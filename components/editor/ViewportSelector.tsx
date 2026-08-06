"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";

export type ViewportMode = "16:9" | "4:3" | "9:16";

interface ViewportSelectorProps {
  currentMode: ViewportMode;
  onChange: (mode: ViewportMode) => void;
}

export function ViewportSelector({ currentMode, onChange }: ViewportSelectorProps) {
  const updateDeck = useDeckStore((s) => s.updateDeck);

  const handleSelect = (mode: ViewportMode) => {
    onChange(mode);
    if (mode === "16:9" || mode === "4:3") {
      updateDeck({ aspectRatio: mode });
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
      <button
        onClick={() => handleSelect("16:9")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
          currentMode === "16:9" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
        }`}
        title="Desktop 16:9 Wide"
      >
        <Monitor size={13} /> 16:9
      </button>

      <button
        onClick={() => handleSelect("4:3")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
          currentMode === "4:3" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
        }`}
        title="Tablet 4:3 Standard"
      >
        <Tablet size={13} /> 4:3
      </button>

      <button
        onClick={() => handleSelect("9:16")}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition ${
          currentMode === "9:16" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
        }`}
        title="Mobile Vertical 9:16"
      >
        <Smartphone size={13} /> Mobile
      </button>
    </div>
  );
}
