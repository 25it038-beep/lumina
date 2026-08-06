"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, MousePointerClick, Sparkles } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useUser } from "@clerk/nextjs";
import { scopedKeyFor } from "@/lib/auth/storage";

const STORAGE_KEY = "lumina-tour-done";
export const START_TOUR_EVENT = "lumina:start-tour";

interface TourStep {
  id: string;
  title: string;
  body: string;
  targets?: string[];
  action?: () => void;
  icon?: React.ReactNode;
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Lumina",
    body: "This is your presentation editor. We'll take a quick tour of every tool so you can build, design and present with confidence. Use → / ← to move between stops.",
    targets: ["canvas"],
    icon: <Sparkles size={18} className="text-indigo-300" />,
    action: () => {
      const ui = useUIStore.getState();
      ui.setMode("editor");
      ui.setView("normal");
      ui.setShowLeftPanel(true);
      ui.setShowRightPanel(true);
    },
  },
  {
    id: "slides-panel",
    title: "Slide deck",
    body: "The left panel lists every slide. Click one to edit it, drag to reorder, or press “Add” to create a new slide. Right-side icons hide, duplicate or delete a slide.",
    targets: ["slides-panel"],
    action: () => useUIStore.getState().setLeftPanel("slides"),
  },
  {
    id: "left-tabs",
    title: "Left panel tabs",
    body: "Switch between Slides, Layers (every element on the current slide, grouped by z-order) and Assets (icons, illustrations and media you can drop onto the canvas).",
    targets: ["left-tabs"],
  },
  {
    id: "right-panel",
    title: "Design inspector",
    body: "The right panel is your formatting hub. With an element selected you can change fonts, colors, fills, shadows, alignment and more — everything updates live on the canvas.",
    targets: ["right-panel"],
    action: () => useUIStore.getState().setRightPanel("inspector"),
  },
  {
    id: "right-tabs",
    title: "Right panel tabs",
    body: "Design (properties) · Themes (recustomize the whole deck) · AI Coach (design critique) · AI Gateway (model settings) · Comments (feedback) · History (versions).",
    targets: ["right-tabs"],
  },
  {
    id: "ribbon-tabs",
    title: "Ribbon tabs",
    body: "Like PowerPoint: Home (clipboard, slides, text, paragraph, arrange) · Insert (shapes, data, media) · Design (theme, background, grid) · Transitions · Animations · View.",
    targets: ["ribbon-tabs"],
  },
  {
    id: "ribbon-body",
    title: "Ribbon tools",
    body: "Every ribbon button acts on the selected slide or element — e.g. select a slide and hit “New”, or select text and hit “Bold”. Try the Transitions tab to animate whole slides.",
    targets: ["ribbon-body"],
  },
  {
    id: "toolbar-insert",
    title: "One-click insert",
    body: "Add content instantly: Text, Image, Shape, Table, Chart, Code and Button. They appear on the canvas, ready to drag, resize and style.",
    targets: ["toolbar-insert"],
  },
  {
    id: "toolbar-ai-media",
    title: "AI media generators",
    body: "“AI Image” and “AI Diagram” generate visuals from a prompt — perfect when you need custom artwork or diagrams without leaving the editor.",
    targets: ["toolbar-ai-media"],
  },
  {
    id: "toolbar-ai-assist",
    title: "AI assistants",
    body: "AI Coach reviews your deck and suggests improvements. Custom Theme builds a palette from scratch, and Brand Kit keeps your brand colors and logos consistent.",
    targets: ["toolbar-ai-assist"],
  },
  {
    id: "toolbar-views",
    title: "Find & customize",
    body: "Search (Ctrl+K) opens the command palette. The panels toggle hides the sidebars for a distraction-free canvas, and the moon icon switches dark/light mode.",
    targets: ["toolbar-views"],
  },
  {
    id: "toolbar-copilot",
    title: "AI Copilot",
    body: "Your chat assistant (Ctrl+/). Ask it to draft slides, rewrite text, restructure the deck or improve your content — it works on your actual presentation.",
    targets: ["toolbar-copilot"],
  },
  {
    id: "toolbar-share",
    title: "Export & present",
    body: "Export as PPTX, PDF, HTML, PNG, JPEG, SVG, Markdown or Reveal.js slides. Hit “Present” to deliver fullscreen with all your animations.",
    targets: ["toolbar-share"],
  },
  {
    id: "footer",
    title: "Status bar",
    body: "A quick glance shows your deck name, slide count, theme, view and shortcuts. Click “Tour” here anytime to replay this guide.",
    targets: ["footer"],
  },
  {
    id: "finish",
    title: "You're ready!",
    body: "Double-click text to edit, right-click canvas for context actions, and press Ctrl+K to run any command. Happy presenting with Lumina!",
    icon: <MousePointerClick size={18} className="text-emerald-300" />,
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  return { top, left, width: right - left, height: bottom - top };
}

