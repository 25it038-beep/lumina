import { LayoutType } from "../types";

export interface LayoutAnalysisInput {
  title: string;
  index: number;
  totalSlides: number;
  hasMetrics?: boolean;
  hasCode?: boolean;
  hasComparison?: boolean;
  previousLayout?: LayoutType;
  avoid?: LayoutType[];
}

export class LayoutIntelligenceEngine {
  selectOptimalLayout(input: LayoutAnalysisInput): LayoutType {
    const { title, index, totalSlides, hasMetrics, hasCode, hasComparison, previousLayout, avoid = [] } = input;
    const lowerTitle = title.toLowerCase();

    // 1. First slide is always Hero/Title
    if (index === 0) return "hero";

    // 2. Second slide is Agenda / Timeline Roadmap
    if (index === 1) return "agenda";

    // 3. Final slide is Conclusion or Q&A
    if (index === totalSlides - 1) return "q-and-a";
    if (index === totalSlides - 2) return "conclusion";

    // 4. Intent-based layout intelligence
    let layout: LayoutType = "two-columns";

    if (hasCode || lowerTitle.includes("code") || lowerTitle.includes("implementation") || lowerTitle.includes("algorithm")) {
      layout = "code";
    } else if (hasComparison || lowerTitle.includes("vs") || lowerTitle.includes("comparison") || lowerTitle.includes("before")) {
      layout = "comparison";
    } else if (lowerTitle.includes("architecture") || lowerTitle.includes("system") || lowerTitle.includes("topology") || lowerTitle.includes("flow")) {
      layout = "architecture";
    } else if (lowerTitle.includes("timeline") || lowerTitle.includes("milestones") || lowerTitle.includes("history")) {
      layout = "timeline";
    } else if (lowerTitle.includes("roadmap") || lowerTitle.includes("process") || lowerTitle.includes("steps") || lowerTitle.includes("phase")) {
      layout = "roadmap";
    } else if (hasMetrics || lowerTitle.includes("metric") || lowerTitle.includes("stat") || lowerTitle.includes("growth") || lowerTitle.includes("kpi")) {
      layout = "metrics";
    } else if (lowerTitle.includes("swot") || lowerTitle.includes("matrix") || lowerTitle.includes("analysis")) {
      layout = "swot";
    } else if (lowerTitle.includes("pricing") || lowerTitle.includes("plans") || lowerTitle.includes("tiers")) {
      layout = "pricing";
    } else if (lowerTitle.includes("funnel") || lowerTitle.includes("conversion") || lowerTitle.includes("pipeline")) {
      layout = "funnel";
    } else if (lowerTitle.includes("pyramid") || lowerTitle.includes("hierarchy") || lowerTitle.includes("maslow")) {
      layout = "pyramid";
    } else if (lowerTitle.includes("before") || lowerTitle.includes("after") || lowerTitle.includes("transformation") || lowerTitle.includes("impact")) {
      layout = "before-after";
    } else if (lowerTitle.includes("team") || lowerTitle.includes("people") || lowerTitle.includes("founders") || lowerTitle.includes("leadership")) {
      layout = "team";
    } else if (lowerTitle.includes("faq") || lowerTitle.includes("question") || lowerTitle.includes("common concerns")) {
      layout = "faq";
    } else if (lowerTitle.includes("journey") || lowerTitle.includes("customer path") || lowerTitle.includes("experience")) {
      layout = "journey";
    } else if (lowerTitle.includes("feature") || lowerTitle.includes("pillar") || lowerTitle.includes("benefit") || lowerTitle.includes("value")) {
      layout = "cards";
    } else {
      // Rotate through diverse layout pool
      const pool: LayoutType[] = ["cards", "three-columns", "metrics", "title-image", "facts", "process", "pyramid", "matrix", "before-after", "quote", "bento", "journey", "faq"];
      layout = pool[index % pool.length];
    }

    // 5. Layout Non-Repetition Rule (previous + memory-driven avoidance)
    if (layout === previousLayout) {
      const fallbackPool: LayoutType[] = ["cards", "three-columns", "metrics", "facts", "process", "before-after", "matrix"];
      layout = fallbackPool.find((l) => l !== previousLayout) || "cards";
    }
    if (avoid.includes(layout)) {
      const altPool: LayoutType[] = ["cards", "three-columns", "metrics", "process", "facts", "title-image", "comparison", "before-after"];
      layout = altPool.find((l) => !avoid.includes(l) && l !== previousLayout) ?? layout;
    }

    return layout;
  }
}

export const layoutIntelligence = new LayoutIntelligenceEngine();
