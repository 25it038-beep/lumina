"use client";

import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { StickyNote } from "lucide-react";

export function NotesPane() {
  const deck = useDeckStore((s) => s.deck);
  const updateSlide = useDeckStore((s) => s.updateSlide);
  const activeSlideId = useUIStore((s) => s.activeSlideId);

  if (!deck) return null;
  const slide = deck.slides.find((s) => s.id === activeSlideId);
  const index = deck.slides.findIndex((s) => s.id === activeSlideId);

  return (
    <div className="flex h-40 shrink-0 items-stretch gap-3 border-t border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="hidden w-40 shrink-0 flex-col items-center justify-center gap-2 border-r border-white/8 pr-4 md:flex">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Slide {index + 1} of {deck.slides.length}</span>
        <div className="flex h-20 w-36 items-center justify-center rounded-md border border-white/10 bg-[#0b0d12] text-2xl font-semibold text-slate-600">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 flex-col">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <StickyNote size={13} className="text-indigo-300" />
          Speaker Notes
          <span className="ml-auto text-[10px] text-slate-600">{slide?.speakerNotes?.length ?? 0} chars</span>
        </div>
        <textarea
          value={slide?.speakerNotes ?? slide?.notes ?? ""}
          onChange={(e) => slide && updateSlide(slide.id, { speakerNotes: e.target.value, notes: e.target.value })}
          placeholder="Add speaker notes for this slide…"
          className="h-full w-full resize-none rounded-lg border border-white/10 bg-[#0b0d12] px-3 py-2 text-xs leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/50 focus:outline-none"
        />
      </div>
    </div>
  );
}