function measure(targets: string[] | undefined): Rect | null {
  if (!targets || targets.length === 0) return null;
  const rects: Rect[] = [];
  for (const id of targets) {
    const el = document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        rects.push({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    }
  }
  return unionRects(rects);
}

export function EditorTutorial() {
  const { user } = useUser();
  const [active, setActive] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<"below" | "above" | "right" | "left" | "center">("below");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  const finish = useCallback(() => {
    setActive(null);
    setRect(null);
    try {
      localStorage.setItem(scopedKeyFor(STORAGE_KEY, user?.id), "1");
    } catch {}
  }, [user?.id]);

  const start = useCallback(() => {
    const ui = useUIStore.getState();
    ui.setMode("editor");
    ui.setView("normal");
    ui.setShowLeftPanel(true);
    ui.setShowRightPanel(true);
    setActive(0);
  }, []);

  const measureStep = useCallback((index: number) => {
    const step = STEPS[index];
    const found = measure(step.targets);
    setRect(found);
    if (!found) {
      setCardPos("center");
      return;
    }
    const gap = 14;
    const below = found.top + found.height + gap + 180;
    const above = found.top - gap - 180;
    const right = found.left + found.width + gap + 340;
    const left = found.left - gap - 340;
    if (below <= window.innerHeight - 8) setCardPos("below");
    else if (above >= 8) setCardPos("above");
    else if (right <= window.innerWidth - 8) setCardPos("right");
    else if (left >= 8) setCardPos("left");
    else setCardPos("center");
  }, []);

  useEffect(() => {
    if (active === null) return;
    const step = STEPS[active];
    step.action?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      measureStep(active);
    }, 350);
  }, [active, measureStep]);

  useEffect(() => {
    if (active === null) return;
    const onResize = () => measureStep(activeRef.current ?? 0);
    const onScroll = () => measureStep(activeRef.current ?? 0);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active, measureStep]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (activeRef.current === null) return;
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((a) => (a === null ? a : Math.min(a + 1, STEPS.length - 1)));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((a) => (a === null ? a : Math.max(a - 1, 0)));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  useEffect(() => {
    const startEvent = () => start();
    window.addEventListener(START_TOUR_EVENT, startEvent);
    const t = setTimeout(() => {
      if (activeRef.current === null) {
        try {
          const done = localStorage.getItem(scopedKeyFor(STORAGE_KEY, user?.id)) === "1";
          if (!done) start();
        } catch {
          start();
        }
      }
    }, 1200);
    return () => {
      window.removeEventListener(START_TOUR_EVENT, startEvent);
      clearTimeout(t);
    };
  }, [start, user?.id]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (active === null) return null;
  const step = STEPS[active];
  const isLast = active === STEPS.length - 1;

  const cardStyle: React.CSSProperties = (() => {
    if (cardPos === "center") {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    }
    if (!rect) return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    const gap = 14;
    const w = 340;
    if (cardPos === "below") return { left: rect.left + rect.width / 2 - w / 2, top: rect.top + rect.height + gap };
    if (cardPos === "above") return { left: rect.left + rect.width / 2 - w / 2, top: rect.top - gap - 190 };
    if (cardPos === "right") return { left: rect.left + rect.width + gap, top: rect.top };
    return { left: rect.left - gap - w, top: rect.top };
  })();

  return (
    <>
      {rect && (
        <>
          {["top", "bottom", "left", "right"].map((side) => {
            const s = {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            };
            const style: React.CSSProperties =
              side === "top"
                ? { left: 0, top: 0, right: 0, height: Math.max(0, s.top) }
                : side === "bottom"
                  ? { left: 0, top: s.top + s.height, right: 0, bottom: 0 }
                  : side === "left"
                    ? { left: 0, top: Math.max(0, s.top), width: Math.max(0, s.left), height: s.height }
                    : { left: s.left + s.width, top: Math.max(0, s.top), right: 0, height: s.height };
            return (
              <div
                key={side}
                style={{ ...style, position: "fixed", background: "rgba(5,7,14,0.72)", zIndex: 950, pointerEvents: "none" }}
              />
            );
          })}
          <div
            className="pointer-events-none fixed z-[960] rounded-xl border-2 border-indigo-400/90 shadow-[0_0_0_4px_rgba(99,102,241,0.25),0_0_40px_rgba(99,102,241,0.5)] animate-pulse"
            style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          />
        </>
      )}

      <div
        className="fixed z-[1000] w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-[#12141d] p-4 shadow-2xl animate-pop-in"
        style={cardStyle}
        role="dialog"
        aria-label={`Tutorial step ${active + 1} of ${STEPS.length}`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-300">
            {step.icon}
            <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300/80">
              {active + 1} / {STEPS.length}
            </span>
          </div>
          <button
            onClick={finish}
            aria-label="Close tutorial"
            className="cursor-pointer rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
          >
            <X size={14} />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{step.body}</p>

        <div className="mt-3 flex h-1 gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1 flex-1 cursor-pointer rounded-full transition-colors ${i <= active ? "bg-indigo-400" : "bg-white/10"}`}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={finish}
            className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActive((a) => Math.max((a ?? 1) - 1, 0))}
              disabled={active === 0}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/8 disabled:opacity-30"
            >
              <ChevronLeft size={13} /> Back
            </button>
            <button
              onClick={() => (isLast ? finish() : setActive((a) => Math.min((a ?? 0) + 1, STEPS.length - 1)))}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-violet-400"
            >
              {isLast ? "Start creating" : "Next"} <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
