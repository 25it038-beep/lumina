import type { PresentationOutline, OutlineItem, LayoutType } from "../../types";
import { LlamaPlanningResult, PresentationArchitecture } from "./planner.types";

/**
 * Blueprint — schema, validation and repair for Llama planning output.
 *
 * Every planning response must be structured JSON. This module guarantees
 * that contract: raw model output is extracted, schema-validated, and
 * automatically repaired (or regenerated upstream) when invalid.
 */

export const VALID_LAYOUTS: LayoutType[] = [
  "title", "title-image", "two-columns", "three-columns", "timeline", "comparison",
  "roadmap", "process", "infographic", "metrics", "pie", "bar", "table", "cards",
  "hero", "gallery", "mindmap", "swot", "bmc", "flowchart", "architecture", "agenda",
  "quote", "quote-image", "statistics", "text-image", "video", "code", "references",
  "conclusion", "q-and-a", "blank", "section", "facts", "key-takeaways", "formula",
  "team", "pricing", "contact", "pyramid", "funnel", "matrix", "before-after",
  "vision", "mission", "milestones", "checklist", "thank-you", "bento", "bento-grid",
  "journey", "faq",
];

export const VALID_CHART_TYPES = [
  "pie", "doughnut", "donut", "bar", "stacked-bar", "horizontal-bar", "line", "area",
  "radar", "bubble", "scatter", "heatmap", "treemap", "sankey", "gantt",
];

export const VALID_ANIMATION_TYPES = [
  "fade", "fade-up", "fade-down", "zoom", "zoom-in", "morph", "slide", "slide-up",
  "slide-left", "slide-right", "scale", "blur", "flip", "parallax", "stagger", "pop",
  "spin", "draw", "none",
];

export interface BlueprintValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface BlueprintValidationResult {
  valid: boolean;
  issues: BlueprintValidationIssue[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function arr(v: unknown): unknown[] | undefined {
  return Array.isArray(v) ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

/** Extract a JSON object from raw model text (fences, prose, leading text). */
export function extractJsonObject(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const start = text.indexOf("{");
  if (start === -1) return null;
  text = text.slice(start);

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(0, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          return isRecord(parsed) ? parsed : null;
        } catch {
          return repairJson(candidate);
        }
      }
    }
  }
  return null;
}

/** Lightweight JSON repair for common model output defects. */
export function repairJson(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  try {
    const parsed = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    /* fall through to repair */
  }

  text = text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  text = text.replace(/,\s*([}\]])/g, "$1"); // trailing commas
  text = text.replace(/:\s*,\s*/g, ":null,"); // empty values
  text = text.replace(/;\s*/g, ","); // stray semicolons
  text = text.replace(/undefined/g, "null");
  text = text.replace(/NaN/g, "0");
  text = text.replace(/True/g, "true").replace(/False/g, "false").replace(/None/g, "null");

  try {
    const parsed = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clampLayout(layout: unknown): LayoutType {
  const l = String(layout ?? "").toLowerCase().replace(/\s+/g, "-");
  return (VALID_LAYOUTS as string[]).includes(l) ? (l as LayoutType) : "two-columns";
}

function clampChart(type: unknown): string {
  const t = String(type ?? "").toLowerCase().replace(/\s+/g, "-");
  return VALID_CHART_TYPES.includes(t) ? t : "bar";
}

function clampAnimation(type: unknown): string {
  const t = String(type ?? "").toLowerCase().replace(/\s+/g, "-");
  return VALID_ANIMATION_TYPES.includes(t) ? t : "fade-up";
}

/**
 * Validate a parsed blueprint against the required output contract.
 * Missing fields are reported so callers can repair or regenerate.
 */
export function validateBlueprint(plan: unknown): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];
  const add = (field: string, message: string, severity: "error" | "warning" = "error") =>
    issues.push({ field, message, severity });

  if (!isRecord(plan)) {
    return { valid: false, issues: [{ field: "$", message: "Blueprint is not an object", severity: "error" }] };
  }

  if (!isRecord(plan.presentation)) add("presentation", "Missing presentation block", "error");
  else {
    if (!str(plan.presentation.title)) add("presentation.title", "Missing title", "warning");
    if (num(plan.presentation.slide_count) === undefined || (plan.presentation.slide_count as number) <= 0) {
      add("presentation.slide_count", "Missing or invalid slide_count", "error");
    }
  }

  if (!isRecord(plan.story)) add("story", "Missing story block", "warning");
  else if (!arr(plan.story.beats) || (plan.story.beats as unknown[]).length === 0) {
    add("story.beats", "Missing story beats", "warning");
  }

  if (!isRecord(plan.architecture)) add("architecture", "Missing architecture block", "error");
  else {
    const arch = plan.architecture as unknown as PresentationArchitecture;
    if (!Array.isArray(arch.slide_dependencies)) add("architecture.slide_dependencies", "Missing dependency graph", "warning");
    if (!Array.isArray(arch.information_hierarchy) || arch.information_hierarchy.length === 0) {
      add("architecture.information_hierarchy", "Missing information hierarchy", "warning");
    }
  }

  if (!Array.isArray(plan.sections)) add("sections", "Missing sections", "warning");

  if (!Array.isArray(plan.slides) || (plan.slides as unknown[]).length === 0) {
    add("slides", "Missing slides array", "error");
  } else {
    (plan.slides as unknown[]).forEach((s, i) => {
      if (!isRecord(s)) return;
      if (!str(s.title)) add(`slides[${i}].title`, "Slide missing title", "warning");
      const layout = str(s.layout);
      if (layout && !(VALID_LAYOUTS as string[]).includes(layout.toLowerCase().replace(/\s+/g, "-"))) {
        add(`slides[${i}].layout`, `Unknown layout "${layout}" — will be clamped`, "warning");
      }
    });
  }

  if (!isRecord(plan.theme)) add("theme", "Missing theme recommendation", "warning");
  if (!Array.isArray(plan.recommendations)) add("recommendations", "Missing recommendations", "warning");
  if (!Array.isArray(plan.risks)) add("risks", "Missing risks", "warning");

  const errors = issues.filter((i) => i.severity === "error");
  return { valid: errors.length === 0, issues };
}

