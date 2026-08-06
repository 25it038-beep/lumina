"use client";

import React from "react";
import { Wand2, Sparkles, Maximize2, Minimize2, Globe, Table, Workflow, Image, RefreshCw, Check } from "lucide-react";

interface InlineAIToolbarProps {
  selectedText: string;
  onAction: (action: string, selectedText: string) => void;
}

export function InlineAIToolbar({ selectedText, onAction }: InlineAIToolbarProps) {
  if (!selectedText || selectedText.trim().length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
      <div className="px-2 py-1 text-[11px] font-medium text-indigo-400">
        AI Tools ({selectedText.length} chars)
      </div>

      <div className="h-4 w-[1px] bg-slate-700/60" />

      <button
        onClick={() => onAction("rewrite", selectedText)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-all"
        title="Rewrite with DeepSeek + LLaMA"
      >
        <Wand2 className="w-3.5 h-3.5 text-purple-400" />
        Rewrite
      </button>

      <button
        onClick={() => onAction("expand", selectedText)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-all"
      >
        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
        Expand
      </button>

      <button
        onClick={() => onAction("simplify", selectedText)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-all"
      >
        <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
        Simplify
      </button>

      <button
        onClick={() => onAction("table", selectedText)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-all"
      >
        <Table className="w-3.5 h-3.5 text-teal-400" />
        To Table
      </button>

      <button
        onClick={() => onAction("diagram", selectedText)}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-all"
      >
        <Workflow className="w-3.5 h-3.5 text-cyan-400" />
        Diagram
      </button>
    </div>
  );
}
