import { LlamaProvider, LlamaProviderError } from "../../providers/llamaProvider";
import { CacheManager, RateLimiter } from "../gateway/GatewayUtilities";
import {
  LlamaPlanningResult,
  PlanReviewResult,
  PlanningCallbacks,
  PlanningContext,
  PresentationArchitecture,
  PromptAnalysis,
  ReasonedConclusion,
  StoryGraph,
} from "./planner.types";
import { buildMessages } from "./context";
import { blueprintToOutline } from "./blueprint";
import { ArchitectureEngine, buildArchitectureEngine } from "./architecture";
import { PlanningReasoningEngine, buildReasoningEngine } from "./reasoning";
import { isPlanningEnabled, resolvePlannerConfig } from "./config";
import type { PresentationOutline } from "../../types";

/**
 * planner.ts — the Planning & Architecture Intelligence Layer facade.
 *
 * Pipeline: Context Engine → Llama Planner → Presentation Blueprint →
 * AI Orchestrator (Story / Research / Theme / Layout / Image / Diagram /
 * Chart / Animation / Review agents).
 *
 * Llama never writes slides; it only produces structured plans that every
 * downstream agent consumes.
 *
 * Performance: response caching, context compression, incremental updates,
 * streaming, request cancellation, automatic retries, rate-limit handling,
 * timeout recovery. Validation: schema validation, JSON repair, and
 * regenerate-once semantics.
 */

export interface PlannerStats {
  totalRequests: number;
  cacheHits: number;
  regenerations: number;
  failures: number;
  lastLatencyMs?: number;
}

export class LlamaPlanner {
  private provider: LlamaProvider;
  private reasoning: PlanningReasoningEngine;
  private architectureEngine: ArchitectureEngine;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;
  private stats: PlannerStats = { totalRequests: 0, cacheHits: 0, regenerations: 0, failures: 0 };

  constructor(provider?: LlamaProvider) {
    this.provider = provider ?? new LlamaProvider();
    this.reasoning = buildReasoningEngine(this.provider);
    this.architectureEngine = buildArchitectureEngine(this.provider);
    this.cache = new CacheManager();
    this.rateLimiter = new RateLimiter(60);
  }

  isEnabled(): boolean {
    return isPlanningEnabled();
  }

  getStats(): PlannerStats {
    return { ...this.stats };
  }

  clearCache() {
    this.cache.clear();
  }

  private cacheKey(ctx: PlanningContext, mode: string): string {
    const sig = ctx.sources.map((s) => `${s.kind}:${s.label}:${s.content.length}`).join("|");
    return `${mode}:${ctx.prompt.slice(0, 120)}:${ctx.slideCount}:${sig}`;
  }

  private async attempt(
    ctx: PlanningContext,
    mode: string,
    opts: PlanningCallbacks,
    maxTokens: number,
    regenSuffix = ""
  ): Promise<LlamaPlanningResult> {
    await this.rateLimiter.checkLimit();
    const key = this.cacheKey(ctx, mode);
    if (opts.useCache !== false) {
      const cached = this.cache.get(key) as LlamaPlanningResult | null;
      if (cached) {
        this.stats.cacheHits++;
        opts.onStep?.("Cache hit — reusing prior blueprint.");
        return cached;
      }
    }

    opts.onStep?.("Llama Planning Engine: reasoning over context…");
    const messages = buildMessages(ctx, mode as any, { question: undefined, draft: undefined });
    if (regenSuffix) {
      messages[1] = { role: "user", content: `${messages[1].content}\n\n${regenSuffix}` };
    }

    let raw: { text: string };
    if (opts.onChunk) {
      raw = await this.provider.streamChat(messages, {
        signal: opts.signal,
        maxTokens,
        onChunk: opts.onChunk,
      });
    } else {
      raw = await this.provider.chat(messages, { signal: opts.signal, maxTokens });
    }
    opts.onStep?.("Blueprint drafted — validating structure…");

    const first = this.reasoning.parseAndValidate(raw.text);
    let plan = first.plan;

    if (!plan && opts.useCache !== false) {
      // Invalid JSON — regenerate once with a repair directive.
      this.stats.regenerations++;
      opts.onStep?.("Invalid JSON detected — regenerating…");
      const raw2 = await this.provider.chat(messages, { signal: opts.signal, maxTokens });
      const second = this.reasoning.parseAndValidate(raw2.text);
      plan = second.plan;
    }

    if (!plan) {
      this.stats.failures++;
      throw new LlamaProviderError("Llama planner returned unparseable output after regeneration", { retryable: false });
    }

    this.stats.totalRequests++;
    this.cache.set(key, plan);
    return plan;
  }

  /**
   * Full planning pipeline: analyze → story → architecture → blueprint.
   * Returns the complete structured LlamaPlanningResult.
   * With `staged` enabled the pipeline runs incrementally (analyze, story,
   * architecture, blueprint), emitting an onStep callback after each stage.
   */
  async planPresentation(ctx: PlanningContext, opts: PlanningCallbacks & { staged?: boolean } = {}): Promise<LlamaPlanningResult> {
    if (!opts.staged) return this.attempt(ctx, "blueprint", opts, 8192);

    opts.onStep?.("Analyzing prompt intent…");
    const analysis = await this.reasoning.analyzePrompt(ctx, opts);
    const enriched: PlanningContext = {
      ...ctx,
      targetAudience: ctx.targetAudience ?? analysis.audience,
      industry: ctx.industry ?? analysis.industry,
      presentationType: ctx.presentationType ?? analysis.presentationType,
    };

    opts.onStep?.(`Story strategy: building "${enriched.presentationType}" narrative…`);
    await this.reasoning.chooseStoryStrategy(enriched, opts);

    opts.onStep?.("Designing information architecture…");
    await this.architectureEngine.designArchitecture(enriched, opts);

    return this.attempt(enriched, "blueprint", opts, 8192);
  }

  /** Same as planPresentation — explicit alias for blueprint generation. */
  async generateBlueprint(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<LlamaPlanningResult> {
    return this.planPresentation(ctx, opts);
  }

  async designArchitecture(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PresentationArchitecture> {
    return this.architectureEngine.designArchitecture(ctx, opts);
  }

  async analyzePrompt(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PromptAnalysis> {
    return this.reasoning.analyzePrompt(ctx, opts);
  }

  async expandContext(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PlanningContext> {
    return this.reasoning.expandContext(ctx, opts);
  }

  async reason(ctx: PlanningContext, question: string, opts: PlanningCallbacks = {}): Promise<ReasonedConclusion> {
    return this.reasoning.reason(ctx, question, opts);
  }

  async chooseStoryStrategy(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<StoryGraph> {
    return this.reasoning.chooseStoryStrategy(ctx, opts);
  }

  async reviewPlan(ctx: PlanningContext, draft: LlamaPlanningResult, opts: PlanningCallbacks = {}): Promise<PlanReviewResult> {
    return this.reasoning.reviewPlan(ctx, draft, opts);
  }

  /** Convert a blueprint into the standard outline consumed by the orchestrator. */
  toOutline(plan: LlamaPlanningResult): PresentationOutline {
    return blueprintToOutline(plan);
  }
}

export const llamaPlanner = new LlamaPlanner();
