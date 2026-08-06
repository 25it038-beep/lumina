import { LayoutType, PresentationOutline, OutlineItem } from "../types";
import { titleCase } from "./localEngine";

export type StoryArchetype =
  | "pitch" | "research" | "education" | "proposal" | "roadmap"
  | "technical" | "sales" | "training" | "conference" | "marketing";

export interface StoryBlueprint {
  archetype: StoryArchetype;
  label: string;
  body: string[];
}

const BLUEPRINTS: StoryBlueprint[] = [
  {
    archetype: "pitch",
    label: "Investor Pitch",
    body: [
      "The Opportunity", "Market Problem", "Our Solution", "Product Overview",
      "Market Size & Traction", "Business Model", "Competitive Landscape", "Roadmap & Milestones", "The Ask",
    ],
  },
  {
    archetype: "research",
    label: "Research Presentation",
    body: [
      "Background & Motivation", "Problem Statement", "Research Questions",
      "Methodology", "Key Findings", "Evidence & Data", "Discussion", "Limitations", "Conclusion & Future Work",
    ],
  },
  {
    archetype: "education",
    label: "Educational Lecture",
    body: [
      "Learning Objectives", "Core Concepts", "Why This Matters", "Key Ideas Explained",
      "Worked Examples", "Common Misconceptions", "Applications", "Practice & Exercises", "Summary",
    ],
  },
  {
    archetype: "proposal",
    label: "Business Proposal",
    body: [
      "Executive Summary", "Current Situation", "The Problem", "Proposed Solution",
      "Approach & Methodology", "Timeline & Budget", "Expected Outcomes", "Risks & Mitigations", "Next Steps",
    ],
  },
  {
    archetype: "roadmap",
    label: "Strategy Roadmap",
    body: [
      "Strategic Context", "Where We Are Today", "The Opportunity", "Strategic Pillars",
      "Initiative Portfolio", "Roadmap Phases", "KPIs & Targets", "Governance & Teams", "Milestones",
    ],
  },
  {
    archetype: "technical",
    label: "Technical Architecture",
    body: [
      "System Overview", "Requirements & Constraints", "High-Level Architecture",
      "Core Components", "Data Flow", "Security & Reliability", "Performance & Scale", "Deployment & Operations", "Future Evolution",
    ],
  },
  {
    archetype: "sales",
    label: "Sales Presentation",
    body: [
      "The Customer Challenge", "Why Now", "Our Solution", "Key Capabilities",
      "Proof Points & Results", "Implementation & Support", "Pricing & Packaging", "Success Stories", "Next Steps",
    ],
  },
  {
    archetype: "training",
    label: "Training Session",
    body: [
      "Session Goals", "Prerequisites", "Module 1: Foundations", "Module 2: Core Skills",
      "Module 3: Advanced Techniques", "Hands-On Exercises", "Troubleshooting Guide", "Resources & Support", "Certification & Next Steps",
    ],
  },
  {
    archetype: "conference",
    label: "Conference Talk",
    body: [
      "The Big Idea", "Context & Setting", "What We Discovered", "How It Works",
      "Evidence & Results", "Lessons Learned", "Implications", "Open Questions", "Call to Action",
    ],
  },
  {
    archetype: "marketing",
    label: "Marketing Campaign",
    body: [
      "Market Context", "Audience Insights", "Campaign Concept", "Messaging & Positioning",
      "Channel Strategy", "Creative Direction", "Launch Plan", "Success Metrics", "Amplification",
    ],
  },
];

const ARCHETYPE_KEYWORDS: Record<StoryArchetype, string[]> = {
  pitch: ["pitch", "invest", "startup", "funding", "series", "venture", "investor", "raise"],
  research: ["research", "study", "paper", "thesis", "experiment", "findings", "analysis", "literature", "report"],
  education: ["education", "learn", "lecture", "course", "lesson", "teaching", "school", "student", "class"],
  proposal: ["proposal", "business plan", "project plan", "proposal", "bid", "sow", "solution brief"],
  roadmap: ["roadmap", "strategy", "strategic", "planning", "initiative", "transformation", "vision 20"],
  technical: ["technical", "architecture", "system", "infrastructure", "engineering", "software", "platform", "code", "api"],
  sales: ["sales", "selling", "product demo", "demo", "deal", "prospect", "buyer", "acquisition"],
  training: ["training", "workshop", "onboarding", "bootcamp", "tutorial", "certification", "upskill"],
  conference: ["conference", "talk", "keynote", "keynote", "stage", "ted", "summit", "panel"],
  marketing: ["marketing", "campaign", "brand", "launch", "advertising", "social media", "audience", "content marketing"],
};

const DOMAIN_DEFAULT: Record<string, StoryArchetype> = {
  ai: "technical",
  tech: "technical",
  health: "research",
  business: "pitch",
  finance: "proposal",
  education: "education",
  environment: "conference",
  marketing: "marketing",
};

