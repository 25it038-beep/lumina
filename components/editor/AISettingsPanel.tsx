"use client";

import { useState } from "react";
import { Cpu, DollarSign, Zap, Database, Activity, RefreshCw, Shield, Sliders } from "lucide-react";
import { aiGateway } from "@/lib/ai/gateway/AIGateway";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button, Input, Label, Slider, SegmentedControl, Divider } from "@/components/ui";
import { toast } from "sonner";

export function AISettingsPanel() {
  const settings = useSettingsStore();
  const [metrics, setMetrics] = useState(() => aiGateway.getMetrics());
  const [logs, setLogs] = useState(() => aiGateway.getLogs());

  const refreshTelemetry = () => {
    setMetrics(aiGateway.getMetrics());
    setLogs(aiGateway.getLogs());
    toast.success("AI Gateway telemetry refreshed");
  };

  return (
    <div className="flex h-full flex-col p-4 space-y-5 overflow-y-auto text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">AI Gateway & Model Control</h3>
            <p className="text-[11px] text-slate-400">Multi-Model Architecture & Telemetry</p>
          </div>
        </div>
        <button onClick={refreshTelemetry} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Gateway Telemetry Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Cost</span>
            <DollarSign size={13} className="text-emerald-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-white">${metrics.totalCostUSD.toFixed(5)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tokens Processed</span>
            <Zap size={13} className="text-indigo-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-white">{metrics.totalTokensUsed.toLocaleString()}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Cache Hits</span>
            <Database size={13} className="text-cyan-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-white">{metrics.cacheHits}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Requests</span>
            <Activity size={13} className="text-violet-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-white">{metrics.totalRequests}</div>
        </div>
      </div>

      <Divider />

      {/* Specialized Model Routing Info */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">Active Task Routing</span>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 space-y-1 text-xs">
          <div className="flex justify-between font-medium text-slate-200">
            <span>🧠 Reasoning & Planning</span>
            <span className="text-indigo-300">GPT OSS 20B</span>
          </div>
          <p className="text-[10px] text-slate-500">NVIDIA API · openai/gpt-oss-20b</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 space-y-1 text-xs">
          <div className="flex justify-between font-medium text-slate-200">
            <span>✍️ Content & Speaker Notes</span>
            <span className="text-violet-300">DeepSeek V4 Pro</span>
          </div>
          <p className="text-[10px] text-slate-500">NVIDIA API · deepseek-ai/deepseek-v4-pro</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 space-y-1 text-xs">
          <div className="flex justify-between font-medium text-slate-200">
            <span>🎨 Hero Visuals & Covers</span>
            <span className="text-cyan-300">FLUX-1 Schnell</span>
          </div>
          <p className="text-[10px] text-slate-500">NVIDIA API · black-forest-labs/flux-1-schnell</p>
        </div>
      </div>

      <Divider />

      {/* Gateway Logs Stream */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">Gateway Request Logs</span>
        {logs.length === 0 ? (
          <p className="text-[11px] text-slate-500">No requests executed yet in this session.</p>
        ) : (
          <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
            {logs.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${l.status === "error" ? "bg-rose-500" : l.status === "cache_hit" ? "bg-cyan-400" : "bg-emerald-400"}`} />
                  <span className="font-mono text-slate-300">{l.taskType}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono">
                  <span>{l.model}</span>
                  <span>{l.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
