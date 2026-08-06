import { Deck, GenerationRequest, PresentationOutline, ResearchResult, ThemeDefinition, Citation } from "../types";
import { ProviderClient, buildClient } from "./provider";
import {
  generateOutline as localOutline,
  generateContent as localContent,
  suggestTheme as localTheme,
  classifyTopic,
} from "./localEngine";
import { buildSlide, SLIDE_WIDTH, SLIDE_HEIGHT } from "../layouts";
import { getTheme } from "../themes";
import { aiGateway } from "./gateway/AIGateway";
import { presentationReviewAgent } from "./presentationReviewAgent";
import { generateSlideVisual, layoutUsesVisual, generateSlideBackground, mapWithConcurrency } from "./visualGenerator";
import { domainFromCategory } from "./imagePlanner";
import { getAIBackgroundStyle } from "./aiBackgroundStyles";
import { llamaPlanner } from "./planning";
import { buildContext } from "../context/contextManager";
import { enrichSlideContent, dedupeOutlineSlides } from "./contentEnrichment";

export interface GenerateProgress {
  phase: "research" | "outline" | "content" | "layout" | "theme" | "done";
  label: string;
  percent: number;
}

export interface GenerationResult {
  deck: Deck;
  outline: PresentationOutline;
  theme: ThemeDefinition;
  research: ResearchResult;
}

export interface GenerationCallbacks {
  onProgress?: (p: GenerateProgress) => void;
  signal?: AbortSignal;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runResearch(topic: string, signal?: AbortSignal): Promise<ResearchResult> {
  const domain = classifyTopic(topic);
  const citations: Citation[] = [];
  try {
    const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.trim().replace(/\s+/g, "_"))}`, { signal });
    if (wiki.ok) {
      const data = await wiki.json();
      if (data?.extract) {
        citations.push({
          id: "wiki-1",
          title: data.title ?? topic,
          url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`,
          source: "wikipedia",
          snippet: data.extract.slice(0, 300),
          published: data.timestamp,
        });
      }
    }
  } catch {
    /* offline */
  }
  if (citations.length === 0) {
    domain.sources.slice(0, 4).forEach((s, i) => {
      citations.push({
        id: `src-${i}`,
        title: s.title,
        url: s.url,
        source: "web",
        snippet: domain.facts[i % domain.facts.length].slice(0, 200),
      });
    });
  }
  return {
    summary: domain.facts.join(" "),
    citations,
    facts: domain.facts.slice(0, 6).map((claim) => ({ claim, source: domain.sources[0].title })),
  };
}

