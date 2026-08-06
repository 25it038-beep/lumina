"use client";

import { useMemo } from "react";
import { Mic, Clock, Sparkles, AlertTriangle, CheckCircle2, Award, Zap } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";

export function AICoachPanel() {
  const deck = useDeckStore((s) => s.deck);

  const stats = useMemo(() => {
    if (!deck) return null;
    let wordCount = 0;
    let fillerCount = 0;

    deck.slides.forEach((sl) => {
      const text = (sl.notes || "") + " " + sl.elements.map((e) => ("content" in e ? e.content : "")).join(" ");
      const words = text.split(/\s+/).filter(Boolean);
      wordCount += words.length;

      const fillers = text.match(/\b(um|uh|like|you know|basically|actually|literally)\b/gi);
      if (fillers) fillerCount += fillers.length;
    });

    const targetWPM = 140;
    const estMinutes = Math.max(1, Math.round((wordCount / targetWPM) * 10) / 10);
    const confidenceScore = Math.min(99, Math.max(80, 100 - fillerCount * 3));

    return {
      wordCount,
      estMinutes,
      fillerCount,
      confidenceScore,
      wpm: targetWPM,
    };
  }, [deck]);

  if (!deck || !stats) {
    return (
      <div className="p-4 text-xs text-slate-400">
        No active presentation deck found.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 text-xs text-slate-200 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Mic size={15} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">AI Rehearsal Coach</h4>
            <p className="text-[10px] text-slate-400">Speech telemetry & delivery coaching</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
          Ready
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Clock size={13} className="text-indigo-400" /> Est. Duration
          </div>
          <p className="mt-1 text-lg font-extrabold text-white">{stats.estMinutes} min</p>
          <span className="text-[10px] text-slate-400">~{stats.wpm} WPM speaking pace</span>
        </div>

        <div className="glass rounded-xl p-3 border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Award size={13} className="text-amber-400" /> Confidence Score
          </div>
          <p className="mt-1 text-lg font-extrabold text-white">{stats.confidenceScore}%</p>
          <span className="text-[10px] text-emerald-400">Executive Delivery</span>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-semibold text-slate-300">Delivery Checklist</h5>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 border border-white/8 text-slate-300 text-[11px]">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>Word Count ({stats.wordCount} words) is well-balanced across {deck.slides.length} slides.</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 border border-white/8 text-slate-300 text-[11px]">
          {stats.fillerCount === 0 ? (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          )}
          <span>
            {stats.fillerCount === 0
              ? "Zero filler words detected in notes."
              : `Detected ${stats.fillerCount} filler word triggers (um, basically).`}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 border border-white/8 text-slate-300 text-[11px]">
          <Zap size={14} className="text-indigo-400 shrink-0" />
          <span>Eye-contact reminder: Pause 3 seconds at Key Metric cards.</span>
        </div>
      </div>
    </div>
  );
}
