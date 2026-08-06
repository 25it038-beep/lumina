import { layoutIntelligence } from "../layoutIntelligence";
import { ThemeDefinition, LayoutType } from "@/lib/types";
import { THEMES, getTheme } from "@/lib/themes";

export type ThemePresetName =
  | "Corporate"
  | "Startup"
  | "Minimal"
  | "Apple"
  | "Google"
  | "Microsoft"
  | "Gamma"
  | "Notion"
  | "Dark Glass"
  | "Cyberpunk"
  | "Academic"
  | "Luxury"
  | "Developer";

export interface VisualPromptMetadata {
  slideId: string;
  visualType: "3d-illustration" | "isometric-diagram" | "dashboard-preview" | "accent-graphic";
  prompt: string;
  suggestedAccentColor: string;
}

/**
 * 10. Layout Recommendation Engine, 11. Visual Intelligence Engine, & 12. Theme Engine
 * Recommends optimal slide layouts, formulates visual prompts, and adapts 13 theme presets.
 */
export class VisualPipelineEngine {
  static recommendLayout(title: string, index: number = 2, totalSlides: number = 10): LayoutType {
    return layoutIntelligence.selectOptimalLayout({
      title,
      index,
      totalSlides,
    });
  }

  static generateVisualPrompt(slideTitle: string, topic: string, style: string = "Modern 3D"): VisualPromptMetadata {
    const prompt = `${style} illustration representing ${slideTitle} for ${topic}, sleek studio lighting, clean background, 8k resolution`;
    return {
      slideId: `vis-${Date.now()}`,
      visualType: style.toLowerCase().includes("isometric") ? "isometric-diagram" : "3d-illustration",
      prompt,
      suggestedAccentColor: "#6366f1",
    };
  }

  static getThemePreset(preset: ThemePresetName | string): ThemeDefinition {
    const mapping: Record<string, string> = {
      Corporate: "midnight",
      Startup: "neon-cyan",
      Minimal: "minimal-light",
      Apple: "glassmorphism",
      Google: "corporate",
      Microsoft: "corporate",
      Gamma: "aurora",
      Notion: "minimal-light",
      "Dark Glass": "glassmorphism",
      Cyberpunk: "synthwave",
      Academic: "emerald-executive",
      Luxury: "warm-editorial",
      Developer: "cyberpunk",
    };

    const targetId = mapping[preset] || preset.toLowerCase();
    return getTheme(targetId) || THEMES[0];
  }
}
