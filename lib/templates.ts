import { Deck, LayoutType, OutlineItem, PresentationOutline, Slide } from "./types";
import { getTheme } from "./themes";
import { buildSlide } from "./layouts";
import { generateContent as localContent } from "./ai/localEngine";
import { presentationReviewAgent } from "./ai/presentationReviewAgent";

export interface TemplateSlide {
  title: string;
  layout: LayoutType;
}

export interface DeckTemplate {
  id: string;
  name: string;
  category: "pitch" | "sales" | "training" | "report" | "research" | "marketing" | "story";
  emoji: string;
  description: string;
  themeId: string;
  audience: string;
  slides: TemplateSlide[];
}

export const TEMPLATES: DeckTemplate[] = [
  {
    id: "investor-pitch",
    name: "Investor Pitch Deck",
    category: "pitch",
    emoji: "🚀",
    description: "Problem → Solution → Market → Traction → Ask. Fundraising-ready narrative.",
    themeId: "startup",
    audience: "Investors",
    slides: [
      { title: "We are transforming {Topic}", layout: "hero" },
      { title: "The Problem", layout: "two-columns" },
      { title: "Our Solution", layout: "two-columns" },
      { title: "Market Opportunity", layout: "statistics" },
      { title: "Core Product Features", layout: "cards" },
      { title: "Business Model", layout: "table" },
      { title: "Traction & Key Metrics", layout: "metrics" },
      { title: "Our Team", layout: "cards" },
      { title: "Financial Projections", layout: "bar" },
      { title: "The Ask", layout: "conclusion" },
      { title: "Q&A", layout: "q-and-a" },
    ],
  },
  {
    id: "product-launch",
    name: "Product Launch",
    category: "marketing",
    emoji: "🎉",
    description: "Hyped launch narrative: teaser → features → roadmap → get it now.",
    themeId: "cyberpunk",
    audience: "Customers",
    slides: [
      { title: "Introducing {Topic}", layout: "hero" },
      { title: "Why Now", layout: "two-columns" },
      { title: "What Players Say", layout: "quote" },
      { title: "Flagship Features", layout: "cards" },
      { title: "See It In Action", layout: "text-image" },
      { title: "Release Roadmap", layout: "roadmap" },
      { title: "Pricing & Plans", layout: "pricing" },
      { title: "Launch Timeline", layout: "timeline" },
      { title: "Get Started Today", layout: "conclusion" },
      { title: "Talk to Us", layout: "q-and-a" },
    ],
  },
  {
    id: "sales-pitch",
    name: "Sales Pitch / Deal Closer",
    category: "sales",
    emoji: "💼",
    description: "Uncover pain → position the win → proof → pricing → close.",
    themeId: "corporate",
    audience: "Customers",
    slides: [
      { title: "A Better Way to {Topic}", layout: "title" },
      { title: "Agenda", layout: "agenda" },
      { title: "The Current Pain", layout: "two-columns" },
      { title: "Us vs. The Alternatives", layout: "comparison" },
      { title: "Proven Results", layout: "statistics" },
      { title: "Customer Case Study", layout: "quote" },
      { title: "Pricing & Packages", layout: "pricing" },
      { title: "ROI Projections", layout: "bar" },
      { title: "Next Steps", layout: "conclusion" },
      { title: "Q&A", layout: "q-and-a" },
    ],
  },
  {
    id: "ted-talk",
    name: "TED Talk / Storytelling",
    category: "story",
    emoji: "🎤",
    description: "Hook → story → turning point → big idea → call to action.",
    themeId: "obsidian-gold",
    audience: "General",
    slides: [
      { title: "{Topic}", layout: "title" },
      { title: "The Hook", layout: "quote" },
      { title: "Where It All Started", layout: "timeline" },
      { title: "The Turning Point", layout: "quote" },
      { title: "The Big Idea", layout: "two-columns" },
      { title: "Why It Matters", layout: "quote" },
      { title: "A Different Lens", layout: "facts" },
      { title: "Call to Action", layout: "conclusion" },
      { title: "Thank You", layout: "q-and-a" },
    ],
  },
  {
    id: "executive-report",
    name: "Executive Report",
    category: "report",
    emoji: "📊",
    description: "Leadership brief: summaries, KPIs, risks, roadmap and recommendations.",
    themeId: "business",
    audience: "Executives",
    slides: [
      { title: "Quarterly Report: {Topic}", layout: "title" },
      { title: "Agenda", layout: "agenda" },
      { title: "Executive Summary", layout: "key-takeaways" },
      { title: "Performance KPIs", layout: "metrics" },
      { title: "Growth Trends", layout: "bar" },
      { title: "Resource Allocation", layout: "pie" },
      { title: "Risk Assessment", layout: "swot" },
      { title: "Roadmap & Milestones", layout: "roadmap" },
      { title: "Recommendations", layout: "conclusion" },
      { title: "Q&A", layout: "q-and-a" },
    ],
  },
  {
    id: "classroom-lesson",
    name: "Classroom Lesson",
    category: "training",
    emoji: "🎓",
    description: "Objective → concept → diagram → practice → recap. Built for students.",
    themeId: "education",
    audience: "Students",
    slides: [
      { title: "{Topic}", layout: "title" },
      { title: "Learning Objectives", layout: "agenda" },
      { title: "Core Concept", layout: "two-columns" },
      { title: "How It Works", layout: "flowchart" },
      { title: "Worked Examples", layout: "cards" },
      { title: "Key Facts", layout: "facts" },
      { title: "Common Mistakes", layout: "comparison" },
      { title: "Quick Recap", layout: "key-takeaways" },
      { title: "Practice Round", layout: "q-and-a" },
    ],
  },
  {
    id: "research-defense",
    name: "Research Thesis Defense",
    category: "research",
    emoji: "🧪",
    description: "Background → methods → results → findings. Rigorous academic flow.",
    themeId: "technology",
    audience: "Researchers",
    slides: [
      { title: "{Topic}", layout: "hero" },
      { title: "Motivation & Background", layout: "three-columns" },
      { title: "Related Work", layout: "table" },
      { title: "Methodology", layout: "architecture" },
      { title: "Experimental Setup", layout: "process" },
      { title: "Results Overview", layout: "statistics" },
      { title: "Key Findings", layout: "key-takeaways" },
      { title: "Future Work", layout: "timeline" },
      { title: "References", layout: "references" },
      { title: "Thank You & Q&A", layout: "q-and-a" },
    ],
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    category: "marketing",
    emoji: "📣",
    description: "Goals → channel strategy → creative direction → launch plan.",
    themeId: "marketing",
    audience: "Customers",
    slides: [
      { title: "{Topic} Campaign", layout: "title" },
      { title: "Campaign Goals", layout: "metrics" },
      { title: "Target Audience", layout: "three-columns" },
      { title: "Channel Strategy", layout: "cards" },
      { title: "Creative Direction", layout: "gallery" },
      { title: "Campaign Timeline", layout: "timeline" },
      { title: "Budget Allocation", layout: "pie" },
      { title: "KPI Dashboard", layout: "statistics" },
      { title: "Launch Playbook", layout: "roadmap" },
      { title: "Wrap-Up", layout: "conclusion" },
    ],
  },
];

