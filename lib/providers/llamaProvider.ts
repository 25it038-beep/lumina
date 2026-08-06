import {
  LlamaChatResult,
  LlamaProviderOptions,
  LlamaStreamOptions,
  TokenUsage,
} from "../ai/planning/planner.types";
import { countTokens } from "../ai/gateway/GatewayUtilities";

/**
 * Llama Provider — the Planning & Architecture Intelligence Layer.
 *
 * An OpenAI-compatible chat completions client (NVIDIA NIM, Together,
 * Groq, or any OpenAI-compatible endpoint) specialised for structured,
 * JSON-first planning workloads.
 *
 * Responsibilities:
 *  - Authentication (Bearer key from environment or explicit config)
 *  - Streaming (SSE over fetch)
 *  - Retry handling (429 / 5xx / network with exponential backoff + jitter)
 *  - Timeout handling (per-attempt AbortController, cooperative abort)
 *  - Structured JSON responses (response_format + robust extraction)
 *  - Error recovery (repair helpers + regenerate-once semantics)
 *  - Token usage reporting (API usage object or local estimate)
 */

export const LLAMA_DEFAULT_MODEL = "meta/llama-3.3-70b-instruct";
export const LLAMA_DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

const RETRYABLE_STATUS = new Set([429, 408, 409, 425, 500, 502, 503, 504]);

export class LlamaProviderError extends Error {
  readonly status?: number;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(message: string, opts: { status?: number; retryable?: boolean; cause?: unknown } = {}) {
    super(message);
    this.name = "LlamaProviderError";
    this.status = opts.status;
    this.retryable = opts.retryable ?? (opts.status !== undefined ? RETRYABLE_STATUS.has(opts.status) : true);
    this.cause = opts.cause;
  }
}

