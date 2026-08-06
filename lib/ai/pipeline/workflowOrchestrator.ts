import { IntentAnalysisEngine, PresentationIntent } from "./intentAnalyzer";
import { PresentationPlanningService } from "./presentationPlanner";
import { ResearchPipelineEngine } from "./researchEngine";
import { SlideContentPipelineEngine } from "./slideContentEngine";
import { VisualPipelineEngine } from "./visualEngine";
import { AnimationAndScoringEngine } from "./animationAndScoring";
import { PresentationArchitectEngine } from "../architectEngine";
import { GenerationCallbacks } from "../index";
import { Deck, Slide, PresentationOutline } from "@/lib/types";
import { getTheme } from "@/lib/themes";

export interface PresentationOSOptions {
  prompt: string;
  sourceType?: string;
  tone?: string;
  audience?: string;
  slideCount?: number;
  contentStyle?: string;
  theme?: string;
  onProgress?: GenerationCallbacks["onProgress"];
}

export interface IncrementalEditRequest {
  deck: Deck;
  action: "rewrite-slide" | "expand-slide" | "add-slide" | "change-theme" | "reduce-text";
  slideId?: string;
  prompt?: string;
  newThemeId?: string;
}

/**
 * 15. Multi-Agent AI System, 16. AI Workflow Orchestrator, & 17. Incremental Editing Engine
 * Coordinates the full 16-stage pipeline and enables targeted slide edits without full deck regeneration.
 */
export class PresentationOperatingSystem {
  static async executeFullPipeline(options: PresentationOSOptions) {
    options.onProgress?.({ phase: "research", label: "Stage 1: Intent Analysis & Prompt Dissection…", percent: 5 });
    const intent = await IntentAnalysisEngine.analyze(options);

    options.onProgress?.({ phase: "research", label: "Stage 2: Deep Research & Context Memory Extraction…", percent: 15 });
    const research = await ResearchPipelineEngine.research(intent.topic, intent);

    options.onProgress?.({ phase: "outline", label: "Stage 3: Slide Planning & Narrative Story Graph…", percent: 35 });
    const plan = await PresentationPlanningService.plan(intent);

    options.onProgress?.({ phase: "content", label: "Stage 4: Multi-Agent Slide Content Generation…", percent: 65 });
    const architect = new PresentationArchitectEngine();
    const mockOutline: PresentationOutline = {
      title: intent.topic,
      subtitle: intent.purpose,
      slides: plan.blueprint.slides.map((s, idx: number) => ({
        id: `s-${idx + 1}`,
        title: s.title,
        layout: s.layout as any,
        notes: s.notes,
      })),
    };

    const deckResult = await architect.runArchitectDeck(
      {
        prompt: intent.topic,
        slideCount: intent.slideCount,
        tone: intent.tone,
        audience: intent.audience,
        theme: options.theme,
        contentStyle: options.contentStyle as any,
      },
      mockOutline,
      {
        summary: `Research summary for ${intent.topic}`,
        facts: research.factsAndStats.map((f) => ({ claim: `${f.label}: ${f.value}`, source: "Research Engine" })),
        citations: research.citations,
      },
      { onProgress: options.onProgress }
    );

    options.onProgress?.({ phase: "done", label: "Stage 5: Quality Audit & Animation Timeline Synthesis…", percent: 100 });
    const themeDef = getTheme(deckResult.deck.themeId);
    const score = AnimationAndScoringEngine.scorePresentation(deckResult.deck, themeDef);

    return {
      intent,
      plan,
      research,
      deck: deckResult.deck,
      logs: deckResult.logs,
      review: deckResult.review,
      score,
    };
  }

  static async executeIncrementalEdit(req: IncrementalEditRequest): Promise<Deck> {
    const updatedDeck = { ...req.deck, updatedAt: Date.now() };

    if (req.action === "change-theme" && req.newThemeId) {
      updatedDeck.themeId = req.newThemeId;
      return updatedDeck;
    }

    if (req.action === "rewrite-slide" && req.slideId) {
      updatedDeck.slides = await Promise.all(
        updatedDeck.slides.map(async (s) => {
          if (s.id === req.slideId) {
            const { slide } = await SlideContentPipelineEngine.reviewAndImprove(s);
            return slide;
          }
          return s;
        })
      );
      return updatedDeck;
    }

    if (req.action === "reduce-text" && req.slideId) {
      updatedDeck.slides = updatedDeck.slides.map((s) => {
        if (s.id === req.slideId) {
          return {
            ...s,
            elements: s.elements.map((el) =>
              el.type === "text" && el.content ? { ...el, content: el.content.slice(0, 140) + "…" } : el
            ),
          };
        }
        return s;
      });
      return updatedDeck;
    }

    return updatedDeck;
  }
}
