"use client";

import React from "react";
import { History, RotateCcw, GitBranch, X, Clock } from "lucide-react";

export interface DocumentVersionSnapshot {
  id: string;
  timestamp: string;
  actionLabel: string;
  wordCount: number;
  content: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersionSnapshot[];
  onRestoreVersion: (version: DocumentVersionSnapshot) => void;
}

export function VersionHistoryModal({ isOpen, onClose, versions, onRestoreVersion }: VersionHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-2xl h-[500px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-slate-100">Document Version History & Branching</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
          {versions.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">No previous version snapshots available.</div>
          ) : (
            versions.map((ver) => (
              <div key={ver.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700 transition-all">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-slate-200">{ver.actionLabel}</div>
                    <div className="text-[11px] text-slate-400">{ver.timestamp} • {ver.wordCount} words</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestoreVersion(ver);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium text-indigo-300 bg-indigo-950/80 border border-indigo-800 hover:bg-indigo-900 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
