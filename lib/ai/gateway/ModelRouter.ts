export type AITaskType =
  | "plan_presentation"
  | "generate_outline"
  | "write_content"
  | "generate_code"
  | "rewrite_text"
  | "summarize_section"
  | "generate_speaker_notes"
  | "generate_hero_image"
  | "generate_illustration"
  | "generate_chart_data"
  | "generate_diagram_nodes"
  | "audit_presentation"
  | "translate_text";

export interface ModelTarget {
  primaryModel:
    | "ensemble (Llama 3.3 + DeepSeek V4 + SambaNova V3.1)"
    | "ensemble (Llama 3.3 + DeepSeek V4)"
    | "meta/llama-3.3-70b-instruct"
    | "gpt-oss-20b"
    | "deepseek-v4-pro"
    | "sambanova-deepseek-v3.1"
    | "flux-1-schnell"
    | "local";
  fallbackModel: "meta/llama-3.3-70b-instruct" | "deepseek-v4-pro" | "gpt-oss-20b" | "sambanova-deepseek-v3.1" | "local";
  description: string;
}

export class ModelRouter {
  route(task: AITaskType): ModelTarget {
    // Strength-based division of labor:
    // GPT-5.5 -> presentation planning, writing quality, complex instructions
    // DeepSeek V4 -> presentation content, reasoning, coding, chart/diagram synthesis (equal quality, lower cost)
    switch (task) {
      // Planning + writing-quality + complex-instruction tasks -> GPT
      case "plan_presentation":
      case "generate_outline":
      case "rewrite_text":
      case "summarize_section":
      case "translate_text":
      case "audit_presentation":
        return {
          primaryModel: "gpt-oss-20b",
          fallbackModel: "deepseek-v4-pro",
          description: "GPT-5.5: best-in-class planning, writing quality, and instruction following",
        };

      // Content, reasoning, coding, and data tasks -> DeepSeek (equal stars, lower cost)
      case "write_content":
      case "generate_speaker_notes":
      case "generate_chart_data":
      case "generate_diagram_nodes":
      case "generate_code":
        return {
          primaryModel: "deepseek-v4-pro",
          fallbackModel: "gpt-oss-20b",
          description: "DeepSeek V4: presentation content, reasoning, coding, and data synthesis at lower cost",
        };

      case "generate_hero_image":
      case "generate_illustration":
        return {
          primaryModel: "flux-1-schnell",
          fallbackModel: "local",
          description: "Ultra-fast diffusion model for hero visual assets",
        };

      default:
        return {
          primaryModel: "deepseek-v4-pro",
          fallbackModel: "local",
          description: "Default fallback content provider",
        };
    }
  }
}
