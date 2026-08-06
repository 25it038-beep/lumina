import { llamaPlanner } from "../planning";
import { buildContext } from "@/lib/context/contextManager";
import type { PresentationIntent } from "./intentAnalyzer";
import type { LlamaPlanningResult, PlannedSlide } from "../planning/planner.types";

export interface PresentationPlanOutput {
  blueprint: LlamaPlanningResult;
  mandatorySections: string[];
  optionalSections: string[];
  visualOnlySlides: number[];
  diagramSlides: number[];
  chartSlides: number[];
  estimatedReadingTimeMinutes: number;
}

/**
 * 2. Presentation Planning Engine & 3. Outline Generation Engine
 * Reasons about structure, order, visual dependencies, and mandatory/optional sections before writing.
 */
export class PresentationPlanningService {
  static async plan(intent: PresentationIntent): Promise<PresentationPlanOutput> {
    const context = buildContext({
      prompt: intent.topic,
      slideCount: intent.slideCount,
      tone: intent.tone,
      targetAudience: intent.audience,
    });

    const blueprint = await llamaPlanner.planPresentation(
      context,
      { onStep: () => {} }
    );

    const mandatorySections = blueprint.sections.map((s) => s.title);
    const optionalSections = ["Case Studies", "Appendix", "Deep Dive Data"];

    const visualOnlySlides: number[] = [];
    const diagramSlides: number[] = [];
    const chartSlides: number[] = [];

    blueprint.slides.forEach((slide: PlannedSlide, idx: number) => {
      if (slide.visual?.type && !slide.objective) {
        visualOnlySlides.push(idx + 1);
      }
      if (slide.diagram?.type) {
        diagramSlides.push(idx + 1);
      }
      if (slide.chart?.type) {
        chartSlides.push(idx + 1);
      }
    });

    return {
      blueprint,
      mandatorySections,
      optionalSections,
      visualOnlySlides,
      diagramSlides,
      chartSlides,
      estimatedReadingTimeMinutes: Math.round(blueprint.slides.length * 1.2),
    };
  }
}
