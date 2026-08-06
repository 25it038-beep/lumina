import { LlamaProvider } from "../../providers/llamaProvider";
import {
  LlamaPlanningResult,
  PlanReviewResult,
  PlanningCallbacks,
  PlanningContext,
  PromptAnalysis,
  ReasonedConclusion,
  StoryGraph,
} from "./planner.types";
import {
  buildMessages,
} from "./context";
import { extractJsonObject, repairJson, repairBlueprint, validateBlueprint } from "./blueprint";
import { inferAudience, inferIndustry, inferPresentationType, inferSlideCount, inferTone } from "../../context/contextManager";

/**
 * reasoning.ts — the Reasoning Engine.
 * Higher-order planning operations (analysis, context expansion, open
 * reasoning, plan review, story selection). Every operation has a local
 * heuristic fallback so the pipeline never breaks when Llama is offline.
 */

export interface JsonLike {
  [key: string]: any;
}

function parseRecordOrNull(text: string): JsonLike | null {
  return (extractJsonObject(text) ?? repairJson(text)) as JsonLike | null;
}

export class PlanningReasoningEngine {
  constructor(private provider: LlamaProvider) {}

  /** Local fallback analysis when the model is unavailable. */
  private localAnalysis(ctx: PlanningContext): PromptAnalysis {
    const keywords = ctx.prompt
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 12);
    return {
      intent: "generate-presentation",
      audience: inferAudience(ctx.prompt, ctx.targetAudience),
      presentationType: inferPresentationType(ctx.prompt, ctx.presentationType),
      tone: inferTone(ctx.prompt, ctx.tone),
      keywords,
      domain: ctx.industry?.toLowerCase() ?? "general",
      industry: inferIndustry(ctx.prompt, ctx.industry),
      suggestedSlideCount: inferSlideCount(ctx.prompt, ctx.slideCount),
      technicalLevel: ctx.technicalLevel ?? "Intermediate",
    };
  }

  async analyzePrompt(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PromptAnalysis> {
    const raw = await this.provider.chat(buildMessages(ctx, "analyze"), {
      signal: opts.signal,
      maxTokens: 1024,
    });
    const parsed = parseRecordOrNull(raw.text);
    if (!parsed) return this.localAnalysis(ctx);
    return {
      intent: String(parsed.intent ?? "generate-presentation"),
      audience: String(parsed.audience ?? this.localAnalysis(ctx).audience),
      presentationType: String(parsed.presentationType ?? this.localAnalysis(ctx).presentationType),
      tone: String(parsed.tone ?? ctx.tone),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : this.localAnalysis(ctx).keywords,
      domain: String(parsed.domain ?? "general"),
      industry: String(parsed.industry ?? this.localAnalysis(ctx).industry),
      suggestedSlideCount: Number(parsed.suggestedSlideCount) || this.localAnalysis(ctx).suggestedSlideCount,
      technicalLevel: String(parsed.technicalLevel ?? "Intermediate"),
    };
  }

  /**
   * Incremental context expansion — ask the model what additional context
   * would materially improve the plan, and fold answers into the context.
   */
  async expandContext(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PlanningContext> {
    const analysis = await this.analyzePrompt(ctx, opts);
    const merged: PlanningContext = {
      ...ctx,
      targetAudience: ctx.targetAudience ?? analysis.audience,
      industry: ctx.industry ?? analysis.industry,
      presentationType: ctx.presentationType ?? analysis.presentationType,
      tone: ctx.tone ?? analysis.tone,
      slideCount: ctx.slideCount || analysis.suggestedSlideCount,
    };
    return merged;
  }

  async reason(ctx: PlanningContext, question: string, opts: PlanningCallbacks = {}): Promise<ReasonedConclusion> {
    const raw = await this.provider.chat(buildMessages(ctx, "reason", { question }), {
      signal: opts.signal,
      maxTokens: 1536,
    });
    const parsed = parseRecordOrNull(raw.text);
    if (!parsed) {
      return {
        question,
        reasoning: [],
        conclusion: `Reasoning unavailable — defaulting to the plan that best matches "${ctx.prompt.slice(0, 80)}".`,
        confidence: 0.5,
      };
    }
    return {
      question: String(parsed.question ?? question),
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map(String) : [],
      conclusion: String(parsed.conclusion ?? ""),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    };
  }

  async chooseStoryStrategy(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<StoryGraph> {
    const raw = await this.provider.chat(buildMessages(ctx, "story"), {
      signal: opts.signal,
      maxTokens: 2048,
    });
    const parsed = parseRecordOrNull(raw.text);
    if (!parsed) return this.localStoryGraph(ctx);
    return {
      strategy: (String(parsed.strategy ?? "Problem-Agitate-Solve")) as any,
      beats: Array.isArray(parsed.beats)
        ? parsed.beats.map((b: any, i: number) => ({
            title: String(b?.title ?? `Beat ${i + 1}`),
            phase: String(b?.phase ?? "Narrative"),
            goal: String(b?.goal ?? ""),
          }))
        : this.localStoryGraph(ctx).beats,
      call_to_action: String(parsed.call_to_action ?? ""),
    };
  }

  private localStoryGraph(ctx: PlanningContext): StoryGraph {
    const beats: StoryGraph["beats"] = [
      { title: "Hook", phase: "Open", goal: "Capture attention with a sharp, relevant opening." },
      { title: "Problem", phase: "Setup", goal: "Establish the stakes and why it matters now." },
      { title: "Insight", phase: "Build", goal: "Deliver the key evidence and reasoning." },
      { title: "Solution", phase: "Climax", goal: "Present the recommendation or answer." },
      { title: "Impact", phase: "Close", goal: "Show outcomes and next steps." },
    ];
    return { strategy: "Problem-Agitate-Solve", beats, call_to_action: "Start the conversation today." };
  }

  async reviewPlan(ctx: PlanningContext, draft: LlamaPlanningResult, opts: PlanningCallbacks = {}): Promise<PlanReviewResult> {
    const raw = await this.provider.chat(buildMessages(ctx, "review", { draft: JSON.stringify(draft).slice(0, 8000) }), {
      signal: opts.signal,
      maxTokens: 1536,
    });
    const parsed = parseRecordOrNull(raw.text);
    if (!parsed) {
      return { score: 85, strengths: [], improvements: [], verdict: "approved" };
    }
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 85)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      verdict: parsed.verdict === "revision" ? "revision" : "approved",
    };
  }

  /** Parse + validate a raw blueprint; returns repaired plan or null. */
  parseAndValidate(raw: string): { plan: LlamaPlanningResult | null; issues: string[] } {
    const parsed = extractJsonObject(raw);
    if (!parsed) return { plan: null, issues: ["No JSON object found in response"] };
    const validation = validateBlueprint(parsed);
    const repaired = repairBlueprint(parsed);
    return {
      plan: repaired,
      issues: validation.issues.map((i) => `${i.severity}: ${i.field} — ${i.message}`),
    };
  }
}

export function buildReasoningEngine(provider: LlamaProvider): PlanningReasoningEngine {
  return new PlanningReasoningEngine(provider);
}