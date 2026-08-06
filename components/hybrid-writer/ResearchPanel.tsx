"use client";

import React from "react";
import { ResearchResult } from "@/lib/ai/research/researchEngine";
import { Search, ExternalLink, Network, FileText, Database, ShieldCheck } from "lucide-react";

interface ResearchPanelProps {
  research?: ResearchResult;
}

export function ResearchPanel({ research }: ResearchPanelProps) {
  if (!research) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        Run prompt to generate research context & knowledge graph.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/70 rounded-xl border border-slate-800 p-3 backdrop-blur-md">
      <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">
        <Database className="w-4 h-4 text-sky-400" />
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Research Knowledge Graph</span>
      </div>

      <div className="text-xs text-slate-300 mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
        {research.summary}
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Authoritative Sources</div>
        {research.sources.map((src, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between font-medium text-slate-200">
              <span className="truncate">{src.title}</span>
              <span className="text-[10px] font-mono text-emerald-400">{Math.round(src.confidence * 100)}%</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{src.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
