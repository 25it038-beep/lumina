"use client";

import React, { useState } from "react";
import { Check, X, ArrowRightLeft, Sparkles, Wand2, RefreshCw } from "lucide-react";

interface ComparisonViewProps {
  deepseekOutput: string;
  llamaOutput: string;
  onAcceptSnippet: (text: string) => void;
  onBlendOutputs: () => void;
}

export function ComparisonView({ deepseekOutput, llamaOutput, onAcceptSnippet, onBlendOutputs }: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState<"side-by-side" | "diff">("side-by-side");

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-100">Dual-Model Intelligence Studio</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBlendOutputs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Blend DeepSeek Logic + LLaMA Style
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 mt-4 overflow-hidden">
        {/* DeepSeek Panel */}
        <div className="flex flex-col rounded-xl border border-sky-950/60 bg-slate-950/60 p-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-900/40">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="font-semibold text-xs text-sky-300">DeepSeek R1 / V3 (Reasoning & Structure)</span>
            </div>
            <button
              onClick={() => onAcceptSnippet(deepseekOutput)}
              className="flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 bg-sky-950/80 px-2 py-1 rounded border border-sky-800/60"
            >
              <Check className="w-3 h-3" /> Use Draft
            </button>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap">
            {deepseekOutput || "Generating DeepSeek reasoning outline..."}
          </div>
        </div>

        {/* LLaMA Panel */}
        <div className="flex flex-col rounded-xl border border-indigo-950/60 bg-slate-950/60 p-3 overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-900/40">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="font-semibold text-xs text-indigo-300">Meta LLaMA 3.3 70B (Tone & Prose Synthesis)</span>
            </div>
            <button
              onClick={() => onAcceptSnippet(llamaOutput)}
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/80 px-2 py-1 rounded border border-indigo-800/60"
            >
              <Check className="w-3 h-3" /> Use Draft
            </button>
          </div>
          <div className="flex-1 overflow-y-auto text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
            {llamaOutput || "Awaiting LLaMA prose synthesis..."}
          </div>
        </div>
      </div>
    </div>
  );
}
