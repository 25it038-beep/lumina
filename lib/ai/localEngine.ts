import { LayoutType, PresentationOutline, OutlineItem, ThemeDefinition } from "../types";
import { THEMES } from "../themes";
import { buildStoryOutline } from "./storyEngine";
import { recommendChart } from "./chartPlanner";
import { planIcons } from "./iconPlanner";

export interface LocalSlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  paragraphs?: string[];
  stats?: { label: string; value: number }[];
  metrics?: { value: string; label: string; delta?: string }[];
  timeline?: { period: string; title: string; desc: string }[];
  roadmap?: { phase: string; title: string; desc: string }[];
  steps?: { title: string; desc: string }[];
  cards?: { title: string; desc: string; icon?: string }[];
  comparison?: { ours: string; theirs: string }[] | { title: string; items: { ours: string; theirs: string }[] };
  tableHeaders?: string[];
  tableRows?: string[][];
  swot?: { s: string[]; w: string[]; o: string[]; t: string[] };
  references?: { title: string; url: string; source: string }[];
  facts?: { fact: string; icon?: string }[];
  keyPoints?: string[];
  quote?: string;
  attribution?: string;
  formula?: string;
  nodes?: { label: string; icon?: string }[];
  chartType?: string;
}

export interface DomainProfile {
  id: string;
  keywords: string[];
  themeId: string;
  tone: string;
  audience: string;
  facts: string[];
  stats: { label: string; value: number }[];
  sources: { title: string; url: string; source: string }[];
  quote: string;
  quoteAuthor: string;
}

