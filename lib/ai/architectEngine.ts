import { Deck, Slide, ThemeDefinition, PresentationOutline, ResearchResult, GenerationRequest, OutlineItem } from "../types";
import { getTheme, THEMES } from "../themes";
import { buildSlide } from "../layouts";
import { runResearch, GenerationCallbacks } from "./index";
import { generateOutline as localOutline, generateContent as localContent, suggestTheme as localTheme, classifyTopic } from "./localEngine";
import { storytellingEngine } from "./storytellingEngine";
import { layoutIntelligence } from "./layoutIntelligence";
import { projectMemory } from "./projectMemory";
import { presentationMemory } from "./presentationMemory";
import { chooseArchetype } from "./storyEngine";
import { presentationReviewAgent, DeckReviewResult } from "./presentationReviewAgent";
import { agents } from "./agents";
import { aiGateway } from "./gateway/AIGateway";
import { llamaPlanner, isPlanningEnabled } from "./planning";
import { clampLayout } from "./planning/blueprint";
import { buildContext } from "../context/contextManager";
import type { LlamaPlanningResult } from "./planning/planner.types";
import { generateSlideBackground, layoutUsesVisual, mapWithConcurrency } from "./visualGenerator";
import { domainFromCategory } from "./imagePlanner";
import { getAIBackgroundStyle } from "./aiBackgroundStyles";
import { extractTopicFromInstruction } from "./deepResearchEngine";
import { enrichSlideContent, dedupeOutlineSlides } from "./contentEnrichment";

export type { DeckReviewResult };
export type { PresentationOutline };

export interface AgentLog {
  agent: string;
  title: string;
  detail: string;
}

export interface ArchitectPipelineInput {
  prompt: string;
  slideCount?: number;
  audience?: string;
  tone?: string;
  theme?: string;
  contentStyle?: "minimalist" | "summarized" | "standard" | "detailed" | "executive";
  sourceType?: string;
  provider?: string;
  model?: string;
  backgroundMode?: "ai" | "available";
  backgroundStyle?: string;
  deckBackgroundImage?: string;
  deckBackground?: {
    id?: string;
    css?: string;
    imageUrl?: string;
    videoUrl?: string;
    animated?: boolean;
    effect?: string;
    name?: string;
    dark?: boolean;
  };
}

export interface ArchitectOutlineResult {
  outline: PresentationOutline;
  logs: AgentLog[];
}

