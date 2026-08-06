"use client";

import { Copy, Trash2, Plus } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { SlidePreview, SLIDE_WIDTH, SLIDE_HEIGHT } from "@/components/SlidePreview";
import { createBlankSlide } from "@/lib/layouts";

const THUMB = 0.16;

export function SlideSorterView() {
  const deck = useDeckStore((s) => s.deck);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);
  const duplicateSlide = useDeckStore((s) => s.duplicateSlide);
  const deleteSlide = useDeckStore((s) => s.deleteSlide);
  const addSlide = useDeckStore((s) => s.addSlide);
  const moveSlide = useDeckStore((s) => s.moveSlide);
  const activeSlideId = useUIStore((s) => s.activeSlideId);

  if (!deck) return null;

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    const from = Number(e.dataTransfer.getData("text/slide-index"));
    if (!Number.isNaN(from) && from !== toIndex) moveSlide(from, toIndex);
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
        {deck.slides.map((slide, i) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/slide-index", String(i))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, i)}
            onClick={() => setActiveSlide(slide.id)}
            className={`group flex flex-col gap-2 rounded-xl border-2 p-2 transition-colors ${
              activeSlideId === slide.id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/25"
            }`}
          >
            <div className="relative overflow-hidden rounded-lg shadow-md">
              <SlidePreview slide={slide} deck={deck} scale={THUMB} className="w-full" />
              <div className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">
                {i + 1}
              </div>
              <div className="pointer-events-none absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  title="Duplicate"
                  onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }}
                  className="pointer-events-auto rounded-md bg-black/70 p-1 text-white hover:bg-indigo-600"
                >
                  <Copy size={12} />
                </button>
                <button
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                  className="pointer-events-auto rounded-md bg-black/70 p-1 text-white hover:bg-rose-600"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className="truncate px-1 text-[11px] text-slate-300">{slide.title}</div>
          </div>
        ))}

        <button
          onClick={() => addSlide(createBlankSlide(`Slide ${deck.slides.length + 1}`))}
          className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 text-slate-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-300"
          style={{ width: SLIDE_WIDTH * THUMB }}
        >
          <Plus size={24} />
          <span className="text-xs">New Slide</span>
        </button>
      </div>
    </div>
  );
}