export function chooseArchetype(topic: string, tone?: string, domainId?: string): StoryArchetype {
  const t = topic.toLowerCase();
  if (tone) {
    const toneLower = tone.toLowerCase();
    if (toneLower.includes("investor") || toneLower.includes("pitch")) return "pitch";
    if (toneLower.includes("academic") || toneLower.includes("research")) return "research";
    if (toneLower.includes("training") || toneLower.includes("teaching")) return "training";
    if (toneLower.includes("sales")) return "sales";
  }
  let best: StoryArchetype | null = null;
  let bestScore = 0;
  for (const [arc, kws] of Object.entries(ARCHETYPE_KEYWORDS)) {
    let score = 0;
    for (const k of kws) if (t.includes(k)) score += k.length;
    if (score > bestScore) {
      bestScore = score;
      best = arc as StoryArchetype;
    }
  }
  if (best) return best;
  return (domainId && DOMAIN_DEFAULT[domainId]) || "conference";
}

function generateTopicDynamicTitles(topic: string, archetype: StoryArchetype, count: number): { title: string; layout: LayoutType }[] {
  const t = topic.toLowerCase();
  const titleT = titleCase(topic);
  
  // Topic-specific custom title modules
  let topicTitles: { title: string; layout: LayoutType }[] = [];

  if (/ai|artificial intelligence|machine learning|llm|deep learning|gpt|neural/i.test(t)) {
    topicTitles = [
      { title: `The Evolution of ${titleT}`, layout: "timeline" },
      { title: "Global AI Market Growth & Enterprise Adoption", layout: "metrics" },
      { title: "Core Architecture & Neural Engine Foundations", layout: "architecture" },
      { title: "Generative AI vs Traditional Machine Learning", layout: "comparison" },
      { title: "Key Industry Use Cases & High-Impact Applications", layout: "bento" },
      { title: "AI Data Pipelines & Model Optimization", layout: "process" },
      { title: "Performance Benchmarks & Accuracy Metrics", layout: "statistics" },
      { title: "Security, Privacy & Responsible AI Governance", layout: "cards" },
      { title: "Implementation Roadmap & Infrastructure Requirements", layout: "roadmap" },
      { title: "ROI & Productivity Gains Analysis", layout: "table" },
      { title: "Future Horizons & Strategic Outlook", layout: "vision" },
    ];
  } else if (/health|medical|doctor|medicine|patient|pharma|clinical/i.test(t)) {
    topicTitles = [
      { title: `Current Landscape in ${titleT}`, layout: "facts" },
      { title: "Patient Outcomes & Healthcare Market Dynamics", layout: "metrics" },
      { title: "Clinical Workflow & Diagnostic Innovations", layout: "bento" },
      { title: "Traditional Care vs Modern Technology Integration", layout: "before-after" },
      { title: "Data Privacy, HIPAA & Regulatory Compliance", layout: "cards" },
      { title: "Real-World Clinical Case Studies & Evidence", layout: "quote" },
      { title: "Precision Medicine & Personalized Interventions", layout: "process" },
      { title: "Deployment Roadmap across Clinical Settings", layout: "roadmap" },
      { title: "Cost Efficiency & Resource Optimization", layout: "table" },
      { title: "Strategic Recommendations for Health Systems", layout: "checklist" },
    ];
  } else if (/quantum|computing|physics|hardware|supercomputer/i.test(t)) {
    topicTitles = [
      { title: "The Quantum Paradigm Shift", layout: "hero" },
      { title: "Classical vs Quantum Computing Principles", layout: "comparison" },
      { title: "Qubit Architectures & Coherence Hardware", layout: "architecture" },
      { title: "Quantum Supremacy & Industry Benchmarks", layout: "statistics" },
      { title: "Commercial Applications: Cryptography & Chemistry", layout: "cards" },
      { title: "Key Challenges: Noise & Error Correction", layout: "swot" },
      { title: "Technology Roadmap to Fault-Tolerant Scale", layout: "timeline" },
      { title: "Global Ecosystem & Investment Landscape", layout: "metrics" },
    ];
  } else if (/startup|pitch|business|venture|investor|funding/i.test(t)) {
    topicTitles = [
      { title: "The Market Opportunity & Problem Statement", layout: "hero" },
      { title: "Target Audience & Customer Pain Points", layout: "cards" },
      { title: "Our Solution & Product Value Proposition", layout: "bento" },
      { title: "Addressable Market Size (TAM, SAM, SOM)", layout: "metrics" },
      { title: "Business Model & Revenue Streams", layout: "table" },
      { title: "Product Architecture & Technological Moat", layout: "architecture" },
      { title: "Competitive Advantage & Market Matrix", layout: "matrix" },
      { title: "Traction, Growth Velocity & Unit Economics", layout: "statistics" },
      { title: "Go-to-Market Strategy & Expansion Channels", layout: "process" },
      { title: "18-Month Execution Roadmap & Key Milestones", layout: "roadmap" },
      { title: "Leadership Team & Advisory Board", layout: "team" },
      { title: "The Investment Ask & Capital Allocation", layout: "pricing" },
    ];
  } else if (/finance|fintech|banking|money|investment|crypto|blockchain/i.test(t)) {
    topicTitles = [
      { title: `Global Trends in ${titleT}`, layout: "metrics" },
      { title: "Legacy Banking vs Decentralized Platforms", layout: "comparison" },
      { title: "Security, Cryptographic Trust & Compliance", layout: "cards" },
      { title: "Transaction Throughput & Scalability Metrics", layout: "statistics" },
      { title: "Risk Management & Fraud Detection Frameworks", layout: "process" },
      { title: "Financial Performance & Yield Models", layout: "table" },
      { title: "Strategic Growth Roadmap", layout: "roadmap" },
    ];
  } else {
    // Dynamic topic fallback generator
    topicTitles = [
      { title: `Strategic Overview of ${titleT}`, layout: "hero" },
      { title: "Market Context & Driving Forces", layout: "metrics" },
      { title: "Core Pillars & Fundamental Principles", layout: "cards" },
      { title: "Key Capabilities & Feature Breakdown", layout: "bento" },
      { title: "Traditional vs Modern Frameworks", layout: "comparison" },
      { title: "Process & Implementation Methodology", layout: "process" },
      { title: "Real-World Evidence & Impact Metrics", layout: "statistics" },
      { title: "Risk Assessment & Mitigation Strategy", layout: "swot" },
      { title: "Phased Execution Roadmap", layout: "timeline" },
      { title: "Resource Allocation & Cost Structure", layout: "table" },
      { title: "Strategic Recommendations & Next Steps", layout: "checklist" },
    ];
  }

  // Extend pool dynamically if count exceeds defined topic titles
  const layoutPool: LayoutType[] = [
    "bento", "cards", "metrics", "statistics", "timeline", "process",
    "comparison", "table", "facts", "roadmap", "matrix", "before-after",
    "swot", "quote", "architecture", "milestones", "journey", "checklist",
  ];

  const result: { title: string; layout: LayoutType }[] = [];
  for (let i = 0; i < count; i++) {
    if (i < topicTitles.length) {
      result.push(topicTitles[i]);
    } else {
      const subAspects = [
        "Deep Dive & Technical Nuance",
        "Operational Workflows & Execution",
        "Stakeholder Alignment & Governance",
        "Scaling Strategy & Ecosystem Expansion",
        "Performance Optimization & Metrics",
        "Continuous Learning & Long-Term Outlook",
      ];
      const aspectTitle = `${titleT}: ${subAspects[(i - topicTitles.length) % subAspects.length]}`;
      result.push({
        title: aspectTitle,
        layout: layoutPool[i % layoutPool.length],
      });
    }
  }

  return result;
}

