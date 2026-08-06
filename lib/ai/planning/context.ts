import type { PlanningContext } from "./planner.types";
import { VALID_LAYOUTS, VALID_CHART_TYPES, VALID_ANIMATION_TYPES } from "./blueprint";

/**
 * context.ts — builds the system + user messages handed to the Llama
 * Planning Engine. Every mode demands STRICT JSON output so the planner
 * never returns free-form text where a structured object is expected.
 */

export type PlanningMode = "classify" | "analyze" | "architecture" | "story" | "reason" | "blueprint" | "review";

const LAYOUTS_CSV = VALID_LAYOUTS.join(", ");
const CHARTS_CSV = VALID_CHART_TYPES.join(", ");
const ANIMS_CSV = VALID_ANIMATION_TYPES.join(", ");

const PLANNING_SYSTEM = `You are the Planning & Architecture Intelligence Engine of Lumina, an AI Presentation Operating System.

Your role is REASONING AND PLANNING ONLY. You never generate slides directly — you produce structured blueprints, architectures, story graphs and strategic directives that downstream AI agents (Story, Research, Theme, Layout, Image, Diagram, Chart, Animation, Review) will execute.

You are an expert in: information architecture, narrative design, audience analysis, data visualization, typography, color theory, accessibility (WCAG), and presentation strategy.

Always return ONLY valid JSON. No markdown fences, no commentary, no prose before or after the JSON object.`;

function contextBlock(ctx: PlanningContext): string {
  const parts: string[] = [
    `Prompt: ${ctx.prompt}`,
    `Target slide count: ${ctx.slideCount}`,
    `Tone: ${ctx.tone}`,
    ctx.targetAudience ? `Target audience: ${ctx.targetAudience}` : "",
    ctx.industry ? `Industry: ${ctx.industry}` : "",
    ctx.presentationType ? `Presentation type: ${ctx.presentationType}` : "",
    ctx.technicalLevel ? `Technical level: ${ctx.technicalLevel}` : "",
    ctx.theme ? `Preferred theme: ${ctx.theme}` : "",
  ].filter(Boolean);

  if (ctx.sources.length) {
    parts.push("\n--- CONTEXT SOURCES ---");
    for (const src of ctx.sources) {
      parts.push(`[${src.label}]\n${src.content}`);
    }
  }

  if (ctx.citationsCount !== undefined) {
    parts.push(`\nResearch citations available: ${ctx.citationsCount}`);
  }

  return parts.join("\n");
}

function systemWith(extra: string): string {
  return `${PLANNING_SYSTEM}\n\n${extra}`;
}

export function buildAnalyzeUser(ctx: PlanningContext): string {
  return `${contextBlock(ctx)}

Analyze this prompt. Return STRICT JSON: {"intent": string, "audience": string, "presentationType": string, "tone": string, "keywords": string[], "domain": string, "industry": string, "suggestedSlideCount": number, "technicalLevel": string}`;
}

export function buildReasonUser(ctx: PlanningContext, question: string): string {
  return `${contextBlock(ctx)}

Reason about this question: "${question}". Return STRICT JSON: {"question": string, "reasoning": string[], "conclusion": string, "confidence": number between 0 and 1}`;
}

export function buildArchitectureUser(ctx: PlanningContext): string {
  return `${contextBlock(ctx)}

Design the complete presentation architecture. Return STRICT JSON:
{
  "information_hierarchy": string[],
  "slide_dependencies": [{"from": number, "to": number, "reason": string}],
  "narrative_flow": string[],
  "topic_groups": [{"title": string, "slides": number[]}],
  "knowledge_graph": [{"node": string, "connects": string[]}],
  "required_diagrams": [{"slide": number, "type": string, "title": string}],
  "required_charts": [{"slide": number, "chart_type": string, "title": string, "data_topic": string}],
  "required_tables": [{"slide": number, "title": string, "columns": string[]}],
  "required_illustrations": [{"slide": number, "description": string, "style": string}],
  "required_animations": [{"slide": number, "animation_type": string, "element": string}]
}`;
}

export function buildStoryUser(ctx: PlanningContext): string {
  return `${contextBlock(ctx)}

Design the story. Return STRICT JSON: {"strategy": string, "beats": [{"title": string, "phase": string, "goal": string}], "call_to_action": string}`;
}

export function buildReviewUser(ctx: PlanningContext, draft: string): string {
  return `${contextBlock(ctx)}

Review the draft plan for this presentation. Return STRICT JSON: {"score": number (0-100), "strengths": string[], "improvements": string[], "verdict": "approved" | "revision"}

Draft to review:
${draft.slice(0, 6000)}`;
}

