"use client";

import { History, RotateCcw, Clock, ShieldCheck, GitBranch } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { timeAgo } from "@/lib/utils";
import { Button, Divider } from "@/components/ui";
import { toast } from "sonner";

export function VersionHistoryPanel() {
  const history = useDeckStore((s) => s.history);
  const restoreVersion = useDeckStore((s) => s.restoreVersion);
  const saveVersion = useDeckStore((s) => s.saveVersion);
  const deck = useDeckStore((s) => s.deck);

  if (!deck) return null;

  return (
    <div className="flex h-full flex-col p-4 space-y-4 overflow-y-auto text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <History size={16} className="text-indigo-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Version History & Snapshots
          </h3>
        </div>
      </div>

      <Button
        className="w-full justify-center"
        onClick={() => {
          const label = prompt("Snapshot label (e.g. Before client review)", "Manual Snapshot");
          if (label) {
            saveVersion(label);
            toast.success("Snapshot created!");
          }
        }}
      >
        <GitBranch size={14} /> Create Snapshot
      </Button>

      <Divider />

      <div className="space-y-2.5">
        {history.map((v, i) => (
          <div
            key={v.id}
            className={`rounded-2xl border p-3 transition-all ${
              i === 0
                ? "border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                : "border-white/10 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{v.label}</span>
              {i === 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  Current
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock size={11} /> {timeAgo(v.timestamp)}
              </span>
              <span>{v.deck.slides?.length ?? 0} slides</span>
            </div>

            {i !== 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => {
                    restoreVersion(v.id);
                    toast.success(`Restored "${v.label}"`);
                  }}
                  className="cursor-pointer flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <RotateCcw size={11} /> Restore Version
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
