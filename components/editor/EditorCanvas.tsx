"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Trash2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { SlidePreview, SLIDE_WIDTH, SLIDE_HEIGHT } from "@/components/SlidePreview";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { SlideElement } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { fixColor } from "@/lib/export/slideRenderer";

type DragMode = "move" | "resize" | "rotate" | null;

interface DragState {
  mode: DragMode;
  elementId: string;
  startX: number;
  startY: number;
  original: { x: number; y: number; width: number; height: number; rotation: number };
  handle?: string;
}

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

const TEXT_TYPES = ["text", "heading", "subtitle"];
const EDITABLE_TYPES = [
  "text", "heading", "subtitle", "code", "button", "formula", "qr",
  "image", "gif", "video", "embed", "audio", "icon",
  "chart", "table", "timeline", "roadmap", "mindmap", "flowchart",
  "mermaid", "architecture", "swot", "bmc", "svg",
];
const MONO_TYPES = ["code", "chart", "table", "svg", "timeline", "roadmap", "mindmap", "flowchart", "mermaid", "architecture", "swot", "bmc"];

const getEditableContent = (el: SlideElement): string => {
  switch (el.type) {
    case "code":
      return el.code ?? "";
    case "button":
      return el.label ?? "";
    case "formula":
      return el.latex ?? "";
    case "qr":
      return el.url ?? "";
    case "image":
    case "gif":
      return el.caption ?? el.alt ?? el.src ?? "";
    case "video":
      return el.src ?? "";
    case "embed":
    case "audio":
      return (el as any).url ?? (el as any).src ?? "";
    case "icon":
      return el.icon ?? "";
    case "chart": {
      const lines = [el.title?.trim() ? `# ${el.title}` : ""];
      for (const d of el.data ?? []) lines.push(`${d.label}: ${d.value}`);
      return lines.filter(Boolean).join("\n");
    }
    case "table": {
      const lines = [(el.headers ?? []).join(", ")];
      for (const row of el.cells ?? []) lines.push(row.join(", "));
      return lines.join("\n");
    }
    case "timeline":
    case "roadmap":
    case "mindmap":
    case "flowchart":
    case "mermaid":
    case "architecture":
    case "swot":
    case "bmc":
      return (el.nodes ?? []).map((n) => n.label ?? "").join("\n");
    case "svg":
      return el.svg ?? "";
    default:
      return (el as any).content ?? (el as any).label ?? "";
  }
};

const setEditableContent = (el: SlideElement, value: string): Record<string, unknown> => {
  switch (el.type) {
    case "code":
      return { code: value };
    case "button":
      return { label: value };
    case "formula":
      return { latex: value };
    case "qr":
      return { url: value.trim() };
    case "image":
    case "gif":
      return { caption: value };
    case "video":
      return { src: value.trim() };
    case "embed":
    case "audio":
      return { url: value.trim() };
    case "icon":
      return { icon: value.trim() };
    case "chart": {
      let title = el.title ?? "";
      const data: { label: string; value: number }[] = [];
      for (const line of value.split("\n")) {
        const l = line.trim();
        if (!l) continue;
        if (l.startsWith("#")) {
          title = l.slice(1).trim();
          continue;
        }
        const idx = l.lastIndexOf(":");
        if (idx > 0) {
          const label = l.slice(0, idx).trim();
          const num = Number(l.slice(idx + 1).trim());
          if (label && !Number.isNaN(num)) data.push({ label, value: num });
        }
      }
      return { title, data };
    }
    case "table": {
      const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
      const headers = lines[0] ? lines[0].split(",").map((s) => s.trim()) : [];
      const cells = lines.slice(1).map((l) => l.split(",").map((s) => s.trim()));
      return {
        headers,
        cells,
        cols: Math.max(headers.length, ...cells.map((r) => r.length), 1),
        rows: cells.length,
      };
    }
    case "timeline":
    case "roadmap":
    case "mindmap":
    case "flowchart":
    case "mermaid":
    case "architecture":
    case "swot":
    case "bmc": {
      const existing = el.nodes ?? [];
      const nodes = value
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((label, i) => ({
          ...(existing[i] ?? {}),
          id: existing[i]?.id ?? `n${i}`,
          label,
        }));
      return { nodes };
    }
    case "svg":
      return { svg: value };
    default:
      return { content: value };
  }
};

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 44, 52, 64, 80];
const FONTS = ["Inter", "Sora", "Space Grotesk", "Playfair Display", "JetBrains Mono", "Georgia"];