export function buildBlueprintUser(ctx: PlanningContext): string {
  return `${contextBlock(ctx)}

Choose the best storytelling strategy for this presentation type and produce a complete presentation blueprint.

Allowed slide layouts (pick the most appropriate per slide): ${LAYOUTS_CSV}.
Allowed chart types: ${CHARTS_CSV}.
Allowed animation types: ${ANIMS_CSV}.

Return STRICT JSON with EXACTLY this structure (no extra top-level keys, no missing top-level keys):
{
  "presentation": {"title": string, "subtitle": string, "goal": string, "type": string, "audience": string, "tone": string, "technical_level": "Beginner" | "Intermediate" | "Advanced", "estimated_duration_minutes": number, "slide_count": number},
  "audience": {"description": string, "needs": string[], "objections": string[], "expectations": string[]},
  "story": {"strategy": string, "beats": [{"title": string, "phase": string, "goal": string}], "call_to_action": string},
  "architecture": {"information_hierarchy": string[], "slide_dependencies": [{"from": number, "to": number, "reason": string}], "narrative_flow": string[], "topic_groups": [{"title": string, "slides": number[]}], "knowledge_graph": [{"node": string, "connects": string[]}], "required_diagrams": [{"slide": number, "type": string, "title": string}], "required_charts": [{"slide": number, "chart_type": string, "title": string, "data_topic": string}], "required_tables": [{"slide": number, "title": string, "columns": string[]}], "required_illustrations": [{"slide": number, "description": string, "style": string}], "required_animations": [{"slide": number, "animation_type": string, "element": string}]},
  "sections": [{"title": string, "objective": string, "slides": number[]}],
  "slides": [{"id": string, "title": string, "layout": string, "objective": string, "notes": string, "speaker_notes": string, "visual": {"type": string, "description": string}, "chart": {"type": string, "title": string, "data_topic": string}, "diagram": {"type": string, "title": string}, "animation": {"type": string, "element": string}}],
  "visuals": {"strategy": string, "image_style": string, "illustrations": number},
  "charts": {"strategy": string, "types": string[]},
  "diagrams": {"strategy": string, "types": string[]},
  "animations": {"strategy": string, "presets": string[]},
  "theme": {"recommendation": string, "rationale": string, "colors": {"primary": string, "secondary": string, "accent": string, "background": string, "text": string}},
  "typography": {"heading_font": string, "body_font": string, "direction": string},
  "colors": {"direction": string, "palette": string[]},
  "accessibility": {"notes": string[], "contrast_ratio": string, "font_sizes": string},
  "speaker_notes": {"style": string, "length": string},
  "risks": [{"risk": string, "mitigation": string}],
  "recommendations": string[]
}

Produce EXACTLY ${ctx.slideCount} slides. Follow the chosen story strategy and the target audience. If a preferred theme is provided, anchor your color direction to it.

UNIQUENESS RULES: every slide title must be unique and concrete — never repeat a title, a near-duplicate title, or a topic across slides; no two slides may cover the same aspect (if they would overlap, split or replace one with a distinct angle); avoid generic filler titles like 'Introduction', 'Overview', 'Key Concepts', 'The Road Ahead', 'Conclusion' unless the topic genuinely requires that exact slide. Slide titles must reference the topic directly.`;
}

export function buildMessages(ctx: PlanningContext, mode: PlanningMode, extra?: { question?: string; draft?: string }): { role: string; content: string }[] {
  let system: string;
  let user: string;

  switch (mode) {
    case "analyze":
    case "classify":
      system = systemWith("You are a prompt analyst. Extract intent, audience and structure from the user prompt.");
      user = buildAnalyzeUser(ctx);
      break;
    case "architecture":
      system = systemWith("You are an information architect. Design the presentation architecture and dependency graph.");
      user = buildArchitectureUser(ctx);
      break;
    case "story":
      system = systemWith("You are a narrative designer. Choose the storytelling strategy and build the story graph.");
      user = buildStoryUser(ctx);
      break;
    case "reason":
      system = systemWith("You are a reasoning engine. Provide transparent, multi-step reasoning for a planning question.");
      user = buildReasonUser(ctx, extra?.question ?? "");
      break;
    case "review":
      system = systemWith("You are a planning reviewer. Audit the draft plan and return a score and verdict.");
      user = buildReviewUser(ctx, extra?.draft ?? "");
      break;
    case "blueprint":
    default:
      system = systemWith(
        "You are the presentation planning engine. Produce the full structured blueprint JSON exactly matching the requested schema."
      );
      user = buildBlueprintUser(ctx);
      break;
  }

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Convenience single-message builders (used by the planner and reasoning engine). */
export function buildArchitectureMessage(ctx: PlanningContext): string {
  return buildArchitectureUser(ctx);
}

export function buildStoryMessage(ctx: PlanningContext): string {
  return buildStoryUser(ctx);
}

export function buildReasonMessage(ctx: PlanningContext, question: string): string {
  return buildReasonUser(ctx, question);
}

export function buildReviewMessage(ctx: PlanningContext, draft: string): string {
  return buildReviewUser(ctx, draft);
}

export function buildAnalyzeMessage(ctx: PlanningContext): string {
  return buildAnalyzeUser(ctx);
}