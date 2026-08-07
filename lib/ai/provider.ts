export type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "deepseek"
  | "sambanova"
  | "ollama"
  | "llama"
  | "nvidia-llama-3.3-70b"
  | "nvidia-gpt-oss"
  | "nvidia-deepseek-v4"
  | "local";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  models: string[];
  needsKey: boolean;
  baseUrl?: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "local",
    label: "Lumina Engine (offline)",
    models: ["lumina-local-v1"],
    needsKey: false,
  },
  {
    id: "openai",
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3-mini"],
    needsKey: true,
    baseUrl: "https://api.openai.com/v1",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    models: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5", "claude-3-7-sonnet"],
    needsKey: true,
    baseUrl: "https://api.anthropic.com/v1",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    needsKey: true,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    models: [
      "openai/gpt-4o",
      "anthropic/claude-sonnet-4-5",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen-2.5-72b-instruct",
      "mistralai/mistral-large",
      "deepseek/deepseek-chat",
    ],
    needsKey: true,
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    models: ["deepseek-chat", "deepseek-reasoner"],
    needsKey: true,
    baseUrl: "https://api.deepseek.com/v1",
  },
  {
    id: "sambanova",
    label: "SambaNova",
    models: ["DeepSeek-V3.1"],
    needsKey: true,
    baseUrl: "https://api.sambanova.ai/v1",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    models: ["qwen3.5:latest", "qwen3", "llama3.3", "qwen2.5", "mistral", "deepseek-r1", "gemma2"],
    needsKey: false,
    baseUrl: "http://localhost:11434/v1",
  },
  {
    id: "nvidia-llama-3.3-70b",
    label: "NVIDIA Llama 3.3 70B Instruct",
    models: ["meta/llama-3.3-70b-instruct"],
    needsKey: true,
    baseUrl: "https://integrate.api.nvidia.com/v1",
  },
  {
    id: "llama",
    label: "Llama (Planning Engine)",
    models: ["meta/llama-3.3-70b-instruct"],
    needsKey: true,
    baseUrl: "https://integrate.api.nvidia.com/v1",
  },
];

export function getProviderInfo(id: string): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

interface ProviderConfig {
  provider: ProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

interface ChatCallOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
}

export class ProviderClient {
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  get providerId(): ProviderId {
    return this.config.provider;
  }

  get model(): string {
    return this.config.model;
  }

  private async chatOpenAICompat(messages: ChatMessage[], opts: ChatCallOptions) {
    const info = getProviderInfo(this.config.provider);
    const baseUrl = this.config.baseUrl ?? info.baseUrl ?? "https://api.openai.com/v1";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    if (this.config.provider === "openrouter") headers["HTTP-Referer"] = "https://lumina.app";

    const body: any = {
      model: this.config.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
    };
    if (opts.json) body.response_format = { type: "json_object" };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Provider ${this.config.provider} error ${res.status}: ${err.slice(0, 300)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async chatGemini(messages: ChatMessage[], opts: ChatCallOptions) {
    const baseUrl = this.config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    const url = `${baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey ?? ""}`;
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { temperature: opts.temperature ?? 0.7 } }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  private async chatClaude(messages: ChatMessage[], opts: ChatCallOptions) {
    const baseUrl = this.config.baseUrl ?? "https://api.anthropic.com/v1";
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const msgs = messages.filter((m) => m.role !== "system");
    const res = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        system,
        messages: msgs,
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }

  async chat(messages: ChatMessage[], opts: ChatCallOptions = {}): Promise<string> {
    if (this.config.provider === "local") {
      throw new Error("local provider has no network chat; use localEngine instead");
    }
    if (this.config.provider === "gemini") return this.chatGemini(messages, opts);
    if (this.config.provider === "anthropic") return this.chatClaude(messages, opts);
    return this.chatOpenAICompat(messages, opts);
  }

  async chatJSON<T>(messages: ChatMessage[], opts: ChatCallOptions = {}): Promise<T> {
    const raw = await this.chat(messages, { ...opts, json: true });
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Provider returned no JSON");
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
}

export const DEFAULT_AI_CONFIG = {
  provider: "local" as ProviderId,
  model: "lumina-local-v1",
};

export function buildClient(
  provider?: string,
  model?: string,
  apiKey?: string,
  baseUrl?: string
): ProviderClient {
  const cfg: ProviderConfig = {
    provider: (provider as ProviderId) ?? "local",
    model: model ?? getProviderInfo(provider ?? "local").models[0],
    apiKey: apiKey || undefined,
    baseUrl: baseUrl || undefined,
  };
  return new ProviderClient(cfg);
}
