"use client";

import {
  ArrowLeft,
  Play,
  Share2,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  Search,
  PanelLeft,
  PanelRight,
  Moon,
  Sun,
  Type,
  ImagePlus,
  Table2,
  PieChart,
  Square,
  Code2,
  Gift,
} from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { Button, IconButton, Tooltip } from "@/components/ui";
import { exportDeck, ExportFormat } from "@/lib/export";
import { useState } from "react";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";

const EXPORT_FORMATS: ExportFormat[] = ["pptx", "pdf", "html", "png", "jpeg", "svg", "markdown", "reveal"];

interface EditorToolbarProps {
  onOpenCustomTheme?: () => void;
  onOpenBrandKit?: () => void;
  onOpenMediaGen?: (mode: "image" | "chart" | "diagram") => void;
}

export function EditorToolbar({ onOpenCustomTheme, onOpenBrandKit, onOpenMediaGen }: EditorToolbarProps) {
  const deck = useDeckStore((s) => s.deck);
  const updateDeck = useDeckStore((s) => s.updateDeck);
  const lastSaved = useDeckStore((s) => s.lastSaved);
  const isDirty = useDeckStore((s) => s.isDirty);
  const ui = useUIStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  if (!deck) return null;

  const runExport = async (format: ExportFormat) => {
    setExportOpen(false);
    setExporting(format);
    try {
      await exportDeck(deck, format, (p) => {
        if (p >= 100) toast.success(`Exported ${format.toUpperCase()}`);
      });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e: any) {
      toast.error(`Export failed: ${e.message ?? "unknown error"}`);
    } finally {
      setExporting(null);
    }
  };

  const addBlock = (type: string) => {
    const slide = deck.slides.find((s) => s.id === ui.activeSlideId);
    if (!slide) return;
    const el: any = {
      id: `el-${Date.now()}`,
      type,
      name: type,
      position: { x: 150, y: 200, width: 400, height: 300, rotation: 0 },
      style: {},
      animation: { type: "fade-up", duration: 0.6, delay: 0 },
      locked: false,
      visible: true,
      zIndex: slide.elements.length + 1,
    };
    if (type === "text") {
      el.content = "Double-click to edit";
      el.style = { fontSize: 28, fontWeight: 600, color: "var(--t-text)" };
      el.position = { x: 150, y: 200, width: 500, height: 90, rotation: 0 };
    } else if (type === "image") {
      el.src = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`;
      el.alt = "";
      el.objectFit = "cover";
    } else if (type === "table") {
      el.rows = 4;
      el.cols = 3;
      el.headers = ["Column 1", "Column 2", "Column 3"];
      el.cells = [
        ["A1", "B1", "C1"],
        ["A2", "B2", "C2"],
        ["A3", "B3", "C3"],
      ];
    } else if (type === "chart") {
      el.chartType = "bar";
      el.title = "Data";
      el.data = [
        { label: "Q1", value: 42 },
        { label: "Q2", value: 58 },
        { label: "Q3", value: 63 },
        { label: "Q4", value: 71 },
      ];
      el.datasets = [];
      el.axisLabels = { x: "", y: "" };
      el.legend = false;
      el.animateChart = true;
    } else if (type === "shape") {
      el.shape = "rect";
      el.style = { fill: "var(--t-primary)", borderRadius: 8 };
      el.position = { x: 150, y: 200, width: 300, height: 200, rotation: 0 };
    } else if (type === "code") {
      el.code = "def hello():\n    print('Hello, world!')";
      el.language = "python";
    } else if (type === "button") {
      el.label = "Click Me";
      el.style = { borderRadius: 10, fontSize: 18 };
      el.position = { x: 150, y: 200, width: 200, height: 60, rotation: 0 };
    }
    useDeckStore.getState().addElement(slide.id, el);
    ui.setSelection([el.id]);
  };

  const blocks = [
    { type: "text", label: "Text", icon: <Type size={14} /> },
    { type: "image", label: "Image", icon: <ImagePlus size={14} /> },
    { type: "shape", label: "Shape", icon: <Square size={14} /> },
    { type: "table", label: "Table", icon: <Table2 size={14} /> },
    { type: "chart", label: "Chart", icon: <PieChart size={14} /> },
    { type: "code", label: "Code", icon: <Code2 size={14} /> },
    { type: "button", label: "Button", icon: <Gift size={14} /> },
  ];

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-white/8 bg-white/[0.03] px-2 backdrop-blur-xl">
      <a href="/" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-400 hover:bg-white/8 hover:text-white transition-colors">
        <ArrowLeft size={16} />
      </a>

      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-1 py-0.5">
        <IconButton title="Undo (Ctrl+Z)" onClick={() => useDeckStore.getState().undo()}><Undo2 size={14} /></IconButton>
        <IconButton title="Redo (Ctrl+Y)" onClick={() => useDeckStore.getState().redo()}><Redo2 size={14} /></IconButton>
      </div>

      {editingTitle ? (
        <input
          autoFocus
          defaultValue={deck.title}
          onBlur={(e) => {
            updateDeck({ title: e.target.value || deck.title });
            setEditingTitle(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="h-8 w-56 rounded-lg border border-indigo-400/40 bg-white/[0.06] px-3 text-sm font-medium text-slate-100 focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditingTitle(true)}
          className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/8 transition-colors"
        >
          <span className="max-w-[280px] truncate">{deck.title}</span>
          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500">edit</span>
        </button>
      )}
      <span className="hidden text-[11px] text-slate-500 sm:block">
        {isDirty ? "Editing…" : lastSaved ? `Saved ${formatTime(lastSaved)}` : "Draft"}
      </span>

      <div className="mx-1 h-6 w-px bg-white/10" />

      {/* Insert blocks */}
      <div data-tour="toolbar-insert" className="hidden items-center gap-0.5 md:flex">
        {blocks.map((b) => (
          <Tooltip key={b.type} label={`Insert ${b.label}`}>
            <IconButton onClick={() => addBlock(b.type)}>{b.icon}</IconButton>
          </Tooltip>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-white/10 hidden md:block" />

      {/* AI Media Generators */}
      <div data-tour="toolbar-ai-media" className="hidden items-center gap-1 lg:flex">
        <Button size="sm" variant="ghost" onClick={() => onOpenMediaGen?.("image")}>
          <ImagePlus size={13} className="text-indigo-300" /> AI Image
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onOpenMediaGen?.("diagram")}>
          <Sparkles size={13} className="text-violet-300" /> AI Diagram
        </Button>
      </div>

      <div className="flex-1" />

      <div data-tour="toolbar-ai-assist" className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => ui.setRightPanel("coach" as any)}>
          <Sparkles size={13} className="text-emerald-400" /> AI Coach
        </Button>

        <Button size="sm" variant="ghost" onClick={onOpenCustomTheme}>
          Custom Theme
        </Button>

        <Button size="sm" variant="ghost" onClick={onOpenBrandKit}>
          Brand Kit
        </Button>
      </div>

      <div data-tour="toolbar-views" className="flex items-center gap-1">
        <IconButton title="Search (Ctrl+K)" onClick={() => ui.setCommandPalette(true)}>
          <Search size={15} />
        </IconButton>
        <IconButton title="Toggle panels" onClick={() => { ui.toggleLeftPanel(); ui.toggleRightPanel(); }}>
          <PanelLeft size={15} />
        </IconButton>
        <IconButton title="Dark mode" onClick={() => ui.toggleDark()}>
          {ui.isDark ? <Sun size={15} /> : <Moon size={15} />}
        </IconButton>
      </div>

      <Button size="sm" variant="secondary" onClick={() => ui.setAIAssistant(true)}>
        <Sparkles size={14} className="text-indigo-300" />
        AI Copilot
      </Button>

      <div data-tour="toolbar-share" className="flex items-center gap-1">
        <div className="relative">
          <Button size="sm" onClick={() => setExportOpen(!exportOpen)} disabled={!!exporting}>
            <Download size={14} />
            {exporting ? `Exporting ${exporting.toUpperCase()}…` : "Export"}
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl glass-strong p-1 shadow-2xl animate-scale-in">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => runExport(f)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <span className="capitalize">{f}</span>
                  <span className="text-[10px] text-slate-500">
                    {f === "pptx" ? "PowerPoint" : f === "pdf" ? "PDF" : f === "reveal" ? "Slides" : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button size="sm" onClick={() => ui.setMode("present")}>
          <Play size={14} />
          Present
        </Button>
      </div>
    </header>
  );
}
