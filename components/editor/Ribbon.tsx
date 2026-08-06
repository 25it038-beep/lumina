"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Plus, Copy, Trash2, Undo2, Redo2, Type, ImagePlus, Square, Grid3x3,
  LayoutTemplate, Video, Code2, Star, Circle as CircleIcon, ArrowRight,
  BringToFront, SendToBack, StickyNote, ChevronDown, Sparkles, Share2, Grid,
  Moon, MousePointer,
} from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { THEMES } from "@/lib/themes";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { createBlankSlide } from "@/lib/layouts";
import { AnimationType, ElementStyle, ElementType } from "@/lib/types";

type RibbonTab = "home" | "insert" | "design" | "transitions" | "animations" | "view";

export type EditorView = "normal" | "sorter" | "outline";

interface RibbonProps {
  view: EditorView;
  onViewChange: (v: EditorView) => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onOpenMediaGen?: (mode: "image" | "chart" | "diagram") => void;
}

const ANIMATIONS: AnimationType[] = [
  "fade", "fade-up", "fade-down", "zoom", "zoom-in", "morph", "slide",
  "slide-up", "slide-left", "slide-right", "scale", "blur", "flip",
  "parallax", "stagger", "pop", "spin", "none",
];

const TAB_LIST: { id: RibbonTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "design", label: "Design" },
  { id: "transitions", label: "Transitions" },
  { id: "animations", label: "Animations" },
  { id: "view", label: "View" },
];

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 border-r border-white/10 px-2">
      {children}
      <span className="ml-1 hidden text-[9px] uppercase tracking-wide text-slate-500 xl:block">{label}</span>
    </div>
  );
}