export function buildStoryOutline(
  topic: string,
  slideCount: number,
  tone?: string,
  domainId?: string,
  seededVariants?: string[]
): PresentationOutline {
  const archetype = chooseArchetype(topic, tone, domainId);
  const blueprint = BLUEPRINTS.find((b) => b.archetype === archetype) ?? BLUEPRINTS[0];
  const n = Math.min(Math.max(slideCount, 6), 30);
  const topicTitle = titleCase(topic);

  const slides: OutlineItem[] = [];
  slides.push({ id: "s0", title: topicTitle, layout: "title", notes: `Title slide for ${topicTitle}` });
  slides.push({ id: "s1", title: "Agenda & Strategic Scope", layout: "agenda", notes: "Overview of topics covered", subtopics: [] });
  slides.push({
    id: "s2",
    title: "Executive Summary",
    layout: "key-takeaways",
    notes: "High-level summary of core conclusions and outcomes up front",
  });

  const bodyCount = Math.max(n - 5, 3);
  const dynamicBody = generateTopicDynamicTitles(topic, archetype, bodyCount);

  dynamicBody.forEach((item, idx) => {
    slides.push({
      id: `s${idx + 3}`,
      title: item.title,
      layout: item.layout,
      notes: `${item.title} — detailed analysis and key findings`,
    });
  });

  slides.push({ id: `s${slides.length}`, title: "Key Takeaways & Strategic Summary", layout: "key-takeaways", notes: "Summary of critical insights" });
  slides.push({ id: `s${slides.length}`, title: "References & Verified Citations", layout: "references", notes: "Authoritative data sources and references" });
  slides.push({ id: `s${slides.length}`, title: "Thank You & Q&A", layout: "thank-you", notes: `Thank you and open Q&A discussion for ${topicTitle}` });

  return {
    title: topicTitle,
    subtitle: `A comprehensive presentation on ${topic} — ${blueprint.label} narrative`,
    slides,
  };
}
