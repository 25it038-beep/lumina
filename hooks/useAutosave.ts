"use client";

import { useEffect, useRef } from "react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";

export function useAutosave(enabled = true) {
  const { deck, isDirty, markSaved, saveVersion } = useDeckStore();
  const interval = useSettingsStore((s) => s.autoSaveInterval);
  const setSaved = useUIStore((s) => s.setSaved);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    if (!enabled) return;
    const persist = () => {
      if (dirtyRef.current && deck) {
        markSaved();
        setSaved(Date.now());
      }
    };
    window.addEventListener("beforeunload", persist);
    timerRef.current = setInterval(() => {
      if (dirtyRef.current && deck) {
        saveVersion("Autosave");
        persist();
      }
    }, interval);
    return () => {
      window.removeEventListener("beforeunload", persist);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, interval, deck?.id]);
}
