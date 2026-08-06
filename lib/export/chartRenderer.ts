export interface ChartRenderInput {
  chartType: string;
  data?: { label: string; value: number; color?: string }[];
  datasets?: { label: string; data: number[]; color: string }[];
  title?: string;
  legend?: boolean;
  axisLabels?: { x: string; y: string };
  width?: number;
  height?: number;
  dark?: boolean;
}

const COLORS = ["#6366f1", "#8b5cf6", "#22d3ee", "#f59e0b", "#ec4899", "#34d399", "#ef4444", "#0ea5e9"];
const NS = "http://www.w3.org/2000/svg";
const TEXT = { label: "#334155", legend: "#475569", muted: "#64748b", grid: "#e2e8f0" };
const DARK = { label: "#e2e8f0", legend: "#cbd5e1", muted: "#cbd5e1", grid: "rgba(255,255,255,0.18)" };

function el(tag: string, attrs: Record<string, string> = {}, text?: string): SVGSVGElement {
  const e = document.createElementNS(NS, tag) as unknown as SVGSVGElement;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function renderChartSVG(input: ChartRenderInput): SVGSVGElement {
  const W = input.width ?? 700;
  const H = input.height ?? 400;
  const pad = { l: 50, r: 24, t: 44, b: 48 };
  const data = input.data ?? [];
  const datasets = input.datasets ?? [];
  const ctype = input.chartType;
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const t = input.dark ? DARK : TEXT;
  const svg = el("svg", { width: String(W), height: String(H), viewBox: `0 0 ${W} ${H}`, xmlns: NS });

  if (input.title) {
    svg.appendChild(el("text", { x: String(W / 2), y: "26", "text-anchor": "middle", "font-size": "16", "font-weight": "700", fill: t.label }, input.title));
  }

  // ---- Pie / Donut ----
  if (ctype === "pie" || ctype === "doughnut" || ctype === "donut") {
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    const cx = W / 2;
    const cy = H / 2 + 8;
    const r = Math.min(cw, ch) / 2 - 12;
    const r2 = r * (ctype === "pie" ? 0 : 0.62);
    let angle = -Math.PI / 2;
    for (const d of data) {
      const frac = d.value / total;
      const a2 = angle + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      let path: string;
      if (ctype === "pie") {
        path = `M ${round2(cx)} ${round2(cy)} L ${round2(x1)} ${round2(y1)} A ${round2(r)} ${round2(r)} 0 ${large} 1 ${round2(x2)} ${round2(y2)} Z`;
      } else {
        const x1b = cx + r2 * Math.cos(angle);
        const y1b = cy + r2 * Math.sin(angle);
        const x2b = cx + r2 * Math.cos(a2);
        const y2b = cy + r2 * Math.sin(a2);
        path = `M ${round2(x1)} ${round2(y1)} A ${round2(r)} ${round2(r)} 0 ${large} 1 ${round2(x2)} ${round2(y2)} L ${round2(x2b)} ${round2(y2b)} A ${round2(r2)} ${round2(r2)} 0 ${large} 0 ${round2(x1b)} ${round2(y1b)} Z`;
      }
      svg.appendChild(el("path", { d: path, fill: d.color ?? COLORS[0], stroke: "#ffffff", "stroke-width": "2" }));
      angle = a2;
    }
    if (input.legend && data.length) {
      data.forEach((d, i) => {
        svg.appendChild(el("rect", { x: String(W - pad.r - 150), y: String(14 + i * 20), width: "12", height: "12", rx: "3", fill: d.color ?? COLORS[i % COLORS.length] }));
        svg.appendChild(el("text", { x: String(W - pad.r - 132), y: String(24 + i * 20), "font-size": "12", fill: t.legend }, d.label.length > 20 ? d.label.slice(0, 19) + "â€¦" : d.label));
      });
    }
    return svg;
  }

  // ---- Line / Area / Scatter / Bubble ----
  if (ctype === "line" || ctype === "area" || ctype === "scatter" || ctype === "bubble") {
    const series = datasets.length ? datasets : [{ label: input.title ?? "", data: data.map((d) => d.value), color: "#6366f1" }];
    const all = series.flatMap((s) => s.data);
    const max = Math.max(...all, 10);
    const n = Math.max(series[0]?.data.length ?? 0, 1);
    const x = (i: number) => pad.l + (i / (n - 1 || 1)) * cw;
    const y = (v: number) => pad.t + ch - (v / max) * ch;

    for (let i = 0; i <= 4; i++) {
      const val = (max * i) / 4;
      const yy = y(val);
      svg.appendChild(el("line", { x1: String(pad.l), y1: String(round2(yy)), x2: String(W - pad.r), y2: String(round2(yy)), stroke: t.grid, "stroke-width": "1", "stroke-dasharray": "4 4" }));
      svg.appendChild(el("text", { x: String(pad.l - 8), y: String(round2(yy + 4)), "text-anchor": "end", "font-size": "11", fill: "#94a3b8" }, String(Math.round(val))));
    }

    series.forEach((s, si) => {
      const pts = s.data.map((v, i) => [x(i), y(v)] as const);
      if (ctype === "area") {
        const d = `M ${round2(pts[0][0])} ${round2(pts[0][1])} ${pts.slice(1).map(([px, py]) => `L ${round2(px)} ${round2(py)}`).join(" ")} L ${round2(pts[pts.length - 1][0])} ${pad.t + ch} L ${round2(pts[0][0])} ${pad.t + ch} Z`;
        svg.appendChild(el("path", { d, fill: s.color ?? COLORS[si], opacity: "0.18" }));
      }
      const d = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${round2(px)} ${round2(py)}`).join(" ");
      svg.appendChild(el("path", { d, fill: "none", stroke: s.color ?? COLORS[si % COLORS.length], "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" }));
      pts.forEach(([px, py], i) => {
        if (ctype === "scatter" || ctype === "bubble") {
          svg.appendChild(el("circle", { cx: String(round2(px)), cy: String(round2(py)), r: ctype === "bubble" ? "9" : "6", fill: s.color ?? COLORS[si % COLORS.length], opacity: "0.85" }));
        } else {
          svg.appendChild(el("circle", { cx: String(round2(px)), cy: String(round2(py)), r: "4.5", fill: "#fff", stroke: s.color ?? COLORS[si % COLORS.length], "stroke-width": "2.5" }));
        }
      });
    });

    const labels = data.length ? data.map((d) => d.label) : series[0].data.map((_, i) => `Q${i + 1}`);
    labels.forEach((lb, i) => {
      svg.appendChild(el("text", { x: String(round2(x(i))), y: String(H - 14), "text-anchor": "middle", "font-size": "11", fill: "#94a3b8" }, lb.length > 14 ? lb.slice(0, 13) + "â€¦" : lb));
    });
    if (input.legend && series.length > 1) {
      series.forEach((s, si) => {
        svg.appendChild(el("rect", { x: String(W - pad.r - 140), y: String(16 + si * 20), width: "12", height: "12", rx: "3", fill: s.color ?? COLORS[si % COLORS.length] }));
        svg.appendChild(el("text", { x: String(W - pad.r - 122), y: String(26 + si * 20), "font-size": "12", fill: t.legend }, s.label));
      });
    }
    return svg;
  }

  // ---- Radar ----
  if (ctype === "radar") {
    const labels = data.length ? data.map((d) => d.label) : ["A", "B", "C", "D", "E"];
    const n = labels.length;
    const cx = W / 2;
    const cy = H / 2 + 8;
    const r = Math.min(cw, ch) / 2 - 24;
    const pt = (i: number, scale: number): [number, number] => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
    };
    for (let ring = 1; ring <= 4; ring++) {
      const pts = Array.from({ length: n }, (_, i) => pt(i, ring / 4).join(",")).join(" ");
      svg.appendChild(el("polygon", { points: pts, fill: ring === 4 ? "rgba(99,102,241,0.08)" : "none", stroke: t.grid }));
    }
    labels.forEach((lb, i) => {
      const [px, py] = pt(i, 1.15);
      svg.appendChild(el("text", { x: String(round2(px)), y: String(round2(py)), "text-anchor": "middle", "font-size": "11", fill: t.muted }, lb));
    });
    const values = data.length ? data.map((d) => d.value) : datasets[0]?.data ?? [60, 70, 50, 80, 65];
    const max = Math.max(...values, 10);
    const pts = values.map((v, i) => pt(i, v / max).join(",")).join(" ");
    svg.appendChild(el("polygon", { points: pts, fill: "rgba(99,102,241,0.3)", stroke: "#6366f1", "stroke-width": "2" }));
    return svg;
  }

  // ---- Heatmap ----
  if (ctype === "heatmap") {
    const rows = data.length ? data.slice(0, 8) : [{ label: "A", value: 40 }, { label: "B", value: 60 }];
    const cellH = ch / rows.length;
    rows.forEach((d, i) => {
      const intensity = Math.min(d.value / 100, 1);
      svg.appendChild(el("rect", { x: String(pad.l), y: String(round2(pad.t + i * cellH + 4)), width: String(cw), height: String(round2(cellH - 8)), rx: "6", fill: `rgba(99,102,241,${round2(0.15 + intensity * 0.85)})` }));
      svg.appendChild(el("text", { x: String(pad.l + 14), y: String(round2(pad.t + i * cellH + cellH / 2 + 4)), "font-size": "13", fill: "#fff", "font-weight": "600" }, `${d.label} â€” ${d.value}`));
    });
    return svg;
  }

  // ---- Gantt ----
  if (ctype === "gantt") {
    const rows = data.length ? data : [{ label: "Phase 1", value: 30 }, { label: "Phase 2", value: 50 }];
    const rowH = Math.min(ch / rows.length, 60);
    rows.forEach((d, i) => {
      const yy = pad.t + i * rowH;
      const w = (d.value / 100) * cw;
      svg.appendChild(el("rect", { x: String(pad.l), y: String(round2(yy + 10)), width: String(round2(w)), height: String(round2(rowH - 20)), rx: "8", fill: COLORS[i % COLORS.length] }));
      svg.appendChild(el("text", { x: String(pad.l + 12), y: String(round2(yy + rowH / 2 + 4)), "font-size": "13", fill: "#fff", "font-weight": "600" }, `${d.label} â€” ${d.value}%`));
    });
    return svg;
  }

  // ---- Treemap ----
  if (ctype === "treemap") {
    const items = data.length ? data : [{ label: "A", value: 30 }, { label: "B", value: 50 }];
    const total = items.reduce((a, d) => a + d.value, 0) || 1;
    let x = pad.l;
    items.slice(0, 8).forEach((d, i) => {
      const w = Math.max(40, (d.value / total) * cw);
      svg.appendChild(el("rect", { x: String(round2(x)), y: String(pad.t), width: String(round2(w)), height: String(ch), fill: d.color ?? COLORS[i % COLORS.length], stroke: "#fff", "stroke-width": "2" }));
      svg.appendChild(el("text", { x: String(round2(x + 8)), y: String(pad.t + 20), "font-size": "12", fill: "#fff", "font-weight": "600" }, d.label.length > 14 ? d.label.slice(0, 13) + "â€¦" : d.label));
      x += w;
    });
    return svg;
  }

  // ---- Sankey ----
  if (ctype === "sankey") {
    const stages = data.length ? data.slice(0, 6) : [{ label: "In", value: 100 }];
    let acc = 0;
    stages.forEach((d, i) => {
      const h = (d.value / 100) * ch;
      const x = pad.l + (i / Math.max(stages.length - 1, 1)) * cw;
      svg.appendChild(el("rect", { x: String(round2(x - 10)), y: String(round2(pad.t + acc)), width: "20", height: String(round2(Math.max(h, 8))), fill: d.color ?? COLORS[i % COLORS.length] }));
      svg.appendChild(el("text", { x: String(round2(x - 30)), y: String(round2(pad.t + acc + h / 2)), "text-anchor": "end", "font-size": "11", fill: t.muted }, d.label));
      acc += h + 6;
    });
    return svg;
  }

  // ---- Horizontal bar ----
  if (ctype === "horizontal-bar") {
    const rowH = Math.min(ch / Math.max(data.length, 1), 56);
    const max = Math.max(...data.map((d) => d.value), 10);
    data.forEach((d, i) => {
      const w = (d.value / max) * cw;
      const yy = pad.t + i * rowH + 6;
      svg.appendChild(el("rect", { x: String(pad.l), y: String(round2(yy)), width: String(round2(w)), height: String(round2(rowH - 12)), rx: "6", fill: d.color ?? COLORS[i % COLORS.length] }));
      svg.appendChild(el("text", { x: String(pad.l + 8), y: String(round2(yy + rowH / 2 + 4)), "font-size": "12", fill: "#fff", "font-weight": "600" }, d.label));
      svg.appendChild(el("text", { x: String(round2(pad.l + w + 8)), y: String(round2(yy + rowH / 2 + 4)), "font-size": "11", fill: t.muted }, String(d.value)));
    });
    return svg;
  }

  // ---- Bar / Stacked bar (fallback) ----
  const max = Math.max(...data.map((d) => d.value), ...datasets.flatMap((s) => s.data), 10);
  const barCount = Math.max(data.length, datasets[0]?.data.length ?? 0, 1);
  const groupW = cw / barCount;

  for (let i = 0; i <= 4; i++) {
    const val = (max * i) / 4;
    const yy = pad.t + ch - (val / max) * ch;
    svg.appendChild(el("line", { x1: String(pad.l), y1: String(round2(yy)), x2: String(W - pad.r), y2: String(round2(yy)), stroke: t.grid, "stroke-width": "1", "stroke-dasharray": "4 4" }));
    svg.appendChild(el("text", { x: String(pad.l - 8), y: String(round2(yy + 4)), "text-anchor": "end", "font-size": "11", fill: "#94a3b8" }, String(Math.round(val))));
  }

  if (!datasets.length) {
    data.forEach((d, i) => {
      const bw = Math.min(groupW * 0.6, 60);
      const bx = pad.l + i * groupW + (groupW - bw) / 2;
      const bh = (d.value / max) * ch;
      svg.appendChild(el("rect", { x: String(round2(bx)), y: String(round2(pad.t + ch - bh)), width: String(round2(bw)), height: String(round2(bh)), rx: "6", fill: d.color ?? COLORS[i % COLORS.length] }));
      svg.appendChild(el("text", { x: String(round2(bx + bw / 2)), y: String(round2(pad.t + ch - bh - 6)), "text-anchor": "middle", "font-size": "10", fill: t.muted }, String(d.value)));
      svg.appendChild(el("text", { x: String(round2(bx + bw / 2)), y: String(H - 14), "text-anchor": "middle", "font-size": "10", fill: "#94a3b8" }, d.label.length > 14 ? d.label.slice(0, 13) + "â€¦" : d.label));
    });
  } else {
    const seriesCount = datasets.length;
    const bw = Math.min(groupW / (seriesCount + 0.4), 46);
    datasets.forEach((ds, si) => {
      ds.data.forEach((v, i) => {
        const bh = (v / max) * ch;
        const bx = pad.l + i * groupW + (groupW - bw * seriesCount) / 2 + si * bw;
        svg.appendChild(el("rect", { x: String(round2(bx)), y: String(round2(pad.t + ch - bh)), width: String(round2(bw - 3)), height: String(round2(bh)), rx: "4", fill: ds.color ?? COLORS[si % COLORS.length] }));
      });
    });
    if (input.legend) {
      datasets.forEach((ds, si) => {
        svg.appendChild(el("rect", { x: String(W - pad.r - 140), y: String(16 + si * 20), width: "12", height: "12", rx: "3", fill: ds.color ?? COLORS[si % COLORS.length] }));
        svg.appendChild(el("text", { x: String(W - pad.r - 122), y: String(26 + si * 20), "font-size": "12", fill: t.legend }, ds.label));
      });
    }
    const labels = data.length ? data.map((d) => d.label) : datasets[0].data.map((_, i) => `Q${i + 1}`);
    labels.forEach((lb, i) => {
      svg.appendChild(el("text", { x: String(round2(pad.l + i * groupW + groupW / 2)), y: String(H - 14), "text-anchor": "middle", "font-size": "10", fill: "#94a3b8" }, lb.length > 14 ? lb.slice(0, 13) + "â€¦" : lb));
    });
  }

  return svg;
}
