import { ProviderClient, ProviderId } from "../provider";

export interface NVIDIAConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const NVIDIA_MODELS = {
  llama33_70b: {
    model: "meta/llama-3.3-70b-instruct",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
  },
  gptOss20b: {
    model: "openai/gpt-oss-20b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
  },
  deepseekV4Pro: {
    model: "deepseek-ai/deepseek-v4-pro",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
  },
  flux1Schnell: {
    model: "black-forest-labs/flux-1-schnell",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: "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",
  },
};

export class Llama33_70bProvider extends ProviderClient {
  private customApiKey: string;
  private customBaseUrl: string;

  constructor(config?: Partial<NVIDIAConfig>) {
    super({
      provider: "nvidia-llama-3.3-70b",
      model: config?.model || NVIDIA_MODELS.llama33_70b.model,
      apiKey: config?.apiKey || NVIDIA_MODELS.llama33_70b.apiKey,
      baseUrl: config?.baseUrl || NVIDIA_MODELS.llama33_70b.baseUrl,
    });
    this.customApiKey = config?.apiKey || NVIDIA_MODELS.llama33_70b.apiKey;
    this.customBaseUrl = config?.baseUrl || NVIDIA_MODELS.llama33_70b.baseUrl;
  }

  async chat(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<string> {
    const res = await fetch(`${this.customBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.customApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NVIDIA Llama 3.3 70B API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || "";
    return content;
  }

  async chatJSON<T>(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<T> {
    const raw = await this.chat(messages, options);
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in Llama 3.3 70B response");
    return JSON.parse(jsonMatch[0]) as T;
  }
}

export class GptOssProvider extends ProviderClient {
  private customApiKey: string;
  private customBaseUrl: string;

  constructor(config?: Partial<NVIDIAConfig>) {
    super({
      provider: "nvidia-gpt-oss",
      model: config?.model || NVIDIA_MODELS.gptOss20b.model,
      apiKey: config?.apiKey || NVIDIA_MODELS.gptOss20b.apiKey,
      baseUrl: config?.baseUrl || NVIDIA_MODELS.gptOss20b.baseUrl,
    });
    this.customApiKey = config?.apiKey || NVIDIA_MODELS.gptOss20b.apiKey;
    this.customBaseUrl = config?.baseUrl || NVIDIA_MODELS.gptOss20b.baseUrl;
  }

  async chat(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<string> {
    const res = await fetch(`${this.customBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.customApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        top_p: 1,
        max_tokens: 4096,
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GPT OSS API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || "";
    const reasoning = message?.reasoning_content;
    return reasoning ? `[Reasoning]\n${reasoning}\n\n${content}` : content;
  }

  async chatJSON<T>(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<T> {
    const raw = await this.chat(messages, options);
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in GPT OSS response");
    return JSON.parse(jsonMatch[0]) as T;
  }
}

export class DeepSeekV4Provider extends ProviderClient {
  private customApiKey: string;
  private customBaseUrl: string;

  constructor(config?: Partial<NVIDIAConfig>) {
    super({
      provider: "nvidia-deepseek-v4",
      model: config?.model || NVIDIA_MODELS.deepseekV4Pro.model,
      apiKey:
        config?.apiKey ||
        process.env.NEXT_PUBLIC_NVIDIA_API_KEY_DEEPSEEK ||
        process.env.NVIDIA_API_KEY_DEEPSEEK ||
        NVIDIA_MODELS.deepseekV4Pro.apiKey,
      baseUrl: config?.baseUrl || NVIDIA_MODELS.deepseekV4Pro.baseUrl,
    });
    this.customApiKey =
      config?.apiKey ||
      process.env.NEXT_PUBLIC_NVIDIA_API_KEY_DEEPSEEK ||
      process.env.NVIDIA_API_KEY_DEEPSEEK ||
      NVIDIA_MODELS.deepseekV4Pro.apiKey;
    this.customBaseUrl = config?.baseUrl || NVIDIA_MODELS.deepseekV4Pro.baseUrl;
  }
  async chat(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<string> {
    const res = await fetch(`${this.customBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.customApiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 16384,
        extra_body: { chat_template_kwargs: { thinking: false } },
        stream: false,
      }),
      signal: options?.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek V4 API Error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async chatJSON<T>(messages: { role: string; content: string }[], options?: { signal?: AbortSignal }): Promise<T> {
    const raw = await this.chat(messages, options);
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in DeepSeek V4 response");
    return JSON.parse(jsonMatch[0]) as T;
  }
}

export class FluxSchnellProvider {
  providerId = "nvidia-flux-1-schnell";
  model: string;
  private apiKey: string;
  private baseUrl: string;
  /** Cache generated images per prompt so repeat slides never re-request. */
  private imageCache = new Map<string, string>();
  /**
   * Circuit breaker: when all NVIDIA endpoints fail (blocked/unreachable network),
   * skip the slow attempts and fail fast so callers fall back to pollinations immediately.
   */
  private static nextRetryAt = 0;
  private static readonly RETRY_COOLDOWN_MS = 5 * 60_000;

  constructor(config?: Partial<NVIDIAConfig>) {
    this.model = config?.model || NVIDIA_MODELS.flux1Schnell.model;
    this.apiKey = config?.apiKey || NVIDIA_MODELS.flux1Schnell.apiKey;
    this.baseUrl = config?.baseUrl || NVIDIA_MODELS.flux1Schnell.baseUrl;
  }

  async generateImage(prompt: string, style = "Illustration"): Promise<string> {
    const cacheKey = `${style}:${prompt}`;
    if (this.imageCache.has(cacheKey)) return this.imageCache.get(cacheKey)!;

    // Fast-fail when NVIDIA endpoints recently proved unreachable.
    if (Date.now() < FluxSchnellProvider.nextRetryAt) {
      throw new Error("FLUX-1 Schnell endpoints unreachable (circuit breaker open)");
    }

    const fullPrompt = `${prompt}, ${style} style, presentation background, 8k resolution, highly detailed, beautiful lighting`;
    const body = JSON.stringify({
      prompt: fullPrompt,
      height: 1024,
      width: 1024,
    });
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    const endpoints = [
      `https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`,
      `${this.baseUrl}/genai/black-forest-labs/flux.1-schnell`,
      `https://build.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`,
    ];
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const art = data?.artifacts?.[0]?.base64;
          if (art) {
            const out = `data:image/png;base64,${art}`;
            this.imageCache.set(cacheKey, out);
            return out;
          }
          if (data?.b64_json) {
            const out = `data:image/png;base64,${data.b64_json}`;
            this.imageCache.set(cacheKey, out);
            return out;
          }
          if (data?.image_url) {
            this.imageCache.set(cacheKey, data.image_url);
            return data.image_url;
          }
          if (data?.images?.[0]?.url) {
            this.imageCache.set(cacheKey, data.images[0].url);
            return data.images[0].url;
          }
        }
      } catch {
        /* try next endpoint */
      }
    }
    FluxSchnellProvider.nextRetryAt = Date.now() + FluxSchnellProvider.RETRY_COOLDOWN_MS;
    throw new Error("FLUX-1 Schnell image generation failed on all endpoints");
  }
}

export class StableDiffusionProvider {
  providerId = "stable-diffusion-xl";

  async generateContentImage(prompt: string, style = "Illustration"): Promise<string> {
    const fullPrompt = `${prompt}, ${style} style, high quality slide graphic, relevant to content, detailed, clear visual representation`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=stablediffusion-xl&width=1024&height=1024&nologo=true`;
  }
}
