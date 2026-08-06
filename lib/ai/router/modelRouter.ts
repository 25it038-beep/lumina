import { PROVIDERS, ProviderId, getProviderInfo } from "../provider";

export type ModelTaskCategory =
  | "reasoning"
  | "creative-writing"
  | "programming"
  | "translation"
  | "mathematics"
  | "summarization"
  | "fact-verification"
  | "editing"
  | "seo"
  | "general";

export interface ModelRouteResult {
  provider: ProviderId;
  model: string;
  reasoning: string;
  fallbackProvider: ProviderId;
  fallbackModel: string;
}

export interface RoutingRule {
  category: ModelTaskCategory;
  primaryProvider: ProviderId;
  primaryModel: string;
  fallbackProvider: ProviderId;
  fallbackModel: string;
  description: string;
}

export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    category: "reasoning",
    primaryProvider: "nvidia-deepseek-v4" as ProviderId,
    primaryModel: "deepseek-ai/deepseek-r1",
    fallbackProvider: "deepseek",
    fallbackModel: "deepseek-reasoner",
    description: "DeepSeek R1/V3 specialized in multi-step CoT reasoning, logic, & analysis",
  },
  {
    category: "fact-verification",
    primaryProvider: "nvidia-deepseek-v4" as ProviderId,
    primaryModel: "deepseek-ai/deepseek-r1",
    fallbackProvider: "deepseek",
    fallbackModel: "deepseek-chat",
    description: "DeepSeek analytical verification for detecting factual claims & hallucinations",
  },
  {
    category: "mathematics",
    primaryProvider: "nvidia-deepseek-v4" as ProviderId,
    primaryModel: "deepseek-ai/deepseek-r1",
    fallbackProvider: "deepseek",
    fallbackModel: "deepseek-reasoner",
    description: "DeepSeek for formal math proofs, LaTeX calculations, & logical structures",
  },
  {
    category: "creative-writing",
    primaryProvider: "llama",
    primaryModel: "meta/llama-3.3-70b-instruct",
    fallbackProvider: "openrouter",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    description: "Meta LLaMA 3.3 70B for rich tone, narrative flow, & engaging creative prose",
  },
  {
    category: "summarization",
    primaryProvider: "llama",
    primaryModel: "meta/llama-3.3-70b-instruct",
    fallbackProvider: "openai",
    fallbackModel: "gpt-4o-mini",
    description: "LLaMA 3.3 for concise synthesis & executive summaries",
  },
  {
    category: "translation",
    primaryProvider: "llama",
    primaryModel: "meta/llama-3.3-70b-instruct",
    fallbackProvider: "openai",
    fallbackModel: "gpt-4o",
    description: "LLaMA 3.3 multilingual translation maintaining style & nuances",
  },
  {
    category: "programming",
    primaryProvider: "openrouter",
    primaryModel: "qwen/qwen-2.5-72b-instruct",
    fallbackProvider: "ollama",
    fallbackModel: "qwen3.5:latest",
    description: "Qwen 2.5/3.5 specialized in high-performance code generation & technical syntax",
  },
  {
    category: "editing",
    primaryProvider: "llama",
    primaryModel: "meta/llama-3.3-70b-instruct",
    fallbackProvider: "deepseek",
    fallbackModel: "deepseek-chat",
    description: "LLaMA 3.3 for stylistic refinement & structural prose polishing",
  },
  {
    category: "seo",
    primaryProvider: "openrouter",
    primaryModel: "meta-llama/llama-3.3-70b-instruct",
    fallbackProvider: "openai",
    fallbackModel: "gpt-4o-mini",
    description: "LLaMA 3.3 for metadata optimization, headings, & search intent alignment",
  },
  {
    category: "general",
    primaryProvider: "llama",
    primaryModel: "meta/llama-3.3-70b-instruct",
    fallbackProvider: "deepseek",
    fallbackModel: "deepseek-chat",
    description: "General multipurpose model selection",
  },
];

export class ModelRouter {
  private rules: RoutingRule[];

  constructor(customRules?: RoutingRule[]) {
    this.rules = customRules ?? DEFAULT_ROUTING_RULES;
  }

  public routeTask(category: ModelTaskCategory): ModelRouteResult {
    const rule = this.rules.find((r) => r.category === category) ?? this.rules.find((r) => r.category === "general")!;
    return {
      provider: rule.primaryProvider,
      model: rule.primaryModel,
      reasoning: rule.description,
      fallbackProvider: rule.fallbackProvider,
      fallbackModel: rule.fallbackModel,
    };
  }

  public classifyTaskFromPrompt(prompt: string): ModelTaskCategory {
    const p = prompt.toLowerCase();
    if (p.includes("code") || p.includes("script") || p.includes("python") || p.includes("typescript") || p.includes("function") || p.includes("html/css")) {
      return "programming";
    }
    if (p.includes("fact check") || p.includes("verify") || p.includes("truth") || p.includes("accuracy")) {
      return "fact-verification";
    }
    if (p.includes("math") || p.includes("calculate") || p.includes("equation") || p.includes("proof") || p.includes("formula")) {
      return "mathematics";
    }
    if (p.includes("reason") || p.includes("analyze") || p.includes("why") || p.includes("evaluate") || p.includes("logic")) {
      return "reasoning";
    }
    if (p.includes("translate") || p.includes("spanish") || p.includes("french") || p.includes("german") || p.includes("japanese")) {
      return "translation";
    }
    if (p.includes("summarize") || p.includes("tl;dr") || p.includes("key points") || p.includes("executive summary")) {
      return "summarization";
    }
    if (p.includes("seo") || p.includes("meta description") || p.includes("keywords")) {
      return "seo";
    }
    if (p.includes("edit") || p.includes("grammar") || p.includes("polish") || p.includes("improve")) {
      return "editing";
    }
    return "creative-writing";
  }

  public getSupportedRules(): RoutingRule[] {
    return this.rules;
  }
}

export const globalModelRouter = new ModelRouter();
