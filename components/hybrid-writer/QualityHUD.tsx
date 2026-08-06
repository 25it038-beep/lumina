"use client";

import React from "react";
import { DocumentQualityMetrics } from "@/lib/ai/quality/qualityAnalyzer";
import { Gauge, CheckCircle2, Search, BookOpen, ShieldCheck, Zap } from "lucide-react";

interface QualityHUDProps {
  metrics: DocumentQualityMetrics;
}

export function QualityHUD({ metrics }: QualityHUDProps) {
  return (
    <div className="flex flex-col bg-slate-900/70 rounded-xl border border-slate-800 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Live Content Quality HUD</span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-semibold">{metrics.wordCount} Words</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Readability */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-400" /> Readability</span>
            <span className="font-mono text-slate-200">Grade {metrics.readabilityGrade}</span>
          </div>
          <div className="text-xs font-medium text-slate-200 truncate">{metrics.readabilityLabel}</div>
        </div>

        {/* Fact Confidence */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Fact Score</span>
            <span className="font-mono text-emerald-400 font-semibold">{metrics.factConfidenceScore}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-emerald-500" style={{ width: `${metrics.factConfidenceScore}%` }} />
          </div>
        </div>

        {/* SEO Score */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Search className="w-3 h-3 text-purple-400" /> SEO Alignment</span>
            <span className="font-mono text-purple-400 font-semibold">{metrics.seoScore}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-purple-500" style={{ width: `${metrics.seoScore}%` }} />
          </div>
        </div>

        {/* Tone & Style Match */}
        <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Tone Alignment</span>
            <span className="font-mono text-amber-400 font-semibold">{metrics.toneMatchScore}%</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-amber-500" style={{ width: `${metrics.toneMatchScore}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
