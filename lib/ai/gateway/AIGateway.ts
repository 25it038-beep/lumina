import { GptOssProvider, DeepSeekV4Provider, FluxSchnellProvider, Llama33_70bProvider } from "./NvidiaProviders";
import { SambaNovaProvider } from "./SambaNovaProvider";
import { OllamaProvider } from "./OllamaProvider";
import { ModelRouter, AITaskType } from "./ModelRouter";
import {
  CacheManager,
  RateLimiter,
  StreamingManager,
  countTokens,
  calculateCostUSD,
  GatewayLog,
} from "./GatewayUtilities";
import { buildClient } from "../provider";
import { generateOutline, generateContent } from "../localEngine";
import { dedupeOutlineSlides, synthesizeDualContent, synthesizeTripleContent } from "../contentEnrichment";

export interface GatewayExecutionOptions {
  signal?: AbortSignal;
  useCache?: boolean;
  onChunk?: (chunk: string, accumulated: string) => void;
}

export class AIGateway {
  private static instance: AIGateway;
  private router = new ModelRouter();
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter(60);
  private streamingManager = new StreamingManager();

  private llama33 = new Llama33_70bProvider();
  private gptOss = new GptOssProvider();
  private deepseek = new DeepSeekV4Provider();
  private samba = new SambaNovaProvider();
  private flux = new FluxSchnellProvider();
  private ollama = new OllamaProvider();

  private logs: GatewayLog[] = [];
  private totalCostUSD = 0;
  private totalTokensUsed = 0;

  private constructor() {}

  static getInstance(): AIGateway {
    if (!AIGateway.instance) {
      AIGateway.instance = new AIGateway();
    }
    return AIGateway.instance;
  }

  getLogs(): GatewayLog[] {
    return [...this.logs];
  }

  getMetrics() {
    return {
      totalRequests: this.logs.length,
      totalCostUSD: Number(this.totalCostUSD.toFixed(5)),
      totalTokensUsed: this.totalTokensUsed,
      cacheHits: this.logs.filter((l) => l.status === "cache_hit").length,
      errors: this.logs.filter((l) => l.status === "error").length,
      cachedEntries: this.cache.size(),
    };
  }

  async executeTask(
    task: AITaskType,
    messages: { role: string; content: string }[],
    options: GatewayExecutionOptions = {}
  ): Promise<string> {
    await this.rateLimiter.checkLimit();
    const startTime = Date.now();
    const target = this.router.route(task);

    // Cache check
    const cacheKey = `${task}:${JSON.stringify(messages)}`;
    if (options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logExecution({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          taskType: task,
          model: target.primaryModel,
          status: "cache_hit",
          promptTokens: 0,
          completionTokens: 0,
          costUSD: 0,
          latencyMs: Date.now() - startTime,
        });
        if (options.onChunk) {
          await this.streamingManager.streamResponse(cached, options.onChunk, options.signal);
        }
        return cached;
      }
    }

    let responseText = "";
    let usedModel: string = target.primaryModel;
    let status: GatewayLog["status"] = "success";
    let errorMsg: string | undefined;