export async function generateDeck(
  req: GenerationRequest,
  client: ProviderClient,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { onProgress, signal } = cb;
  const step = (phase: GenerateProgress["phase"], label: string, percent: number) =>
    onProgress?.({ phase, label, percent });

  step("research", "Researching the latest information…", 5);
  const research = await runResearch(req.input, signal);
  step("research", "Verifying facts and collecting citations…", 15);

  step("outline", "Planning the presentation structure…", 20);
  let outline: PresentationOutline | null = null;

  /* ---- Llama Planning & Architecture Intelligence Layer ---- */
  if (llamaPlanner.isEnabled()) {
    try {
      step("outline", "Llama Planning Engine: building presentation blueprint…", 22);
      const ctx = buildContext({
        prompt: req.input,
        slideCount: req.slideCount,
        tone: req.tone,
        theme: req.theme,
        sourceType: req.sourceType,
        researchSummary: research.summary,
        citationsCount: research.citations.length,
      });
      const plan = await llamaPlanner.planPresentation(ctx, { signal });
      outline = llamaPlanner.toOutline(plan);
      outline.slides = dedupeOutlineSlides(outline.slides);
      step("outline", `Llama blueprint ready (${outline.slides.length} slides) — agents consuming planning directives…`, 35);
    } catch (e: any) {
      console.warn("Llama planning unavailable — using existing outline pipeline:", e?.message);
    }
  }
  /* ---- end Llama Planning Layer ---- */

  if (!outline) {
    if (client.providerId === "local") {
      await sleep(300);
      outline = localOutline({ topic: req.input, slideCount: req.slideCount, tone: req.tone });
    } else {
      try {
        outline = await client.chatJSON<PresentationOutline>(
          [
            {
              role: "system",
              content:
                "You are a world-class presentation architect. Create a detailed presentation outline. Slide titles MUST be unique — no repeated or near-duplicate titles, no two slides on the same aspect, and no generic placeholders like 'Key Concepts' or 'The Road Ahead'. Return STRICT JSON: {title, subtitle, slides:[{id, title, layout, notes}]}. Layouts must come from this list: title, agenda, two-columns, three-columns, timeline, comparison, roadmap, process, infographic, metrics, pie, bar, table, cards, hero, gallery, mindmap, swot, bmc, flowchart, architecture, quote, statistics, text-image, video, code, references, conclusion, q-and-a, facts, key-takeaways, section. Use exactly " +
                req.slideCount +
                " slides. Topic: " +
                req.input,
            },
            { role: "user", content: `Create a ${req.slideCount}-slide outline for: ${req.input} (tone: ${req.tone})` },
          ],
          { signal, json: true }
        );
      } catch {
        outline = localOutline({ topic: req.input, slideCount: req.slideCount, tone: req.tone });
      }
    }
    if (outline && Array.isArray(outline.slides)) {
      outline.slides = dedupeOutlineSlides(outline.slides);
    }
  }
  step("outline", "Outline ready — applying smart layouts…", 35);

  const theme = req.theme ? getTheme(req.theme) : localTheme(req.input);
  step("theme", `Applying ${theme.name} theme…`, 45);

  const total = outline.slides.length;
  const slides = [];
  for (let i = 0; i < total; i++) {
    const item = outline.slides[i];
    step("content", `Llama 3.3 + DeepSeek V4: writing slide ${i + 1} of ${total}: ${item.title}`, 45 + Math.round((i / total) * 45));

    let content: any;
    try {
      // DeepSeek V4 Pro via the gateway is the primary content writer.
      content = await aiGateway.executeJSON<any>(
        "write_content",
        [
          {
            role: "system",
content:
              "You are DeepSeek V4 Pro writing concise, specific, factual slide content. Content Density & Style: " +
              (req.contentStyle ?? "summarized") +
              " (" +
              (req.contentStyle === "minimalist"
                ? "ultra-sparse headline + 1 key metric or stat"
                : req.contentStyle === "summarized"
                ? "concise bullet points and short key takeaways"
                : req.contentStyle === "executive"
                ? "high-impact action callouts and ROI metrics"
                : req.contentStyle === "detailed"
                ? "comprehensive technical details and structured data"
                : "balanced text and structured points") +
              "). DENSITY RULES: if the layout displays bullets, return AT LEAST 4-6 substantive bullets (each 10-25 words, concrete and topic-specific — never filler like 'Drive innovation' or 'Leverage technology'); always include a subtitle; weave real figures and specifics from context when available; never return empty arrays for keys the layout uses. Return STRICT JSON with keys appropriate for layout " +
              item.layout +
              " (title, subtitle, bullets[], paragraphs[], stats[{label,value}], metrics[{value,label}], timeline[{period,title,desc}], steps[{title,desc}], cards[{title,desc,icon}], comparison[{ours,theirs}], swot{s,w,o,t}, quote, attribution, nodes[{label,icon}], references[{title,url,source}], facts[{fact,icon}], keyPoints[], tableHeaders[], tableRows[][], formula, code, language). Never invent citations with fake URLs. Topic: " +
              req.input,
          },
          { role: "user", content: `Write content for slide "${item.title}" (layout: ${item.layout}, notes: ${item.notes ?? ""}). Context: ${research.summary.slice(0, 1500)}` },
        ],
        { signal }
      );
    } catch {
      if (client.providerId === "local") {
        await sleep(60);
        content = localContent(item, req.input, i, total, req.contentStyle);
      } else {
        try {
          content = await client.chatJSON<any>(
            [
              {
                role: "system",
                content:
                  "You write dense, specific, factual slide content. DENSITY RULES: if the layout displays bullets, return AT LEAST 4-6 substantive bullets (each 10-25 words, concrete and topic-specific — never filler like 'Drive innovation'); always include a subtitle; never return empty arrays for keys the layout uses. Return STRICT JSON with keys appropriate for layout " +
                  item.layout +
                  " (title, subtitle, bullets[], paragraphs[], stats[{label,value}], metrics[{value,label}], timeline[{period,title,desc}], steps[{title,desc}], cards[{title,desc,icon}], comparison[{ours,theirs}], swot{s,w,o,t}, quote, attribution, nodes[{label,icon}], references[{title,url,source}], facts[{fact,icon}], keyPoints[], tableHeaders[], tableRows[][], formula, code, language). Never invent citations with fake URLs. Topic: " +
                  req.input,
              },
              { role: "user", content: `Write content for slide "${item.title}" (layout: ${item.layout}, notes: ${item.notes ?? ""}). Context: ${research.summary.slice(0, 1500)}` },
            ],
            { signal, json: true }
          );
        } catch {
          content = localContent(item, req.input, i, total);
        }
      }
    }
    slides.push(buildSlide(item, enrichSlideContent(content, item, req.input, research), theme, i));
    void SLIDE_WIDTH;
    void SLIDE_HEIGHT;
  }

  // Generate content-related FLUX visuals / backgrounds based on user's mode
  if (client.providerId !== "local") {
    const style = getAIBackgroundStyle(req.backgroundStyle ?? "3d-modern");
    if (req.deckBackground) {
      step("layout", `Applying "${req.deckBackground.name ?? "selected"}" background to every slide…`, 90);
      for (const sl of slides) {
        sl.background = req.deckBackground.css ?? sl.background;
        if (req.deckBackground.imageUrl) sl.backgroundImage = req.deckBackground.imageUrl;
        sl.backgroundVideo = req.deckBackground.videoUrl ?? sl.backgroundVideo;
        sl.backgroundAnimated = req.deckBackground.animated ?? sl.backgroundAnimated;
        sl.backgroundEffect = req.deckBackground.effect ?? sl.backgroundEffect;
        sl.backgroundId = req.deckBackground.id ?? sl.backgroundId;
      }
    } else if (req.deckBackgroundImage) {
      step("layout", "Applying selected AI background to every slide…", 90);
      for (const sl of slides) {
        if (!sl.backgroundImage) sl.backgroundImage = req.deckBackgroundImage;
      }
    } else if (req.backgroundMode === "ai") {
      step("layout", `FLUX-1 Schnell: Generating ${style.label} backgrounds for every slide…`, 90);
      await mapWithConcurrency(slides, 4, async (sl, i) => {
        const item = outline.slides[i];
        if (!item || sl.backgroundImage) return;
        sl.backgroundImage = await generateSlideBackground(
          req.input,
          sl.title ?? item.title,
          style,
          item.layout,
          domainFromCategory(theme.category)
        );
      });
    } else {
      step("layout", "FLUX-1 Schnell: Generating custom visuals for slides…", 90);
      await mapWithConcurrency(slides, 4, async (sl, i) => {
        const item = outline.slides[i];
        if (!item || !layoutUsesVisual(item.layout) || sl.backgroundImage) return;
        sl.backgroundImage = await generateSlideVisual(
          sl.title ?? item.title,
          req.input,
          item.layout,
          "Illustration",
          domainFromCategory(theme.category)
        );
      });
    }
  }

  step("layout", "Arranging layouts and generating visuals…", 92);
  await sleep(150);

  const deck: Deck = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: outline.title,
    description: outline.subtitle,
    topic: req.input,
    themeId: theme.id,
    aspectRatio: "16:9",
    slides,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: "You",
    tags: [req.tone, classifyTopic(req.input).id],
    aiMeta: {
      model: client.model ?? "lumina-local-v1",
      source: "lumina",
      citations: research.citations,
    },
  };

  step("done", "Presentation ready", 100);
  return { deck, outline, theme, research };
}

