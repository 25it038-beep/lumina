"use client";

import { useState } from "react";
import {
  Type, Image as ImageIcon, Video, Music, Sparkles, Box, Table, BarChart2,
  Code, Binary, GitBranch, QrCode, Square, Circle, ArrowRight, Star, Hexagon,
  Layers, Search, Globe, MousePointerClick, Plus
} from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { SlideElement } from "@/lib/types";
import { Button, Input, SegmentedControl } from "@/components/ui";
import { toast } from "sonner";
import { BACKGROUNDS, BACKGROUND_CATEGORIES, BackgroundCategory } from "@/lib/backgrounds";

const uid = () => Math.random().toString(36).slice(2, 10);

export function AssetLibrary() {
  const deck = useDeckStore((s) => s.deck);
  const addElement = useDeckStore((s) => s.addElement);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setSelection = useUIStore((s) => s.setSelection);
  const [tab, setTab] = useState<"backgrounds" | "components" | "media" | "shapes" | "data">("backgrounds");
  const [search, setSearch] = useState("");
  const updateSlide = useDeckStore((s) => s.updateSlide);

  if (!deck || !activeSlideId) return null;

  const insert = (el: Partial<SlideElement> & Pick<SlideElement, "type">) => {
    const slide = deck.slides.find((s) => s.id === activeSlideId);
    if (!slide) return;

    const newEl: SlideElement = {
      id: uid(),
      name: el.type.charAt(0).toUpperCase() + el.type.slice(1),
      position: { x: 200, y: 180, width: 400, height: 200, rotation: 0 },
      style: { opacity: 1 },
      animation: { type: "fade-up", duration: 0.6, delay: 0 },
      locked: false,
      visible: true,
      zIndex: slide.elements.length + 1,
      ...el,
    } as SlideElement;

    addElement(activeSlideId, newEl);
    setSelection([newEl.id]);
    toast.success(`Added ${newEl.name} to slide`);
  };

  const [bgCategory, setBgCategory] = useState<string>("all");

  const filteredBackgrounds = BACKGROUNDS.filter((b) => {
    if (bgCategory !== "all" && b.category !== bgCategory) return false;
    if (search && !`${b.name} ${b.category}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col p-3 space-y-4 overflow-y-auto text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Insert Assets & Backgrounds</h3>
      </div>

      <SegmentedControl
        options={[
          { value: "backgrounds", label: "Backgrounds" },
          { value: "components", label: "Components" },
          { value: "media", label: "Media" },
          { value: "shapes", label: "Shapes" },
          { value: "data", label: "Charts" },
        ]}
        value={tab}
        onChange={(v) => setTab(v as any)}
      />

      {/* SEARCH */}
      <Input
        placeholder="Search assets or backgrounds..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
      />

      {/* BACKGROUNDS TAB */}
      {tab === "backgrounds" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setBgCategory("all")}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                bgCategory === "all" ? "border-indigo-400 bg-indigo-500/20 text-indigo-100" : "border-white/10 text-slate-400 hover:bg-white/5"
              }`}
            >
              All ({BACKGROUNDS.length})
            </button>
            {BACKGROUND_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setBgCategory(c.id)}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                  bgCategory === c.id ? "border-indigo-400 bg-indigo-500/20 text-indigo-100" : "border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredBackgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => {
                  updateSlide(activeSlideId, {
                    background: bg.css,
                    backgroundId: bg.id,
                    backgroundImage: bg.imageUrl,
                    backgroundVideo: bg.videoUrl,
                    backgroundAnimated: bg.animated,
                    backgroundEffect: bg.effect,
                  });
                  toast.success(`Applied "${bg.name}" background to slide!`);
                }}
                className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 p-2 text-left cursor-pointer transition-all hover:border-indigo-400/70 hover:scale-[1.02]"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: bg.css }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur px-2 py-1 flex items-center justify-between">
                  <span className="truncate text-[10px] font-medium text-white">{bg.name}</span>
                  <span className="text-[9px] text-indigo-300 capitalize">{bg.category}</span>
                </div>
              </button>
            ))}
          </div>

          {filteredBackgrounds.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">No backgrounds found matching "{search}"</p>
          )}
        </div>
      )}

      {/* COMPONENTS TAB */}
      {tab === "components" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              insert({
                type: "heading",
                content: "Heading Title",
                position: { x: 100, y: 150, width: 600, height: 70, rotation: 0 },
                style: { fontSize: 44, fontWeight: 700, color: "var(--t-text)" },
              })
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Type size={18} className="text-indigo-400" />
            <span>Heading</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "text",
                content: "• Add concise bullet point 1\n• Supporting detail or metric\n• Final key takeaway",
                position: { x: 100, y: 240, width: 600, height: 180, rotation: 0 },
                style: { fontSize: 20, fontWeight: 400, color: "var(--t-text)", lineHeight: 1.6 },
              })
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Type size={18} className="text-violet-400" />
            <span>Text Block</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "code",
                code: "function computeGrowth(revenue) {\n  return revenue * 1.35;\n}",
                language: "typescript",
                position: { x: 100, y: 200, width: 500, height: 220, rotation: 0 },
                style: { borderRadius: 12, fontFamily: "JetBrains Mono" },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Code size={18} className="text-emerald-400" />
            <span>Code Block</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "formula",
                latex: "E = mc^2 \\quad \\text{and} \\quad \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}",
                position: { x: 150, y: 220, width: 600, height: 140, rotation: 0 },
                style: { fontSize: 32 },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Binary size={18} className="text-amber-400" />
            <span>LaTeX Math</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "button",
                label: "Get Started →",
                href: "https://lumina.app",
                position: { x: 200, y: 300, width: 220, height: 50, rotation: 0 },
                style: { fill: "#6366f1", color: "#ffffff", borderRadius: 12 },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <MousePointerClick size={18} className="text-fuchsia-400" />
            <span>Action Button</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "qr",
                url: "https://lumina.app",
                label: "Scan to View Presentation",
                position: { x: 200, y: 200, width: 180, height: 180, rotation: 0 },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <QrCode size={18} className="text-cyan-400" />
            <span>QR Code</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "table",
                rows: 4,
                cols: 3,
                headers: ["Feature", "Standard", "Enterprise"],
                cells: [
                  ["AI Deck Generation", "Unlimited", "Unlimited"],
                  ["Custom Themes", "5 Included", "Custom Fonts & Branding"],
                  ["Export Formats", "PDF, PPTX", "PPTX, PDF, HTML, SVG, PNG"],
                ],
                position: { x: 100, y: 200, width: 700, height: 260, rotation: 0 },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Table size={18} className="text-rose-400" />
            <span>Data Table</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "embed",
                url: "https://wikipedia.org",
                position: { x: 100, y: 150, width: 700, height: 400, rotation: 0 },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Globe size={18} className="text-teal-400" />
            <span>Embed Webpage</span>
          </button>
        </div>
      )}

      {/* MEDIA TAB */}
      {tab === "media" && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              insert({
                type: "image",
                src: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`,
                alt: "Abstract Visual",
                objectFit: "cover",
                position: { x: 150, y: 150, width: 600, height: 380, rotation: 0 },
                style: { borderRadius: 16, shadow: true },
              })
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <ImageIcon size={18} className="text-indigo-400" />
            <span>Stock Image</span>
          </button>

          <button
            onClick={() =>
              insert({
                type: "video",
                src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                autoplay: false,
                loop: false,
                position: { x: 150, y: 150, width: 640, height: 360, rotation: 0 },
                style: { borderRadius: 16, shadow: true },
              } as any)
            }
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
          >
            <Video size={18} className="text-rose-400" />
            <span>Video Embed</span>
          </button>
        </div>
      )}

      {/* SHAPES TAB */}
      {tab === "shapes" && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Rectangle", shape: "rect", icon: <Square size={16} /> },
            { name: "Circle", shape: "circle", icon: <Circle size={16} /> },
            { name: "Arrow", shape: "arrow", icon: <ArrowRight size={16} /> },
            { name: "Star", shape: "star", icon: <Star size={16} /> },
            { name: "Hexagon", shape: "hexagon", icon: <Hexagon size={16} /> },
          ].map((s) => (
            <button
              key={s.name}
              onClick={() =>
                insert({
                  type: "shape",
                  shape: s.shape as any,
                  position: { x: 250, y: 200, width: 140, height: 140, rotation: 0 },
                  style: { fill: "#6366f1", borderRadius: 12 },
                } as any)
              }
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
            >
              <div className="text-indigo-400">{s.icon}</div>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* DATA & CHARTS TAB */}
      {tab === "data" && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "bar", label: "Bar Chart" },
            { id: "pie", label: "Pie Chart" },
            { id: "donut", label: "Donut Chart" },
            { id: "line", label: "Line Chart" },
            { id: "area", label: "Area Chart" },
            { id: "radar", label: "Radar Chart" },
            { id: "heatmap", label: "Heatmap" },
            { id: "gantt", label: "Gantt Roadmap" },
            { id: "sankey", label: "Sankey Flow" },
            { id: "treemap", label: "Treemap" },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() =>
                insert({
                  type: "chart",
                  chartType: c.id as any,
                  title: c.label,
                  data: [
                    { label: "Q1", value: 45 },
                    { label: "Q2", value: 72 },
                    { label: "Q3", value: 88 },
                    { label: "Q4", value: 110 },
                  ],
                  datasets: [],
                  axisLabels: { x: "", y: "" },
                  legend: true,
                  animateChart: true,
                  position: { x: 100, y: 180, width: 680, height: 380, rotation: 0 },
                } as any)
              }
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300 hover:border-indigo-400/50 hover:bg-white/8 transition-all"
            >
              <BarChart2 size={18} className="text-indigo-400" />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