export function getTemplate(id: string): DeckTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function buildTemplateOutline(tpl: DeckTemplate, topic?: string, slideCount?: number): PresentationOutline {
  const cap = (s?: string) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "");
  const topicName = (topic || "our product").trim();
  const slides = (slideCount && slideCount > 0 && slideCount < tpl.slides.length
    ? tpl.slides.slice(0, slideCount)
    : tpl.slides
  ).map(
    (s, i): OutlineItem => ({
      id: `tpl-${tpl.id}-${i}`,
      title: s.title
        .replace(/\{topic\}/gi, topicName)
        .replace(/\{Topic\}/g, cap(topicName)),
      layout: s.layout,
      notes: `Template slide · ${tpl.audience} persona · category: ${tpl.category}`,
    })
  );
  return {
    title: slides[0]?.title ?? tpl.name,
    subtitle: tpl.description,
    slides,
  };
}

export function buildTemplateDeck(tpl: DeckTemplate, topic?: string, tone = "Professional"): Deck {
  const theme = getTheme(tpl.themeId);
  const outline = buildTemplateOutline(tpl, topic);
  const total = outline.slides.length;
  const slides: Slide[] = outline.slides.map((item, i) => {
    const content = localContent(item, topic || tpl.name, i, total) as any;
    const slide = buildSlide(item, content, theme, i);
    if (!slide.notes || slide.notes.length < 10) {
      slide.notes = `Talking points for ${item.title}:\n- Introduce main themes and metrics.\n- Highlight business implications.\n- Address Q&A expectations.`;
    }
    return slide;
  });

  const draft: Deck = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: outline.title,
    description: outline.subtitle,
    topic: topic || tpl.name,
    themeId: theme.id,
    aspectRatio: "16:9",
    slides,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: "Lumina Templates",
    tags: [tpl.category, "template"],
    aiMeta: {
      model: "lumina-template-v1",
      source: "template",
      citations: [],
    },
  };

  const reviewed = presentationReviewAgent.reviewAndAutoRedesignDeck(draft, theme);
  return reviewed.deck;
}