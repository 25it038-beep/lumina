import { ProviderClient, ProviderId } from "../provider";

export interface SambaNovaConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const SAMBANOVA_MODELS = {
  deepseekV31: {
    model: "DeepSeek-V3.1",
    baseUrl: "https://api.sambanova.ai/v1",
    apiKey: process.env.NEXT_PUBLIC_SAMBANOVA_API_KEY || process.env.SAMBANOVA_API_KEY || "",
  },
};

/**
 * SambaNova-hosted DeepSeek-V3.1 — the third member of the content-writing
 * ensemble. OpenAI-compatible chat completions endpoint.
 */
export class SambaNovaProvider extends ProviderClient {
  private customApiKey: string;
  private customBaseUrl: string;

  constructor(config?: Partial<SambaNovaConfig>) {
    super({
      provider: "sambanova" as ProviderId,
      model: config?.model || SAMBANOVA_MODELS.deepseekV31.model,
      apiKey: config?.apiKey || SAMBANOVA_MODELS.deepseekV31.apiKey,
      baseUrl: config?.baseUrl || SAMBANOVA_MODELS.deepseekV31.baseUrl,
    });
    this.customApiKey = config?.apiKey || SAMBANOVA_MODELS.deepseekV31.apiKey;
    this.customBaseUrl = config?.baseUrl || SAMBANOVA_MODELS.deepseekV31.baseUrl;
  }

  get isConfigured(): boolean {
    return Boolean(this.customApiKey);
  }

  async chat(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<string> {
    if (!this.customApiKey) {
      throw new Error("SambaNova API key not configured (set SAMBANOVA_API_KEY)");
    }

    const res = await fetch(`${this.customBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.customApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        top_p: 0.85,
        max_tokens: 8192,
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`SambaNova DeepSeek-V3.1 API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async chatJSON<T>(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<T> {
    const raw = await this.chat(messages, options);
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in SambaNova DeepSeek-V3.1 response");
    return JSON.parse(jsonMatch[0]) as T;
  }
}
