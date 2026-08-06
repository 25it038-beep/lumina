"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, FileText, Play, Download, Plus, Copy, Trash2, Layers,
  Palette, Search, Settings, Eye, EyeOff, PanelLeft, PanelRight, Moon, Sun,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useDeckStore } from "@/stores/deckStore";
import { createBlankSlide } from "@/lib/layouts";
import { exportDeck } from "@/lib/export";
import { toast } from "sonner";

import { SLASH_COMMANDS } from "@/lib/ai/slashCommands";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPalette);
  const ui = useUIStore();
  const deck = useDeckStore();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const slide = deck.deck?.slides.find((s) => s.id === ui.activeSlideId);
    const el = slide?.elements.find((e) => e.id === ui.selectedElementIds[0]);

    const slashCmds: Command[] = SLASH_COMMANDS.map((sc) => ({
      id: sc.command,
      label: `${sc.command} — ${sc.label}`,
      hint: sc.category,
      group: "Slash Commands",
      icon: <Sparkles size={14} className="text-indigo-400" />,
      run: () => {
        setOpen(false);
        toast.success(`Executed AI Command ${sc.command}`);
        ui.setAIAssistant(true);
      },
    }));

    return [
      ...slashCmds,
      { id: "ai", label: "Open AI Assistant", hint: "Ctrl+/", group: "AI", icon: <Sparkles size={14} />, run: () => { setOpen(false); ui.setAIAssistant(true); } },
      { id: "present", label: "Start Presentation", hint: "Shift+Space", group: "View", icon: <Play size={14} />, run: () => { setOpen(false); ui.setMode("present"); } },
      { id: "export", label: "Export as PowerPoint", group: "File", icon: <Download size={14} />, run: () => { setOpen(false); deck.deck && exportDeck(deck.deck, "pptx"); } },
      { id: "export-pdf", label: "Export as PDF", group: "File", icon: <Download size={14} />, run: () => { setOpen(false); deck.deck && exportDeck(deck.deck, "pdf"); } },
      { id: "export-md", label: "Export as Markdown", group: "File", icon: <FileText size={14} />, run: () => { setOpen(false); deck.deck && exportDeck(deck.deck, "markdown"); } },
      { id: "new-slide", label: "Add Slide", group: "Edit", icon: <Plus size={14} />, run: () => { setOpen(false); deck.deck && deck.addSlide(createBlankSlide(`Slide ${deck.deck.slides.length + 1}`)); } },
      { id: "dup-slide", label: "Duplicate Slide", group: "Edit", icon: <Copy size={14} />, run: () => { setOpen(false); ui.activeSlideId && deck.duplicateSlide(ui.activeSlideId); } },
      { id: "del-slide", label: "Delete Slide", group: "Edit", icon: <Trash2 size={14} />, run: () => { setOpen(false); ui.activeSlideId && deck.deleteSlide(ui.activeSlideId); } },
      { id: "dup-el", label: "Duplicate Element", group: "Edit", icon: <Copy size={14} />, run: () => { setOpen(false); ui.activeSlideId && ui.selectedElementIds[0] && deck.duplicateElement(ui.activeSlideId, ui.selectedElementIds[0]); } },
      { id: "del-el", label: "Delete Element", group: "Edit", icon: <Trash2 size={14} />, run: () => { setOpen(false); ui.activeSlideId && ui.selectedElementIds[0] && deck.deleteElement(ui.activeSlideId, ui.selectedElementIds[0]); } },
      { id: "toggle-left", label: "Toggle Slides Panel", group: "View", icon: <PanelLeft size={14} />, run: () => { setOpen(false); ui.toggleLeftPanel(); } },
      { id: "toggle-right", label: "Toggle Inspector", group: "View", icon: <PanelRight size={14} />, run: () => { setOpen(false); ui.toggleRightPanel(); } },
      { id: "toggle-layers", label: "Show Layers Panel", group: "View", icon: <Layers size={14} />, run: () => { setOpen(false); ui.setRightPanel("layers"); } },
      { id: "themes", label: "Open Theme Gallery", group: "Design", icon: <Palette size={14} />, run: () => { setOpen(false); ui.setRightPanel("themes"); } },
      { id: "dark", label: "Toggle Dark / Light Mode", group: "App", icon: ui.isDark ? <Sun size={14} /> : <Moon size={14} />, run: () => { setOpen(false); ui.toggleDark(); } },
      { id: "settings", label: "Open AI Settings", group: "App", icon: <Settings size={14} />, run: () => { setOpen(false); ui.setAIAssistant(true); } },
      { id: "hide-slide", label: "Hide / Unhide Slide", group: "Edit", icon: <EyeOff size={14} />, run: () => { setOpen(false); if (slide) deck.updateSlide(slide.id, { hidden: !slide.hidden }); } },
      { id: "search-notes", label: "Search… (this is you)", group: "App", icon: <Search size={14} />, run: () => setOpen(false) },
    ];
  }, [deck, ui, ui.activeSlideId, ui.selectedElementIds]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  if (!open) return null;

  const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c);
    return acc;
  }, {});

  const run = (c: Command) => {
    setOpen(false);
    c.run();
  };

  const flat = filtered;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-[560px] max-w-[92vw] overflow-hidden rounded-2xl glass-strong shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, flat.length - 1)); scrollIntoView(highlight + 1); }
              if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); scrollIntoView(highlight - 1); }
              if (e.key === "Enter" && flat[highlight]) run(flat[highlight]);
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="kbd">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[380px] overflow-y-auto p-2">
          {Object.entries(groups).map(([group, cmds]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{group}</div>
              {cmds.map((c) => {
                const idx = flat.indexOf(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => run(c)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      idx === highlight ? "bg-indigo-500/20 text-white" : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-400">{c.icon}</span>
                    <span className="flex-1">{c.label}</span>
                    {c.hint && <kbd className="kbd">{c.hint}</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-500">No commands found</p>}
        </div>
      </div>
    </div>
  );

  function scrollIntoView(idx: number) {
    const el = listRef.current?.children[0]?.querySelectorAll("button")[idx];
    el?.scrollIntoView({ block: "nearest" });
  }
}
