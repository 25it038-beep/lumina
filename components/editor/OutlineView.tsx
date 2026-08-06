"use client";

import { useState } from "react";
import { ChevronRight, Type, ImagePlus, Table2, LayoutTemplate, Square, Video } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";

const TYPE_ICON = {
  heading: Type, subtitle: Type, text: Type, image: ImagePlus, gif: ImagePlus,
  icon: Square, shape: Square, table: Table2, chart: LayoutTemplate, code: Type,
  video: Video, button: Square, qr: Square, embed: Square, audio: Square, svg: Square,
  timeline: Square, roadmap: Square, mindmap: Square, flowchart: Square, mermaid: Square,
  architecture: Square, swot: Square, bmc: Square,
} as const;

export function OutlineView() {
  const deck = useDeckStore((s) => s.deck);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setMode = useUIStore((s) => s.setMode);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (!deck) return null;

  return (
    <div className="flex-1 overflow-auto bg-[#0b0d12]">
      <div className="mx-auto max-w-3xl px-6 py-6">
        <h1 className="mb-6 border-b border-white/10 pb-3 text-xl font-semibold text-slate-100">{deck.title}</h1>
        <div className="space-y-1">
          {deck.slides.map((slide, i) => {
            const heading = slide.elements.find((e) => e.type === "heading");
            const bullets = slide.elements.filter((e) => e.type === "text" || e.type === "subtitle");
            const isCollapsed = collapsed[slide.id];
            return (
              <div key={slide.id} className="flex items-start gap-2">
                <span className={`mt-1.5 w-8 shrink-0 text-right text-[11px] font-mono ${activeSlideId === slide.id ? "text-indigo-300" : "text-slate-600"}`}>
                  {i + 1}
                </span>
                <button
                  onClick={() => { setActiveSlide(slide.id); setCollapsed((c) => ({ ...c, [slide.id]: !c[slide.id] })); }}
                  className={`flex-1 rounded-lg border-l-2 px-3 py-2 text-left transition-colors ${
                    activeSlideId === slide.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[13px] text-slate-200">
                    <ChevronRight size={13} className={`shrink-0 text-slate-500 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    <span>{heading ? (heading as any).content || slide.title : slide.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] capitalize text-slate-500">{slide.layout}</span>
                  </div>
                  {!isCollapsed && bullets.length > 0 && (
                    <div className="mt-1 space-y-0.5 pl-5">
                      {bullets.slice(0, 6).map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 text-[12px] text-slate-400">
                          {(TYPE_ICON as any)[b.type] ? null : null}
                          <span className="h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                          <span className="truncate">{(b as any).content || "(empty)"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setMode("editor")}
          className="mt-8 w-full rounded-lg border border-dashed border-white/15 py-3 text-xs text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-300"
        >
          Open in Normal view to edit slides
        </button>
      </div>
    </div>
  );
}