"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Deck, Slide, SlideElement, HistoryVersion, ThemeDefinition } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { userScopedStorage } from "@/lib/auth/storage";

interface DeckState {
  deck: Deck | null;
  history: HistoryVersion[];
  currentVersion: number;
  lastSaved: number | null;
  isDirty: boolean;
  past: Deck[];
  future: Deck[];

  setDeck: (deck: Deck) => void;
  updateDeck: (patch: Partial<Deck>) => void;
  addSlide: (slide: Slide, index?: number) => void;
  updateSlide: (slideId: string, patch: Partial<Slide>) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  moveSlide: (from: number, to: number) => void;
  addElement: (slideId: string, element: SlideElement) => void;
  updateElement: (slideId: string, elementId: string, patch: Partial<SlideElement>) => void;
  deleteElement: (slideId: string, elementId: string) => void;
  duplicateElement: (slideId: string, elementId: string) => void;
  reorderElement: (slideId: string, elementId: string, direction: "forward" | "backward" | "front" | "back") => void;
  applyTheme: (themeId: string) => void;
  markSaved: () => void;
  saveVersion: (label?: string) => void;
  restoreVersion: (versionId: string) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Undo/redo coalescing window (ms). Rapid continuous edits (e.g. dragging an element)
// are collapsed into a single undo step, like Gamma / PowerPoint.
const HISTORY_WINDOW_MS = 400;
const MAX_HISTORY = 60;

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => {
      // Wraps the raw zustand `set` so every deck-mutating action also records the
      // previous deck onto the undo stack. Rapid edits within the window coalesce.
      let lastCommitTs = 0;
      const commit = (partial: Partial<DeckState> | ((s: DeckState) => Partial<DeckState>)) => {
        const prev = get().deck;
        set(partial as any);
        const next = get().deck;
        if (!prev || !next || prev === next) return;
        const now = Date.now();
        const s = get();
        if (s.past.length === 0 || now - lastCommitTs > HISTORY_WINDOW_MS) {
          set({ past: [...s.past, structuredClone(prev)].slice(-MAX_HISTORY), future: [] });
          lastCommitTs = now;
        }
      };

      return {
        deck: null,
        history: [],
        currentVersion: 0,
        lastSaved: null,
        isDirty: false,
        past: [],
        future: [],

        setDeck: (deck) =>
          commit((s) => ({
            deck: { ...deck, updatedAt: Date.now() },
            isDirty: true,
            history: [{ id: uid(), deck: structuredClone(deck), timestamp: Date.now(), label: "Created" }, ...s.history].slice(0, 50),
            currentVersion: s.currentVersion + 1,
          })),

        updateDeck: (patch) =>
          commit((s) =>
            s.deck
              ? { deck: { ...s.deck, ...patch, updatedAt: Date.now() }, isDirty: true }
              : s
          ),

        addSlide: (slide, index) =>
          commit((s) => {
            if (!s.deck) return s;
            const slides = [...s.deck.slides];
            const i = index ?? slides.length;
            slides.splice(i, 0, slide);
            return { deck: { ...s.deck, slides, updatedAt: Date.now() }, isDirty: true };
          }),

        updateSlide: (slideId, patch) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.map((sl) => (sl.id === slideId ? { ...sl, ...patch } : sl)),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        duplicateSlide: (slideId) =>
          commit((s) => {
            if (!s.deck) return s;
            const idx = s.deck.slides.findIndex((sl) => sl.id === slideId);
            if (idx === -1) return s;
            const copy: Slide = structuredClone(s.deck.slides[idx]);
            copy.id = uid();
            copy.title = `${copy.title} (copy)`;
            copy.elements = copy.elements.map((e) => ({ ...e, id: uid() }));
            const slides = [...s.deck.slides];
            slides.splice(idx + 1, 0, copy);
            return { deck: { ...s.deck, slides, updatedAt: Date.now() }, isDirty: true };
          }),

        deleteSlide: (slideId) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.filter((sl) => sl.id !== slideId),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        moveSlide: (from, to) =>
          commit((s) => {
            if (!s.deck) return s;
            const slides = [...s.deck.slides];
            const [moved] = slides.splice(from, 1);
            slides.splice(to, 0, moved);
            return { deck: { ...s.deck, slides, updatedAt: Date.now() }, isDirty: true };
          }),

        addElement: (slideId, element) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.map((sl) =>
                  sl.id === slideId
                    ? { ...sl, elements: [...sl.elements, element] }
                    : sl
                ),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        updateElement: (slideId, elementId, patch) =>
          commit((s) => {
            if (!s.deck) return s;
            const slides = s.deck.slides.map((sl) => {
              if (sl.id !== slideId) return sl;
              return {
                ...sl,
                elements: sl.elements.map((e) =>
                  e.id === elementId ? ({ ...e, ...patch } as SlideElement) : e
                ),
              };
            });
            return {
              deck: { ...s.deck, slides, updatedAt: Date.now() },
              isDirty: true,
            };
          }),

        deleteElement: (slideId, elementId) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.map((sl) =>
                  sl.id === slideId
                    ? { ...sl, elements: sl.elements.filter((e) => e.id !== elementId) }
                    : sl
                ),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        duplicateElement: (slideId, elementId) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.map((sl) => {
                  if (sl.id !== slideId) return sl;
                  const el = sl.elements.find((e) => e.id === elementId);
                  if (!el) return sl;
                  const copy = structuredClone(el);
                  copy.id = uid();
                  copy.position = { ...copy.position, x: copy.position.x + 24, y: copy.position.y + 24 };
                  return { ...sl, elements: [...sl.elements, copy] };
                }),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        reorderElement: (slideId, elementId, direction) =>
          commit((s) => {
            if (!s.deck) return s;
            return {
              deck: {
                ...s.deck,
                slides: s.deck.slides.map((sl) => {
                  if (sl.id !== slideId) return sl;
                  const els = [...sl.elements];
                  const idx = els.findIndex((e) => e.id === elementId);
                  if (idx === -1) return sl;
                  const [el] = els.splice(idx, 1);
                  const target = direction === "front" ? els.length : direction === "back" ? 0 : direction === "forward" ? Math.min(idx + 1, els.length) : Math.max(idx - 1, 0);
                  els.splice(target, 0, el);
                  return { ...sl, elements: els.map((e, i) => ({ ...e, zIndex: i })) };
                }),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        applyTheme: (themeId) =>
          commit((s) => {
            if (!s.deck) return s;
            const theme = getTheme(themeId);
            return {
              deck: {
                ...s.deck,
                themeId,
                slides: s.deck.slides.map((sl) => ({
                  ...sl,
                  themeId,
                  background: theme.background,
                  elements: sl.elements.map((el) => {
                    if (el.type === "heading") {
                      return { ...el, style: { ...el.style, color: theme.text } };
                    }
                    if (el.type === "subtitle" || el.type === "text") {
                      return { ...el, style: { ...el.style, color: theme.text } };
                    }
                    if (el.type === "shape" && el.shape === "rect") {
                      return { ...el, style: { ...el.style, fill: theme.surface, borderColor: theme.border } };
                    }
                    return el;
                  }),
                })),
                updatedAt: Date.now(),
              },
              isDirty: true,
            };
          }),

        markSaved: () => set({ isDirty: false, lastSaved: Date.now() }),

        saveVersion: (label) =>
          set((s) => {
            if (!s.deck) return s;
            return {
              history: [
                { id: uid(), deck: structuredClone(s.deck), timestamp: Date.now(), label: label ?? `Version ${s.history.length + 1}` },
                ...s.history,
              ].slice(0, 50),
              currentVersion: s.currentVersion + 1,
            };
          }),

        restoreVersion: (versionId) =>
          set((s) => {
            const v = s.history.find((h) => h.id === versionId);
            if (!v) return s;
            return { deck: { ...structuredClone(v.deck), id: s.deck?.id ?? v.deck.id, updatedAt: Date.now() }, isDirty: true };
          }),

        undo: () =>
          set((s) => {
            if (s.past.length === 0 || !s.deck) return s;
            const previous = s.past[s.past.length - 1];
            return {
              deck: { ...structuredClone(previous), id: s.deck.id, updatedAt: Date.now() },
              past: s.past.slice(0, -1),
              future: [...s.future, structuredClone(s.deck)].slice(-MAX_HISTORY),
              isDirty: true,
            };
          }),

        redo: () =>
          set((s) => {
            if (s.future.length === 0 || !s.deck) return s;
            const next = s.future[s.future.length - 1];
            return {
              deck: structuredClone(next),
              past: [...s.past, structuredClone(s.deck)].slice(-MAX_HISTORY),
              future: s.future.slice(0, -1),
              isDirty: true,
            };
          }),

        clear: () => set({ deck: null, history: [], past: [], future: [] }),
      };
    },
    {
      name: "lumina-decks",
      storage: createJSONStorage(() => userScopedStorage()),
      partialize: (s) => ({ deck: s.deck, history: s.history.slice(0, 10), lastSaved: s.lastSaved }),
    }
  )
);