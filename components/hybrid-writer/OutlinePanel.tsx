"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, MoveVertical, RefreshCw, Trash2, Split, Plus, FileText } from "lucide-react";

export interface OutlineSection {
  id: string;
  title: string;
  level: number; // 1, 2, 3
  wordCount: number;
}

interface OutlinePanelProps {
  sections: OutlineSection[];
  onRegenerateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onAddSection: () => void;
}

export function OutlinePanel({ sections, onRegenerateSection, onDeleteSection, onAddSection }: OutlinePanelProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800/80 p-3 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Document Outline</span>
        </div>
        <button
          onClick={onAddSection}
          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30 transition-all"
        >
          <Plus className="w-3 h-3" />
          Section
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {sections.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No outline headings found</div>
        ) : (
          sections.map((sec) => (
            <div
              key={sec.id}
              className={`group flex items-center justify-between rounded-lg p-2 text-xs transition-all ${
                sec.level === 1 ? "bg-slate-800/60 font-semibold text-slate-100" : sec.level === 2 ? "pl-5 text-slate-300" : "pl-8 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MoveVertical className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 cursor-grab" />
                <span className="truncate">{sec.title}</span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRegenerateSection(sec.id)}
                  title="Regenerate Section with AI"
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-indigo-400"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteSection(sec.id)}
                  title="Delete Section"
                  className="p-1 hover:bg-slate-700/60 rounded text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
