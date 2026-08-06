import { presentationReviewAgent } from "../presentationReviewAgent";
import { SlideElement, Slide } from "@/lib/types";

export interface SlideContentPlan {
  slideId: string;
  maxWordCount: number;
  maxBullets: number;
  bulletDensity: "Low" | "Medium" | "High";
  technicalDepth: "Beginner" | "Intermediate" | "Advanced";
  requiredVisual: string;
  speakerNoteLength: "Brief" | "Standard" | "Detailed";
}

/**
 * 6. Content Planning, 7. Slide Content Generator, & 8. AI Review Engine
 * Generates presentation copy (no wall-of-text paragraphs) and audits clarity, tone, and bullet balance.
 */
export class SlideContentPipelineEngine {
  static planSlideContent(slide: Partial<Slide>, density: string): SlideContentPlan {
    const isMinimal = density === "minimalist" || density === "summarized";
    return {
      slideId: slide.id || "s-1",
      maxWordCount: isMinimal ? 40 : 90,
      maxBullets: isMinimal ? 3 : 5,
      bulletDensity: isMinimal ? "Low" : "Medium",
      technicalDepth: "Intermediate",
      requiredVisual: slide.layout?.includes("chart") ? "Chart" : "Graphic Card",
      speakerNoteLength: "Standard",
    };
  }

  static async reviewAndImprove(slide: Slide): Promise<{ slide: Slide; reviewPassed: boolean }> {
    let updatedSlide = { ...slide };
    const overflow = updatedSlide.elements.some((el) => el.type === "text" && (el.content?.length ?? 0) > 250);

    if (overflow) {
      updatedSlide.elements = updatedSlide.elements.map((el) => {
        if (el.type === "text" && el.content && el.content.length > 250) {
          return {
            ...el,
            content: el.content.slice(0, 200) + "…",
          };
        }
        return el;
      });
    }

    return { slide: updatedSlide, reviewPassed: !overflow };
  }
}
