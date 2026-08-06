"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Timer, Users, MessageSquare, PenLine, MousePointer2, List } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { getTheme } from "@/lib/themes";
import { SLIDE_WIDTH, SLIDE_HEIGHT } from "@/lib/layouts";
import { resolveBackground } from "@/lib/export/slideRenderer";
import { SlidePreview } from "@/components/SlidePreview";

export function PresentationPlayer() {
  const deck = useDeckStore((s) => s.deck);
  const setMode = useUIStore((s) => s.setMode);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);

  const [index, setIndex] = useState(() => {
    const i = deck?.slides.findIndex((s) => s.id === activeSlideId) ?? -1;
    return i >= 0 ? i : 0;
  });
  const [speakerView, setSpeakerView] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [laser, setLaser] = useState<{ x: number; y: number } | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [cursor, setCursor] = useState<"pointer" | "laser" | "pen">("pointer");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = deck?.slides.filter((s) => !s.hidden) ?? [];
  const current = slides[Math.min(index, slides.length - 1)];

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); prev(); }
      if (e.key === "Escape") setMode("editor");
      if (e.key === "s" || e.key === "S") setSpeakerView((v) => !v);
      if (e.key === "n" || e.key === "N") setNotesOpen((v) => !v);
      if (e.key === "l" || e.key === "L") setCursor((c) => (c === "laser" ? "pointer" : "laser"));
      if (e.key === "p" || e.key === "P") setCursor((c) => (c === "pen" ? "pointer" : "pen"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, slides.length]);

  useEffect(() => {
    if (current) setActiveSlide(current.id);
  }, [index]);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  if (!deck || !current) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black">
        <p className="text-slate-400">No slides to present</p>
        <button onClick={() => setMode("editor")} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white">Back to editor</button>
      </div>
    );
  }

  const theme = getTheme(deck.themeId);
  const fmt = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  const onCanvasMove = (e: React.PointerEvent) => {
    if (cursor === "laser") setLaser({ x: e.clientX, y: e.clientY });
    if (cursor === "pen" && drawingRef.current) {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      const rect = c.getBoundingClientRect();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  return (
    <div
      className="relative flex h-screen w-screen select-none flex-col overflow-hidden bg-black"
      onPointerMove={onCanvasMove}
      onPointerDown={(e) => {
        if (cursor === "pen") {
          drawingRef.current = true;
          const c = canvasRef.current;
          if (c) {
            const ctx = c.getContext("2d")!;
            const rect = c.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
          }
        }
      }}
      onPointerUp={() => (drawingRef.current = false)}
      onClick={() => {
        if (cursor === "pointer") return; // allow click for laser/pen mode
      }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* Slide */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {current.backgroundImage || !resolveBackground(current, deck)?.includes("url") ? (
          <div
            className="relative"
            style={{
              width: "min(96vw, calc(100vh * 16 / 9))",
              height: "min(94vh, calc(96vw * 9 / 16))",
            }}
          >
            <SlidePreview
              key={current.id}
              slide={current}
              deck={deck}
              showAnimations
              animateIndex={0}
              scale={1}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, transform: `scale(${Math.min(1, (window.innerWidth * 0.96) / SLIDE_WIDTH)})` }}>
            </div>
          </div>
        ) : null}
      </div>

      {/* Laser pointer */}
      {cursor === "laser" && laser && (
        <div
          className="pointer-events-none fixed z-40"
          style={{ left: laser.x - 10, top: laser.y - 10, width: 20, height: 20 }}
        >
          <div className="h-full w-full rounded-full bg-rose-500 shadow-glow" />
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full glass-strong px-3 py-1.5 shadow-2xl">
        <button onClick={prev} className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"><ChevronLeft size={16} /></button>
        <span className="w-16 text-center text-xs font-medium tabular-nums text-white/80">{index + 1} / {slides.length}</span>
        <button onClick={next} className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"><ChevronRight size={16} /></button>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <button
          onClick={() => setTimerRunning(!timerRunning)}
          className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[11px] tabular-nums ${timerRunning ? "text-emerald-300" : "text-white/60"}`}
          title="Timer"
        >
          <Timer size={13} /> {fmt(elapsed)}
        </button>
        <button
          onClick={() => setCursor((c) => (c === "laser" ? "pointer" : "laser"))}
          className={`cursor-pointer rounded-full p-1.5 ${cursor === "laser" ? "bg-rose-500/30 text-rose-300" : "text-white/70 hover:bg-white/10"}`}
          title="Laser pointer (L)"
        >
          <MousePointer2 size={14} />
        </button>
        <button
          onClick={() => setCursor((c) => (c === "pen" ? "pointer" : "pen"))}
          className={`cursor-pointer rounded-full p-1.5 ${cursor === "pen" ? "bg-rose-500/30 text-rose-300" : "text-white/70 hover:bg-white/10"}`}
          title="Draw (P)"
        >
          <PenLine size={14} />
        </button>
        <button
          onClick={() => setNotesOpen(!notesOpen)}
          className={`cursor-pointer rounded-full p-1.5 ${notesOpen ? "bg-indigo-500/30 text-indigo-200" : "text-white/70 hover:bg-white/10"}`}
          title="Notes (N)"
        >
          <MessageSquare size={14} />
        </button>
        <button
          onClick={() => setSpeakerView(!speakerView)}
          className={`cursor-pointer rounded-full p-1.5 ${speakerView ? "bg-indigo-500/30 text-indigo-200" : "text-white/70 hover:bg-white/10"}`}
          title="Speaker view (S)"
        >
          <Users size={14} />
        </button>
        <div className="mx-1 h-4 w-px bg-white/20" />
        <button onClick={() => setMode("editor")} className="cursor-pointer rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white" title="Exit (Esc)">
          <X size={16} />
        </button>
      </div>

      {/* Notes overlay */}
      {notesOpen && (
        <div className="absolute bottom-16 right-4 z-40 w-[340px] rounded-2xl glass-strong p-4 shadow-2xl animate-scale-in">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90">Speaker notes</span>
            <button onClick={() => setNotesOpen(false)} className="cursor-pointer text-white/50 hover:text-white"><X size={13} /></button>
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
            {current.notes || current.speakerNotes || "No notes for this slide."}
          </p>
        </div>
      )}

      {/* Speaker view */}
      {speakerView && (
        <div className="absolute right-4 top-4 z-40 w-[300px] overflow-hidden rounded-2xl glass-strong shadow-2xl animate-slide-in-right">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Next slide preview
          </div>
          <div className="p-3">
            <div className="overflow-hidden rounded-lg">
              {slides[index + 1] ? (
                <SlidePreview slide={slides[index + 1]} deck={deck} scale={0.35} />
              ) : (
                <div className="flex h-[126px] items-center justify-center rounded-lg bg-white/[0.03] text-xs text-white/40">
                  End of deck
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-white/10 px-3 py-2 text-[10px] text-white/50">
            {slides.length - index - 1} slides remaining · {Math.max(0, Math.round(slides.length - index - 1))} to go
          </div>
        </div>
      )}
    </div>
  );
}