const DOMAINS: DomainProfile[] = [
  {
    id: "ai",
    keywords: ["artificial intelligence", "machine learning", "deep learning", "ai", "llm", "neural", "gpt", "chatgpt", "automation", "agi", "ai in"],
    themeId: "technology",
    tone: "forward-looking, data-driven",
    audience: "technology executives and innovators",
    facts: [
      "Global AI market is projected to reach $1.8 trillion by 2030, growing at ~37% CAGR",
      "70% of enterprises report AI adoption or planned deployment within 24 months",
      "Generative AI could add $2.6–4.4 trillion annually to the global economy (McKinsey)",
      "AI-driven automation could boost global productivity by 1.4% annually",
      "Organizations using AI report 40%+ efficiency gains in content and analysis workflows",
      "Federated learning and on-device AI are reducing data privacy concerns",
    ],
    stats: [
      { label: "Global AI market by 2030 ($T)", value: 1.8 },
      { label: "Enterprise adoption (%)", value: 70 },
      { label: "Efficiency gain (%)", value: 40 },
      { label: "Economic impact ($T)", value: 4.4 },
    ],
    sources: [
      { title: "McKinsey — The state of AI in 2025", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai", source: "McKinsey" },
      { title: "Stanford HAI — AI Index Report", url: "https://aiindex.stanford.edu/report/", source: "Stanford HAI" },
      { title: "arXiv — Recent advances in LLMs", url: "https://arxiv.org/list/cs.CL/recent", source: "arXiv" },
      { title: "Gartner — AI trends and forecasts", url: "https://www.gartner.com/en/newsroom", source: "Gartner" },
    ],
    quote: "AI is the new electricity. Just as electricity transformed industries 100 years ago, AI will transform every major industry today.",
    quoteAuthor: "Andrew Ng",
  },
  {
    id: "health",
    keywords: ["health", "healthcare", "medical", "medicine", "disease", "patient", "hospital", "wellness", "clinical", "therapy", "mental health", "pharma"],
    themeId: "medical",
    tone: "empathetic, evidence-based",
    audience: "healthcare professionals and patients",
    facts: [
      "AI in healthcare is expected to reach $188B by 2030 with a CAGR of 37%",
      "AI-based diagnostics improve early detection accuracy by up to 20%",
      "Telehealth adoption grew 38x during the pandemic and remains 10x pre-pandemic levels",
      "Wearable health devices are projected to exceed 1 billion units by 2028",
      "Precision medicine is reducing adverse drug reactions by 30%",
      "Global healthcare spending exceeds $10 trillion annually",
    ],
    stats: [
      { label: "AI healthcare market by 2030 ($B)", value: 188 },
      { label: "Diagnostic accuracy gain (%)", value: 20 },
      { label: "Telehealth growth (x)", value: 38 },
      { label: "Global health spending ($T)", value: 10 },
    ],
    sources: [
      { title: "WHO — Global health observatory", url: "https://www.who.int/data/gho", source: "WHO" },
      { title: "Nature Medicine — AI in clinical practice", url: "https://www.nature.com/nm/", source: "Nature Medicine" },
      { title: "PubMed — Latest medical research", url: "https://pubmed.ncbi.nlm.nih.gov/", source: "PubMed" },
      { title: "Mayo Clinic — Health innovations", url: "https://www.mayoclinic.org/", source: "Mayo Clinic" },
    ],
    quote: "The greatest wealth is health.",
    quoteAuthor: "Virgil",
  },
  {
    id: "business",
    keywords: ["business", "startup", "entrepreneur", "market", "strategy", "growth", "revenue", "sales", "startup", "management", "company", "enterprise", "leadership"],
    themeId: "corporate",
    tone: "professional, persuasive",
    audience: "executives, investors and business leaders",
    facts: [
      "90% of startups fail within the first 10 years — planning reduces that risk",
      "Businesses with strong digital strategies grow 2x faster than peers",
      "Customer retention costs 5x less than acquisition",
      "The global consulting market exceeds $340 billion",
      "Agile organizations outperform competitors by 30% in profitability",
      "Data-driven companies are 23x more likely to acquire customers",
    ],
    stats: [
      { label: "Digital-first growth (x)", value: 2 },
      { label: "Retention vs acquisition (x)", value: 5 },
      { label: "Agile profitability gain (%)", value: 30 },
      { label: "Consulting market ($B)", value: 340 },
    ],
    sources: [
      { title: "Harvard Business Review", url: "https://hbr.org/", source: "HBR" },
      { title: "McKinsey & Company", url: "https://www.mckinsey.com/", source: "McKinsey" },
      { title: "Forbes — Business insights", url: "https://www.forbes.com/business/", source: "Forbes" },
      { title: "CB Insights — Startup trends", url: "https://www.cbinsights.com/", source: "CB Insights" },
    ],
    quote: "The best way to predict the future is to create it.",
    quoteAuthor: "Peter Drucker",
  },
  {
    id: "education",
    keywords: ["education", "learning", "school", "teaching", "student", "university", "course", "training", "curriculum", "online learning", "edtech", "skills"],
    themeId: "education",
    tone: "inspirational, accessible",
    audience: "students, educators and institutions",
    facts: [
      "The global edtech market will reach $605 billion by 2027",
      "Personalized learning improves outcomes by 30% on average",
      "Online course completion rates have tripled in the past five years",
      "Micro-credentials and upskilling grew 2x faster than traditional degrees",
      "AI tutors can reduce learning time by up to 40%",
      "Over 1.5 billion students experienced remote learning during the pandemic",
    ],
    stats: [
      { label: "Edtech market by 2027 ($B)", value: 605 },
      { label: "Personalized learning gain (%)", value: 30 },
      { label: "AI tutoring time saved (%)", value: 40 },
      { label: "Students affected (B)", value: 1.5 },
    ],
    sources: [
      { title: "UNESCO — Education data", url: "https://www.unesco.org/en/education", source: "UNESCO" },
      { title: "EdSurge — Edtech news", url: "https://www.edsurge.com/", source: "EdSurge" },
      { title: "OECD — Education at a glance", url: "https://www.oecd.org/education/", source: "OECD" },
      { title: "World Economic Forum — Future of jobs", url: "https://www.weforum.org/future-of-jobs/", source: "WEF" },
    ],
    quote: "Education is the most powerful weapon which you can use to change the world.",
    quoteAuthor: "Nelson Mandela",
  },
  {
    id: "tech",
    keywords: ["technology", "software", "digital", "cloud", "cybersecurity", "blockchain", "iot", "software", "developer", "platform", "web", "app", "data", "saas"],
    themeId: "technology",
    tone: "technical, forward-looking",
    audience: "engineers, CTOs and technology strategists",
    facts: [
      "Global IT spending is projected to surpass $5.5 trillion",
      "Cloud services account for 60%+ of enterprise workloads",
      "Cybercrime damage is expected to reach $10.5 trillion annually",
      "The IoT will connect 29 billion devices by 2030",
      "Edge computing reduces latency by up to 80%",
      "Open-source software powers over 90% of modern applications",
    ],
    stats: [
      { label: "IT spending ($T)", value: 5.5 },
      { label: "Cloud workload share (%)", value: 60 },
      { label: "IoT devices by 2030 (B)", value: 29 },
      { label: "Edge latency cut (%)", value: 80 },
    ],
    sources: [
      { title: "Gartner — IT spending forecast", url: "https://www.gartner.com/en/newsroom/press-releases", source: "Gartner" },
      { title: "IEEE Spectrum", url: "https://spectrum.ieee.org/", source: "IEEE" },
      { title: "Stack Overflow — Developer survey", url: "https://survey.stackoverflow.co/", source: "Stack Overflow" },
      { title: "MIT Technology Review", url: "https://www.technologyreview.com/", source: "MIT TR" },
    ],
    quote: "Software is eating the world, but AI is eating software.",
    quoteAuthor: "Marc Andreessen",
  },
  {
    id: "finance",
    keywords: ["finance", "investment", "banking", "economy", "stock", "crypto", "financial", "fund", "trading", "money", "wealth", "recession", "inflation"],
    themeId: "finance",
    tone: "analytical, authoritative",
    audience: "investors, analysts and financial professionals",
    facts: [
      "Global assets under management exceed $140 trillion",
      "Fintech adoption rates exceed 90% in leading digital economies",
      "Algorithmic trading accounts for 60-75% of equity volume",
      "The digital payments market will pass $16 trillion by 2028",
      "Gen AI could add $200-340 billion in annual value to banking",
      "ESG investing now represents one-third of total assets",
    ],
    stats: [
      { label: "Assets under management ($T)", value: 140 },
      { label: "Algo trading share (%)", value: 70 },
      { label: "Digital payments by 2028 ($T)", value: 16 },
      { label: "GenAI banking value ($B)", value: 340 },
    ],
    sources: [
      { title: "IMF — World economic outlook", url: "https://www.imf.org/en/Publications/WEO", source: "IMF" },
      { title: "World Bank — Data", url: "https://data.worldbank.org/", source: "World Bank" },
      { title: "Bloomberg — Markets", url: "https://www.bloomberg.com/markets", source: "Bloomberg" },
      { title: "Financial Times", url: "https://www.ft.com/", source: "FT" },
    ],
    quote: "An investment in knowledge pays the best interest.",
    quoteAuthor: "Benjamin Franklin",
  },
  {
    id: "environment",
    keywords: ["climate", "environment", "sustainability", "renewable", "energy", "carbon", "green", "solar", "wind", "net zero", "emission", "plastic", "biodiversity"],
    themeId: "education",
    tone: "urgent, optimistic",
    audience: "policymakers, activists and concerned citizens",
    facts: [
      "Renewable energy now supplies 30%+ of global electricity",
      "Solar costs have fallen 90% in the past decade",
      "The world must cut emissions 43% by 2030 to meet Paris goals",
      "Electric vehicle sales grew 35% year-over-year globally",
      "Climate finance needs $9 trillion annually by 2030",
      "Restoring ecosystems can provide 30% of needed mitigation",
    ],
    stats: [
      { label: "Renewables share (%)", value: 30 },
      { label: "Solar cost drop (%)", value: 90 },
      { label: "Required emission cut (%)", value: 43 },
      { label: "EV sales growth (%)", value: 35 },
    ],
    sources: [
      { title: "IPCC — Sixth assessment report", url: "https://www.ipcc.ch/reports/", source: "IPCC" },
      { title: "IEA — World energy outlook", url: "https://www.iea.org/", source: "IEA" },
      { title: "UNEP — Emissions gap report", url: "https://www.unep.org/", source: "UNEP" },
      { title: "NASA — Climate change", url: "https://climate.nasa.gov/", source: "NASA" },
    ],
    quote: "We are the first generation to feel the effect of climate change and the last generation who can do something about it.",
    quoteAuthor: "Barack Obama",
  },
  {
    id: "marketing",
    keywords: ["marketing", "brand", "advertising", "social media", "content", "campaign", "seo", "digital marketing", "customer", "ecommerce", "branding"],
    themeId: "marketing",
    tone: "creative, energetic",
    audience: "marketers, brand managers and founders",
    facts: [
      "Digital ad spending will exceed $700 billion globally",
      "88% of consumers trust reviews as much as personal recommendations",
      "Personalized marketing improves conversion by 30%",
      "Short-form video generates 2.5x more engagement",
      "Email marketing delivers $36 ROI per $1 spent",
      "90% of marketers now use AI for content production",
    ],
    stats: [
      { label: "Digital ads ($B)", value: 700 },
      { label: "Consumer trust in reviews (%)", value: 88 },
      { label: "Personalization lift (%)", value: 30 },
      { label: "Email ROI (x)", value: 36 },
    ],
    sources: [
      { title: "eMarketer — Digital ad spending", url: "https://www.emarketer.com/", source: "eMarketer" },
      { title: "HubSpot — Marketing statistics", url: "https://www.hubspot.com/marketing-statistics", source: "HubSpot" },
      { title: "Nielsen — Consumer insights", url: "https://www.nielsen.com/", source: "Nielsen" },
      { title: "Gartner — Marketing trends", url: "https://www.gartner.com/en/marketing", source: "Gartner" },
    ],
    quote: "People do not buy goods and services. They buy relations, stories and magic.",
    quoteAuthor: "Seth Godin",
  },
];

const FALLBACK = DOMAINS[0];

export function classifyTopic(topic: string): DomainProfile {
  const t = topic.toLowerCase();
  let best: DomainProfile = FALLBACK;
  let bestScore = 0;
  for (const d of DOMAINS) {
    let score = 0;
    for (const k of d.keywords) {
      if (t.includes(k)) score += k.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

export function titleCase(topic: string): string {
  const stop = new Set(["of", "the", "in", "on", "and", "for", "with", "a", "an", "to"]);
  return topic
    .split(/\s+/)
    .map((w, i) => (i > 0 && stop.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .trim();
}

export interface OutlineRequest {
  topic: string;
  slideCount: number;
  tone?: string;
  customStructure?: string;
}

import { extractTopicFromInstruction } from "./deepResearchEngine";

export function generateOutline(req: OutlineRequest): PresentationOutline {
  const { cleanTopic } = extractTopicFromInstruction(req.topic);
  const domain = classifyTopic(cleanTopic);
  const n = Math.min(Math.max(req.slideCount, 5), 30);
  const topicTitle = titleCase(cleanTopic);

  const h = hashString(cleanTopic);
  const titleSets = SECTION_TITLE_SETS[domain.id] ?? [SECTION_BASE_TITLES[domain.id] ?? []];
  const seededVariants = titleSets[h % titleSets.length];

  return buildStoryOutline(cleanTopic, n, req.tone, domain.id, seededVariants.length ? seededVariants : undefined);
}

const SECTION_BASE_TITLES: Record<string, string[]> = {
  ai: ["The Intelligence Revolution", "From Theory to Practice", "Core Technologies", "Enterprise Adoption", "Ethics & Governance", "Industry Transformation", "The Road Ahead"],
  health: ["The Healthcare Landscape", "The Challenge Today", "Root Causes & Drivers", "Innovative Solutions", "Evidence & Outcomes", "Implementation Roadmap", "Patient-Centric Future"],
  business: ["Market Overview", "The Opportunity", "Strategic Framework", "Growth Levers", "Financial Model", "Execution Plan", "Why Now"],
  education: ["The Learning Landscape", "Why Education Must Evolve", "New Pedagogies", "Technology in Learning", "Measured Outcomes", "The 21st Century Classroom", "Lifelong Learning"],
  tech: ["The Technology Landscape", "Foundations & Architecture", "Key Innovations", "Platforms & Ecosystems", "Security & Reliability", "Adoption Trends", "What's Next"],
  finance: ["Macro Overview", "Market Dynamics", "Investment Landscape", "Risk & Regulation", "Digital Transformation", "Opportunity Assessment", "Outlook & Strategy"],
  environment: ["The State of the Planet", "Why Action Is Urgent", "Drivers of Change", "Solutions at Scale", "Economics of Transition", "What You Can Do", "A Sustainable Future"],
  marketing: ["The Marketing Landscape", "The Modern Consumer", "Channels & Content", "Brand Building", "Data & Personalization", "AI in Marketing", "Campaign Playbook"],
};

const SECTION_TITLE_SETS: Record<string, string[][]> = {
  ai: [
    SECTION_BASE_TITLES.ai,
    ["The Big Picture", "Why Now", "Building Blocks", "Real-World Deployments", "Risks & Guardrails", "Winners & Losers", "Where This Goes Next"],
    ["Context & Motivation", "Core Concepts", "The Technical Stack", "Adoption Signals", "Bottlenecks & Gaps", "Opportunity Zones", "Forecast"],
  ],
  business: [
    SECTION_BASE_TITLES.business,
    ["The Current State", "The Gap", "Our Approach", "Value Creation", "Numbers & Milestones", "Team & Execution", "The Ask"],
    ["Landscape Scan", "Problem Framing", "Strategy in Action", "Levers That Move the Business", "Scorecard", "Operating Plan", "Call to Action"],
  ],
  tech: [
    SECTION_BASE_TITLES.tech,
    ["Setting the Stage", "The Core Stack", "What's Broken Today", "The New Approach", "Performance & Scale", "Migration Path", "The Horizon"],
    ["Why This Matters", "Under the Hood", "Key Components", "Ecosystem Map", "Reliability & Security", "Traction & Metrics", "Next Steps"],
  ],
  health: [
    SECTION_BASE_TITLES.health,
    ["Current State of Care", "Unmet Needs", "Diagnosis & Drivers", "Care Innovations", "Clinical Evidence", "Adoption Plan", "A Healthier Future"],
  ],
  finance: [
    SECTION_BASE_TITLES.finance,
    ["Market Conditions", "Where Capital Flows", "Risk Landscape", "Regulatory Tailwinds", "Digital Disruption", "Deal Sourcing", "Theses & Outlook"],
  ],
  education: [
    SECTION_BASE_TITLES.education,
    ["Where Learning Stands", "The Friction Points", "Fresh Pedagogies", "Tools & Platforms", "Outcomes That Matter", "Scaling Impact", "A Culture of Learning"],
  ],
  environment: [
    SECTION_BASE_TITLES.environment,
    ["Planetary Report Card", "The Cost of Inaction", "Intervention Levers", "Scale & Speed", "Financing the Transition", "Collective Action", "Regeneration"],
  ],
  marketing: [
    SECTION_BASE_TITLES.marketing,
    ["The Consumer Today", "Fragmentation & Attention", "Channels That Win", "Story & Brand", "Personalization at Scale", "Creative Testing", "Growth Roadmap"],
  ],
};

const BULLET_TEMPLATES: Record<string, string[]> = {
  ai: [
    "State-of-the-art models now exceed human benchmarks on many reasoning tasks",
    "Enterprise AI adoption has shifted from experimentation to production scale",
    "Retrieval-augmented generation grounds models with real-time, verified data",
    "Agentic systems are automating complex multi-step workflows end-to-end",
    "Responsible AI frameworks are becoming a board-level priority",
    "Multimodal models unify text, vision, audio and code in a single pipeline",
    "Fine-tuning and distillation make frontier capabilities accessible at scale",
    "Human-in-the-loop design remains essential for trust and accountability",
  ],
  health: [
    "Preventive care and early detection dramatically improve outcomes",
    "Digital biomarkers enable continuous, non-invasive monitoring",
    "Interoperable health records reduce errors and duplication",
    "AI-assisted diagnosis augments clinician decision-making",
    "Patient engagement drives adherence and long-term wellness",
    "Value-based care aligns incentives with patient outcomes",
    "Telehealth expands access to underserved communities",
    "Genomic medicine is moving from research to routine care",
  ],
  business: [
    "Clear strategy aligns every team toward measurable outcomes",
    "Customer-centricity drives retention and lifetime value",
    "Operational excellence compounds through small improvements",
    "Data-informed decisions outperform gut instinct consistently",
    "Talent and culture are the moat competitors cannot copy",
    "Capital allocation discipline separates winners from survivors",
    "Partnerships extend reach without diluting focus",
    "Scenario planning prepares the organization for uncertainty",
  ],
  education: [
    "Active learning outperforms passive instruction by 40%",
    "Feedback loops accelerate mastery and reduce dropout",
    "Gamification sustains motivation across long curricula",
    "Spaced repetition embeds knowledge for the long term",
    "Peer learning builds collaboration skills employers demand",
    "Assessments should measure application, not recall alone",
    "Inclusive design ensures no learner is left behind",
    "Digital literacy is the new foundational skill",
  ],
  tech: [
    "Modular architecture accelerates feature velocity and resilience",
    "Automated pipelines reduce deployment risk dramatically",
    "Zero-trust security protects users in distributed environments",
    "Open standards prevent vendor lock-in and enable portability",
    "Observability turns production signals into actionable insight",
    "Developer experience directly correlates with product quality",
    "Cost optimization requires continuous, data-driven refinement",
    "Sustained innovation depends on deliberate platform investment",
  ],
  finance: [
    "Diversification reduces portfolio volatility without sacrificing return",
    "Compounding rewards patience and long-term discipline",
    "Liquidity management protects against unforeseen shocks",
    "Regulatory alignment is a strategic asset, not a burden",
    "Digital rails reduce transaction costs by an order of magnitude",
    "Risk models must stress-test tail scenarios rigorously",
    "Transparency builds investor trust and lowers cost of capital",
    "Sustainable investing increasingly outperforms over full cycles",
  ],
  environment: [
    "Decarbonizing energy is the single highest-leverage action",
    "Nature-based solutions sequester carbon and restore resilience",
    "Circular economies reduce waste and input costs",
    "Adaptation planning protects communities and infrastructure",
    "Policy signals unlock private capital at scale",
    "Consumer behavior shifts follow availability, not just intent",
    "Data transparency accelerates accountability and progress",
    "Early movers capture outsized economic advantage",
  ],
  marketing: [
    "Story-driven campaigns outperform feature-focused messaging",
    "Consistent branding compounds recognition over time",
    "Omnichannel presence meets customers where they are",
    "Authenticity converts better than polish alone",
    "Community becomes your most durable distribution channel",
    "Creative testing reveals what audiences truly value",
    "Attribution discipline keeps spend allocated to what works",
    "Speed of iteration beats perfection of execution",
  ],
};

export function generateContent(item: OutlineItem, topic: string, slideIndex: number, total: number, contentStyle?: string): LocalSlideContent {
  const domain = classifyTopic(topic);
  let bullets = BULLET_TEMPLATES[domain.id] ?? BULLET_TEMPLATES.ai;
  
  if (contentStyle === "minimalist") {
    bullets = bullets.slice(0, 1).map((b) => b.split("—")[0].trim());
  } else if (contentStyle === "summarized") {
    bullets = bullets.slice(0, 3).map((b) => `• ${b.trim()}`);
  } else if (contentStyle === "executive") {
    bullets = bullets.slice(0, 3).map((b, i) => `[High Impact] ${b.trim()}`);
  }

  const title = item.title;

  // Extract prompt-specific metrics and keywords
  const promptNumbers = topic.match(/\$?\d+(?:\.\d+)?%?[BMkT]?/g) ?? [];
  const customStats = promptNumbers.map((n, i) => ({
    value: n,
    label: `Metric ${i + 1} from Prompt`,
  }));
  const mergedStats = customStats.length > 0
    ? [...customStats.map((cs) => ({ label: cs.label, value: Number(cs.value.replace(/[^0-9.]/g, "")) || 50 })), ...domain.stats]
    : domain.stats;

  switch (item.layout) {
    case "title":
      return {
        title: titleCase(topic),
        subtitle: `An in-depth analysis on ${topic} · Prepared for ${domain.audience}`,
        bullets: [domain.quote, domain.quoteAuthor ? `— ${domain.quoteAuthor}` : ""].filter(Boolean),
      };
    case "agenda":
      return {
        title: "Presentation Overview & Agenda",
        bullets: [
          `1. Context & Background on ${topic.slice(0, 30)}...`,
          "2. Core Architectural Pillars & Strategy",
          "3. Performance Benchmarks & Market Metrics",
          "4. Competitive Analysis & Positioning",
          "5. Implementation Roadmap & Milestones",
          "6. Key Takeaways & Q&A Discussion",
        ],
      };
    case "metrics":
      return {
        title,
        metrics: mergedStats.slice(0, 4).map((s) => ({ value: `${s.value}`, label: s.label })),
      };
    case "statistics":
    case "bar":
    case "pie":
      return {
        title,
        stats: domain.stats.map((s) => ({ label: s.label, value: s.value })),
        chartType: recommendChart(title, topic, `${title}:${slideIndex}`, domain.id).chartType,
        bullets: [domain.facts[slideIndex % domain.facts.length], domain.facts[(slideIndex + 1) % domain.facts.length]],
      };
    case "timeline":
      return {
        title,
        timeline: [
          { period: "Phase 1", title: "Awareness & Research", desc: "Understand the landscape, identify the core problem and gather evidence." },
          { period: "Phase 2", title: "Strategy & Design", desc: "Define objectives, architecture and the measurable success criteria." },
          { period: "Phase 3", title: "Execution & Build", desc: "Implement incrementally with continuous validation and feedback." },
          { period: "Phase 4", title: "Scale & Optimize", desc: "Expand impact, automate operations and compound early wins." },
          { period: "Phase 5", title: "Innovation", desc: "Explore next-generation capabilities and sustain the advantage." },
        ],
      };
    case "process":
    case "roadmap":
      return {
        title,
        steps: [
          { title: "Discover", desc: "Research, benchmark and define the problem space." },
          { title: "Define", desc: "Set goals, success metrics and scope." },
          { title: "Design", desc: "Prototype solutions and validate with users." },
          { title: "Deliver", desc: "Build, test and launch at quality." },
          { title: "Grow", desc: "Iterate, measure and scale what works." },
        ],
      };
    case "comparison":
      return {
        title,
        comparison: [
          { ours: "Integrated solution, lower total cost", theirs: "Point tools, fragmented stack" },
          { ours: "Real-time data and AI assistance", theirs: "Batch processing, manual analysis" },
          { ours: "Enterprise-grade security", theirs: "Variable security maturity" },
          { ours: "Scalable with your organization", theirs: "Plateaus at team scale" },
        ],
      };
    case "swot":
      return {
        title,
        swot: {
          s: [domain.facts[0].split(".")[0], domain.facts[1].split(".")[0], "Strong domain expertise"],
          w: ["Integration complexity", "Talent availability", "Legacy system friction"],
          o: [domain.facts[2].split(".")[0], "Emerging adjacent markets", "Partnership opportunities"],
          t: ["Regulatory change", "Competitive pressure", "Macroeconomic headwinds"],
        },
      };
    case "pyramid":
      return {
        title,
        steps: [
          { title: "Foundation", desc: "Core infrastructure, data and platform primitives" },
          { title: "Capabilities", desc: "Services, tooling and integrations on top of the base layer" },
          { title: "Experience", desc: "Customer-facing solutions powered by those capabilities" },
          { title: "Value", desc: "Measurable business outcomes and strategic impact" },
        ],
      };
    case "funnel":
      return {
        title,
        steps: [
          { title: "Awareness", desc: "Broad reach, discovery and first impressions" },
          { title: "Interest", desc: "Engagement, education and relationship building" },
          { title: "Evaluation", desc: "Rigorous comparison against alternatives" },
          { title: "Decision", desc: "Commitment, purchase and onboarding" },
          { title: "Advocacy", desc: "Expansion, retention and referrals" },
        ],
      };
    case "matrix":
      return {
        title,
        swot: {
          s: ["Strong domain expertise", domain.facts[0].split(".")[0], "Proven delivery track record"],
          w: ["Integration complexity", "Talent availability", "Legacy system friction"],
          o: [domain.facts[2].split(".")[0], "Emerging adjacent markets", "Partnership opportunities"],
          t: ["Regulatory change", "Competitive pressure", "Macroeconomic headwinds"],
        },
      };
    case "before-after":
      return {
        title,
        comparison: [
          { ours: "Fragmented manual workflows", theirs: "Unified automated platform" },
          { ours: "Hours spent on repetitive tasks", theirs: "Minutes with AI assistance" },
          { ours: "Reactive, siloed decision-making", theirs: "Proactive, data-driven insight" },
          { ours: "High cost of iteration", theirs: "Rapid low-cost experiments" },
        ],
      };
    case "team":
      return {
        title,
        subtitle: "The people turning this vision into reality",
        cards: [
          { title: "Alex Chen", desc: "CEO · Product Vision", icon: "sparkles" },
          { title: "Priya Patel", desc: "CTO · Platform", icon: "cpu" },
          { title: "Marcus Lee", desc: "Head of Design", icon: "palette" },
          { title: "Sara Kim", desc: "VP Engineering", icon: "code_2" },
          { title: "David Ruiz", desc: "Head of Research", icon: "flask" },
          { title: "Nina Sharma", desc: "Chief of Staff", icon: "briefcase" },
        ],
      };
    case "flowchart":
    case "architecture":
    case "mindmap":
      return {
        title,
        nodes: [
          { label: "Inputs & Data", icon: "database" },
          { label: "Processing Layer", icon: "cpu" },
          { label: "AI Engine", icon: "brain" },
          { label: "Outputs & Actions", icon: "zap" },
          { label: "Feedback Loop", icon: "refresh" },
        ],
      };
    case "facts":
      return {
        title,
        facts: domain.facts.slice(0, 6).map((f) => ({ fact: f, icon: "check_circle" })),
      };
    case "references":
      return {
        title: "References",
        references: domain.sources,
      };
    case "conclusion":
      return {
        title,
        bullets: [
          `The evidence clearly supports meaningful, measured action on ${topic.toLowerCase()}`,
          "Prioritize high-leverage moves that compound over time",
          "Build capabilities now to capture the advantage early",
          "Stay evidence-driven and adapt as new information emerges",
        ],
      };
    case "key-takeaways":
      return {
        title,
        keyPoints: [
          domain.facts[0],
          domain.facts[1],
          domain.facts[2],
          `Bottom line: ${topic} is an opportunity to act on with evidence and discipline — the compounding benefits favor early, focused investment`,
        ],
      };
    case "quote":
    case "quote-image":
      return { title, quote: domain.quote, attribution: domain.quoteAuthor };
    case "table":
      return {
        title,
        tableHeaders: ["Aspect", "Before", "With Modern Approach"],
        tableRows: domain.stats.slice(0, 6).map((s, i) => [
          s.label,
          String(Math.round(s.value * (0.4 + (i % 3) * 0.2))),
          String(Math.round(s.value)),
        ]),
      };
    case "section":
      return { title, subtitle: `${domain.audience.charAt(0).toUpperCase() + domain.audience.slice(1)}` };
    case "vision":
      return {
        title,
        subtitle: "Our Vision",
        paragraphs: consultantParagraphs(topic, domain),
        metrics: domain.stats.slice(0, 2).map((s) => ({ value: `${s.value}${s.label.includes("($") || s.label.includes("by") ? "" : "%"}`, label: s.label })),
      };
    case "mission":
      return {
        title,
        subtitle: "Our Mission",
        keyPoints: actionPoints(domain),
      };
    case "milestones":
      return {
        title,
        timeline: [
          { period: "Phase 1", title: "Foundation", desc: "Establish core platform, data and initial deployment." },
          { period: "Phase 2", title: "Validation", desc: "Pilot with early adopters and measure early outcomes." },
          { period: "Phase 3", title: "Expansion", desc: "Scale infrastructure, expand segments and harden security." },
          { period: "Phase 4", title: "Evolution", desc: "Compound advantages and extend the platform roadmap." },
        ],
      };
    case "checklist":
      return {
        title,
        keyPoints: actionPoints(domain),
      };
    case "thank-you":
      return {
        title: "Thank You",
        subtitle: `Thank you — questions welcome. Connect with us to explore ${topic.slice(0, 60)} further.`,
      };
    case "two-columns":
      return {
        title,
        paragraphs: deepParagraphs(item, topic, domain),
        bullets: bullets.slice(0, 6),
      };
    case "journey":
      return {
        title,
        timeline: [
          { period: "Stage 1", title: "Awareness", desc: "Surface the problem, gather evidence and set goals — the why before the how." },
          { period: "Stage 2", title: "Evaluation", desc: "Benchmark options against measurable criteria and secure stakeholder buy-in." },
          { period: "Stage 3", title: "Adoption", desc: "Pilot with early users, instrument outcomes and refine the playbook." },
          { period: "Stage 4", title: "Scale", desc: "Expand across teams and geographies, compounding early wins into sustained impact." },
        ],
      };
    case "faq":
      return {
        title,
        bullets: [
          "How quickly can this be implemented?",
          "What does it cost to get started?",
          "How is success measured?",
          "What support and training are included?",
          "How does this integrate with existing systems?",
        ].slice(0, 4),
      };
    case "cards": {
      const icons = planIcons(`${title}:${slideIndex}`, domain.id, "cards", 6).icons;
      return {
        title,
        cards: [
          { title: "Clarity", desc: domain.facts[0].split(".")[0] + ".", icon: icons[0] },
          { title: "Evidence", desc: domain.facts[1].split(".")[0] + ".", icon: icons[1] },
          { title: "Execution", desc: domain.facts[2].split(".")[0] + ".", icon: icons[2] },
          { title: "Scalability", desc: domain.facts[3].split(".")[0] + ".", icon: icons[3] },
          { title: "Resilience", desc: domain.facts[4].split(".")[0] + ".", icon: icons[4] },
          { title: "Case Study", desc: caseStudyFor(domain), icon: icons[5] },
        ],
      };
    }
    default:
      return {
        title,
        paragraphs: deepParagraphs(item, topic, domain),
        bullets: bullets.slice(0, 5),
      };
  }
}

function consultantParagraphs(topic: string, domain: DomainProfile): string[] {
  const f0 = domain.facts[0] ?? "";
  const f1 = domain.facts[1] ?? "";
  const f2 = domain.facts[2] ?? "";
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return [
    `${titleCase(topic)} has evolved from an emerging theme into a strategic priority. ${f0} At the same time, ${lc(f1)} — dynamics that are reshaping how organizations allocate capital, talent and attention.`,
    `For decision-makers, the question is no longer whether to engage but how to sequence investment. The early evidence points to compounding returns: ${lc(f2)} Teams that pair disciplined governance with fast experimentation consistently convert technical capability into durable competitive advantage.`,
  ];
}

function deepParagraphs(item: OutlineItem, topic: string, domain: DomainProfile): string[] {
  const t = item.title.toLowerCase();
  const f = domain.facts;
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  if (/problem|challenge|pain|friction/.test(t)) {
    return [
      `The core problem in ${topic} is structural rather than cosmetic. ${f[0] ?? ""} Legacy approaches compound the difficulty: ${lc(f[1] ?? "")} Organizations facing this challenge routinely watch waste accumulate across time, cost and staff attention, even when individual teams are performing well.`,
      `Left unaddressed, these frictions widen into competitive gaps. Teams that defer action accept slower cycles, higher operating cost and growing exposure to disruption from faster-moving entrants who have already begun to consolidate their position.`,
    ];
  }
  if (/market|opportunity|landscape|trend|industry/.test(t)) {
    return [
      `The market opportunity around ${topic} is substantial and still forming. ${f[0] ?? ""} Demand signals continue to strengthen — notably, ${lc(f[1] ?? "")} — which suggests the window for early positioning and category leadership is open today rather than later.`,
      `Structurally, the value accrues to players that pair technical capability with distribution. ${lc(f[2] ?? "")} The organizations that convert this momentum into durable scale while competitors remain undecided will capture the outsized share.`,
    ];
  }
  if (/solution|approach|method|strategy|framework/.test(t)) {
    return [
      `The recommended approach anchors on outcomes rather than activity. ${f[0] ?? ""} A phased model reduces risk: start narrow, validate quickly, then expand with evidence, keeping each increment independently valuable.`,
      `Execution discipline matters more than planning polish. ${lc(f[2] ?? "")} Teams that pair tight governance with fast iteration translate strategy into operating results within a single planning cycle.`,
    ];
  }
  if (/risk|threat|limitation|governance|security/.test(t)) {
    return [
      `Risk in ${topic} is manageable but not negligible. The foremost concerns are integration complexity, talent constraints and evolving regulatory expectations. ${f[0] ?? ""} The mature mitigations are staged rollout, focused capability building and independent assurance before scale.`,
      `The sharper risks are strategic rather than technical: acting too late to position, or too broadly to focus. Measured, evidence-led sequencing addresses both and protects optionality.`,
    ];
  }
  return consultantParagraphs(topic, domain);
}

function actionPoints(domain: DomainProfile): string[] {
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return [
    `Anchor every initiative in measurable outcomes — early evidence shows ${lc(domain.facts[0] ?? "progress compounding fast")}`,
    "Sequence work to generate visible wins quickly and build momentum",
    "Invest in capabilities that compound across initiatives rather than one-off fixes",
    "Keep strategy, governance and delivery tightly aligned",
    "Shorten learning loops so teams correct course with data",
    "Communicate progress against agreed metrics, not activity",
  ];
}

function caseStudyFor(domain: DomainProfile): string {
  const fact = domain.facts[1] ?? domain.facts[0] ?? "Early adopters report measurable gains within the first year of deployment.";
  return `Leading organizations applying this approach are seeing real results — ${fact}`;
}

const DOMAIN_THEME_IDS: Record<string, string[]> = {
  ai: ["technology", "ai-theme", "futuristic", "gradient-flow", "neon-dark", "cyberpunk", "holographic", "aurora"],
  tech: ["technology", "technical", "architecture-dev", "dashboard", "cyberpunk", "neon-dark", "holographic", "futuristic"],
  health: ["medical", "emerald", "ocean", "minimal", "glass", "material", "editorial"],
  business: ["corporate", "startup", "business", "pitch", "financial", "annual-report", "graphite", "obsidian-gold"],
  finance: ["financial", "obsidian-gold", "luxury", "luxury-minimal", "annual-report", "graphite", "corporate"],
  education: ["education", "paper", "editorial", "terra", "nature", "storytelling", "memphis", "portfolio"],
  environment: ["terra", "nature", "forest", "emerald", "esg", "ocean", "aurora"],
  marketing: ["marketing", "saas", "product", "memphis", "y2k", "vaporwave", "retro", "fashion", "magazine-cover", "portfolio"],
};

function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function suggestTheme(topic: string, exclude?: string[]): ThemeDefinition {
  const domain = classifyTopic(topic);
  const list = DOMAIN_THEME_IDS[domain.id] ?? DOMAIN_THEME_IDS.business;
  const start = hashString(topic) % list.length;
  const skip = new Set(exclude ?? []);
  let pick = list[start];
  for (let i = 0; i < list.length && skip.has(pick); i++) {
    pick = list[(start + i + 1) % list.length];
  }
  return THEMES.find((t) => t.id === pick) ?? THEMES[0];
}

export function suggestLayoutForSection(title: string): LayoutType {
  const t = title.toLowerCase();
  if (t.includes("introduction") || t.includes("overview") || t.includes("landscape")) return "two-columns";
  if (t.includes("market") || t.includes("trend")) return "statistics";
  if (t.includes("timeline") || t.includes("history") || t.includes("roadmap")) return "timeline";
  if (t.includes("architecture") || t.includes("system")) return "architecture";
  if (t.includes("process") || t.includes("workflow")) return "process";
  if (t.includes("comparison") || t.includes("vs")) return "comparison";
  if (t.includes("case") || t.includes("study")) return "cards";
  if (t.includes("swot")) return "swot";
  if (t.includes("future") || t.includes("outlook")) return "roadmap";
  if (t.includes("conclusion")) return "conclusion";
  return "two-columns";
}