export function EditorCanvas({ showGrid = false }: { showGrid?: boolean }) {
  const deck = useDeckStore((s) => s.deck);
  const updateElement = useDeckStore((s) => s.updateElement);
  const deleteElement = useDeckStore((s) => s.deleteElement);
  const addElement = useDeckStore((s) => s.addElement);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);
  const setSelection = useUIStore((s) => s.setSelection);
  const selectedElementIds = useUIStore((s) => s.selectedElementIds);
  const zoom = useUIStore((s) => s.zoom);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const [snapTo, setSnapTo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const slide = deck?.slides.find((s) => s.id === activeSlideId) ?? null;

  useEffect(() => {
    if (deck && !activeSlideId && deck.slides.length) {
      setActiveSlide(deck.slides[0].id);
    }
  }, [deck?.id]);

  useEffect(() => {
    setEditingId(null);
    setDrag(null);
  }, [activeSlideId, deck?.id]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, elId: string) => {
      const el = slide?.elements.find((x) => x.id === elId);
      if (!el) return;
      setSelection([elId]);
      setEditingId(null);
      setDrag({
        mode: "move",
        elementId: elId,
        startX: e.clientX,
        startY: e.clientY,
        original: { ...el.position },
      });
    },
    [slide, setSelection]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, elId: string, handle: string) => {
      e.stopPropagation();
      e.preventDefault();
      const el = slide?.elements.find((x) => x.id === elId);
      if (!el) return;
      setDrag({
        mode: "resize",
        elementId: elId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        original: { ...el.position },
      });
    },
    [slide]
  );

  const rotatePointerDown = useCallback(
    (e: React.PointerEvent, elId: string) => {
      e.stopPropagation();
      e.preventDefault();
      const el = slide?.elements.find((x) => x.id === elId);
      if (!el) return;
      setDrag({
        mode: "rotate",
        elementId: elId,
        startX: e.clientX,
        startY: e.clientY,
        original: { ...el.position },
      });
    },
    [slide]
  );

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || !slide) return;
      const dx = (e.clientX - d.startX) / zoom;
      const dy = (e.clientY - d.startY) / zoom;
      const snap = (v: number) => (snapTo ? Math.round(v / 8) * 8 : v);

      if (d.mode === "move") {
        updateElement(slide.id, d.elementId, {
          position: {
            ...d.original,
            x: snap(d.original.x + dx),
            y: snap(d.original.y + dy),
          },
        });
      } else if (d.mode === "resize") {
        const o = d.original;
        let { x, y, width, height } = o;
        const min = 16;
        const h = d.handle!;
        if (h.includes("e")) width = Math.max(min, o.width + dx);
        if (h.includes("w")) {
          width = Math.max(min, o.width - dx);
          x = snap(o.x + o.width - width);
        }
        if (h.includes("s")) height = Math.max(min, o.height + dy);
        if (h.includes("n")) {
          height = Math.max(min, o.height - dy);
          y = snap(o.y + o.height - height);
        }
        updateElement(slide.id, d.elementId, { position: { x, y, width, height, rotation: o.rotation } });
      } else if (d.mode === "rotate") {
        const o = d.original;
        const cx = o.x + o.width / 2;
        const cy = o.y + o.height / 2;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const origAngle = o.rotation;
        const initial = (Math.atan2(0, 1) * 180) / Math.PI;
        updateElement(slide.id, d.elementId, {
          position: { ...o, rotation: Math.round(origAngle + angle - initial + 90) },
        });
      }
    },
    [slide, zoom, updateElement, snapTo]
  );

  const endDrag = useCallback(() => {
    setDrag(null);
  }, []);

  const addTextElement = () => {
    if (!slide) return;
    const el: SlideElement = {
      id: `el-${Date.now()}`,
      type: "text",
      content: "Double-click to edit text",
      name: "Text",
      position: { x: 200, y: 300, width: 400, height: 80, rotation: 0 },
      style: { fontSize: 28, fontWeight: 600, color: "var(--t-text)" },
      animation: { type: "fade-up", duration: 0.6, delay: 0 },
      locked: false,
      visible: true,
      zIndex: slide.elements.length + 1,
    };
    addElement(slide.id, el);
    setSelection([el.id]);
    setEditingId(el.id);
  };

  const onElementDoubleClick = useCallback((id: string) => {
    const st = useDeckStore.getState();
    const ui = useUIStore.getState();
    const sl = st.deck?.slides.find((s) => s.id === ui.activeSlideId);
    const el = sl?.elements.find((x) => x.id === id);
    if (el && EDITABLE_TYPES.includes(el.type)) {
      setEditingId(id);
    }
  }, []);

  if (!deck || !slide) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-500">
        <div className="skeleton h-40 w-72 rounded-2xl" />
        <p className="text-sm">No slide selected</p>
      </div>
    );
  }

  const selected = slide.elements.filter((e) => selectedElementIds.includes(e.id));
  const editingEl =
    (slide.elements.find(
      (e) => e.id === editingId && EDITABLE_TYPES.includes(e.type)
    ) as (SlideElement & { type: string }) | null) ?? null;
  const activeTextEl =
    (editingEl && TEXT_TYPES.includes(editingEl.type) && editingEl) ||
    (selected.length === 1 && TEXT_TYPES.includes(selected[0].type) ? selected[0] : null);

  const patchStyle = (patch: Record<string, unknown>) => {
    if (!activeTextEl) return;
    updateElement(slide.id, activeTextEl.id, { style: { ...activeTextEl.style, ...patch } });
  };

  const theme = getTheme(deck.themeId);
  const editingStyle = editingEl ? (editingEl.style as any) : null;

  return (
    <div
      className="dot-grid relative h-full w-full overflow-hidden"
      style={{ touchAction: "none" }}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).dataset?.elId === undefined && slide && editingId === null) {
          addTextElement();
        }
      }}
    >
      {showGrid && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}
      <div
        className="absolute left-1/2 top-1/2"
        style={{ transform: `translate(-50%, -50%) scale(${zoom})` }}
      >
        <div
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            position: "relative",
            userSelect: "none",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <SlidePreview
            slide={slide}
            deck={deck}
            interactive
            scale={1}
            selectedIds={selectedElementIds}
            onSelectElement={(id) => setSelection([id])}
            onElementPointerDown={onPointerDown}
            onElementDoubleClick={onElementDoubleClick}
          />
          {editingEl && editingStyle && (
            <textarea
              autoFocus
              value={getEditableContent(editingEl)}
              onChange={(e) => updateElement(slide.id, editingEl.id, setEditableContent(editingEl, e.target.value))}
              onFocus={(e) => e.target.select()}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
                  (e.target as HTMLTextAreaElement).blur();
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey && editingEl.type !== "code" && editingEl.type !== "table") {
                  const ta = e.currentTarget;
                  const start = ta.selectionStart;
                  const val = ta.value;
                  const lineStart = val.lastIndexOf("\n", start - 1) + 1;
                  const currentLine = val.slice(lineStart, start);
                  if (currentLine.trim().startsWith("•")) {
                    e.preventDefault();
                    if (currentLine.trim() === "•" || currentLine.trim() === "• ") {
                      const newVal = val.slice(0, lineStart) + val.slice(start);
                      updateElement(slide.id, editingEl.id, setEditableContent(editingEl, newVal));
                    } else {
                      const newVal = val.slice(0, start) + "\n•  " + val.slice(start);
                      updateElement(slide.id, editingEl.id, setEditableContent(editingEl, newVal));
                    }
                  }
                }
              }}
              style={{
                position: "absolute",
                left: editingEl.position.x,
                top: editingEl.position.y,
                width: editingEl.position.width,
                height: editingEl.position.height,
                transform: `rotate(${editingEl.position.rotation}deg)`,
                transformOrigin: "center",
                zIndex: 150,
                background: "rgba(99,102,241,0.06)",
                outline: "2px dashed rgba(99,102,241,0.7)",
                borderRadius: 2,
                border: "none",
                resize: "none",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: 0,
                margin: 0,
                userSelect: "text",
                cursor: "text",
                color: fixColor(editingStyle.color) || fixColor(theme.text),
                fontSize: MONO_TYPES.includes(editingEl.type) ? (editingStyle.fontSize ?? 14) : (editingStyle.fontSize ?? 20),
                fontFamily:
                  editingStyle.fontFamily ||
                  (MONO_TYPES.includes(editingEl.type)
                    ? "JetBrains Mono, monospace"
                    : editingEl.type === "heading" || editingEl.type === "subtitle"
                      ? theme.headingFont
                      : theme.bodyFont),
                fontWeight: editingStyle.fontWeight ?? 400,
                lineHeight: editingStyle.lineHeight ?? 1.5,
                textAlign: editingStyle.textAlign ?? "left",
                fontStyle: editingStyle.fontStyle ?? "normal",
                textDecoration: editingStyle.textDecoration ?? "none",
              }}
            />
          )}
          {selected
            .filter((el) => el.id !== editingId)
            .map((el) => (
              <SelectionOverlay
                key={el.id}
                el={el}
                zoom={1}
                onHandleDown={(e, handle) => handlePointerDown(e, el.id, handle)}
                onRotateDown={(e) => rotatePointerDown(e, el.id)}
              />
            ))}
          <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white/80">
            {slide.elements.length} elements
          </div>
        </div>
      </div>

      {/* Floating text format toolbar */}
      {activeTextEl && (
        <div className="absolute left-1/2 top-3 z-[200] flex -translate-x-1/2 items-center gap-1 rounded-xl glass-strong px-2 py-1.5 text-xs text-slate-200 shadow-2xl animate-scale-in">
          {!editingEl && (
            <button
              title="Edit text (or double-click the text on the slide)"
              onClick={() => setEditingId(activeTextEl.id)}
              className="mr-0.5 flex cursor-pointer items-center gap-1 rounded-md bg-indigo-500/30 px-2 py-1.5 font-medium text-indigo-200 hover:bg-indigo-500/50 hover:text-white"
            >
              <Pencil size={12} />
              Edit
            </button>
          )}
          <div className="flex items-center gap-0.5">
            <button
              title="Decrease size"
              onClick={() => patchStyle({ fontSize: Math.max(8, ((activeTextEl.style as any)?.fontSize ?? 20) - 2) })}
              className="cursor-pointer rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={13} />
            </button>
            <select
              value={(activeTextEl.style as any)?.fontSize ?? 20}
              onChange={(e) => patchStyle({ fontSize: Number(e.target.value) })}
              className="h-7 w-16 cursor-pointer rounded-md border border-white/10 bg-white/[0.06] px-1 text-center text-xs text-slate-200 focus:outline-none"
              title="Font size"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s}
                </option>
              ))}
            </select>
            <button
              title="Increase size"
              onClick={() => patchStyle({ fontSize: Math.min(200, ((activeTextEl.style as any)?.fontSize ?? 20) + 2) })}
              className="cursor-pointer rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronUp size={13} />
            </button>
          </div>

          <span className="mx-0.5 h-5 w-px bg-white/10" />

          <button
            title="Bold"
            onClick={() =>
              patchStyle({ fontWeight: ((activeTextEl.style as any)?.fontWeight ?? 400) >= 600 ? 400 : 700 })
            }
            className={`cursor-pointer rounded-md p-1.5 transition-colors ${
              ((activeTextEl.style as any)?.fontWeight ?? 400) >= 600 ? "bg-indigo-500/40 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bold size={13} />
          </button>
          <button
            title="Italic"
            onClick={() => patchStyle({ fontStyle: (activeTextEl.style as any)?.fontStyle === "italic" ? "normal" : "italic" })}
            className={`cursor-pointer rounded-md p-1.5 transition-colors ${
              (activeTextEl.style as any)?.fontStyle === "italic" ? "bg-indigo-500/40 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Italic size={13} />
          </button>
          <button
            title="Underline"
            onClick={() => patchStyle({ textDecoration: (activeTextEl.style as any)?.textDecoration === "underline" ? "none" : "underline" })}
            className={`cursor-pointer rounded-md p-1.5 transition-colors ${
              (activeTextEl.style as any)?.textDecoration === "underline" ? "bg-indigo-500/40 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Underline size={13} />
          </button>
          <button
            title="Toggle Bullet Points"
            onClick={() => {
              if ("content" in activeTextEl) {
                const c = String((activeTextEl as any).content ?? "");
                const lines = c.split("\n");
                const hasBullets = lines.some((l) => l.trim().startsWith("•"));
                const newContent = lines
                  .map((l) => (hasBullets ? l.replace(/^[•\-*]\s*/, "") : l.trim() ? `•  ${l.replace(/^[•\-*]\s*/, "")}` : l))
                  .join("\n");
                updateElement(slide.id, activeTextEl.id, { content: newContent });
              }
            }}
            className="cursor-pointer rounded-md p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <List size={13} />
          </button>

          <span className="mx-0.5 h-5 w-px bg-white/10" />

          <div className="relative h-6 w-7 overflow-hidden rounded-md border border-white/15 bg-white/[0.06]">
            <input
              type="color"
              value={(() => {
                const c = (activeTextEl.style as any)?.color;
                return c && c.startsWith("#") ? c : "#ffffff";
              })()}
              onChange={(e) => patchStyle({ color: e.target.value })}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              title="Text color"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  fixColor((activeTextEl.style as any)?.color) || fixColor(theme.text),
              }}
            />
          </div>

          <span className="mx-0.5 h-5 w-px bg-white/10" />

          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              title={`Align ${a}`}
              onClick={() => patchStyle({ textAlign: a })}
              className={`cursor-pointer rounded-md p-1.5 transition-colors ${
                ((activeTextEl.style as any)?.textAlign ?? "left") === a ? "bg-indigo-500/40 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {a === "left" ? <AlignLeft size={13} /> : a === "center" ? <AlignCenter size={13} /> : <AlignRight size={13} />}
            </button>
          ))}

          <span className="mx-0.5 h-5 w-px bg-white/10" />

          <select
            value={(activeTextEl.style as any)?.fontFamily || ""}
            onChange={(e) => patchStyle({ fontFamily: e.target.value })}
            className="h-7 max-w-[110px] cursor-pointer rounded-md border border-white/10 bg-white/[0.06] px-1 text-[11px] text-slate-200 focus:outline-none"
            title="Font family"
          >
            <option value="" className="bg-slate-900">Auto</option>
            {FONTS.map((f) => (
              <option key={f} value={f} className="bg-slate-900">
                {f}
              </option>
            ))}
          </select>

          <span className="mx-0.5 h-5 w-px bg-white/10" />

          <button
            title="Delete element"
            onClick={() => {
              deleteElement(slide.id, activeTextEl.id);
              setSelection([]);
              setEditingId(null);
            }}
            className="cursor-pointer rounded-md p-1.5 text-slate-300 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl glass-strong px-1 py-1 text-xs text-slate-300">
        <button className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white/10" onClick={() => useUIStore.getState().setZoom(zoom - 0.1)}>−</button>
        <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <button className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white/10" onClick={() => useUIStore.getState().setZoom(zoom + 0.1)}>+</button>
        <button className="cursor-pointer rounded-lg px-2 py-1 hover:bg-white/10" onClick={() => useUIStore.getState().setZoom(1)}>Fit</button>
        <button
          className={`cursor-pointer rounded-lg px-2 py-1 ${snapTo ? "bg-indigo-500/40 text-indigo-100" : "hover:bg-white/10"}`}
          onClick={() => setSnapTo(!snapTo)}
          title="Snap to grid"
        >
          ⧉
        </button>
      </div>
    </div>
  );
}

