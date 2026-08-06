import {
  BrandKit,
  PlanningContext,
  PlanningSource,
  PresentationType,
  TechnicalLevel,
  UploadedDocument,
  UserPreferences,
} from "../ai/planning/planner.types";
import { projectMemoryStore } from "./projectMemory";
import { conversationMemoryStore } from "./conversationMemory";

/**
 * Context Engine — collects every relevant input before a planning request
 * (user prompt, uploaded documents, existing presentation, brand kit,
 * previous slides, preferences, presentation history, conversation history,
 * theme, target audience, industry, presentation type) and merges them into
 * ONE structured PlanningContext object handed to the Llama Planner.
 *
 * Applies context compression so long inputs fit a token budget.
 */

export interface ContextSources {
  prompt: string;
  sourceType?: string;
  slideCount?: number;
  tone?: string;
  theme?: string;
  targetAudience?: string;
  industry?: string;
  presentationType?: PresentationType | string;
  technicalLevel?: TechnicalLevel;
  uploadedDocuments?: UploadedDocument[];
  existingPresentation?: { title: string; slideCount: number; summary: string };
  brandKit?: BrandKit;
  previousSlides?: string[];
  preferences?: UserPreferences;
  presentationHistory?: string[];
  conversationHistory?: { role: string; content: string }[];
  researchSummary?: string;
  citationsCount?: number;
}

const MAX_SOURCE_CHARS = 4_000;
const MAX_DOCS = 5;
const MAX_HISTORY_ITEMS = 8;
const MAX_CONVERSATION_MESSAGES = 12;

function clip(text: string, max = MAX_SOURCE_CHARS): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…[truncated]" : text;
}

function pushSource(sources: PlanningSource[], kind: PlanningSource["kind"], label: string, content: string) {
  const clipped = clip(content);
  if (!clipped.trim()) return;
  sources.push({ kind, label, content: clipped });
}

export function inferIndustry(prompt: string, explicit?: string): string {
  if (explicit) return explicit;
  const t = prompt.toLowerCase();
  const map: [string, string][] = [
    ["health", "Healthcare"],
    ["medical", "Healthcare"],
    ["financ", "Finance"],
    ["bank", "Finance"],
    ["educat", "Education"],
    ["school", "Education"],
    ["software", "Technology"],
    ["ai ", "Technology"],
    ["artificial intelligence", "Technology"],
    ["retail", "Retail"],
    ["manufactur", "Manufacturing"],
    ["energy", "Energy"],
    ["legal", "Legal"],
    ["market", "Marketing"],
    ["marketing", "Marketing"],
    ["startup", "Startups"],
    ["science", "Science"],
    ["engineering", "Engineering"],
  ];
  for (const [kw, industry] of map) if (t.includes(kw)) return industry;
  return "General";
}

export function inferPresentationType(prompt: string, explicit?: string): PresentationType | string {
  if (explicit) return explicit;
  const t = prompt.toLowerCase();
  const map: [string, string][] = [
    ["pitch", "Startup Pitch"],
    ["investor", "Investor Pitch"],
    ["executive", "Executive Brief"],
    ["architecture", "Technical Architecture"],
    ["technical", "Technical Architecture"],
    ["case study", "Case Study"],
    ["research", "Research Paper"],
    ["train", "Training"],
    ["onboarding", "Training"],
    ["sales", "Sales"],
    ["marketing", "Marketing"],
    ["launch", "Product Launch"],
    ["annual report", "Annual Report"],
    ["conference", "Conference"],
    ["lecture", "Education"],
    ["education", "Education"],
    ["health", "Healthcare"],
  ];
  for (const [kw, type] of map) if (t.includes(kw)) return type;
  return "General";
}

export function inferAudience(prompt: string, explicit?: string): string {
  if (explicit) return explicit;
  const t = prompt.toLowerCase();
  const map: [string, string][] = [
    ["investor", "Investors"],
    ["students", "Students"],
    ["students", "Students"],
    ["developers", "Developers"],
    ["engineers", "Developers"],
    ["executives", "Executives"],
    ["c-suite", "Executives"],
    ["patients", "Patients"],
    ["customers", "Customers"],
    ["clients", "Customers"],
    ["teachers", "Teachers"],
    ["sales team", "Sales Team"],
    ["employees", "Employees"],
    ["government", "Government"],
    ["researchers", "Researchers"],
  ];
  for (const [kw, audience] of map) if (t.includes(kw)) return audience;
  return "General Audience";
}

export function inferTone(prompt: string, explicit?: string): string {
  if (explicit) return explicit;
  const t = prompt.toLowerCase();
  if (t.includes("fun") || t.includes("casual") || t.includes("playful")) return "Casual";
  if (t.includes("academic") || t.includes("formal")) return "Academic";
  if (t.includes("inspir")) return "Inspirational";
  if (t.includes("technical")) return "Technical";
  if (t.includes("persuasive")) return "Marketing";
  return "Professional";
}

export function inferSlideCount(prompt: string, explicit?: number): number {
  if (explicit && explicit > 0) return explicit;
  const match = prompt.match(/(\d+)\s*-?\s*(?:slide|slides|page|pages)\b/i);
  if (match) return Math.min(Math.max(parseInt(match[1], 10), 5), 40);
  return 10;
}

