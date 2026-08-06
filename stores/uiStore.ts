"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AIConfig } from "@/lib/types";

type PanelId = "slides" | "inspector" | "ai" | "assets" | "charts" | "layers" | "comments" | "history" | "themes" | "animations" | "coach" | "layout" | "gateway" | null;

interface UIState {
  mode: "editor" | "present" | "outline";
  activeSlideId: string | null;
  selectedElementIds: string[];
  leftPanel: PanelId;
  rightPanel: PanelId;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  commandPaletteOpen: boolean;
  aiAssistantOpen: boolean;
  zoom: number;
  isDark: boolean;
  lastSavedAt: number | null;
  hasSaved: boolean;
  previewMode: "editor" | "present";
  sidebarCollapsed: boolean;
  view: "normal" | "sorter" | "outline";

  setMode: (m: UIState["mode"]) => void;
  setView: (v: UIState["view"]) => void;
  setActiveSlide: (id: string) => void;
  setSelection: (ids: string[]) => void;
  setLeftPanel: (p: PanelId) => void;
  setRightPanel: (p: PanelId) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setShowLeftPanel: (v: boolean) => void;
  setShowRightPanel: (v: boolean) => void;
  setCommandPalette: (open: boolean) => void;
  setAIAssistant: (open: boolean) => void;
  setZoom: (z: number) => void;
  toggleDark: () => void;
  setSaved: (t: number) => void;
  setPreviewMode: (m: UIState["previewMode"]) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      mode: "editor",
      activeSlideId: null,
      selectedElementIds: [],
      leftPanel: "slides",
      rightPanel: "inspector",
      showLeftPanel: true,
      showRightPanel: true,
      commandPaletteOpen: false,
      aiAssistantOpen: false,
      zoom: 0.65,
      isDark: true,
      lastSavedAt: null,
      hasSaved: false,
      previewMode: "editor",
      sidebarCollapsed: false,
      view: "normal",

      setMode: (mode) => set({ mode }),
      setView: (view) => set({ view }),
      setActiveSlide: (id) => set({ activeSlideId: id }),
      setSelection: (ids) => set({ selectedElementIds: ids }),
      setLeftPanel: (p) => set({ leftPanel: p, showLeftPanel: true }),
      setRightPanel: (p) => set({ rightPanel: p, showRightPanel: true }),
      toggleLeftPanel: () => set((s) => ({ showLeftPanel: !s.showLeftPanel })),
      toggleRightPanel: () => set((s) => ({ showRightPanel: !s.showRightPanel })),
      setShowLeftPanel: (v) => set({ showLeftPanel: v }),
      setShowRightPanel: (v) => set({ showRightPanel: v }),
      setCommandPalette: (open) => set({ commandPaletteOpen: open }),
      setAIAssistant: (open) => set({ aiAssistantOpen: open }),
      setZoom: (z) => set({ zoom: Math.min(2.5, Math.max(0.2, z)) }),
      toggleDark: () => set((s) => ({ isDark: !s.isDark })),
      setSaved: (t) => set({ lastSavedAt: t, hasSaved: true }),
      setPreviewMode: (m) => set({ previewMode: m }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "lumina-ui", partialize: (s) => ({ isDark: s.isDark }) }
  )
);