    // Primary Provider Execution with Triple-Model Parallel Ensemble
    // (Llama 3.3 70B + DeepSeek V4 Pro + SambaNova DeepSeek-V3.1).
    // The second and third writers get complementary-role directives so the
    // drafts cover different angles instead of repeating each other.
    try {
      if (task === "write_content" || task === "generate_outline") {
        const complementaryDirective =
          "You are a SECOND writer in a multi-model ensemble. Write a COMPLEMENTARY draft: contribute DIFFERENT insights, statistics, key takeaways and bullets the first writer likely missed. Do NOT repeat the first draft's phrasing or points — take a distinct angle and keep every point specific.";
        const thirdWriterDirective =
          "You are a THIRD writer in a multi-model ensemble. Write a CONTRASTING draft: contribute FRESH evidence, examples, numbers and angles that neither of the other writers covered. Avoid repeating their phrasing or points entirely — your job is to make the final blend richer, not similar.";

        const llamaMsgs =
          task === "write_content"
            ? [...messages, { role: "user", content: complementaryDirective }]
            : messages;
        const sambaMsgs =
          task === "write_content"
            ? [...messages, { role: "user", content: thirdWriterDirective }]
            : messages;

        const calls: Promise<string>[] = [
          this.llama33.chat(llamaMsgs, { signal: options.signal }),
          this.deepseek.chat(messages, { signal: options.signal }),
        ];
        if (this.samba.isConfigured) {
          calls.push(this.samba.chat(sambaMsgs, { signal: options.signal }));
        }
        const [llamaRes, deepseekRes, sambaRes] = await Promise.allSettled(calls);

        const parseDraft = (raw: string): any | null => {
          try {
            const cleaned = raw
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/```\s*$/i, "")
              .trim();
            let best: any = null;
            const candidates = cleaned.match(/\{[\s\S]*?\}|\[[\s\S]*?\]/g) ?? [];
            for (const m of [...candidates, ...(cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/) ?? [])]) {
              try {
                const obj = JSON.parse(m);
                if (obj && typeof obj === "object") {
                  if (!best || Object.keys(obj).length > Object.keys(best).length) best = obj;
                }
              } catch {
                /* try next candidate */
              }
            }
            return best;
          } catch {
            return null;
          }
        };

        const llamaObj = llamaRes.status === "fulfilled" ? parseDraft(llamaRes.value) : null;
        const deepseekObj = deepseekRes.status === "fulfilled" ? parseDraft(deepseekRes.value) : null;
        const sambaObj =
          sambaRes && sambaRes.status === "fulfilled" ? parseDraft(sambaRes.value) : null;

        const fulfillCount = [llamaRes, deepseekRes, sambaRes].filter(
          (r): r is PromiseFulfilledResult<string> => !!r && r.status === "fulfilled"
        ).length;

        if (llamaObj && deepseekObj && sambaObj && fulfillCount >= 3) {
          // Triple synthesis: LLaMA + DeepSeek + SambaNova blend.
          const blended =
            task === "write_content"
              ? synthesizeTripleContent(llamaObj, deepseekObj, sambaObj)
              : {
                  ...deepseekObj,
                  ...llamaObj,
                  ...sambaObj,
                  title: llamaObj.title || deepseekObj.title || sambaObj.title,
                  subtitle: llamaObj.subtitle || deepseekObj.subtitle || sambaObj.subtitle,
                  slides: dedupeOutlineSlides(
                    (Array.isArray(llamaObj.slides) ? llamaObj.slides : [])
                      .concat(Array.isArray(deepseekObj.slides) ? deepseekObj.slides : [])
                      .concat(Array.isArray(sambaObj.slides) ? sambaObj.slides : [])
                  ),
                };
          responseText = JSON.stringify(blended);
          usedModel = "ensemble (Llama 3.3 + DeepSeek V4 + SambaNova V3.1)";
        } else if (llamaObj && deepseekObj) {
          // LLaMA + DeepSeek Dual Synthesis: blend both drafts and return
          // the best combined content output for the slide.
          const blended =
            task === "write_content"
              ? synthesizeDualContent(llamaObj, deepseekObj)
              : {
                  ...deepseekObj,
                  ...llamaObj,
                  title: llamaObj.title || deepseekObj.title,
                  subtitle: llamaObj.subtitle || deepseekObj.subtitle,
                  slides: dedupeOutlineSlides(
                    (Array.isArray(llamaObj.slides) ? llamaObj.slides : []).concat(
                      Array.isArray(deepseekObj.slides) ? deepseekObj.slides : []
                    )
                  ),
                };
          responseText = JSON.stringify(blended);
          usedModel = "ensemble (Llama 3.3 + DeepSeek V4)";
        } else if (deepseekObj && sambaObj) {
          const blended =
            task === "write_content"
              ? synthesizeDualContent(deepseekObj, sambaObj)
              : {
                  ...deepseekObj,
                  ...sambaObj,
                  title: deepseekObj.title || sambaObj.title,
                  subtitle: deepseekObj.subtitle || sambaObj.subtitle,
                  slides: dedupeOutlineSlides(
                    (Array.isArray(deepseekObj.slides) ? deepseekObj.slides : []).concat(
                      Array.isArray(sambaObj.slides) ? sambaObj.slides : []
                    )
                  ),
                };
          responseText = JSON.stringify(blended);
          usedModel = "ensemble (DeepSeek V4 + SambaNova V3.1)";
        } else if (llamaObj && sambaObj) {
          const blended =
            task === "write_content"
              ? synthesizeDualContent(llamaObj, sambaObj)
              : {
                  ...llamaObj,
                  ...sambaObj,
                  title: llamaObj.title || sambaObj.title,
                  subtitle: llamaObj.subtitle || sambaObj.subtitle,
                  slides: dedupeOutlineSlides(
                    (Array.isArray(llamaObj.slides) ? llamaObj.slides : []).concat(
                      Array.isArray(sambaObj.slides) ? sambaObj.slides : []
                    )
                  ),
                };
          responseText = JSON.stringify(blended);
          usedModel = "ensemble (Llama 3.3 + SambaNova V3.1)";
        } else if (deepseekObj) {
          responseText = JSON.stringify(deepseekObj);
          usedModel = "deepseek-v4-pro";
        } else if (llamaObj) {
          responseText = JSON.stringify(llamaObj);
          usedModel = "meta/llama-3.3-70b-instruct";
        } else if (sambaObj) {
          responseText = JSON.stringify(sambaObj);
          usedModel = "sambanova-deepseek-v3.1";
        } else {
          const winner = [llamaRes, deepseekRes, sambaRes]
            .filter((r): r is PromiseFulfilledResult<string> => !!r && r.status === "fulfilled")
            .sort((a, b) => b.value.length - a.value.length)[0];
          if (winner) {
            responseText = winner.value;
            usedModel = "deepseek-v4-pro";
          } else {
            throw new Error("All Llama 3.3, DeepSeek V4 and SambaNova providers failed.");
          }
        }
      } else if (target.primaryModel === "gpt-oss-20b") {
        responseText = await this.gptOss.chat(messages, { signal: options.signal });
      } else {
        responseText = await this.deepseek.chat(messages, { signal: options.signal });
      }
    } catch (err: any) {
      status = "fallback";
      errorMsg = err.message;
      try {
        // Fallback execution chain
        try {
          responseText = await this.llama33.chat(messages, { signal: options.signal });
          usedModel = "meta/llama-3.3-70b-instruct";
        } catch {
          try {
            responseText = await this.deepseek.chat(messages, { signal: options.signal });
            usedModel = "deepseek-v4-pro";
          } catch {
            responseText = await this.samba.chat(messages, { signal: options.signal });
            usedModel = "sambanova-deepseek-v3.1";
          }
        }
      } catch (fbErr: any) {
        status = "error";
        errorMsg = fbErr.message;
        responseText = "Local engine ready: Please verify model endpoint connection.";
      }
    }

    // Token & Cost Calculations
    const pTokens = messages.reduce((a, m) => a + countTokens(m.content), 0);
    const cTokens = countTokens(responseText);
    const cost = calculateCostUSD(usedModel, pTokens, cTokens);

    this.totalCostUSD += cost;
    this.totalTokensUsed += pTokens + cTokens;

    this.logExecution({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskType: task,
      model: usedModel,
      status,
      promptTokens: pTokens,
      completionTokens: cTokens,
      costUSD: cost,
      latencyMs: Date.now() - startTime,
      error: errorMsg,
    });

    if (responseText && status !== "error") {
      this.cache.set(cacheKey, responseText);
    }

    if (options.onChunk && responseText) {
      await this.streamingManager.streamResponse(responseText, options.onChunk, options.signal);
    }

    return responseText;
  }

  async executeJSON<T>(
    task: AITaskType,
    messages: { role: string; content: string }[],
    options: GatewayExecutionOptions = {}
  ): Promise<T> {
    const raw = await this.executeTask(task, messages, options);
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Gateway failed to extract JSON from model response");
    return JSON.parse(jsonMatch[0]) as T;
  }

  async generateVisual(prompt: string, style = "Illustration"): Promise<string> {
    return this.generateStableDiffusionContentImage(prompt, style);
  }

  async generateFluxBackground(prompt: string, style = "Presentation Background"): Promise<string> {
    const startTime = Date.now();
    await this.rateLimiter.checkLimit();
    let url = "";

    try {
      url = await this.flux.generateImage(prompt, style);
    } catch {
      url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${style}, 8k presentation background`)}?model=flux&width=1920&height=1080&nologo=true`;
    }

    const cost = calculateCostUSD("flux-1-schnell", 0, 0);
    this.totalCostUSD += cost;
    this.logExecution({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskType: "generate_hero_image",
      model: "flux-1-schnell",
      status: "success",
      promptTokens: countTokens(prompt),
      completionTokens: 0,
      costUSD: cost,
      latencyMs: Date.now() - startTime,
    });

    return url;
  }

  async generateStableDiffusionContentImage(prompt: string, style = "Illustration"): Promise<string> {
    const startTime = Date.now();
    await this.rateLimiter.checkLimit();
    const fullPrompt = `${prompt}, ${style} style, slide graphic, highly relevant to presentation content, 8k resolution, crisp detail`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?model=stablediffusion-xl&width=1024&height=1024&nologo=true`;

    this.logExecution({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      taskType: "generate_hero_image",
      model: "stable-diffusion-xl" as any,
      status: "success",
      promptTokens: countTokens(prompt),
      completionTokens: 0,
      costUSD: 0,
      latencyMs: Date.now() - startTime,
    });

    return url;
  }

  private logExecution(log: GatewayLog) {
    this.logs = [log, ...this.logs].slice(0, 100);
  }
}

export const aiGateway = AIGateway.getInstance();
