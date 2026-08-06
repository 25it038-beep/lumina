export interface GatewayLog {
  id: string;
  timestamp: number;
  taskType: string;
  model: string;
  status: "success" | "error" | "cache_hit" | "fallback";
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  latencyMs: number;
  error?: string;
}

// Token Counter
export function countTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
}

// Cost Calculator ($ per 1k tokens)
export function calculateCostUSD(model: string, promptTokens: number, completionTokens: number): number {
  if (model.includes("gpt-oss")) {
    return (promptTokens / 1000) * 0.001 + (completionTokens / 1000) * 0.002;
  }
  if (model.includes("deepseek")) {
    return (promptTokens / 1000) * 0.0008 + (completionTokens / 1000) * 0.0016;
  }
  if (model.includes("flux")) {
    return 0.003; // fixed cost per image request
  }
  return (promptTokens / 1000) * 0.001 + (completionTokens / 1000) * 0.002;
}

// Cache Manager
export class CacheManager {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  set(key: string, value: any, ttlMs = 1000 * 60 * 30) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  clear() {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Rate Limiter
export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequestsPerMinute: number;

  constructor(maxPerMinute = 60) {
    this.maxRequestsPerMinute = maxPerMinute;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 60000);
    if (this.timestamps.length >= this.maxRequestsPerMinute) {
      const oldest = this.timestamps[0];
      const waitMs = 60000 - (now - oldest);
      await new Promise((r) => setTimeout(r, waitMs));
    }
    this.timestamps.push(Date.now());
  }
}

// Streaming Manager
export class StreamingManager {
  async streamResponse(
    fullText: string,
    onChunk: (chunk: string, accumulated: string) => void,
    signal?: AbortSignal,
    delayMs = 12
  ): Promise<void> {
    const tokens = fullText.split(" ");
    let accumulated = "";

    for (let i = 0; i < tokens.length; i++) {
      if (signal?.aborted) throw new Error("Generation canceled by user");
      const word = tokens[i] + (i === tokens.length - 1 ? "" : " ");
      accumulated += word;
      onChunk(word, accumulated);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
