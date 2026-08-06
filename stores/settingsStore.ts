"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AIConfig, ThemeDefinition } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import { setPlanningEnabled } from "@/lib/ai/planning/config";
import { userScopedStorage } from "@/lib/auth/storage";

interface SettingsState {
  ai: AIConfig;
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  autoSaveInterval: number;
  recentTopics: string[];
  defaultTheme: string;
  favorites: string[];
  planningEnabled: boolean;

  setProvider: (p: string) => void;
  setModel: (m: string) => void;
  setApiKey: (k: string) => void;
  setBaseUrl: (u: string) => void;
  setAutoSave: (ms: number) => void;
  addRecentTopic: (t: string) => void;
  setDefaultTheme: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setPlanningEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ai: { provider: "local", model: "lumina-local-v1" },
      provider: "local",
      model: "lumina-local-v1",
      apiKey: "",
      baseUrl: "",
      autoSaveInterval: 30000,
      recentTopics: [],
      defaultTheme: "technology",
      favorites: ["technology", "glassmorphism", "dark", "startup"],
      planningEnabled: true,

      setProvider: (p) => {
        const info = { local: ["lumina-local-v1"], openai: ["gpt-4o"], anthropic: ["claude-sonnet-4-5"], gemini: ["gemini-2.5-flash"], openrouter: ["openai/gpt-4o"], deepseek: ["deepseek-chat"], ollama: ["llama3.3"] }[p as string];
        set((s) => ({ provider: p, model: info?.[0] ?? s.model, ai: { ...s.ai, provider: p as any, model: info?.[0] ?? s.model } }));
      },
      setModel: (m) => set((s) => ({ model: m, ai: { ...s.ai, model: m } })),
      setApiKey: (k) => set((s) => ({ apiKey: k, ai: { ...s.ai, apiKey: k || undefined } })),
      setBaseUrl: (u) => set((s) => ({ baseUrl: u, ai: { ...s.ai, baseUrl: u || undefined } })),
      setAutoSave: (ms) => set({ autoSaveInterval: ms }),
      addRecentTopic: (t) =>
        set((s) => ({ recentTopics: [t, ...s.recentTopics.filter((x) => x !== t)].slice(0, 8) })),
      setDefaultTheme: (id) => set({ defaultTheme: id }),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      setPlanningEnabled: (enabled) => {
        setPlanningEnabled(enabled);
        set({ planningEnabled: enabled });
      },
    }),
    {
      name: "lumina-settings",
      storage: createJSONStorage(() => userScopedStorage()),
    }
  )
);

export const THEME_LIST: ThemeDefinition[] = THEMES;