export interface ArchitectDeckResult {
  deck: Deck;
  review: DeckReviewResult;
  logs: AgentLog[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class PresentationArchitectEngine {
  /**
   * Blueprint produced by the Llama Planning Engine for the current run.
   * Downstream agents (deck builder) consume it instead of planning independently.
   */
  private lastBlueprint: LlamaPlanningResult | null = null;

  /** Map a blueprint theme recommendation to a known theme id when possible. */
  private blueprintTheme(): string | undefined {
    if (!this.lastBlueprint?.theme.recommendation) return undefined;
    const rec = this.lastBlueprint.theme.recommendation.toLowerCase();
    const byId = THEMES.find((t) => t.id === rec);
    if (byId) return byId.id;
    const byName = THEMES.find((t) => rec.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(rec));
    return byName?.id;
  }

  /**
   * Generates a topic-specific outline through the AI Gateway (GPT OSS 20B /
   * DeepSeek V4 Pro) so the structure actually changes with the topic. Falls
   * back to the local domain-template engine if the gateway is unavailable.
   */
  private async generateTopicOutline(
    rawPrompt: string,
    slideCount: number,
    tone: string,
    citations: { title: string; url: string }[]
  ): Promise<PresentationOutline> {
    const { cleanTopic: topic } = extractTopicFromInstruction(rawPrompt);
    try {
      const outline = await aiGateway.executeJSON<PresentationOutline>(
        "generate_outline",
        [
          {
            role: "system",
            content:
              "You are a world-class presentation architect. Create a unique, topic-specific presentation outline. The slide titles MUST be concrete and specific to the topic — never generic placeholders like 'Core Concepts', 'Key Innovations', 'The Road Ahead'. Every slide title must be UNIQUE: no repeated titles, no near-duplicate titles, and no two slides covering the same aspect — if two slides would overlap, split or replace one with a distinct angle. Return STRICT JSON: {title, subtitle, slides:[{id, title, layout, notes}]}. Layouts from: title, agenda, two-columns, three-columns, timeline, comparison, roadmap, process, infographic, metrics, pie, bar, table, cards, hero, gallery, mindmap, swot, bmc, flowchart, architecture, quote, statistics, text-image, video, code, references, conclusion, q-and-a, facts, key-takeaways, section. Use exactly " +
              slideCount +
              " slides. Topic: " +
              topic,
          },
          {
            role: "user",
            content: `Create a ${slideCount}-slide presentation outline for: "${topic}" (tone: ${tone}). Make every slide title reference ${topic} directly — e.g. for "AI in Healthcare" use titles like "AI-Assisted Diagnostics", not "The Technology Landscape".`,
          },
        ],
        { signal: undefined }
      );
      if (outline && Array.isArray(outline.slides) && outline.slides.length >= 3 && outline.title) {
        // Normalize the layout list and guarantee a title slide first.
        const slides = dedupeOutlineSlides(
          outline.slides.map((s, i) => ({
            id: s.id || `ai-${i}`,
            title: s.title || `${topic} — Section ${i + 1}`,
            layout: clampLayout(s.layout),
            notes: s.notes ?? "",
          }))
        );
        const hasTitle = slides.some((s) => s.layout === "title");
        return {
          title: outline.title,
          subtitle: outline.subtitle ?? `An in-depth presentation on ${topic}`,
          slides: hasTitle ? slides : [{ id: "ai-title", title: outline.title, layout: "title", notes: `Title slide for ${outline.title}` }, ...slides],
        };
      }
    } catch (e: any) {
      console.warn("Gateway outline unavailable — falling back to local templates:", e?.message);
    }
    return localOutline({ topic, slideCount, tone });
  }

  /**
   * Content Writer Agent — LLaMA 3.3 70B + DeepSeek V4 Pro dual synthesis.
   * Both models write a draft in parallel through the AI Gateway
   * (write_content), their responses are blended into one best-content object
   * (union + dedupe + best-of pick). The local engine is the last resort.
   */
  private async writeSlideContent(
    item: OutlineItem,
    topic: string,
    research: ResearchResult,
    i: number,
    total: number
  ): Promise<any> {
    try {
      return await aiGateway.executeJSON<any>(
        "write_content",
        [
          {
            role: "system",
            content:
              "You are DeepSeek V4 Pro writing dense, professional, high-impact slide content. DENSITY RULES: if the layout displays bullets, return AT LEAST 4-6 substantive bullets (each 10-25 words, concrete and topic-specific — never filler like 'Drive innovation' or 'Leverage technology'); always include a subtitle; weave real figures and specifics from the provided context when available; never return empty arrays for keys the layout uses. Return STRICT JSON with keys appropriate for layout " +
              item.layout +
              " (title, subtitle, bullets[], paragraphs[], stats[{label,value}], metrics[{value,label}], timeline[{period,title,desc}], steps[{title,desc}], cards[{title,desc,icon}], comparison[{ours,theirs}], swot{s,w,o,t}, quote, attribution, nodes[{label,icon}], references[{title,url,source}], facts[{fact,icon}], keyPoints[], tableHeaders[], tableRows[][], formula, code, language). Never invent citations with fake URLs. Topic: " +
              topic,
          },
          {
            role: "user",
            content: `Write content for slide "${item.title}" (layout: ${item.layout}, notes: ${item.notes ?? ""}). Slide ${i + 1} of ${total}. Context: ${research.summary.slice(0, 1500)}`,
          },
        ],
        { signal: undefined }
      );
    } catch {
      return localContent(item, topic, i, total);
    }
  }

  /**
   * Research Agent → Storytelling Engine → Slide Planner (layout intelligence).
   * Produces a narrative-aware outline with AI-assigned layouts.
   * When the Llama Planning Layer is enabled it runs first and its blueprint
   * drives the outline; otherwise the existing local pipeline is unchanged.
   */
  async runArchitectOutline(
    prompt: string,
    slideCount: number,
    tone: string,
    audience?: string
  ): Promise<ArchitectOutlineResult> {
    const logs: AgentLog[] = [];
    const add = (agent: string, title: string, detail: string) => logs.push({ agent, title, detail });

    add("research", "Research Agent", `Collecting verified facts and citations for "${prompt}"`);
    const domain = await runResearch(prompt);
    add("research", "Research Agent", `Found ${domain.citations.length} sources + ${domain.facts.length} verified facts.`);

    /* ---- Llama Planning & Architecture Intelligence Layer ---- */
    if (llamaPlanner.isEnabled()) {
      add("context", "Context Engine", `Merging prompt, research (${domain.citations.length} sources), audience "${audience ?? "General"}", tone "${tone}" and project memory into one context object.`);
      const ctx = buildContext({
        prompt,
        slideCount,
        tone,
        targetAudience: audience,
        sourceType: "prompt",
        researchSummary: domain.summary,
        citationsCount: domain.citations.length,
      });
      try {
        add("llama", "Llama Planning Engine", `Planning presentation blueprint with ${ctx.sources.length} context sources…`);
        const plan = await llamaPlanner.planPresentation(ctx, {
          onStep: (label) => add("llama", "Llama Planning Engine", label),
        });
        this.lastBlueprint = plan;
        const outline = llamaPlanner.toOutline(plan);
        outline.slides = dedupeOutlineSlides(outline.slides);
        add(
          "llama",
          "Llama Planning Engine",
          `Blueprint ready: ${plan.presentation.slide_count} slides · "${plan.story.strategy}" narrative · ${plan.architecture.required_charts.length} charts · ${plan.architecture.required_diagrams.length} diagrams · ${plan.architecture.required_illustrations.length} illustrations · ${plan.architecture.required_animations.length} animations.`
        );
        add("orchestrator", "AI Orchestrator", `Blueprint consumed — Story, Theme, Layout, Image, Diagram, Chart & Animation agents will follow Llama directives instead of planning independently.`);
        const archProblems = plan.architecture.slide_dependencies.length
          ? ` · ${plan.architecture.slide_dependencies.length} slide dependencies mapped`
          : "";
        add("architect", "Architecture Engine", `Information hierarchy (${plan.architecture.information_hierarchy.length} levels)${archProblems}.`);
        if (plan.recommendations.length) {
          add("llama", "Llama Planning Engine", `Top recommendation: ${plan.recommendations[0]}`);
        }
        projectMemory.setAudience(plan.presentation.audience || audience || "Executives");
        projectMemory.updateMemory({ topic: prompt, tone, themeId: "", citationsCount: domain.citations.length });
        return { outline, logs };
      } catch (e: any) {
        add("llama", "Llama Planning Engine", `Unavailable (${e?.message?.slice(0, 120) ?? "error"}) — falling back to local planning pipeline.`);
      }
    }
    /* ---- end Llama Planning Layer ---- */

    const archetype = chooseArchetype(prompt, tone, classifyTopic(prompt).id);
    add("director", "Presentation Director", `Detected presentation type: ${archetype} narrative`);

    const sim = presentationMemory.mostSimilarTo(prompt);
    if (sim && sim.score >= 40) {
      add("memory", "Presentation Memory", `Similar prior deck found (${sim.score}% overlap) — steering theme and layouts away.`);
    }
    const avoidLayouts = presentationMemory.avoidLayouts(prompt);
    if (avoidLayouts.length) {
      add("director", "Slide Planner", `Avoiding layouts used heavily before: ${avoidLayouts.join(", ")}`);
    }

    projectMemory.setAudience(audience || "Executives");
    projectMemory.updateMemory({
      topic: prompt,
      tone,
      themeId: "",
      citationsCount: domain.citations.length,
    });

    add("story", "Story Architect Agent", agents.storyArchitect.buildNarrative(prompt, slideCount));
    const story = storytellingEngine.generateStoryArc(prompt, slideCount);

    add("director", "Design Director Agent", `Configuring design system, 8-point grid, typography pairing & color tokens.`);
    const designChoice = agents.designDirector.selectDesignTokens(prompt);
    void designChoice;

    add("composer", "Layout Composer Agent", `Composing visual hierarchy and assigning layouts (Bento Grid, Architecture, Metrics, SWOT).`);
    let outline = await this.generateTopicOutline(prompt, slideCount, tone, domain.citations);
    let previousLayout: string | undefined;
    outline = {
      ...outline,
      slides: outline.slides.map((item, i) => {
        const beat = story[i];
        const layout = layoutIntelligence.selectOptimalLayout({
          title: item.title,
          index: i,
          totalSlides: outline.slides.length,
          previousLayout: previousLayout as any,
          avoid: avoidLayouts,
        });
        const visualType = agents.visualPlanner.planVisual(item.title);
        previousLayout = layout;
        return {
          ...item,
          layout,
          notes: `[Visual: ${visualType}] ${beat?.narrativeGoal ?? item.notes}. ${item.notes ?? ""}`,
        };
      }),
    };
    add("visual", "Visual Planner Agent", `Planned slide visual assets (Illustrations, Diagrams, Charts & Icon Sets).`);
    add("content", "Content Editor Agent", `Enriching and simplifying slide copy with verified statistics.`);

    return { outline, logs };
  }

  /**
   * Content Writer Agents → UI Designer Engine (buildSlide) → Presentation Review Agent.
   * Produces a fully designed deck plus a scored design review.
   */
  async runArchitectDeck(
    input: ArchitectPipelineInput,
    outline: PresentationOutline,
    research: ResearchResult,
    cb: GenerationCallbacks = {}
  ): Promise<ArchitectDeckResult> {
    const { onProgress, signal } = cb;
    const step = (phase: any, label: string, percent: number) => onProgress?.({ phase, label, percent });
    const logs: AgentLog[] = [];
    const add = (agent: string, title: string, detail: string) => logs.push({ agent, title, detail });

    const theme = input.theme
      ? getTheme(input.theme)
      : this.blueprintTheme()
      ? getTheme(this.blueprintTheme()!)
      : localTheme(input.prompt, presentationMemory.recentThemeIds(8));
    if (this.lastBlueprint) {
      add("llama", "Llama Planning Engine", `Theme directive: ${this.lastBlueprint.theme.recommendation || "auto"} — ${this.lastBlueprint.theme.rationale}`);
      add("director", "AI Orchestrator", `Chart strategy: ${this.lastBlueprint.charts.strategy || "auto"} · Diagram strategy: ${this.lastBlueprint.diagrams.strategy || "auto"} · Animation strategy: ${this.lastBlueprint.animations.strategy || "auto"} · Image style: ${this.lastBlueprint.visuals.image_style || "auto"}`);
    }
    step("theme", `Theme Director: applying ${theme.name} theme (skipping ${presentationMemory.recentThemeIds(8).length} recently used)…`, 8);

    const req: GenerationRequest = {
      input: input.prompt,
      sourceType: (input.sourceType as any) ?? "prompt",
      slideCount: outline.slides.length,
      tone: input.tone ?? "Professional",
      theme: input.theme ?? undefined,
      provider: input.provider ?? "local",
      model: input.model ?? "lumina-local-v1",
    };
    void req;

    add("content", "Content Writer Agents", `Llama 3.3 70B + DeepSeek V4 Pro: dual-synthesizing content for ${outline.slides.length} slides from research context`);

    const total = outline.slides.length;
    const slides: Slide[] = [];
    for (let i = 0; i < total; i++) {
      const item = outline.slides[i];
      if (signal?.aborted) throw new Error("Generation cancelled");
      step("content", `Llama + DeepSeek: writing slide ${i + 1} of ${total}: ${item.title}`, 8 + Math.round((i / total) * 72));
      await sleep(40);
      const content = await this.writeSlideContent(item, input.prompt, research, i, total);
      const slideObj = buildSlide(item, enrichSlideContent(content, item, input.prompt, research), theme, i);
      if (!slideObj.notes || slideObj.notes.length < 10) {
        slideObj.notes = `Talking points for ${item.title}:\n- Introduce main themes and metrics.\n- Highlight business implications.\n- Address Q&A expectations.`;
      }
      slides.push(slideObj);
    }
    add("content", "Content Writer Agents", `Llama + DeepSeek dual synthesis finished ${slides.length} slides — blended, deduped, best-of-both content.`);

    step("layout", "Arranging layouts and generating visuals…", 85);
    await sleep(150);
    add("planner", "Chart Planner", `Recommended chart types per data slide (bar/line/doughnut/radar) from slide intent + domain.`);
    add("planner", "Icon Planner", `Selected domain-matched icon sets (AI→neural, Finance→currency, Health→medical…) varied per deck.`);
    add("planner", "Illustration Planner", `Chose artwork style per image slide (Medical/Technology/Education/Business/Abstract…) matched to topic.`);
    add("planner", "Animation Planner", `Assigned layout transitions + element motion presets (fade/zoom/cascade/stagger) per slide.`);
    add("designer", "UI Designer Engine", "Rendering glass components, 8-point grids, charts & motion presets");

    // Generate content-related FLUX visuals / backgrounds based on user's mode
    if (input.deckBackground) {
      step("layout", `Applying "${input.deckBackground.name ?? "selected"}" background to every slide…`, 92);
      add("designer", "Deck Background", `Applying the selected "${input.deckBackground.name ?? "background"}" across all ${slides.length} slides`);
      for (const sl of slides) {
        sl.background = input.deckBackground.css ?? sl.background;
        if (input.deckBackground.imageUrl) sl.backgroundImage = input.deckBackground.imageUrl;
        sl.backgroundVideo = input.deckBackground.videoUrl ?? sl.backgroundVideo;
        sl.backgroundAnimated = input.deckBackground.animated ?? sl.backgroundAnimated;
        sl.backgroundEffect = input.deckBackground.effect ?? sl.backgroundEffect;
        sl.backgroundId = input.deckBackground.id ?? sl.backgroundId;
      }
    } else if (input.deckBackgroundImage) {
      step("layout", "Applying selected AI background to every slide…", 92);
      add("designer", "Deck Background", "Applying the user-picked AI background across all slides");
      for (const sl of slides) {
        if (!sl.backgroundImage) sl.backgroundImage = input.deckBackgroundImage;
      }
    } else if (input.backgroundMode === "ai") {
      const bgStyle = getAIBackgroundStyle(input.backgroundStyle ?? "3d-modern");
      step("layout", `FLUX-1 Schnell: Generating ${bgStyle.label} backgrounds for every slide…`, 92);
      add("designer", "FLUX-1 Schnell", `Generating ${bgStyle.label} AI backgrounds for all ${slides.length} slides`);
      await mapWithConcurrency(slides, 4, async (sl, i) => {
        const item = outline.slides[i];
        if (!item || sl.backgroundImage) return;
        sl.backgroundImage = await generateSlideBackground(
          input.prompt,
          sl.title ?? item.title,
          bgStyle,
          item.layout,
          domainFromCategory(theme.category)
        );
      });
    } else {
      step("layout", "FLUX-1 Schnell: Generating custom visuals for slides…", 92);
      await mapWithConcurrency(slides, 4, async (sl, i) => {
        const item = outline.slides[i];
        if (!item || !layoutUsesVisual(item.layout) || sl.backgroundImage) return;
        sl.backgroundImage = await generateSlideBackground(
          input.prompt,
          sl.title ?? item.title,
          getAIBackgroundStyle("3d-modern"),
          item.layout,
          domainFromCategory(theme.category)
        );
      });
    }

    const deck: Deck = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      title: outline.title,
      description: outline.subtitle,
      topic: input.prompt,
      themeId: theme.id,
      aspectRatio: "16:9",
      slides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: "Lumina AI Architect",
      tags: [input.tone ?? "professional", "multi-agent"],
      aiMeta: {
        model: "lumina-architect-v1",
        source: "multi-agent-pipeline",
        citations: research.citations,
      },
    };

    step("done", "Presentation Review Agent: verifying design score > 95…", 97);
    add("review", "Presentation Review Agent", "Auditing contrast, hierarchy, density, accessibility, variety & redundancy");
    const reviewed = presentationReviewAgent.reviewAndAutoRedesignDeck(deck, theme);
    add(
      "review",
      "Presentation Review Agent",
      `Final score: ${reviewed.result.overallScore}% · ${reviewed.result.slideScores.filter((s) => s.autoRedesigned).length} slides auto-redesigned`
    );
    presentationMemory.record(reviewed.deck, chooseArchetype(input.prompt, input.tone));
    add("memory", "Presentation Memory", `Recorded fingerprint of this deck for future anti-repetition steering.`);
    step("done", "Presentation ready", 100);

    return {
      deck: reviewed.deck,
      review: reviewed.result,
      logs,
    };
  }

  /**
   * One-shot multi-agent pipeline (Research → Architect → Story → Planner → UI Designer → Review).
   */
  async executePipeline(
    input: ArchitectPipelineInput,
    cb: GenerationCallbacks = {}
  ): Promise<{ deck: Deck; reviewScore: number; logs: AgentLog[] }> {
    const { outline, logs } = await this.runArchitectOutline(
      input.prompt,
      input.slideCount || 8,
      input.tone || "Professional",
      input.audience
    );
    const research = await runResearch(input.prompt, cb.signal);
    const { deck, review } = await this.runArchitectDeck(input, outline, research, cb);
    return { deck, reviewScore: review.overallScore, logs };
  }
}

export const architectEngine = new PresentationArchitectEngine();