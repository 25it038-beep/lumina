"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  Move,
  Type,
  BarChart3,
  Table2,
  GitCommit,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { SlideElement } from "@/lib/types";
import { Button } from "@/components/ui";

export const START_ELEMENT_TOUR_EVENT = "lumina:start-element-tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ELEMENT_TYPE_DESCRIPTIONS: Record<string, { title: string; hint: string; icon: any }> = {
  heading: {
    title: "Heading Title Element",
    hint: "Double-click directly on the slide to type inline text. Adjust font size, family, and bold/italic in the top floating toolbar or right Inspector panel.",
    icon: Type,
  },
  subtitle: {
    title: "Subtitle / Sub-heading",
    hint: "Double-click to edit description text inline. Supports auto-wrap, custom text colors, and line height adjustments.",
    icon: Type,
  },
  text: {
    title: "Body Text / Bullet Item",
    hint: "Double-click to edit content directly. Click the 'AI Rewrite' button in the Inspector panel to rephrase or summarize automatically.",
    icon: Pencil,
  },
  chart: {
    title: "Data Chart Element",
    hint: "Click this chart to view data settings in the right Inspector tab. Enter line-by-line values ('Label: Value') or switch between Bar, Line, Pie, and Donut types.",
    icon: BarChart3,
  },
  table: {
    title: "Structured Table Grid",
    hint: "Click to edit table header columns and row data cells in the right Inspector panel. Drag corner handles to scale table bounds.",
    icon: Table2,
  },
  timeline: {
    title: "Timeline & Milestone Flow",
    hint: "Click to update milestone titles, period labels, and descriptions line-by-line in the right Inspector panel.",
    icon: GitCommit,
  },
  roadmap: {
    title: "Strategy Roadmap Diagram",
    hint: "Click to edit phase titles and execution steps in the Inspector. Lumina automatically recalculates node positions and connecting lines.",
    icon: GitCommit,
  },
  mindmap: {
    title: "Mindmap Node Network",
    hint: "Click to edit central topic nodes and sub-branches line-by-line in the Inspector panel.",
    icon: GitCommit,
  },
  flowchart: {
    title: "Process Flowchart Diagram",
    hint: "Click to update process steps and flow sequence in the Inspector. Lumina formats node connections automatically.",
    icon: GitCommit,
  },
  architecture: {
    title: "System Architecture Flow",
    hint: "Click to update infrastructure component labels and data flow lines in the right Inspector panel.",
    icon: GitCommit,
  },
  swot: {
    title: "SWOT Analysis Grid",
    hint: "Click to edit Strengths, Weaknesses, Opportunities, and Threats quadrant items in the Inspector.",
    icon: Table2,
  },
  bmc: {
    title: "Business Model Canvas",
    hint: "Click to update key partners, value propositions, channels, and revenue stream nodes in the Inspector.",
    icon: Table2,
  },
  image: {
    title: "Image / Photo Graphic",
    hint: "Drag corner handles to resize. Use the right Inspector or 'AI Image' button to generate replacement artwork using FLUX AI.",
    icon: ImageIcon,
  },
  gif: {
    title: "Animated GIF Visual",
    hint: "Drag handles to resize or reposition. Replace GIF URL in the right Inspector panel.",
    icon: ImageIcon,
  },
  video: {
    title: "Video Player Box",
    hint: "Enter YouTube or video URLs in the right Inspector panel for inline presentation playback.",
    icon: ImageIcon,
  },
  shape: {
    title: "Vector Geometry Shape",
    hint: "Click to change fill colors, borders, opacity, or shadow effects in the right Inspector panel.",
    icon: Move,
  },
  icon: {
    title: "Icon Graphic Element",
    hint: "Click to change icon glyph, size, or accent colors in the right Inspector panel.",
    icon: Sparkles,
  },
  code: {
    title: "Monospace Code Block",
    hint: "Click to edit source code and syntax highlighting options in the right Inspector panel.",
    icon: Pencil,
  },
  button: {
    title: "Call-to-Action Button",
    hint: "Click to edit button label, border radius, background color, and hyperlink target.",
    icon: Move,
  },
};