function Btn({ title, onClick, active, children }: { title: string; onClick?: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex min-w-[44px] flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors ${
        active ? "bg-indigo-500/20 text-indigo-100" : "text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export function Ribbon({ view, onViewChange, showNotes, onToggleNotes, showGrid, onToggleGrid, onOpenMediaGen }: RibbonProps) {
  const deck = useDeckStore((s) => s.deck);
  const updateSlide = useDeckStore((s) => s.updateSlide);
  const updateElement = useDeckStore((s) => s.updateElement);
  const addSlide = useDeckStore((s) => s.addSlide);
  const duplicateSlide = useDeckStore((s) => s.duplicateSlide);
  const deleteSlide = useDeckStore((s) => s.deleteSlide);
  const addElement = useDeckStore((s) => s.addElement);
  const applyTheme = useDeckStore((s) => s.applyTheme);
  const ui = useUIStore();
  const [tab, setTab] = useState<RibbonTab>("home");

  if (!deck) return null;
  const slide = deck.slides.find((s) => s.id === ui.activeSlideId);
  const selectedEl = slide?.elements.find((e) => e.id === ui.selectedElementIds[0]);
  const selectedIds = ui.selectedElementIds;

  const base = (extra: Record<string, unknown>) => {
    if (!slide) return;
    const el: any = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: (extra.name as string) ?? "Element",
      type: "text",
      position: { x: 150, y: 160, width: 420, height: 100, rotation: 0 },
      style: {},
      animation: { type: "fade-up", duration: 0.6, delay: 0 },
      locked: false,
      visible: true,
      zIndex: slide.elements.length + 1,
      ...extra,
    };
    addElement(slide.id, el);
    ui.setSelection([el.id]);
  };

  const addTextBlock = () => base({ type: "text", name: "Text", content: "Double-click to edit", style: { fontSize: 28, fontWeight: 600, color: "var(--t-text)" } });
  const addImageBlock = () => base({ type: "image", name: "Image", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", alt: "", objectFit: "cover", style: { borderRadius: 16, shadow: true } });
  const addShapeBlock = (shape: string) => base({ type: "shape", name: shape, shape, style: { fill: "var(--t-primary)", borderRadius: 12 } });
  const addTableBlock = () => base({ type: "table", name: "Table", rows: 4, cols: 3, headers: ["Column 1", "Column 2", "Column 3"], cells: [["A1", "B1", "C1"], ["A2", "B2", "C2"], ["A3", "B3", "C3"]] });
  const addChartBlock = (chartType: string) => base({ type: "chart", name: "Chart", chartType, title: "Data", data: [{ label: "Q1", value: 42 }, { label: "Q2", value: 58 }, { label: "Q3", value: 63 }, { label: "Q4", value: 71 }], datasets: [], axisLabels: { x: "", y: "" }, legend: false, animateChart: true });
  const addMediaBlock = (type: ElementType) => base({
    type,
    name: type,
    ...(type === "video" ? { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", autoplay: false, loop: false }
      : type === "code" ? { code: "def hello():\n    print('Hello')", language: "python" }
      : type === "button" ? { label: "Button", href: "" }
      : {}),
  });

  const addNewSlide = () => addSlide(createBlankSlide(`Slide ${deck.slides.length + 1}`));

  const patchSelectedStyle = (stylePatch: Partial<ElementStyle>) => {
    if (slide && selectedEl) updateElement(slide.id, selectedEl.id, { style: { ...(selectedEl.style ?? {}), ...stylePatch } as ElementStyle });
  };
  const applyTransition = (t: AnimationType) => {
    if (slide) updateSlide(slide.id, { transition: t });
  };
  const applyAnimation = (type: AnimationType) => {
    if (slide && selectedEl) updateElement(slide.id, selectedEl.id, {
      animation: { ...(selectedEl.animation ?? { type: "fade-up" as AnimationType, duration: 0.6, delay: 0 }), type },
    });
  };
  const reorder = (dir: "forward" | "backward" | "front" | "back") => {
    if (slide) for (const id of selectedIds) useDeckStore.getState().reorderElement(slide.id, id, dir);
  };

  const setSlideBackground = (bgId: string) => {
    if (!slide) return;
    const bg = BACKGROUNDS.find((b) => b.id === bgId);
    updateSlide(slide.id, {
      backgroundId: bg?.id,
      background: bg?.css,
      backgroundImage: bg?.imageUrl,
      backgroundVideo: bg?.videoUrl,
      backgroundAnimated: bg?.animated,
      backgroundEffect: bg?.effect,
    });
  };

  return (
    <div className="shrink-0 border-b border-white/10 bg-[#14172b]">
      {/* Tab strip */}
      <div data-tour="ribbon-tabs" className="flex h-9 items-center gap-0.5 px-1">
        {TAB_LIST.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5">
          <Share2 size={13} /> Share
        </button>
      </div>

      {/* Ribbon body */}
      <div data-tour="ribbon-body" className="flex items-start gap-1 overflow-x-auto px-3 pb-2 pt-1">
        {tab === "home" && (
          <>
            <Group label="Clipboard">
              <Btn title="Undo (Ctrl+Z)" onClick={() => useDeckStore.getState().undo()}><Undo2 size={16} /><span>Undo</span></Btn>
              <Btn title="Redo (Ctrl+Y)" onClick={() => useDeckStore.getState().redo()}><Redo2 size={16} /><span>Redo</span></Btn>
            </Group>
            <Group label="Slides">
              <Btn title="New slide" onClick={addNewSlide}><Plus size={16} /><span>New</span></Btn>
              <Btn title="Duplicate slide" onClick={() => ui.activeSlideId && duplicateSlide(ui.activeSlideId)}><Copy size={16} /><span>Duplicate</span></Btn>
              <Btn title="Delete slide" onClick={() => ui.activeSlideId && deleteSlide(ui.activeSlideId)}><Trash2 size={16} /><span>Delete</span></Btn>
            </Group>
            <Group label="Text">
              <Btn title="Text box" onClick={addTextBlock}><Type size={16} /><span>Text</span></Btn>
              <Btn title="Bold" active={(selectedEl?.style as any)?.fontWeight >= 600} onClick={() => patchSelectedStyle({ fontWeight: ((selectedEl?.style as any)?.fontWeight ?? 400) >= 600 ? 400 : 700 })}><Bold size={16} /></Btn>
              <Btn title="Italic" active={(selectedEl?.style as any)?.fontStyle === "italic"} onClick={() => patchSelectedStyle({ fontStyle: (selectedEl?.style as any)?.fontStyle === "italic" ? "normal" : "italic" })}><Italic size={16} /></Btn>
              <Btn title="Underline" active={(selectedEl?.style as any)?.textDecoration === "underline"} onClick={() => patchSelectedStyle({ textDecoration: (selectedEl?.style as any)?.textDecoration === "underline" ? "none" : "underline" })}><Underline size={16} /></Btn>
            </Group>
            <Group label="Paragraph">
              <Btn title="Align left" active={(selectedEl?.style as any)?.textAlign === "left"} onClick={() => patchSelectedStyle({ textAlign: "left" })}><AlignLeft size={16} /></Btn>
              <Btn title="Align center" active={(selectedEl?.style as any)?.textAlign === "center"} onClick={() => patchSelectedStyle({ textAlign: "center" })}><AlignCenter size={16} /></Btn>
              <Btn title="Align right" active={(selectedEl?.style as any)?.textAlign === "right"} onClick={() => patchSelectedStyle({ textAlign: "right" })}><AlignRight size={16} /></Btn>
            </Group>
            <Group label="Arrange">
              <Btn title="Bring to front" onClick={() => reorder("front")}><BringToFront size={16} /><span>Front</span></Btn>
              <Btn title="Send to back" onClick={() => reorder("back")}><SendToBack size={16} /><span>Back</span></Btn>
            </Group>
          </>
        )}

        {tab === "insert" && (
          <>
            <Group label="Illustrations">
              <Btn title="Text box" onClick={addTextBlock}><Type size={16} /><span>Text</span></Btn>
              <Btn title="Image" onClick={addImageBlock}><ImagePlus size={16} /><span>Image</span></Btn>
              <Btn title="Rectangle" onClick={() => addShapeBlock("rect")}><Square size={16} /><span>Rect</span></Btn>
              <Btn title="Circle" onClick={() => addShapeBlock("circle")}><CircleIcon size={16} /><span>Circle</span></Btn>
              <Btn title="Arrow" onClick={() => addShapeBlock("arrow")}><ArrowRight size={16} /><span>Arrow</span></Btn>
              <Btn title="Star" onClick={() => addShapeBlock("star")}><Star size={16} /><span>Star</span></Btn>
            </Group>
            <Group label="Data">
              <Btn title="Table" onClick={addTableBlock}><Grid3x3 size={16} /><span>Table</span></Btn>
              <Btn title="Chart" onClick={() => addChartBlock("bar")}><LayoutTemplate size={16} /><span>Chart</span></Btn>
            </Group>
            <Group label="Media">
              <Btn title="Video" onClick={() => addMediaBlock("video")}><Video size={16} /><span>Video</span></Btn>
              <Btn title="Code" onClick={() => addMediaBlock("code")}><Code2 size={16} /><span>Code</span></Btn>
              <Btn title="Button" onClick={() => addMediaBlock("button")}><MousePointer size={16} /><span>Button</span></Btn>
            </Group>
            {onOpenMediaGen && (
              <Group label="AI Media">
                <Btn title="AI Image" onClick={() => onOpenMediaGen("image")}><ImagePlus size={16} /><span>AI Image</span></Btn>
                <Btn title="AI Diagram" onClick={() => onOpenMediaGen("diagram")}><LayoutTemplate size={16} /><span>AI Diagram</span></Btn>
              </Group>
            )}
          </>
        )}

        {tab === "design" && (
          <>
            <Group label="Theme">
              <select
                value={deck.themeId}
                onChange={(e) => applyTheme(e.target.value)}
                className="h-8 w-48 cursor-pointer rounded-md border border-white/10 bg-white/[0.06] px-2 text-xs text-slate-200 focus:outline-none"
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                ))}
              </select>
            </Group>
            <Group label="Background">
              <select
                value={slide?.backgroundId ?? ""}
                onChange={(e) => setSlideBackground(e.target.value)}
                className="h-8 w-44 cursor-pointer rounded-md border border-white/10 bg-white/[0.06] px-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="" className="bg-slate-900">Theme default</option>
                {BACKGROUNDS.slice(0, 60).map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>
                ))}
              </select>
            </Group>
            <Group label="Grid">
              <Btn title="Toggle gridlines" active={showGrid} onClick={onToggleGrid}><Grid3x3 size={16} /><span>Grid</span></Btn>
            </Group>
          </>
        )}

        {tab === "transitions" && (
          <Group label="Transitions">
            {ANIMATIONS.map((a) => (
              <Btn key={a} title={a} active={slide?.transition === a} onClick={() => applyTransition(a)}>
                <ChevronDown size={14} /><span>{a.replace(/-/g, " ")}</span>
              </Btn>
            ))}
          </Group>
        )}

        {tab === "animations" && (
          <>
            <Group label="Animation">
              {ANIMATIONS.map((a) => (
                <Btn key={a} title={a} active={selectedEl?.animation?.type === a} onClick={() => applyAnimation(a)}>
                  <ChevronDown size={14} />
                  <span>{a.replace(/-/g, " ")}</span>
                </Btn>
              ))}
            </Group>
            {selectedEl && (
              <Group label="Clear">
                <Btn title="No animation" active={!selectedEl.animation || selectedEl.animation.type === "none"} onClick={() => applyAnimation("none")}>
                  <Moon size={16} /><span>None</span>
                </Btn>
              </Group>
            )}
          </>
        )}

        {tab === "view" && (
          <>
            <Group label="Presentation Views">
              <Btn title="Normal" active={view === "normal"} onClick={() => onViewChange("normal")}><Grid size={16} /><span>Normal</span></Btn>
              <Btn title="Slide Sorter" active={view === "sorter"} onClick={() => onViewChange("sorter")}><Grid3x3 size={16} /><span>Sorter</span></Btn>
              <Btn title="Outline" active={view === "outline"} onClick={() => onViewChange("outline")}><Type size={16} /><span>Outline</span></Btn>
            </Group>
            <Group label="Show">
              <Btn title="Notes" active={showNotes} onClick={onToggleNotes}><StickyNote size={16} /><span>Notes</span></Btn>
              <Btn title="Gridlines" active={showGrid} onClick={onToggleGrid}><Grid3x3 size={16} /><span>Grid</span></Btn>
            </Group>
            <Group label="Zoom">
              <Btn title="Zoom out" onClick={() => ui.setZoom(ui.zoom - 0.1)}><span className="text-lg">−</span><span>{Math.round(ui.zoom * 100)}%</span></Btn>
              <Btn title="Zoom in" onClick={() => ui.setZoom(ui.zoom + 0.1)}><span className="text-lg">+</span></Btn>
              <Btn title="Fit" onClick={() => ui.setZoom(1)}><span>Fit</span></Btn>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}