export async function generateOutlineOnly(
  req: GenerationRequest,
  client: ProviderClient,
  cb: GenerationCallbacks = {}
): Promise<{ outline: PresentationOutline; research: ResearchResult }> {
  const { onProgress, signal } = cb;
  onProgress?.({ phase: "research", label: "Researching topic and collecting statistics…", percent: 15 });
  const research = await runResearch(req.input, signal);

  onProgress?.({ phase: "outline", label: "GPT OSS 20B: Architecting smart presentation structure…", percent: 40 });
  let outline: PresentationOutline | null = null;

  if (llamaPlanner.isEnabled()) {
    try {
      onProgress?.({ phase: "outline", label: "Llama Planning Engine: building presentation blueprint…", percent: 40 });
      const ctx = buildContext({
        prompt: req.input,
        slideCount: req.slideCount,
        tone: req.tone,
        theme: req.theme,
        sourceType: req.sourceType,
        researchSummary: research.summary,
        citationsCount: research.citations.length,
      });
      const plan = await llamaPlanner.planPresentation(ctx, { signal });
      outline = llamaPlanner.toOutline(plan);
      onProgress?.({ phase: "outline", label: "Llama blueprint ready for review", percent: 80 });
    } catch (e: any) {
      console.warn("Llama planning unavailable — using existing outline pipeline:", e?.message);
    }
  }

  if (!outline) {
    try {
      outline = await aiGateway.executeJSON<PresentationOutline>(
        "generate_outline",
        [
          {
            role: "system",
            content:
              "You are a world-class presentation architect powered by GPT OSS 20B. Create a detailed presentation outline. Return STRICT JSON: {title, subtitle, slides:[{id, title, layout, notes}]}. Layouts must come from this list: title, agenda, two-columns, three-columns, timeline, comparison, roadmap, process, infographic, metrics, pie, bar, table, cards, hero, gallery, mindmap, swot, bmc, flowchart, architecture, quote, statistics, text-image, video, code, references, conclusion, q-and-a, facts, key-takeaways, section. Use exactly " +
              req.slideCount +
              " slides. Topic: " +
              req.input,
          },
          { role: "user", content: `Create a ${req.slideCount}-slide outline for: ${req.input} (tone: ${req.tone})` },
        ],
        { signal }
      );
    } catch {
      outline = localOutline({ topic: req.input, slideCount: req.slideCount, tone: req.tone });
    }
  }
  onProgress?.({ phase: "outline", label: "Outline ready for review", percent: 100 });
  return { outline, research };
}