export function ElementSpotlightTour() {
  const [active, setActive] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<"below" | "above" | "right" | "left" | "center">("below");
  const rafRef = useRef<number | null>(null);

  const deck = useDeckStore((s) => s.deck);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setSelection = useUIStore((s) => s.setSelection);

  const slide = deck?.slides.find((s) => s.id === activeSlideId);
  const elements = slide?.elements ?? [];

  const finish = useCallback(() => {
    setActive(null);
    setRect(null);
  }, []);

  const startTour = useCallback(() => {
    if (!elements.length) return;
    setActive(0);
    setSelection([elements[0].id]);
  }, [elements, setSelection]);

  useEffect(() => {
    const handleStart = () => startTour();
    window.addEventListener(START_ELEMENT_TOUR_EVENT, handleStart);
    return () => window.removeEventListener(START_ELEMENT_TOUR_EVENT, handleStart);
  }, [startTour]);

  const measureElement = useCallback((idx: number) => {
    if (!elements[idx]) {
      setRect(null);
      setCardPos("center");
      return;
    }

    const targetEl = elements[idx];
    setSelection([targetEl.id]);

    const domNode = document.querySelector<HTMLElement>(`[data-el-id="${targetEl.id}"]`);
    if (!domNode) {
      setRect(null);
      setCardPos("center");
      return;
    }

    const r = domNode.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });

      const gap = 16;
      const cardHeight = 220;
      const cardWidth = 360;

      const below = r.top + r.height + gap + cardHeight;
      const above = r.top - gap - cardHeight;
      const right = r.left + r.width + gap + cardWidth;
      const left = r.left - gap - cardWidth;

      if (below <= window.innerHeight - 10) setCardPos("below");
      else if (above >= 10) setCardPos("above");
      else if (right <= window.innerWidth - 10) setCardPos("right");
      else if (left >= 10) setCardPos("left");
      else setCardPos("center");
    } else {
      setRect(null);
      setCardPos("center");
    }
  }, [elements, setSelection]);

  useEffect(() => {
    if (active === null) return;
    measureElement(active);

    const update = () => measureElement(active);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, measureElement]);

  if (active === null || !elements.length) return null;

  const currentEl = elements[active];
  const info = ELEMENT_TYPE_DESCRIPTIONS[currentEl.type] ?? {
    title: `${currentEl.type.toUpperCase()} Element`,
    hint: "Click to select and view properties in the right Inspector panel. Drag to move or scale.",
    icon: Sparkles,
  };
  const Icon = info.icon;

  const isFirst = active === 0;
  const isLast = active === elements.length - 1;

  const handleNext = () => {
    if (isLast) finish();
    else setActive(active + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setActive(active - 1);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden animate-fade-in">
      {/* Darkened Canvas Mask */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="element-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx={6}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(11, 13, 18, 0.75)"
          mask="url(#element-spotlight-mask)"
        />
      </svg>

      {/* Glowing Target Ring around Element */}
      {rect && (
        <div
          className="absolute border-2 border-indigo-400/90 shadow-[0_0_24px_rgba(99,102,241,0.6)] transition-all duration-300 animate-pulse"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 8,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        className="pointer-events-auto absolute transition-all duration-300"
        style={(() => {
          if (!rect || cardPos === "center") {
            return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
          }
          const gap = 14;
          if (cardPos === "below") return { top: rect.top + rect.height + gap, left: Math.max(16, Math.min(window.innerWidth - 380, rect.left)) };
          if (cardPos === "above") return { top: rect.top - 230, left: Math.max(16, Math.min(window.innerWidth - 380, rect.left)) };
          if (cardPos === "right") return { top: Math.max(16, rect.top), left: rect.left + rect.width + gap };
          return { top: Math.max(16, rect.top), left: rect.left - 380 };
        })()}
      >
        <div className="w-[360px] overflow-hidden rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300">
                <Icon size={18} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                  Element {active + 1} of {elements.length}
                </span>
                <h4 className="text-sm font-bold">{info.title}</h4>
              </div>
            </div>
            <button
              onClick={finish}
              className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-slate-950/60 p-3 text-xs text-slate-200 leading-relaxed">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <span>{info.hint}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Position: ({Math.round(currentEl.position.x)}, {Math.round(currentEl.position.y)})</span>
              <span>Size: {Math.round(currentEl.position.width)} × {Math.round(currentEl.position.height)}px</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/40 px-4 py-3">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors ${
                isFirst ? "opacity-30 cursor-not-allowed text-slate-500" : "text-slate-300 hover:text-white"
              }`}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <div className="flex items-center gap-1.5">
              {elements.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === active ? "w-4 bg-indigo-500" : "w-1.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <Button size="sm" onClick={handleNext} className="gap-1 text-xs">
              <span>{isLast ? "Done" : "Next"}</span>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
