import { ChartType, DataPoint, Dataset } from "./types";

export const CHART_TYPES: { id: ChartType; label: string; icon: string }[] = [
  { id: "bar", label: "Bar", icon: "bar-chart" },
  { id: "pie", label: "Pie", icon: "pie-chart" },
  { id: "doughnut", label: "Donut", icon: "circle-dot" },
  { id: "line", label: "Line", icon: "line-chart" },
  { id: "area", label: "Area", icon: "trending-up" },
  { id: "radar", label: "Radar", icon: "radar" },
  { id: "bubble", label: "Bubble", icon: "circle" },
  { id: "scatter", label: "Scatter", icon: "grip" },
  { id: "heatmap", label: "Heatmap", icon: "grid" },
  { id: "treemap", label: "Treemap", icon: "layout" },
  { id: "sankey", label: "Sankey", icon: "network" },
  { id: "gantt", label: "Gantt", icon: "calendar" },
  { id: "stacked-bar", label: "Stacked Bar", icon: "bar-chart-3" },
  { id: "horizontal-bar", label: "Horizontal Bar", icon: "bar-chart-2" },
];

export const CHART_PALETTES = [
  ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"],
  ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef"],
  ["#10b981", "#22c55e", "#84cc16", "#eab308", "#f59e0b"],
  ["#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308"],
  ["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e"],
  ["#f472b6", "#fb7185", "#f97316", "#fbbf24", "#34d399"],
];

export function sampleData(chartType: ChartType, labels = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]): DataPoint[] {
  const base = chartType === "gantt" ? 30 : 40;
  return labels.map((label, i) => ({
    label,
    value: Math.round(base + ((i * 37 + 11) % 60)),
    color: CHART_PALETTES[0][i % CHART_PALETTES[0].length],
  }));
}

export function sampleDatasets(): Dataset[] {
  return [
    { label: "Series A", data: [42, 58, 63, 71, 66, 82], color: "#6366f1" },
    { label: "Series B", data: [30, 44, 51, 49, 60, 68], color: "#8b5cf6" },
  ];
}
