"use client";

import { useState } from "react";
import { Trash2, Copy, Lock, Unlock, RotateCcw, Sparkles, Bold, Italic, Underline, List } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { getTheme } from "@/lib/themes";
import { THEMES } from "@/lib/themes";
import { CHART_TYPES } from "@/lib/charts";
import { Input, Label, SegmentedControl, Slider, ColorField, Divider, Button } from "@/components/ui";
import { ElementType, AnimationType, LayoutType, Slide } from "@/lib/types";
import { BACKGROUNDS, BACKGROUND_CATEGORIES } from "@/lib/backgrounds";
import { rewriteText } from "@/lib/ai/rewrite";
import { buildClient } from "@/lib/ai/provider";
import { useSettingsStore } from "@/stores/settingsStore";
import { toast } from "sonner";

const ANIMATIONS: AnimationType[] = ["fade", "fade-up", "fade-down", "zoom", "zoom-in", "morph", "slide", "slide-up", "slide-left", "slide-right", "scale", "blur", "flip", "parallax", "stagger", "pop", "none"];

export function InspectorPanel() {
  const deck = useDeckStore((s) => s.deck);
  const updateSlide = useDeckStore((s) => s.updateSlide);
  const updateElement = useDeckStore((s) => s.updateElement);
  const deleteElement = useDeckStore((s) => s.deleteElement);
  const duplicateElement = useDeckStore((s) => s.duplicateElement);
  const applyTheme = useDeckStore((s) => s.applyTheme);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const selectedIds = useUIStore((s) => s.selectedElementIds);

  const [tab, setTab] = useState<"slide" | "element" | "theme" | "layout">("element");
  const settings = useSettingsStore();

  if (!deck) return null;
  const slide = deck.slides.find((s) => s.id === activeSlideId);
  if (!slide) return null;

  const el = slide.elements.find((e) => e.id === selectedIds[0]);
  const theme = getTheme(deck.themeId);

  const patchEl = (patch: any) => {
    if (el) updateElement(slide.id, el.id, patch);
  };

  const onRewrite = async (mode: any) => {
    if (!el || !("content" in el)) return;
    const client = buildClient(settings.provider, settings.model, settings.apiKey, settings.baseUrl);
    toast.loading("Rewriting…");
    const out = await rewriteText(String((el as any).content ?? ""), mode, client);
    patchEl({ content: out });
    toast.dismiss();
    toast.success("Rewritten");
  };

  const tabButtons = [
    { id: "element", label: "Element" },
    { id: "slide", label: "Slide" },
    { id: "theme", label: "Theme" },
    { id: "layout", label: "Layout" },
  ] as const;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 p-2">
        <SegmentedControl
          options={tabButtons.map((t) => ({ value: t.id, label: t.label }))}
          value={tab}
          onChange={(v) => setTab(v as any)}
        />
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {tab === "element" && (
          <>
            {!el ? (
              <p className="py-6 text-center text-xs text-slate-500">Select an element to edit its properties</p>
            ) : (
              <ElementInspector el={el} slideId={slide.id} onPatch={patchEl} onDelete={() => deleteElement(slide.id, el.id)} onDuplicate={() => duplicateElement(slide.id, el.id)} onRewrite={onRewrite} />
            )}
          </>
        )}
        {tab === "slide" && (
          <div className="space-y-4">
            <div>
              <Label>Slide title</Label>
              <Input
                value={slide.title}
                onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Background</Label>
              <BackgroundPicker
                currentId={slide.backgroundId}
                current={slide.background}
                currentImage={slide.backgroundImage}
                onApply={(patch) => updateSlide(slide.id, patch)}
                onApplyAll={(patch) => {
                  for (const sl of deck.slides) updateSlide(sl.id, patch);
                }}
                themeDefault={theme.background}
              />
            </div>
            <div>
              <Label>Transition</Label>
              <select
                value={slide.transition ?? "fade"}
                onChange={(e) => updateSlide(slide.id, { transition: e.target.value as any })}
                className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
              >
                {ANIMATIONS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">{a}</option>
                ))}
              </select>
            </div>
            <Divider />
            <div>
              <Label>Speaker notes</Label>
              <textarea
                value={slide.speakerNotes ?? slide.notes ?? ""}
                onChange={(e) => updateSlide(slide.id, { notes: e.target.value, speakerNotes: e.target.value })}
                rows={5}
                className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
                placeholder="Speaker notes for this slide..."
              />
            </div>
          </div>
        )}
        {tab === "theme" && (
          <div className="space-y-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-2 transition-all ${
                  deck.themeId === t.id ? "border-indigo-400/60 bg-indigo-500/10" : "border-white/10 hover:bg-white/5"
                }`}
              >
                <div
                  className="h-8 w-12 shrink-0 rounded-md border border-white/20"
                  style={{ background: t.gradient }}
                />
                <div className="flex-1 text-left">
                  <div className="text-xs font-medium text-slate-200">{t.name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{t.category}</div>
                </div>
                <div className={`h-2 w-2 rounded-full ${t.isDark ? "bg-slate-900 ring-1 ring-white/30" : "bg-white ring-1 ring-black/20"}`} />
              </button>
            ))}
          </div>
        )}
        {tab === "layout" && (
          <LayoutGallery slideId={slide.id} />
        )}
      </div>
    </div>
  );
}

function LayoutGallery({ slideId }: { slideId: string }) {
  const updateSlide = useDeckStore((s) => s.updateSlide);
  const layouts: LayoutType[] = [
    "title", "title-image", "two-columns", "three-columns", "timeline", "comparison",
    "roadmap", "process", "infographic", "metrics", "pie", "bar", "table", "cards",
    "hero", "gallery", "mindmap", "swot", "bmc", "flowchart", "architecture",
    "agenda", "quote", "statistics", "text-image", "video", "code", "references",
    "conclusion", "q-and-a", "facts", "key-takeaways", "section", "blank",
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {layouts.map((l) => (
        <button
          key={l}
          onClick={() => updateSlide(slideId, { layout: l })}
          className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-white/10 p-2 text-[10px] text-slate-400 hover:border-indigo-400/50 hover:bg-white/5 hover:text-slate-200 transition-all"
        >
          <div className="flex h-10 w-full items-center justify-center rounded-md bg-white/[0.04]">
            <div className="flex h-6 w-9 flex-col gap-0.5 rounded-sm border border-indigo-300/40 p-0.5">
              <div className="h-1 rounded-sm bg-indigo-300/60" />
              <div className="h-0.5 w-4/5 rounded-sm bg-indigo-300/30" />
              <div className="h-0.5 w-3/5 rounded-sm bg-indigo-300/30" />
              <div className="h-0.5 w-4/5 rounded-sm bg-indigo-300/30" />
            </div>
          </div>
          {l}
        </button>
      ))}
    </div>
  );
}

function ElementInspector({ el, slideId, onPatch, onDelete, onDuplicate, onRewrite }: {
  el: any;
  slideId: string;
  onPatch: (p: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRewrite: (mode: any) => void;
}) {
  const s = el.style ?? {};

  const text = "content" in el;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate rounded-md bg-white/[0.05] px-2 py-1 text-xs font-medium text-slate-300">
          {el.name || el.type}
        </span>
        <button onClick={onDuplicate} className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" title="Duplicate">
          <Copy size={13} />
        </button>
        <button
          onClick={() => onPatch({ locked: !el.locked })}
          className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          title={el.locked ? "Unlock" : "Lock"}
        >
          {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
        <button onClick={onDelete} className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>X</Label>
          <Input type="number" value={Math.round(el.position.x)} onChange={(e) => onPatch({ position: { ...el.position, x: Number(e.target.value) } })} className="mt-1" />
        </div>
        <div>
          <Label>Y</Label>
          <Input type="number" value={Math.round(el.position.y)} onChange={(e) => onPatch({ position: { ...el.position, y: Number(e.target.value) } })} className="mt-1" />
        </div>
        <div>
          <Label>W</Label>
          <Input type="number" value={Math.round(el.position.width)} onChange={(e) => onPatch({ position: { ...el.position, width: Number(e.target.value) } })} className="mt-1" />
        </div>
        <div>
          <Label>H</Label>
          <Input type="number" value={Math.round(el.position.height)} onChange={(e) => onPatch({ position: { ...el.position, height: Number(e.target.value) } })} className="mt-1" />
        </div>
        <div>
          <Label>Rotation</Label>
          <Input type="number" value={Math.round(el.position.rotation)} onChange={(e) => onPatch({ position: { ...el.position, rotation: Number(e.target.value) } })} className="mt-1" />
        </div>
        <div>
          <Label>Opacity</Label>
          <Slider value={(s.opacity ?? 1) * 100} min={0} max={100} onChange={(v) => onPatch({ style: { ...s, opacity: v / 100 } })} />
        </div>
      </div>

      <Divider />

      <Divider />

      {text && (
        <>
          <div>
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <div className="flex items-center gap-1">
                <button
                  title="Bold"
                  onClick={() => onPatch({ style: { ...s, fontWeight: (s.fontWeight ?? 400) >= 600 ? 400 : 700 } })}
                  className={`rounded p-1 text-xs transition-colors ${
                    (s.fontWeight ?? 400) >= 600 ? "bg-indigo-500/40 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Bold size={12} />
                </button>
                <button
                  title="Italic"
                  onClick={() => onPatch({ style: { ...s, fontStyle: s.fontStyle === "italic" ? "normal" : "italic" } })}
                  className={`rounded p-1 text-xs transition-colors ${
                    s.fontStyle === "italic" ? "bg-indigo-500/40 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Italic size={12} />
                </button>
                <button
                  title="Underline"
                  onClick={() => onPatch({ style: { ...s, textDecoration: s.textDecoration === "underline" ? "none" : "underline" } })}
                  className={`rounded p-1 text-xs transition-colors ${
                    s.textDecoration === "underline" ? "bg-indigo-500/40 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Underline size={12} />
                </button>
                <button
                  title="Toggle Bullets"
                  onClick={() => {
                    const c = String(el.content ?? "");
                    const lines = c.split("\n");
                    const hasBullets = lines.some((l) => l.trim().startsWith("•"));
                    const newContent = lines
                      .map((l) => (hasBullets ? l.replace(/^[•\-*]\s*/, "") : l.trim() ? `•  ${l.replace(/^[•\-*]\s*/, "")}` : l))
                      .join("\n");
                    onPatch({ content: newContent });
                  }}
                  className="rounded p-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <List size={12} />
                </button>
              </div>
            </div>
            <textarea
              value={el.content}
              onChange={(e) => onPatch({ content: e.target.value })}
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
            />
          </div>
          <div>
            <Label>Font size</Label>
            <Slider value={s.fontSize ?? 20} min={8} max={160} onChange={(v) => onPatch({ style: { ...s, fontSize: v } })} />
          </div>
          <div>
            <Label>Font weight</Label>
            <Slider value={s.fontWeight ?? 400} min={100} max={900} step={100} onChange={(v) => onPatch({ style: { ...s, fontWeight: v } })} />
          </div>
          <div>
            <Label>Align</Label>
            <SegmentedControl
              className="mt-1"
              options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }]}
              value={s.textAlign ?? "left"}
              onChange={(v) => onPatch({ style: { ...s, textAlign: v } })}
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-1">
              <ColorField value={s.color ?? "var(--t-text)"} onChange={(v) => onPatch({ style: { ...s, color: v } })} />
            </div>
          </div>
          <Divider />
          <div>
            <Label className="flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-300" /> AI Rewrite
            </Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["improve", "shorter", "longer", "professional", "academic", "marketing", "simple", "creative", "executive-summary", "bullet-points"].map((m) => (
                <button
                  key={m}
                  onClick={() => onRewrite(m)}
                  className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300 hover:border-indigo-400/50 hover:text-indigo-200 transition-colors"
                >
                  {m.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {(el.type === "image" || el.type === "gif") && (
        <div className="space-y-3">
          <div>
            <Label>Image URL</Label>
            <Input value={el.src} onChange={(e) => onPatch({ src: e.target.value })} className="mt-1" />
            <div className="mt-2 flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => onPatch({ src: `https://source.unsplash.com/featured/800x600/?random&sig=${Date.now()}` })}>
                <RotateCcw size={12} /> Regenerate
              </Button>
            </div>
          </div>
          <div>
            <Label>Caption (Editable)</Label>
            <Input
              value={el.caption ?? ""}
              onChange={(e) => onPatch({ caption: e.target.value })}
              placeholder="Add image caption..."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Alt text</Label>
            <Input
              value={el.alt ?? ""}
              onChange={(e) => onPatch({ alt: e.target.value })}
              placeholder="Describe image..."
              className="mt-1"
            />
          </div>
        </div>
      )}

      {el.type === "table" && (
        <TableInspector el={el} onPatch={onPatch} />
      )}

      {el.type === "chart" && (
        <div>
          <Label>Chart type</Label>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {CHART_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => onPatch({ chartType: c.id })}
                className={`cursor-pointer rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
                  el.chartType === c.id ? "border-indigo-400/60 bg-indigo-500/15 text-indigo-100" : "border-white/10 text-slate-400 hover:bg-white/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Divider />
          <Label>Data (label: value)</Label>
          <textarea
            value={(el.data ?? []).map((d: any) => `${d.label}: ${d.value}`).join("\n")}
            onChange={(e) => {
              const data = e.target.value.split("\n").filter(Boolean).map((line) => {
                const [label, value] = line.split(":");
                return { label: (label ?? "").trim(), value: Number(value) || 0 };
              });
              onPatch({ data });
            }}
            rows={6}
            className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-indigo-400/50"
          />
        </div>
      )}

      <Divider />

      <div>
        <Label>Animation</Label>
        <select
          value={el.animation?.type ?? "fade-up"}
          onChange={(e) => onPatch({ animation: { ...(el.animation ?? {}), type: e.target.value } })}
          className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
        >
          {ANIMATIONS.map((a) => (
            <option key={a} value={a} className="bg-slate-900">{a}</option>
          ))}
        </select>
        <div className="mt-2 space-y-2">
          <Slider label="Duration" value={(el.animation?.duration ?? 0.6) * 10} min={2} max={20} onChange={(v) => onPatch({ animation: { ...(el.animation ?? {}), duration: v / 10 } })} />
          <Slider label="Delay" value={(el.animation?.delay ?? 0) * 10} min={0} max={20} onChange={(v) => onPatch({ animation: { ...(el.animation ?? {}), delay: v / 10 } })} />
        </div>
      </div>
    </div>
  );
}

function BackgroundPicker({
  currentId,
  current,
  currentImage,
  onApply,
  onApplyAll,
  themeDefault,
}: {
  currentId?: string;
  current: string;
  currentImage?: string;
  onApply: (patch: Partial<Slide>) => void;
  onApplyAll: (patch: Partial<Slide>) => void;
  themeDefault: string;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const cats = ["all", ...BACKGROUND_CATEGORIES.map((c) => c.id)];
  const list = BACKGROUNDS.filter((b) => {
    if (cat !== "all" && b.category !== cat) return false;
    if (query && !`${b.name} ${b.category}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          defaultValue="#141821"
          onChange={(e) => onApply({ background: e.target.value, backgroundId: undefined, backgroundImage: undefined, backgroundVideo: undefined })}
          title="Custom solid color"
          className="h-8 w-9 shrink-0 cursor-pointer rounded-md border border-white/15 bg-transparent"
        />
        <button
          onClick={() => onApply({ background: themeDefault, backgroundId: undefined, backgroundImage: undefined, backgroundVideo: undefined })}
          className="flex-1 rounded-md border border-white/15 px-2 py-1.5 text-[11px] text-slate-300 hover:bg-white/8"
        >
          Theme default
        </button>
        <button
          onClick={() => {
            const url = prompt("Background image URL");
            if (url) onApply({ backgroundImage: url, backgroundVideo: undefined });
          }}
          className="rounded-md border border-white/15 px-2 py-1.5 text-[11px] text-slate-300 hover:bg-white/8"
        >
          Image…
        </button>
        <button
          onClick={() => onApplyAll({ background: current, backgroundImage: currentImage, backgroundId: currentId })}
          title="Apply current background to all slides"
          className="rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2 py-1.5 text-[11px] text-indigo-200 hover:bg-indigo-500/25"
        >
          All
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search backgrounds…"
        className="h-8 w-full rounded-md border border-white/10 bg-white/[0.05] px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none"
      />
      <div className="flex flex-wrap gap-1">
        {cats.map((c) => {
          const label = c === "all" ? "All" : BACKGROUND_CATEGORIES.find((x) => x.id === c)?.label ?? c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                cat === c ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-100" : "border-white/10 text-slate-400 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {list.slice(0, 60).map((b) => (
          <button
            key={b.id}
            onClick={() => onApply({ background: b.css, backgroundId: b.id, backgroundImage: b.imageUrl, backgroundVideo: b.videoUrl, backgroundAnimated: b.animated, backgroundEffect: b.effect })}
            title={b.name}
            className={`group relative aspect-video cursor-pointer overflow-hidden rounded-md border transition-all ${
              currentId === b.id ? "border-indigo-400/70 ring-1 ring-indigo-400/50" : "border-white/10 hover:border-white/30"
            }`}
          >
            <div className="absolute inset-0" style={{ background: b.css }} />
            <div className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-1 py-0.5 text-left text-[9px] text-white/90">{b.name}</div>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="text-center text-[11px] text-slate-500">No backgrounds match</p>}
      <p className="text-center text-[10px] text-slate-600">{list.length} backgrounds</p>
    </div>
  );
}

function TableInspector({ el, onPatch }: { el: any; onPatch: (p: any) => void }) {
  const headers = el.headers ?? ["Col 1", "Col 2"];
  const cells = el.cells ?? [["A", "B"]];

  const updateHeader = (index: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = val;
    onPatch({ headers: newHeaders });
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const newCells = cells.map((row: string[], rIdx: number) => {
      if (rIdx !== rowIndex) return row;
      const newRow = [...row];
      newRow[colIndex] = val;
      return newRow;
    });
    onPatch({ cells: newCells });
  };

  const addRow = () => {
    const emptyRow = new Array(headers.length).fill("");
    const newCells = [...cells, emptyRow];
    onPatch({ cells: newCells, rows: newCells.length });
  };

  const removeRow = (rowIndex: number) => {
    if (cells.length <= 1) return;
    const newCells = cells.filter((_: any, idx: number) => idx !== rowIndex);
    onPatch({ cells: newCells, rows: newCells.length });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Col ${headers.length + 1}`];
    const newCells = cells.map((row: string[]) => [...row, ""]);
    onPatch({ headers: newHeaders, cells: newCells, cols: newHeaders.length });
  };

  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_: any, idx: number) => idx !== colIndex);
    const newCells = cells.map((row: string[]) => row.filter((_: any, idx: number) => idx !== colIndex));
    onPatch({ headers: newHeaders, cells: newCells, cols: newHeaders.length });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Table Grid (Editable)</Label>
        <div className="flex items-center gap-1">
          <button
            onClick={addRow}
            className="cursor-pointer rounded-md bg-indigo-500/20 px-2 py-1 text-[10px] font-medium text-indigo-200 hover:bg-indigo-500/30"
          >
            + Add Row
          </button>
          <button
            onClick={addColumn}
            className="cursor-pointer rounded-md bg-indigo-500/20 px-2 py-1 text-[10px] font-medium text-indigo-200 hover:bg-indigo-500/30"
          >
            + Add Col
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-2">
        <div>
          <span className="text-[10px] uppercase font-semibold text-indigo-300">Headers</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {headers.map((h: string, ci: number) => (
              <div key={ci} className="flex items-center gap-1 flex-1 min-w-[80px]">
                <Input
                  value={h}
                  onChange={(e) => updateHeader(ci, e.target.value)}
                  className="h-7 px-2 text-xs font-semibold"
                />
                {headers.length > 1 && (
                  <button
                    onClick={() => removeColumn(ci)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 p-0.5"
                    title="Remove column"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Rows & Cells</span>
          <div className="mt-1 space-y-1.5">
            {cells.map((row: string[], ri: number) => (
              <div key={ri} className="flex items-center gap-1">
                <span className="w-4 text-[10px] text-slate-500">{ri + 1}</span>
                <div className="flex flex-1 gap-1">
                  {row.map((cellVal: string, ci: number) => (
                    <Input
                      key={ci}
                      value={cellVal ?? ""}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-7 flex-1 px-2 text-xs"
                    />
                  ))}
                </div>
                {cells.length > 1 && (
                  <button
                    onClick={() => removeRow(ri)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 p-0.5"
                    title="Remove row"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
