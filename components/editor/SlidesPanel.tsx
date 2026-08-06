"use client";

import { Plus, Trash2, Copy, Eye, EyeOff, GripVertical, MoreHorizontal } from "lucide-react";
import { SlidePreview } from "@/components/SlidePreview";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { createBlankSlide } from "@/lib/layouts";
import { uid } from "@/lib/utils";

export function SlidesPanel() {
  const deck = useDeckStore((s) => s.deck);
  const addSlide = useDeckStore((s) => s.addSlide);
  const duplicateSlide = useDeckStore((s) => s.duplicateSlide);
  const deleteSlide = useDeckStore((s) => s.deleteSlide);
  const updateSlide = useDeckStore((s) => s.updateSlide);
  const moveSlide = useDeckStore((s) => s.moveSlide);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);
  const setSelection = useUIStore((s) => s.setSelection);

  if (!deck) return null;

  const onDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(from) && from !== toIndex) moveSlide(from, toIndex);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Slides</span>
        <button
          onClick={() => addSlide(createBlankSlide(`Slide ${deck.slides.length + 1}`))}
          className="flex cursor-pointer items-center gap-1 rounded-md bg-indigo-500/80 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {deck.slides.map((slide, i) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, i)}
            onClick={() => {
              setActiveSlide(slide.id);
              setSelection([]);
            }}
            className={`group relative cursor-pointer overflow-hidden rounded-lg border transition-all ${
              slide.id === activeSlideId
                ? "border-indigo-400/70 shadow-lg shadow-indigo-500/20"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <div className="pointer-events-none scale-[0.22] origin-top-left w-[1280px] h-[720px]" style={{ transform: "scale(0.22)", transformOrigin: "top left", width: 1280, height: 720 }}>
              <SlidePreview slide={slide} deck={deck} scale={1} />
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-4">
              <span className="text-[10px] font-medium text-white/90">{i + 1}. {slide.title}</span>
              <span className="flex items-center gap-1">
                <button
                  className="pointer-events-auto cursor-pointer rounded p-0.5 text-white/60 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); updateSlide(slide.id, { hidden: !slide.hidden }); }}
                  title={slide.hidden ? "Show" : "Hide"}
                >
                  {slide.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button
                  className="pointer-events-auto cursor-pointer rounded p-0.5 text-white/60 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); duplicateSlide(slide.id); }}
                  title="Duplicate"
                >
                  <Copy size={11} />
                </button>
                <button
                  className="pointer-events-auto cursor-pointer rounded p-0.5 text-white/60 hover:text-rose-400"
                  onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            </div>
            <GripVertical size={12} className="pointer-events-none absolute left-0.5 top-0.5 text-white/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LayersPanel() {
  const deck = useDeckStore((s) => s.deck);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const selectedIds = useUIStore((s) => s.selectedElementIds);
  const setSelection = useUIStore((s) => s.setSelection);
  const reorderElement = useDeckStore((s) => s.reorderElement);

  const slide = deck?.slides.find((s) => s.id === activeSlideId);
  if (!slide) return null;

  const els = [...slide.elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-1 p-2">
      {els.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">No elements yet</p>}
      {els.map((e) => (
        <div
          key={e.id}
          onClick={() => setSelection([e.id])}
          className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
            selectedIds.includes(e.id) ? "bg-indigo-500/20 text-indigo-100" : "text-slate-400 hover:bg-white/5"
          }`}
        >
          <MoreHorizontal size={12} className="shrink-0" />
          <span className="flex-1 truncate">{e.name || e.type}</span>
          <button
            onClick={(ev) => { ev.stopPropagation(); reorderElement(slide.id, e.id, "front"); }}
            className="rounded p-0.5 hover:bg-white/10"
            title="Bring to front"
          >
            ↑
          </button>
          <button
            onClick={(ev) => { ev.stopPropagation(); reorderElement(slide.id, e.id, "back"); }}
            className="rounded p-0.5 hover:bg-white/10"
            title="Send to back"
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}
