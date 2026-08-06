import { LlamaPlanner } from "../planning/planner";
import type { PresentationType } from "../planning/planner.types";

export interface PresentationIntent {
  topic: string;
  audience: string;
  purpose: string;
  complexity: "Beginner" | "Intermediate" | "Advanced";
  presentationType: PresentationType | string;
  tone: string;
  durationMinutes: number;
  slideCount: number;
  language: string;
  themePreference: string;
  imageStyle: string;
  chartPreference: string;
  storytellingStyle: string;
}

export interface IntentAnalysisInput {
  prompt: string;
  sourceType?: string;
  tone?: string;
  audience?: string;
  slideCount?: number;
  contentStyle?: string;
  language?: string;
}

/**
 * 1. Intent Analysis Engine
 * Analyzes the user's prompt and options to extract structured PresentationIntent.
 */
export class IntentAnalysisEngine {
  static async analyze(input: IntentAnalysisInput): Promise<PresentationIntent> {
    const topic = input.prompt.trim() || "Untitled Presentation";
    
    const lower = topic.toLowerCase();
    const isTechnical = lower.includes("architecture") || lower.includes("code") || lower.includes("api") || lower.includes("algorithm");
    const isExecutive = lower.includes("exec") || lower.includes("investor") || lower.includes("board") || lower.includes("strategy");

    const complexity = isTechnical ? "Advanced" : isExecutive ? "Intermediate" : "Intermediate";
    const presentationType = lower.includes("pitch")
      ? "Startup Pitch"
      : lower.includes("research")
      ? "Research Paper"
      : lower.includes("architecture")
      ? "Technical Architecture"
      : "General";

    return {
      topic,
      audience: input.audience || (isExecutive ? "Executives" : "General Audience"),
      purpose: `Deliver a compelling, structured presentation on ${topic}`,
      complexity,
      presentationType,
      tone: input.tone || "Professional",
      durationMinutes: Math.round((input.slideCount || 10) * 1.5),
      slideCount: input.slideCount || 10,
      language: input.language || "English",
      themePreference: "auto",
      imageStyle: lower.includes("3d") ? "3D Isometric" : "Modern Minimalist",
      chartPreference: lower.includes("metric") || lower.includes("data") ? "KPI + Bar Chart" : "Standard",
      storytellingStyle: isExecutive ? "Problem-Agitate-Solve" : "TED Talk Arc",
    };
  }
}
