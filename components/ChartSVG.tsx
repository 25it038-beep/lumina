"use client";

import { DataPoint, Dataset } from "@/lib/types";

const COLORS = ["#6366f1", "#8b5cf6", "#22d3ee", "#f59e0b", "#ec4899", "#34d399", "#ef4444", "#0ea5e9"];
const PAD = { l: 50, r: 24, t: 44, b: 48 };
const TEXT = { label: "#334155", legend: "#475569", muted: "#64748b", grid: "#e2e8f0" };
const DARK = { label: "#e2e8f0", legend: "#cbd5e1", muted: "#cbd5e1", grid: "rgba(255,255,255,0.18)" };

interface ChartSVGProps {
  chartType: string;
  data?: DataPoint[];
  datasets?: Dataset[];
  title?: string;
  legend?: boolean;
  axisLabels?: { x: string; y: string };
  width?: number;
  height?: number;
  dark?: boolean;
}

export function ChartSVG({ chartType, data = [], datasets = [], title, legend, width = 700, height = 400, dark = false }: ChartSVGProps) {
  const cw = width - PAD.l - PAD.r;
  const ch = height - PAD.t - PAD.b;
  const t = dark ? DARK : TEXT;

  // ---- Pie / Donut ----
  if (chartType === "pie" || chartType === "doughnut" || chartType === "donut") {
    const total = data.reduce((a, d) => a + d.value, 0) || 1;
    const cx = width / 2;
    const cy = height / 2 + 8;
    const r = Math.min(cw, ch) / 2 - 12;
    const r2 = r * (chartType === "pie" ? 0 : 0.62);
    let angle = -Math.PI / 2;
    const slices = data.map((d) => {
      const frac = d.value / total;
      const a2 = angle + frac * Math.PI * 2;
      const large = frac > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      let path: string;
      if (chartType === "pie") {
        path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      } else {
        const x1b = cx + r2 * Math.cos(angle);
        const y1b = cy + r2 * Math.sin(angle);
        const x2b = cx + r2 * Math.cos(a2);
        const y2b = cy + r2 * Math.sin(a2);
        path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x2b} ${y2b} A ${r2} ${r2} 0 ${large} 0 ${x1b} ${y1b} Z`;
      }
      angle = a2;
      return { path, color: d.color ?? COLORS[0], label: d.label };
    });
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {title && <text x={width / 2} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill={t.label}>{title}</text>}
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} />
        ))}
        {legend &&
          data.map((d, i) => (
            <g key={i}>
              <rect x={width - PAD.r - 150} y={14 + i * 20} width={12} height={12} rx={3} fill={d.color ?? COLORS[i % COLORS.length]} />
              <text x={width - PAD.r - 132} y={24 + i * 20} fontSize={12} fill={t.legend}>{d.label.length > 20 ? d.label.slice(0, 19) + "…" : d.label}</text>
            </g>
          ))}
      </svg>
    );
  }

  // ---- Line / Area / Scatter / Bubble ----
  if (chartType === "line" || chartType === "area" || chartType === "scatter" || chartType === "bubble") {
    const series = datasets.length ? datasets : [{ label: title ?? "", data: data.map((d) => d.value), color: "#6366f1" }];
    const max = Math.max(...series.flatMap((s) => s.data), 10);
    const n = Math.max(series[0]?.data.length ?? 0, 1);
    const x = (i: number) => PAD.l + (i / (n - 1 || 1)) * cw;
    const y = (v: number) => PAD.t + ch - (v / max) * ch;
    const labels = data.length ? data.map((d) => d.label) : series[0].data.map((_, i) => `Q${i + 1}`);

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {title && <text x={width / 2} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill={t.label}>{title}</text>}
        {[0, 1, 2, 3, 4].map((i) => {
          const val = (max * i) / 4;
          const yy = y(val);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={yy} x2={width - PAD.r} y2={yy} stroke={t.grid} strokeWidth={1} strokeDasharray="4 4" />
              <text x={PAD.l - 8} y={yy + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{Math.round(val)}</text>
            </g>
          );
        })}
        {series.map((s, si) => {
          const pts = s.data.map((v, i) => [x(i), y(v)] as const);
          const line = pts.map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px} ${py}`).join(" ");
          return (
            <g key={si}>
              {chartType === "area" && (
                <path d={`M ${pts[0][0]} ${pts[0][1]} ${pts.slice(1).map(([px, py]) => `L ${px} ${py}`).join(" ")} L ${pts[pts.length - 1][0]} ${PAD.t + ch} L ${pts[0][0]} ${PAD.t + ch} Z`} fill={s.color ?? COLORS[si]} opacity={0.18} />
              )}
              <path d={line} fill="none" stroke={s.color ?? COLORS[si % COLORS.length]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map(([px, py], i) =>
                chartType === "scatter" || chartType === "bubble" ? (
                  <circle key={i} cx={px} cy={py} r={chartType === "bubble" ? 9 : 6} fill={s.color ?? COLORS[si % COLORS.length]} opacity={0.85} />
                ) : (
                  <circle key={i} cx={px} cy={py} r={4.5} fill="#fff" stroke={s.color ?? COLORS[si % COLORS.length]} strokeWidth={2.5} />
                )
              )}
            </g>
          );
        })}
        {labels.map((lb, i) => (
          <text key={i} x={x(i)} y={height - 14} textAnchor="middle" fontSize={11} fill="#94a3b8">{lb.length > 14 ? lb.slice(0, 13) + "…" : lb}</text>
        ))}
        {legend &&
          series.length > 1 &&
          series.map((s, si) => (
            <g key={si}>
              <rect x={width - PAD.r - 140} y={16 + si * 20} width={12} height={12} rx={3} fill={s.color ?? COLORS[si % COLORS.length]} />
              <text x={width - PAD.r - 122} y={26 + si * 20} fontSize={12} fill={t.legend}>{s.label}</text>
            </g>
          ))}
      </svg>
    );
  }

  // ---- Radar ----
  if (chartType === "radar") {
    const labels = data.length ? data.map((d) => d.label) : ["A", "B", "C", "D", "E"];
    const n = labels.length;
    const cx = width / 2;
    const cy = height / 2 + 8;
    const r = Math.min(cw, ch) / 2 - 24;
    const pt = (i: number, scale: number): [number, number] => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + r * scale * Math.cos(a), cy + r * scale * Math.sin(a)];
    };
    const values = data.length ? data.map((d) => d.value) : datasets[0]?.data ?? [60, 70, 50, 80, 65];
    const max = Math.max(...values, 10);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {[1, 2, 3, 4].map((ring) => (
          <polygon key={ring} points={Array.from({ length: n }, (_, i) => pt(i, ring / 4).join(",")).join(" ")} fill={ring === 4 ? "rgba(99,102,241,0.08)" : "none"} stroke={t.grid} />
        ))}
        {labels.map((lb, i) => {
          const [px, py] = pt(i, 1.15);
          return (
            <text key={i} x={px} y={py} textAnchor="middle" fontSize={11} fill={t.muted}>{lb}</text>
          );
        })}
        <polygon points={values.map((v, i) => pt(i, v / max).join(",")).join(" ")} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={2} />
      </svg>
    );
  }

  // ---- Heatmap ----
  if (chartType === "heatmap") {
    const rows = data.length ? data.slice(0, 8) : [{ label: "A", value: 40 }, { label: "B", value: 60 }];
    const cellH = ch / rows.length;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rows.map((d, i) => {
          const intensity = Math.min(d.value / 100, 1);
          return (
            <g key={i}>
              <rect x={PAD.l} y={PAD.t + i * cellH + 4} width={cw} height={cellH - 8} rx={6} fill={`rgba(99,102,241,${0.15 + intensity * 0.85})`} />
              <text x={PAD.l + 14} y={PAD.t + i * cellH + cellH / 2 + 4} fontSize={13} fill="#fff" fontWeight={600}>{d.label} — {d.value}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ---- Gantt ----
  if (chartType === "gantt") {
    const rows = data.length ? data : [{ label: "Phase 1", value: 30 }, { label: "Phase 2", value: 50 }];
    const rowH = Math.min(ch / rows.length, 60);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {rows.map((d, i) => {
          const w = (d.value / 100) * cw;
          return (
            <g key={i}>
              <rect x={PAD.l} y={PAD.t + i * rowH + 10} width={w} height={rowH - 20} rx={8} fill={COLORS[i % COLORS.length]} />
              <text x={PAD.l + 12} y={PAD.t + i * rowH + rowH / 2 + 4} fontSize={13} fill="#fff" fontWeight={600}>{d.label} — {d.value}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ---- Treemap ----
  if (chartType === "treemap") {
    const items = data.length ? data : [{ label: "A", value: 30 }, { label: "B", value: 50 }];
    const total = items.reduce((a, d) => a + d.value, 0) || 1;
    let x = PAD.l;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {items.slice(0, 8).map((d, i) => {
          const w = Math.max(40, (d.value / total) * cw);
          const out = (
            <g key={i}>
              <rect x={x} y={PAD.t} width={w} height={ch} fill={d.color ?? COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
              <text x={x + 8} y={PAD.t + 20} fontSize={12} fill="#fff" fontWeight={600}>{d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}</text>
            </g>
          );
          x += w;
          return out;
        })}
      </svg>
    );
  }

  // ---- Sankey ----
  if (chartType === "sankey") {
    const stages = data.length ? data.slice(0, 6) : [{ label: "In", value: 100 }];
    let acc = 0;
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {stages.map((d, i) => {
          const h = (d.value / 100) * ch;
          const x = PAD.l + (i / Math.max(stages.length - 1, 1)) * cw;
          const out = (
            <g key={i}>
              <rect x={x - 10} y={PAD.t + acc} width={20} height={Math.max(h, 8)} fill={d.color ?? COLORS[i % COLORS.length]} />
              <text x={x - 30} y={PAD.t + acc + h / 2} textAnchor="end" fontSize={11} fill={t.muted}>{d.label}</text>
            </g>
          );
          acc += h + 6;
          return out;
        })}
      </svg>
    );
  }

  // ---- Horizontal bar ----
  if (chartType === "horizontal-bar") {
    const rowH = Math.min(ch / Math.max(data.length, 1), 56);
    const max = Math.max(...data.map((d) => d.value), 10);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const w = (d.value / max) * cw;
          const yy = PAD.t + i * rowH + 6;
          return (
            <g key={i}>
              <rect x={PAD.l} y={yy} width={w} height={rowH - 12} rx={6} fill={d.color ?? COLORS[i % COLORS.length]} />
              <text x={PAD.l + 8} y={yy + rowH / 2 + 4} fontSize={12} fill="#fff" fontWeight={600}>{d.label}</text>
              <text x={PAD.l + w + 8} y={yy + rowH / 2 + 4} fontSize={11} fill={t.muted}>{d.value}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ---- Bar / Stacked (fallback) ----
  const max = Math.max(...data.map((d) => d.value), ...datasets.flatMap((s) => s.data), 10);
  const barCount = Math.max(data.length, datasets[0]?.data.length ?? 0, 1);
  const groupW = cw / barCount;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {title && <text x={width / 2} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill={t.label}>{title}</text>}
      {[0, 1, 2, 3, 4].map((i) => {
        const val = (max * i) / 4;
        const yy = PAD.t + ch - (val / max) * ch;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={yy} x2={width - PAD.r} y2={yy} stroke={t.grid} strokeWidth={1} strokeDasharray="4 4" />
            <text x={PAD.l - 8} y={yy + 4} textAnchor="end" fontSize={11} fill="#94a3b8">{Math.round(val)}</text>
          </g>
        );
      })}
      {!datasets.length &&
        data.map((d, i) => {
          const bw = Math.min(groupW * 0.6, 60);
          const bx = PAD.l + i * groupW + (groupW - bw) / 2;
          const bh = (d.value / max) * ch;
          return (
            <g key={i}>
              <rect x={bx} y={PAD.t + ch - bh} width={bw} height={bh} rx={6} fill={d.color ?? COLORS[i % COLORS.length]} />
              <text x={bx + bw / 2} y={PAD.t + ch - bh - 6} textAnchor="middle" fontSize={10} fill={t.muted}>{d.value}</text>
              <text x={bx + bw / 2} y={height - 14} textAnchor="middle" fontSize={10} fill="#94a3b8">{d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}</text>
            </g>
          );
        })}
      {datasets.length > 0 &&
        (() => {
          const seriesCount = datasets.length;
          const bw = Math.min(groupW / (seriesCount + 0.4), 46);
          return (
            <>
              {datasets.map((ds, si) => (
                <g key={si}>
                  {ds.data.map((v, i) => {
                    const bh = (v / max) * ch;
                    const bx = PAD.l + i * groupW + (groupW - bw * seriesCount) / 2 + si * bw;
                    return <rect key={i} x={bx} y={PAD.t + ch - bh} width={bw - 3} height={bh} rx={4} fill={ds.color ?? COLORS[si % COLORS.length]} />;
                  })}
                  <rect x={width - PAD.r - 140} y={16 + si * 20} width={12} height={12} rx={3} fill={ds.color ?? COLORS[si % COLORS.length]} />
                  <text x={width - PAD.r - 122} y={26 + si * 20} fontSize={12} fill={t.legend}>{ds.label}</text>
                </g>
              ))}
              {(data.length ? data.map((d) => d.label) : datasets[0].data.map((_, i) => `Q${i + 1}`)).map((lb, i) => (
                <text key={i} x={PAD.l + i * groupW + groupW / 2} y={height - 14} textAnchor="middle" fontSize={10} fill="#94a3b8">{lb.length > 14 ? lb.slice(0, 13) + "…" : lb}</text>
              ))}
            </>
          );
        })()}
    </svg>
  );
}