/**
 * Repair a parsed blueprint in place: coerce types, clamp enums, and
 * derive missing values from available data where possible.
 */
export function repairBlueprint(raw: unknown): LlamaPlanningResult | null {
  let plan: Record<string, unknown> | null = isRecord(raw) ? raw : null;
  if (!plan && typeof raw === "string") plan = extractJsonObject(raw);
  if (!plan) return null;

  const slidesRaw = arr(plan.slides) ?? [];
  const sectionsRaw = arr(plan.sections) ?? [];

  const slides: LlamaPlanningResult["slides"] = slidesRaw.map((s, i) => {
    const rec = isRecord(s) ? s : {};
    return {
      id: str(rec.id) ?? `s${i}`,
      title: str(rec.title) ?? `Section ${i + 1}`,
      layout: clampLayout(rec.layout),
      objective: str(rec.objective) ?? "",
      notes: str(rec.notes) ?? (str(rec.objective) ?? ""),
      speaker_notes: str(rec.speaker_notes),
      visual: isRecord(rec.visual)
        ? { type: str(rec.visual.type) ?? "illustration", description: str(rec.visual.description) ?? "" }
        : undefined,
      chart: isRecord(rec.chart)
        ? {
            type: clampChart(rec.chart.type),
            title: str(rec.chart.title) ?? "",
            data_topic: str(rec.chart.data_topic) ?? "",
          }
        : undefined,
      diagram: isRecord(rec.diagram) ? { type: str(rec.diagram.type) ?? "", title: str(rec.diagram.title) ?? "" } : undefined,
      animation: isRecord(rec.animation)
        ? { type: clampAnimation(rec.animation.type), element: str(rec.animation.element) ?? "" }
        : undefined,
    };
  });

  const presentationRaw = isRecord(plan.presentation) ? plan.presentation : {};
  const slideCount = num(presentationRaw.slide_count) ?? slides.length ?? 10;

  const sections: LlamaPlanningResult["sections"] = sectionsRaw.map((s, i) => {
    const rec = isRecord(s) ? s : {};
    return {
      title: str(rec.title) ?? `Section ${i + 1}`,
      objective: str(rec.objective) ?? "",
      slides: arr(rec.slides)?.map((n) => Number(n)).filter((n) => !Number.isNaN(n)) ?? [i],
    };
  });

  const storyRaw = isRecord(plan.story) ? plan.story : {};
  const beats = arr(storyRaw.beats)?.map((b, i) => {
    const rec = isRecord(b) ? b : {};
    return {
      title: str(rec.title) ?? `Beat ${i + 1}`,
      phase: str(rec.phase) ?? "Narrative",
      goal: str(rec.goal) ?? "",
    };
  }) ?? [];

  const archRaw = isRecord(plan.architecture) ? plan.architecture : {};
  const themeRaw = isRecord(plan.theme) ? plan.theme : {};
  const colorsRaw = isRecord(themeRaw.colors) ? themeRaw.colors : {};
  const typoRaw = isRecord(plan.typography) ? plan.typography : {};
  const a11yRaw = isRecord(plan.accessibility) ? plan.accessibility : {};
  const visualsRaw = isRecord(plan.visuals) ? plan.visuals : {};
  const chartsRaw = isRecord(plan.charts) ? plan.charts : {};
  const diagramsRaw = isRecord(plan.diagrams) ? plan.diagrams : {};
  const animsRaw = isRecord(plan.animations) ? plan.animations : {};
  const colorsRaw2 = isRecord(plan.colors) ? plan.colors : {};
  const speakerRaw = isRecord(plan.speaker_notes) ? plan.speaker_notes : {};

  return {
    presentation: {
      title: str(presentationRaw.title) ?? "Untitled Presentation",
      subtitle: str(presentationRaw.subtitle) ?? "",
      goal: str(presentationRaw.goal) ?? "",
      type: str(presentationRaw.type) ?? "General",
      audience: str(presentationRaw.audience) ?? "General Audience",
      tone: str(presentationRaw.tone) ?? "Professional",
      technical_level: str(presentationRaw.technical_level) ?? "Intermediate",
      estimated_duration_minutes: num(presentationRaw.estimated_duration_minutes) ?? Math.max(5, slideCount * 2),
      slide_count: slideCount,
    },
    audience: isRecord(plan.audience)
      ? {
          description: str(plan.audience.description) ?? "",
          needs: arr(plan.audience.needs)?.map(String) ?? [],
          objections: arr(plan.audience.objections)?.map(String) ?? [],
          expectations: arr(plan.audience.expectations)?.map(String) ?? [],
        }
      : { description: "", needs: [], objections: [], expectations: [] },
    story: {
      strategy: (str(storyRaw.strategy) as LlamaPlanningResult["story"]["strategy"]) ?? "Problem-Agitate-Solve",
      beats,
      call_to_action: str(storyRaw.call_to_action) ?? "",
    },
    architecture: {
      information_hierarchy: arr(archRaw.information_hierarchy)?.map(String) ?? [],
      slide_dependencies:
        arr(archRaw.slide_dependencies)?.map((d, i) => {
          const rec = isRecord(d) ? d : {};
          return { from: Number(rec.from) || i, to: Number(rec.to) || i + 1, reason: str(rec.reason) ?? "" };
        }) ?? [],
      narrative_flow: arr(archRaw.narrative_flow)?.map(String) ?? [],
      topic_groups:
        arr(archRaw.topic_groups)?.map((g, i) => {
          const rec = isRecord(g) ? g : {};
          return { title: str(rec.title) ?? `Group ${i + 1}`, slides: arr(rec.slides)?.map(Number) ?? [] };
        }) ?? [],
      knowledge_graph:
        arr(archRaw.knowledge_graph)?.map((n, i) => {
          const rec = isRecord(n) ? n : {};
          return { node: str(rec.node) ?? `Node ${i + 1}`, connects: arr(rec.connects)?.map(String) ?? [] };
        }) ?? [],
      required_diagrams:
        arr(archRaw.required_diagrams)?.map((d, i) => {
          const rec = isRecord(d) ? d : {};
          return { slide: Number(rec.slide) || i, type: str(rec.type) ?? "flowchart", title: str(rec.title) ?? "" };
        }) ?? [],
      required_charts:
        arr(archRaw.required_charts)?.map((c, i) => {
          const rec = isRecord(c) ? c : {};
          return { slide: Number(rec.slide) || i, chart_type: clampChart(rec.chart_type), title: str(rec.title) ?? "", data_topic: str(rec.data_topic) ?? "" };
        }) ?? [],
      required_tables:
        arr(archRaw.required_tables)?.map((t, i) => {
          const rec = isRecord(t) ? t : {};
          return { slide: Number(rec.slide) || i, title: str(rec.title) ?? "", columns: arr(rec.columns)?.map(String) ?? [] };
        }) ?? [],
      required_illustrations:
        arr(archRaw.required_illustrations)?.map((il, i) => {
          const rec = isRecord(il) ? il : {};
          return { slide: Number(rec.slide) || i, description: str(rec.description) ?? "", style: str(rec.style) ?? "" };
        }) ?? [],
      required_animations:
        arr(archRaw.required_animations)?.map((a, i) => {
          const rec = isRecord(a) ? a : {};
          return { slide: Number(rec.slide) || i, animation_type: clampAnimation(rec.animation_type), element: str(rec.element) ?? "" };
        }) ?? [],
    },
    sections,
    slides,
    visuals: {
      strategy: str(visualsRaw.strategy) ?? "",
      image_style: str(visualsRaw.image_style) ?? "",
      illustrations: num(visualsRaw.illustrations) ?? 0,
    },
    charts: { strategy: str(chartsRaw.strategy) ?? "", types: arr(chartsRaw.types)?.map(String) ?? [] },
    diagrams: { strategy: str(diagramsRaw.strategy) ?? "", types: arr(diagramsRaw.types)?.map(String) ?? [] },
    animations: { strategy: str(animsRaw.strategy) ?? "", presets: arr(animsRaw.presets)?.map(String) ?? [] },
    theme: {
      recommendation: str(themeRaw.recommendation) ?? "",
      rationale: str(themeRaw.rationale) ?? "",
      colors: {
        primary: str(colorsRaw.primary) ?? "#6366f1",
        secondary: str(colorsRaw.secondary) ?? "#38bdf8",
        accent: str(colorsRaw.accent) ?? "#f59e0b",
        background: str(colorsRaw.background) ?? "#0b0f19",
        text: str(colorsRaw.text) ?? "#f8fafc",
      },
    },
    typography: {
      heading_font: str(typoRaw.heading_font) ?? "Inter",
      body_font: str(typoRaw.body_font) ?? "Inter",
      direction: str(typoRaw.direction) ?? "",
    },
    colors: { direction: str(colorsRaw2.direction) ?? "", palette: arr(colorsRaw2.palette)?.map(String) ?? [] },
    accessibility: {
      notes: arr(a11yRaw.notes)?.map(String) ?? [],
      contrast_ratio: str(a11yRaw.contrast_ratio) ?? "AA",
      font_sizes: str(a11yRaw.font_sizes) ?? "",
    },
    speaker_notes: { style: str(speakerRaw.style) ?? "", length: str(speakerRaw.length) ?? "" },
    risks:
      arr(plan.risks)?.map((r) => {
        const rec = isRecord(r) ? r : {};
        return { risk: str(rec.risk) ?? "", mitigation: str(rec.mitigation) ?? "" };
      }) ?? [],
    recommendations: arr(plan.recommendations)?.map(String) ?? [],
  };
}