function SelectionOverlay({
  el,
  zoom,
  onHandleDown,
  onRotateDown,
}: {
  el: SlideElement;
  zoom: number;
  onHandleDown: (e: React.PointerEvent, handle: string) => void;
  onRotateDown: (e: React.PointerEvent) => void;
}) {
  const { x, y, width, height, rotation } = el.position;
  const hs = 10;
  const handlePos: Record<string, [number, number]> = {
    nw: [0, 0], n: [width / 2, 0], ne: [width, 0],
    e: [width, height / 2], se: [width, height], s: [width / 2, height],
    sw: [0, height], w: [0, height / 2],
  };
  const cursors: Record<string, string> = {
    nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize",
    e: "ew-resize", se: "nwse-resize", s: "ns-resize",
    sw: "nesw-resize", w: "ew-resize",
  };

  return (
    <div
      className="pointer-events-none absolute z-[100]"
      style={{
        left: x - hs / 2,
        top: y - hs / 2,
        width: width + hs,
        height: height + hs,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${width / 2 + hs / 2}px ${height / 2 + hs / 2}px`,
      }}
    >
      <div
        className="pointer-events-auto absolute"
        style={{
          left: hs / 2,
          top: hs / 2,
          right: hs / 2,
          bottom: hs / 2,
          border: "2px solid #6366f1",
          borderRadius: 2,
        }}
      />
      <div
        onPointerDown={(e) => onRotateDown(e)}
        className="pointer-events-auto rotate-handle"
        style={{ left: width / 2 - 6, top: -34, transform: "rotate(45deg)" }}
        title="Rotate"
      />
      {HANDLES.map((h) => {
        const [hx, hy] = handlePos[h];
        return (
          <div
            key={h}
            onPointerDown={(e) => onHandleDown(e, h)}
            className="resize-handle pointer-events-auto"
            style={{ left: hx - hs / 2, top: hy - hs / 2, cursor: cursors[h] }}
          />
        );
      })}
    </div>
  );
}