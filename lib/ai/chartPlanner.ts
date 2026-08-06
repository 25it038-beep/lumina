import { ChartType } from "../types";

export interface ChartRecommendation {
  chartType: ChartType;
  reason: string;
  palette: string[];
}

const REASONS: Record<string, string> = {
  bar: "Categorical comparison with discrete labels",
  "stacked-bar": "Part-to-whole breakdown across categories",
  "horizontal-bar": "Long category names or many categories",
  line: "Trend over time",
  area: "Volume/trend emphasis with magnitude",
  pie: "Simple part-to-whole distribution",
  doughnut: "Part-to-whole with multiple segments",
  radar: "Multivariate comparison of a few entities",
  scatter: "Correlation between two variables",
  bubble: "Three-variable correlation (size = third)",
  heatmap: "Density or intensity across two dimensions",
  treemap: "Hierarchical share of total",
  sankey: "Flow between stages or nodes",
  gantt: "Timeline of tasks or phases",
};

const DOMAIN_PREFERENCE: Record<string, ChartType[]> = {
  finance: ["line", "bar", "area", "doughnut", "scatter"],
  business: ["bar", "line", "doughnut", "stacked-bar", "area"],
  ai: ["line", "area", "heatmap", "radar", "scatter"],
  tech: ["line", "bar", "heatmap", "radar", "gantt"],
  health: ["line", "bar", "area", "radar", "treemap"],
  education: ["bar", "pie", "doughnut", "radar", "treemap"],
  environment: ["area", "line", "treemap", "heatmap", "bar"],
  marketing: ["pie", "doughnut", "bar", "stacked-bar", "line"],
};

const TITLE_RULES: [RegExp, ChartType][] = [
  [/trend|growth|over time|history|evolution|quarterly|monthly|year/i, "line"],
  [/pipeline|conversion|flow/i, "bar"],
  [/market share|distribution|breakdown|composition|share of/i, "doughnut"],
  [/compare|vs|versus|benchmark|competitive/i, "radar"],
  [/correlation|relationship|scatter/i, "scatter"],
  [/heat|density|coverage/i, "heatmap"],
  [/hierarchy|portfolio|organization|structure/i, "treemap"],
  [/timeline|schedule|phases|milestones|roadmap/i, "gantt"],
  [/rank|top|leaderboard|priority/i, "horizontal-bar"],
  [/budget|allocation|expense|cost breakdown/i, "stacked-bar"],
  [/satisfaction|survey|rating|score/i, "bar"],
];

export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Director stage: Chart Planner.
 * Recommends the best chart type for a slide based on its title and domain.
 */
export function recommendChart(title: string, topic: string, seed = "", domainId = "business"): ChartRecommendation {
  for (const [re, type] of TITLE_RULES) {
    if (re.test(title)) {
      return { chartType: type, reason: REASONS[type], palette: pickPalette(seed) };
    }
  }

  const pref = DOMAIN_PREFERENCE[domainId] ?? ["bar", "line", "doughnut"];
  const chartType = pref[hashString(seed || title) % pref.length] as ChartType;
  return { chartType, reason: REASONS[chartType] ?? "Best-fit for the available data", palette: pickPalette(seed || title) };
}

const PALETTES = [
  ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"],
  ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"],
  ["#10b981", "#22c55e", "#84cc16", "#eab308", "#f59e0b"],
  ["#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308"],
  ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e"],
  ["#f472b6", "#fb7185", "#f97316", "#fbbf24", "#34d399"],
];

export function pickPalette(seed: string): string[] {
  return PALETTES[hashString(seed) % PALETTES.length];
}