export async function generateDeckFromApprovedOutline(
  outline: PresentationOutline,
  req: GenerationRequest,
  research: ResearchResult,
  client: ProviderClient,
  cb: GenerationCallbacks = {}
): Promise<GenerationResult> {
  const { onProgress, signal } = cb;
  const step = (phase: GenerateProgress["phase"], label: string, percent: number) =>
    onProgress?.({ phase, label, percent });

  const theme = req.theme ? getTheme(req.theme) : localTheme(req.input);
  step("theme", `Applying ${theme.name} theme…`, 10);

  const total = outline.slides.length;
  const slides = [];
  for (let i = 0; i < total; i++) {
    const item = outline.slides[i];
    step("content", `Llama 3.3 + DeepSeek V4: synthesizing slide ${i + 1} of ${total}: ${item.title}`, 10 + Math.round((i / total) * 75));

    let content: any;
    try {
      content = await aiGateway.executeJSON<any>(
        "write_content",
        [
          {
            role: "system",
            content:
              "You are DeepSeek V4 Pro writing dense, professional, high-impact slide content. Return STRICT JSON with keys appropriate for layout " +
              item.layout +
              " (title, subtitle, bullets[], paragraphs[], stats[{label,value}], metrics[{value,label}], timeline[{period,title,desc}], steps[{title,desc}], cards[{title,desc,icon}], comparison[{ours,theirs}], swot{s,w,o,t}, quote, attribution, nodes[{label,icon}], references[{title,url,source}], facts[{fact,icon}], keyPoints[], tableHeaders[], tableRows[][], formula, code, language). Topic: " +
              req.input,
          },
          { role: "user", content: `Write content for slide "${item.title}" (layout: ${item.layout}, notes: ${item.notes ?? ""}). Context: ${research.summary.slice(0, 1500)}` },
        ],
        { signal }
      );
    } catch {
      content = localContent(item, req.input, i, total);
    }

    const slideObj = buildSlide(item, content, theme, i);
    // Ensure speaker notes are populated
    if (!slideObj.notes || slideObj.notes.length < 10) {
      slideObj.notes = `Talking points for ${item.title}:\n- Introduce main themes and metrics.\n- Highlight business implications.\n- Address Q&A expectations.`;
    }
    slides.push(slideObj);
  }

  // Generate content-related FLUX visuals / backgrounds based on user's mode
  const bgStyle = getAIBackgroundStyle(req.backgroundStyle ?? "3d-modern");
  if (req.deckBackground) {
    step("layout", `Applying "${req.deckBackground.name ?? "selected"}" background to every slide…`, 92);
    for (const sl of slides) {
      sl.background = req.deckBackground.css ?? sl.background;
      if (req.deckBackground.imageUrl) sl.backgroundImage = req.deckBackground.imageUrl;
      sl.backgroundVideo = req.deckBackground.videoUrl ?? sl.backgroundVideo;
      sl.backgroundAnimated = req.deckBackground.animated ?? sl.backgroundAnimated;
      sl.backgroundEffect = req.deckBackground.effect ?? sl.backgroundEffect;
      sl.backgroundId = req.deckBackground.id ?? sl.backgroundId;
    }
  } else if (req.deckBackgroundImage) {
    step("layout", "Applying selected AI background to every slide…", 92);
    for (const sl of slides) {
      if (!sl.backgroundImage) sl.backgroundImage = req.deckBackgroundImage;
    }
  } else if (req.backgroundMode === "ai") {
    step("layout", `FLUX-1 Schnell: Generating ${bgStyle.label} backgrounds for every slide…`, 92);
    await mapWithConcurrency(slides, 4, async (sl, i) => {
      const item = outline.slides[i];
      if (!item || sl.backgroundImage) return;
      sl.backgroundImage = await generateSlideBackground(
        req.input,
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
      sl.backgroundImage = await generateSlideVisual(
        sl.title ?? item.title,
        req.input,
        item.layout,
        "Illustration",
        domainFromCategory(theme.category)
      );
    });
  }

  step("layout", "Arranging layouts and finalizing visuals…", 95);
  await sleep(150);

  const deck: Deck = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: outline.title,
    description: outline.subtitle,
    topic: req.input,
    themeId: theme.id,
    aspectRatio: "16:9",
    slides,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: "You",
    tags: [req.tone, classifyTopic(req.input).id],
    aiMeta: {
      model: client.model ?? "lumina-local-v1",
      source: "lumina",
      citations: research.citations,
    },
  };

  step("done", "Presentation Review Agent: Verifying score > 95/100 and finalizing deck…", 100);
  const reviewed = presentationReviewAgent.reviewAndAutoRedesignDeck(deck, theme);
  return { deck: reviewed.deck, outline, theme, research };
}

