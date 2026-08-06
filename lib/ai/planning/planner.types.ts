import type { LayoutType, ChartType, AnimationType, ThemeDefinition } from "../../types";

/* ------------------------------------------------------------------ */
/* Planning Layer type contracts                                       */
/* The Llama Planning Engine never writes slides directly — it only    */
/* emits structured blueprints that downstream agents consume.         */
/* ------------------------------------------------------------------ */

export type PresentationType =
  | "Investor Pitch"
  | "Executive Brief"
  | "Technical Architecture"
  | "Case Study"
  | "Research Paper"
  | "Training"
  | "Sales"
  | "Marketing"
  | "Healthcare"
  | "Education"
  | "Startup Pitch"
  | "Annual Report"
  | "Conference"
  | "Product Launch"
  | "Business Proposal"
  | "Strategy Roadmap"
  | "Onboarding"
  | "General";

export type TechnicalLevel = "Beginner" | "Intermediate" | "Advanced";

export type StoryStrategy =
  | "Problem-Agitate-Solve"
  | "Hero's Journey"
  | "Hook-Narrative-Evidence-Impact"
  | "Friction-Funnel"
  | "Before-After-Bridge"
  | "Pyramid Principle"
  | "Question-Case-Insight"
  | "Challenge-Solution-Proof-Ask"
  | "Linear Chronology"
  | "TED Talk Arc";

export interface StoryBeat {
  title: string;
  phase: string;
  goal: string;
}

export interface StoryGraph {
  strategy: StoryStrategy;
  beats: StoryBeat[];
  call_to_action: string;
}

export interface SlideDependency {
  from: number;
  to: number;
  reason: string;
}

export interface TopicGroup {
  title: string;
  slides: number[];
}

export interface KnowledgeNode {
  node: string;
  connects: string[];
}

export interface RequiredDiagram {
  slide: number;
  type: string;
  title: string;
}

export interface RequiredChart {
  slide: number;
  chart_type: ChartType | string;
  title: string;
  data_topic: string;
}

export interface RequiredTable {
  slide: number;
  title: string;
  columns: string[];
}

export interface RequiredIllustration {
  slide: number;
  description: string;
  style: string;
}

export interface RequiredAnimation {
  slide: number;
  animation_type: AnimationType | string;
  element: string;
}

export interface PresentationArchitecture {
  information_hierarchy: string[];
  slide_dependencies: SlideDependency[];
  narrative_flow: string[];
  topic_groups: TopicGroup[];
  knowledge_graph: KnowledgeNode[];
  required_diagrams: RequiredDiagram[];
  required_charts: RequiredChart[];
  required_tables: RequiredTable[];
  required_illustrations: RequiredIllustration[];
  required_animations: RequiredAnimation[];
}

export interface PlannedSlide {
  id: string;
  title: string;
  layout: LayoutType | string;
  objective: string;
  notes: string;
  speaker_notes?: string;
  visual?: { type: string; description: string };
  chart?: { type: string; title: string; data_topic: string };
  diagram?: { type: string; title: string };
  animation?: { type: string; element: string };
}

export interface PlannedSection {
  title: string;
  objective: string;
  slides: number[];
}

export interface ColorDirection {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ThemeRecommendation {
  recommendation: string;
  rationale: string;
  colors: ColorDirection;
}

export interface TypographyDirection {
  heading_font: string;
  body_font: string;
  direction: string;
}

export interface AccessibilityNotes {
  notes: string[];
  contrast_ratio: string;
  font_sizes: string;
}

export interface PlanRisk {
  risk: string;
  mitigation: string;
}

export interface SpeakerNotesPlan {
  style: string;
  length: string;
}

/* Full structured output contract for a planning request */
export interface LlamaPlanningResult {
  presentation: {
    title: string;
    subtitle: string;
    goal: string;
    type: PresentationType | string;
    audience: string;
    tone: string;
    technical_level: TechnicalLevel | string;
    estimated_duration_minutes: number;
    slide_count: number;
  };
  audience: { description: string; needs: string[]; objections: string[]; expectations: string[] };
  story: StoryGraph;
  architecture: PresentationArchitecture;
  sections: PlannedSection[];
  slides: PlannedSlide[];
  visuals: { strategy: string; image_style: string; illustrations: number };
  charts: { strategy: string; types: string[] };
  diagrams: { strategy: string; types: string[] };
  animations: { strategy: string; presets: string[] };
  theme: ThemeRecommendation;
  typography: TypographyDirection;
  colors: { direction: string; palette: string[] };
  accessibility: AccessibilityNotes;
  speaker_notes: SpeakerNotesPlan;
  risks: PlanRisk[];
  recommendations: string[];
}

/* ------------------------------------------------------------------ */
/* Context Engine types                                                */
/* ------------------------------------------------------------------ */

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  excerpt: string;
  size: number;
}

export interface BrandKit {
  logo?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  fonts?: string[];
  constraints?: string[];
}

export interface UserPreferences {
  preferredThemes: string[];
  favoriteLayouts: string[];
  writingStyle?: string;
  preferredLength?: string;
  industry?: string;
  defaultAudience?: string;
  brandKit?: BrandKit;
}

export interface PlanningSource {
  kind:
    | "prompt"
    | "document"
    | "presentation"
    | "brand-kit"
    | "preferences"
    | "history"
    | "conversation"
    | "theme"
    | "audience"
    | "industry"
    | "research"
    | "previous-slides";
  label: string;
  content: string;
}

export interface PlanningContext {
  prompt: string;
  sourceType: string;
  slideCount: number;
  tone: string;
  theme?: string;
  targetAudience?: string;
  industry?: string;
  presentationType?: PresentationType | string;
  technicalLevel?: TechnicalLevel;
  uploadedDocuments: UploadedDocument[];
  existingPresentation?: { title: string; slideCount: number; summary: string };
  brandKit?: BrandKit;
  previousSlides: string[];
  preferences?: UserPreferences;
  presentationHistory: string[];
  conversationHistory: { role: string; content: string }[];
  researchSummary?: string;
  citationsCount?: number;
  sources: PlanningSource[];
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/* Provider-level types                                                */
/* ------------------------------------------------------------------ */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlamaChatResult {
  text: string;
  usage: TokenUsage;
  model: string;
  latencyMs: number;
}

export interface LlamaProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  maxRetries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
  /** Request response_format: json_object. Disable for endpoints that reject it. */
  jsonMode?: boolean;
}

export interface LlamaStreamOptions {
  signal?: AbortSignal;
  onChunk?: (delta: string, accumulated: string) => void;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface PlannerConfig {
  enabled: boolean;
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  cacheTtlMs: number;
  maxContextTokens: number;
}

export interface PlanningCallbacks {
  signal?: AbortSignal;
  onStep?: (label: string) => void;
  onChunk?: (delta: string, accumulated: string) => void;
  useCache?: boolean;
}

export interface PlanReviewResult {
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: "approved" | "revision";
}

export interface PromptAnalysis {
  intent: string;
  audience: string;
  presentationType: PresentationType | string;
  tone: string;
  keywords: string[];
  domain: string;
  industry: string;
  suggestedSlideCount: number;
  technicalLevel: TechnicalLevel | string;
}

export interface ReasonedConclusion {
  question: string;
  reasoning: string[];
  conclusion: string;
  confidence: number;
}

export type { LayoutType, ChartType, AnimationType, ThemeDefinition };