/**
 * Convert a Llama blueprint into the standard PresentationOutline the
 * AI Orchestrator and downstream agents already consume.
 */
export function blueprintToOutline(plan: LlamaPlanningResult): PresentationOutline {
  const slides: OutlineItem[] = plan.slides.map((s, i) => {
    const visuals: string[] = [];
    if (s.visual?.description) visuals.push(`Visual: ${s.visual.description}`);
    if (s.chart?.title) visuals.push(`Chart (${s.chart.type}): ${s.chart.title}`);
    if (s.diagram?.title) visuals.push(`Diagram (${s.diagram.type}): ${s.diagram.title}`);
    if (s.animation?.type) visuals.push(`Animation: ${s.animation.type}`);
    const directive = visuals.length ? `\n[Blueprint directives] ${visuals.join(" · ")}` : "";

    return {
      id: s.id || `bp-${i}`,
      title: s.title,
      layout: clampLayout(s.layout),
      notes: `${s.objective ? `Objective: ${s.objective}. ` : ""}${s.notes ?? ""}${directive}`.slice(0, 1200),
      subtopics: plan.architecture.information_hierarchy.filter((h) =>
        h.toLowerCase().split(/\s+/).some((w) => w.length > 3 && s.title.toLowerCase().includes(w))
      ),
    };
  });

  return {
    title: plan.presentation.title || "Untitled Presentation",
    subtitle: plan.presentation.subtitle || plan.presentation.goal || "",
    slides,
  };
}
