"use client";

import React from "react";
import { AgentStageStatus, AgentStageId } from "@/lib/ai/agents/orchestrator";
import { CheckCircle2, Loader2, Circle, Activity, Cpu } from "lucide-react";

interface LiveAgentTrackerProps {
  stages: Record<AgentStageId, AgentStageStatus>;
  activeStage?: AgentStageId;
}

export function LiveAgentTracker({ stages }: LiveAgentTrackerProps) {
  const stageList = Object.values(stages);
  const completedCount = stageList.filter((s) => s.status === "completed").length;
  const progressPct = Math.round((completedCount / stageList.length) * 100);

  return (
    <div className="flex flex-col bg-slate-900/70 rounded-xl border border-slate-800 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Multi-Agent Execution Pipeline</span>
        </div>
        <span className="text-[11px] font-mono font-medium text-indigo-400">{progressPct}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {stageList.map((stage) => (
          <div
            key={stage.id}
            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
              stage.status === "running"
                ? "bg-indigo-950/60 border border-indigo-500/40 text-indigo-200"
                : stage.status === "completed"
                ? "bg-slate-850/40 text-slate-300"
                : "text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {stage.status === "running" ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              ) : stage.status === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="font-medium">{stage.name}</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>{stage.modelUsed}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
