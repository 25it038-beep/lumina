export type ElementType =
  | "text"
  | "heading"
  | "subtitle"
  | "image"
  | "video"
  | "gif"
  | "audio"
  | "icon"
  | "shape"
  | "table"
  | "chart"
  | "code"
  | "formula"
  | "timeline"
  | "roadmap"
  | "mindmap"
  | "mermaid"
  | "flowchart"
  | "svg"
  | "qr"
  | "button"
  | "embed"
  | "swot"
  | "bmc"
  | "architecture"
  | "mermaid";

export type LayoutType =
  | "title"
  | "title-image"
  | "two-columns"
  | "three-columns"
  | "timeline"
  | "comparison"
  | "roadmap"
  | "process"
  | "infographic"
  | "metrics"
  | "pie"
  | "bar"
  | "table"
  | "cards"
  | "hero"
  | "gallery"
  | "mindmap"
  | "swot"
  | "bmc"
  | "flowchart"
  | "architecture"
  | "agenda"
  | "quote"
  | "quote-image"
  | "statistics"
  | "text-image"
  | "video"
  | "code"
  | "references"
  | "conclusion"
  | "q-and-a"
  | "blank"
  | "section"
  | "facts"
  | "key-takeaways"
  | "formula"
  | "team"
  | "pricing"
  | "contact"
  | "pyramid"
  | "funnel"
  | "matrix"
  | "before-after"
  | "vision"
  | "mission"
  | "milestones"
  | "checklist"
  | "thank-you"
  | "bento"
  | "bento-grid"
  | "journey"
  | "faq";

export type ChartType =
  | "pie"
  | "doughnut"
  | "bar"
  | "line"
  | "area"
  | "radar"
  | "bubble"
  | "scatter"
  | "heatmap"
  | "treemap"
  | "sankey"
  | "gantt"
  | "donut"
  | "stacked-bar"
  | "horizontal-bar";

export type AnimationType =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "zoom"
  | "zoom-in"
  | "morph"
  | "slide"
  | "slide-up"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "blur"
  | "flip"
  | "parallax"
  | "stagger"
  | "pop"
  | "spin"
  | "draw"
  | "none";

export type TemplateCategory =
  | "corporate"
  | "startup"
  | "education"
  | "business"
  | "marketing"
  | "medical"
  | "technology"
  | "finance"
  | "minimal"
  | "glassmorphism"
  | "dark"
  | "apple"
  | "microsoft"
  | "google"
  | "modern"
  | "gradient"
  | "luxury"
  | "cyberpunk"
  | "academic"
  | "creative"
  | "technical"
  | "security"
  | "scientific"
  | "interface"
  | "diagram"
  | "engineering"
  | "isometric"
  | "3d"
  | "retro"
  | "art"
  | "vaporwave"
  | "nature"
  | "travel"
  | "real-estate"
  | "sustainability"
  | "portfolio"
  | "photography"
  | "story"
  | "interactive"
  | "development"
  | "data";

export type ThemeStyle =
  | "corporate"
  | "startup"
  | "education"
  | "business"
  | "marketing"
  | "medical"
  | "technology"
  | "finance"
  | "minimal"
  | "glassmorphism"
  | "dark"
  | "apple"
  | "microsoft"
  | "google"
  | "modern"
  | "gradient"
  | "luxury"
  | "cyberpunk"
  | "academic";

export type IconStyle = "lucide" | "heroicons" | "fontawesome" | "material" | "tabler" | "phosphor";

export interface ThemeDefinition {
  id: string;
  name: string;
  category: TemplateCategory;
  isDark: boolean;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  gradient: string;
  headingFont: string;
  bodyFont: string;
  iconStyle: IconStyle;
  animationStyle: AnimationType;
  spacing: number;
  radius: number;
  glass: boolean;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ElementStyle {
  fill: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  borderRadius: number;
  opacity: number;
  borderColor: string;
  borderWidth: number;
  shadow: boolean;
  italic?: boolean;
  fontStyle?: string;
  textDecoration?: string;
  letterSpacing?: number;
}

export interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay: number;
  stagger?: number;
}

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface Dataset {
  label: string;
  data: number[];
  color: string;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  style: Partial<ElementStyle>;
  animation?: AnimationConfig;
  locked: boolean;
  visible: boolean;
  name: string;
  zIndex: number;
  groupId?: string;
}