export function resolveLlamaConfig(opts: LlamaProviderOptions = {}) {
  return {
    baseUrl: (opts.baseUrl ?? process.env.NEXT_PUBLIC_LLAMA_BASE_URL ?? process.env.LLAMA_BASE_URL ?? LLAMA_DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey:
      opts.apiKey ??
      process.env.NEXT_PUBLIC_LLAMA_API_KEY ??
      process.env.LLAMA_API_KEY ??
      "",
    model: opts.model ?? process.env.NEXT_PUBLIC_LLAMA_MODEL ?? process.env.LLAMA_MODEL ?? LLAMA_DEFAULT_MODEL,
    temperature: opts.temperature ?? 0.2,
    topP: opts.topP ?? 0.7,
    maxTokens: opts.maxTokens ?? (Number(process.env.LLAMA_MAX_TOKENS) || 4096),
    maxRetries: opts.maxRetries ?? (Number(process.env.LLAMA_MAX_RETRIES) || 3),
    timeoutMs: opts.timeoutMs ?? (Number(process.env.LLAMA_TIMEOUT_MS) || 120_000),
    retryDelayMs: opts.retryDelayMs ?? (Number(process.env.LLAMA_RETRY_DELAY_MS) || 1_000),
    jsonMode: opts.jsonMode ?? (process.env.LLAMA_JSON_MODE === "false" ? false : true),
  };
}

export class LlamaProvider {
  private options: Required<LlamaProviderOptions>;

  constructor(options: LlamaProviderOptions = {}) {
    this.options = resolveLlamaConfig(options);
  }

  get model(): string {
    return this.options.model;
  }

  get baseUrl(): string {
    return this.options.baseUrl;
  }

  get hasApiKey(): boolean {
    return this.options.apiKey.length > 0;
  }

  /**
   * Build an AbortController that aborts when EITHER the caller signal
   * fires or the per-attempt timeout elapses.
   */
  private buildController(signal?: AbortSignal, timeoutMs?: number): { controller: AbortController; clearTimer: () => void } {
    const controller = new AbortController();
    const external = signal;
    const onAbort = () => controller.abort();
    if (external?.aborted) controller.abort();
    else if (external) external.addEventListener("abort", onAbort, { once: true });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const t = timeoutMs ?? this.options.timeoutMs;
    if (t > 0) timer = setTimeout(() => controller.abort(new LlamaProviderError("Llama request timed out", { retryable: true })), t);

    return {
      controller,
      clearTimer: () => {
        if (timer) clearTimeout(timer);
        if (external) external.removeEventListener("abort", onAbort);
      },
    };
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.options.apiKey) h["Authorization"] = `Bearer ${this.options.apiKey}`;
    return h;
  }

  private delayMs(attempt: number): number {
    const base = this.options.retryDelayMs * 2 ** attempt;
    const jitter = Math.random() * base * 0.25;
    return Math.min(base + jitter, 30_000);
  }

  private estimateUsage(prompt: string, completion: string): TokenUsage {
    const promptTokens = countTokens(prompt);
    const completionTokens = countTokens(completion);
    return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
  }

  /**
   * Execute a chat completion with retry / timeout / rate-limit handling.
   * Returns the full response text plus token usage.
   */
  async chat(messages: { role: string; content: string }[], opts: LlamaStreamOptions = {}): Promise<LlamaChatResult> {
    if (!this.options.apiKey) {
      throw new LlamaProviderError("LLAMA_API_KEY is not configured — set LLAMA_API_KEY (or NEXT_PUBLIC_LLAMA_API_KEY) in your environment", { retryable: false });
    }

    const started = Date.now();
    const budgetMs = Math.max(this.options.timeoutMs, this.options.timeoutMs * 2);
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      if (Date.now() - started > budgetMs) {
        throw new LlamaProviderError("Llama request exceeded total time budget", { cause: lastError });
      }
      const { controller, clearTimer } = this.buildController(opts.signal);
      try {
        const body: Record<string, unknown> = {
          model: this.options.model,
          messages,
          temperature: opts.temperature ?? this.options.temperature,
          top_p: opts.topP ?? this.options.topP,
          max_tokens: opts.maxTokens ?? this.options.maxTokens,
          stream: false,
        };
        if (this.options.jsonMode) body.response_format = { type: "json_object" };
        const res = await fetch(`${this.options.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          const retryAfter = Number(res.headers.get("retry-after") ?? "0") * 1000;
          const err = new LlamaProviderError(
            `Llama API error ${res.status}: ${body.slice(0, 300) || res.statusText}`,
            { status: res.status }
          );
          lastError = err;

          if (err.retryable && attempt < this.options.maxRetries) {
            clearTimer();
            await new Promise((r) => setTimeout(r, retryAfter || this.delayMs(attempt)));
            continue;
          }
          throw err;
        }

        const data = await res.json();
        const content: string = data.choices?.[0]?.message?.content ?? "";
        const usage: TokenUsage =
          data.usage?.prompt_tokens != null
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens ?? 0,
                totalTokens: (data.usage.prompt_tokens ?? 0) + (data.usage.completion_tokens ?? 0),
              }
            : this.estimateUsage(messages.map((m) => m.content).join("\n"), content);

        if (opts.onChunk && content) opts.onChunk(content, content);

        return { text: content, usage, model: this.options.model, latencyMs: Date.now() - started };
      } catch (err: any) {
        if (err?.name === "AbortError") {
          const isTimeout = controller.signal.reason instanceof LlamaProviderError;
          if (isTimeout && attempt < this.options.maxRetries) {
            lastError = controller.signal.reason;
            clearTimer();
            await new Promise((r) => setTimeout(r, this.delayMs(attempt)));
            continue;
          }
          clearTimer();
          throw new LlamaProviderError("Llama request cancelled or timed out", { cause: controller.signal.reason });
        }
        lastError = err;
        clearTimer();
        if (err instanceof LlamaProviderError && !err.retryable) throw err;
        if (attempt < this.options.maxRetries) {
          await new Promise((r) => setTimeout(r, this.delayMs(attempt)));
          continue;
        }
      }
    }

    throw new LlamaProviderError("Llama request failed after retries", { cause: lastError });
  }

  /**
   * Streamed chat completion (SSE). `onChunk` receives each content delta.
   */
  async streamChat(messages: { role: string; content: string }[], opts: LlamaStreamOptions = {}): Promise<LlamaChatResult> {
    if (!this.options.apiKey) {
      throw new LlamaProviderError("LLAMA_API_KEY is not configured — set LLAMA_API_KEY (or NEXT_PUBLIC_LLAMA_API_KEY) in your environment", { retryable: false });
    }

    const started = Date.now();
    const budgetMs = Math.max(this.options.timeoutMs, this.options.timeoutMs * 2);
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      if (Date.now() - started > budgetMs) {
        throw new LlamaProviderError("Llama stream exceeded total time budget", { cause: lastError });
      }
      const { controller, clearTimer } = this.buildController(opts.signal);
      let accumulated = "";
      try {
        const body: Record<string, unknown> = {
          model: this.options.model,
          messages,
          temperature: opts.temperature ?? this.options.temperature,
          top_p: opts.topP ?? this.options.topP,
          max_tokens: opts.maxTokens ?? this.options.maxTokens,
          stream: true,
        };
        if (this.options.jsonMode) body.response_format = { type: "json_object" };
        const res = await fetch(`${this.options.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          const err = new LlamaProviderError(`Llama stream error ${res.status}: ${body.slice(0, 300)}`, { status: res.status });
          lastError = err;
          if (err.retryable && attempt < this.options.maxRetries) {
            clearTimer();
            await new Promise((r) => setTimeout(r, this.delayMs(attempt)));
            continue;
          }
          throw err;
        }

        if (!res.body) throw new LlamaProviderError("Llama stream returned no body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            if (!payload) continue;
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                accumulated += delta;
                opts.onChunk?.(delta, accumulated);
              }
            } catch {
              /* partial / keep-alive frames — ignore */
            }
          }
        }

        const usage = this.estimateUsage(messages.map((m) => m.content).join("\n"), accumulated);
        return { text: accumulated, usage, model: this.options.model, latencyMs: Date.now() - started };
      } catch (err: any) {
        if (err?.name === "AbortError") {
          const isTimeout = controller.signal.reason instanceof LlamaProviderError;
          if (isTimeout && attempt < this.options.maxRetries) {
            lastError = controller.signal.reason;
            clearTimer();
            await new Promise((r) => setTimeout(r, this.delayMs(attempt)));
            continue;
          }
          clearTimer();
          throw new LlamaProviderError("Llama stream cancelled or timed out", { cause: controller.signal.reason });
        }
        lastError = err;
        clearTimer();
        if (err instanceof LlamaProviderError && !err.retryable) throw err;
        if (attempt < this.options.maxRetries) {
          await new Promise((r) => setTimeout(r, this.delayMs(attempt)));
          continue;
        }
      }
    }

    throw new LlamaProviderError("Llama stream failed after retries", { cause: lastError });
  }
}

export const llamaProvider = new LlamaProvider();