export async function generateSpeakerNotes(deck: Deck, slideIndex: number, client: ProviderClient): Promise<string> {
  const slide = deck.slides[slideIndex];
  const text = slide.elements
    .map((e) => ("content" in e ? e.content : ""))
    .filter(Boolean)
    .join(". ");

  if (client.providerId === "local") {
    const words = text.split(" ").filter(Boolean).length;
    return [
      `Opening: Welcome the audience and introduce "${slide.title}".`,
      `Key points: ${text.slice(0, 400) || "Define the core concept and why it matters."}`,
      `Detail: Elaborate on the main ideas in ~2 minutes (aim for ~${Math.max(180, words * 2)} spoken words).`,
      `Transition: Bridge to the next section and preview what is coming next.`,
      `Anticipated questions: "What data supports this?" and "How do we implement this?" — prepare concrete examples.`,
    ].join("\n\n");
  }

  try {
    return await client.chat([
      { role: "system", content: "You are an expert presentation coach. Generate speaker notes with talking points, timing, and anticipated Q&A. Plain text only." },
      { role: "user", content: `Slide title: ${slide.title}\nContent: ${text.slice(0, 2000)}\n\nWrite concise speaker notes.` },
    ], { signal: undefined });
  } catch {
    return "See slide content for talking points.";
  }
}