export interface TextElement extends BaseElement {
  type: "text" | "heading" | "subtitle";
  content: string;
  richText?: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image" | "gif";
  src: string;
  alt: string;
  objectFit: "cover" | "contain" | "fill";
  url?: string;
  caption?: string;
}

export interface IconElement extends BaseElement {
  type: "icon";
  icon: string;
  library: IconStyle;
  size: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rect" | "circle" | "triangle" | "line" | "arrow" | "diamond" | "hexagon" | "star";
}

export interface TableElement extends BaseElement {
  type: "table";
  rows: number;
  cols: number;
  headers: string[];
  cells: string[][];
}

export interface ChartElement extends BaseElement {
  type: "chart";
  chartType: ChartType;
  title: string;
  data: DataPoint[];
  datasets: Dataset[];
  axisLabels: { x: string; y: string };
  legend: boolean;
  animateChart: boolean;
}

export interface CodeElement extends BaseElement {
  type: "code";
  code: string;
  language: string;
}

export interface FormulaElement extends BaseElement {
  type: "formula";
  latex: string;
}

export interface FlowElement extends BaseElement {
  type: "timeline" | "roadmap" | "mindmap" | "flowchart" | "mermaid" | "architecture" | "swot" | "bmc";
  nodes: FlowNode[];
  edges?: FlowEdge[];
}

export interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  icon?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface VideoElement extends BaseElement {
  type: "video";
  src: string;
  poster?: string;
  autoplay: boolean;
  loop: boolean;
}

export interface QRElement extends BaseElement {
  type: "qr";
  url: string;
  label?: string;
}

export interface ButtonElement extends BaseElement {
  type: "button";
  label: string;
  href?: string;
}

export interface EmbedElement extends BaseElement {
  type: "embed";
  url: string;
}

export interface AudioElement extends BaseElement {
  type: "audio";
  src: string;
}

export interface SvgElement extends BaseElement {
  type: "svg";
  svg: string;
}

export type SlideElement =
  | TextElement
  | ImageElement
  | IconElement
  | ShapeElement
  | TableElement
  | ChartElement
  | CodeElement
  | FormulaElement
  | FlowElement
  | VideoElement
  | QRElement
  | ButtonElement
  | EmbedElement
  | AudioElement
  | SvgElement;

export interface Slide {
  id: string;
  title: string;
  layout: LayoutType;
  elements: SlideElement[];
  background: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  backgroundId?: string;
  backgroundAnimated?: boolean;
  backgroundVideo?: string;
  backgroundEffect?: string;
  transition?: AnimationType;
  notes: string;
  speakerNotes: string;
  hidden: boolean;
  themeId?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  topic: string;
  themeId: string;
  aspectRatio: "16:9" | "4:3" | "16:10";
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
  author: string;
  tags: string[];
  aiMeta?: {
    model?: string;
    source?: string;
    citations: Citation[];
  };
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  source: "web" | "wikipedia" | "arxiv" | "semantic-scholar" | "news" | "youtube";
  snippet: string;
  published?: string;
}

export interface OutlineItem {
  id: string;
  title: string;
  layout: LayoutType;
  notes?: string;
  subtopics?: string[];
}

export interface PresentationOutline {
  title: string;
  subtitle: string;
  slides: OutlineItem[];
}

export interface AIConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ResearchResult {
  summary: string;
  citations: Citation[];
  facts: { claim: string; source: string }[];
}

export interface HistoryVersion {
  id: string;
  deck: Deck;
  timestamp: number;
  label: string;
}

export type SourceType =
  | "prompt"
  | "topic"
  | "pdf"
  | "docx"
  | "pptx"
  | "research"
  | "markdown"
  | "url"
  | "youtube"
  | "notes"
  | "csv"
  | "excel"
  | "images"
  | "upload";

export interface GenerationRequest {
  input: string;
  sourceType: SourceType;
  slideCount: number;
  tone: string;
  theme?: string;
  provider?: string;
  model?: string;
  backgroundMode?: "ai" | "available";
  backgroundStyle?: string;
  deckBackgroundImage?: string;
  contentStyle?: "minimalist" | "summarized" | "standard" | "detailed" | "executive";
  /** Full library background selected by the user to apply to every slide. */
  deckBackground?: {
    id?: string;
    css?: string;
    imageUrl?: string;
    videoUrl?: string;
    animated?: boolean;
    effect?: string;
    name?: string;
    dark?: boolean;
  };
}