/**
 * Build a single structured PlanningContext from all available sources.
 * Pulls in persistent project memory + conversation history automatically.
 */
export function buildContext(input: ContextSources): PlanningContext {
  const memory = projectMemoryStore.getMemory();
  const conversation = conversationMemoryStore.all().slice(-MAX_CONVERSATION_MESSAGES);

  const prompt = input.prompt.trim();
  const sources: PlanningSource[] = [];

  pushSource(sources, "prompt", "User prompt", prompt);

  (input.uploadedDocuments ?? []).slice(0, MAX_DOCS).forEach((doc) => {
    pushSource(sources, "document", `Document: ${doc.name}`, doc.excerpt);
  });

  if (input.existingPresentation) {
    pushSource(
      sources,
      "presentation",
      "Existing presentation",
      `${input.existingPresentation.title} (${input.existingPresentation.slideCount} slides): ${input.existingPresentation.summary}`
    );
  }

  if (input.brandKit) {
    pushSource(sources, "brand-kit", "Brand kit", JSON.stringify(input.brandKit));
  }

  (input.previousSlides ?? []).slice(0, 6).forEach((s, i) => {
    pushSource(sources, "previous-slides", `Previous slide ${i + 1}`, s);
  });

  if (input.preferences) {
    pushSource(sources, "preferences", "User preferences", JSON.stringify(input.preferences));
  }

  (input.presentationHistory ?? []).slice(0, MAX_HISTORY_ITEMS).forEach((h, i) => {
    pushSource(sources, "history", `Presentation history ${i + 1}`, h);
  });

  conversation.forEach((m) => {
    pushSource(sources, "conversation", `Conversation ${m.role}`, m.content);
  });

  if (input.researchSummary) {
    pushSource(sources, "research", "Research summary", input.researchSummary);
  }

  const memorySummary = [
    memory.preferredThemes.length ? `Preferred themes: ${memory.preferredThemes.join(", ")}` : "",
    memory.writingStyle ? `Writing style: ${memory.writingStyle}` : "",
    memory.audiencePreferences.length ? `Audiences presented to: ${memory.audiencePreferences.join(", ")}` : "",
    memory.preferredLength ? `Preferred length: ${memory.preferredLength}` : "",
    memory.industry ? `Known industry: ${memory.industry}` : "",
    memory.favoriteLayouts.length ? `Favorite layouts: ${memory.favoriteLayouts.join(", ")}` : "",
    memory.brandKit ? `Brand kit: ${JSON.stringify(memory.brandKit).slice(0, 600)}` : "",
    memory.previousPresentations.length
      ? `Prior decks (${memory.previousPresentations.length}): ${memory.previousPresentations
          .slice(0, 6)
          .map((p) => p.title)
          .join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (memorySummary) pushSource(sources, "preferences", "Project memory", memorySummary);

  const slideCount = inferSlideCount(prompt, input.slideCount);
  const preferences: UserPreferences = {
    preferredThemes: memory.preferredThemes,
    favoriteLayouts: memory.favoriteLayouts,
    writingStyle: memory.writingStyle,
    preferredLength: memory.preferredLength,
    industry: memory.industry,
    defaultAudience: memory.audiencePreferences[0],
    brandKit: memory.brandKit ?? input.brandKit,
  };

  return {
    prompt,
    sourceType: input.sourceType ?? "prompt",
    slideCount,
    tone: inferTone(prompt, input.tone),
    theme: input.theme,
    targetAudience: inferAudience(prompt, input.targetAudience),
    industry: inferIndustry(prompt, input.industry),
    presentationType: inferPresentationType(prompt, input.presentationType),
    technicalLevel: input.technicalLevel,
    uploadedDocuments: (input.uploadedDocuments ?? []).slice(0, MAX_DOCS),
    existingPresentation: input.existingPresentation,
    brandKit: input.brandKit,
    previousSlides: (input.previousSlides ?? []).slice(0, 6),
    preferences,
    presentationHistory: (input.presentationHistory ?? []).slice(0, MAX_HISTORY_ITEMS),
    conversationHistory: conversation,
    researchSummary: input.researchSummary,
    citationsCount: input.citationsCount,
    sources,
    createdAt: Date.now(),
  };
}

/**
 * Compress an existing context object to a bounded token budget.
 * Longest source entries are dropped first (preferences/memory retained).
 */
export function compressContext(ctx: PlanningContext, maxSources = 10): PlanningContext {
  const sources = [...ctx.sources];
  if (sources.length <= maxSources) return ctx;

  const priority: PlanningSource["kind"][] = [
    "prompt",
    "research",
    "presentation",
    "brand-kit",
    "preferences",
    "audience",
    "industry",
    "document",
  ];
  const sorted = [...sources].sort((a, b) => {
    const pa = priority.indexOf(a.kind);
    const pb = priority.indexOf(b.kind);
    if (pa !== pb) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    return b.content.length - a.content.length;
  });

  return { ...ctx, sources: sorted.slice(0, maxSources) };
}
