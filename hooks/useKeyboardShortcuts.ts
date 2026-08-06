"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useDeckStore } from "@/stores/deckStore";

export interface ShortcutAction {
  keys: string;
  label: string;
  group: string;
  run: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutAction[], deps: unknown[] = []) {
  const actionRef = useRef(actions);
  actionRef.current = actions;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
      }
      for (const a of actionRef.current) {
        if (matchKeys(e, a.keys)) {
          e.preventDefault();
          a.run();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, deps);
}

export function useGlobalShortcuts() {
  const ui = useUIStore();
  const deck = useDeckStore();

  useKeyboardShortcuts([
    { keys: "mod+k", label: "Command Palette", group: "App", run: () => ui.setCommandPalette(true) },
    { keys: "mod+/", label: "AI Assistant", group: "App", run: () => ui.setAIAssistant(!ui.aiAssistantOpen) },
    { keys: "mod+\\", label: "Toggle Left Panel", group: "View", run: () => ui.toggleLeftPanel() },
    { keys: "mod+]", label: "Toggle Right Panel", group: "View", run: () => ui.toggleRightPanel() },
    { keys: "mod+shift+d", label: "Toggle Dark Mode", group: "App", run: () => ui.toggleDark() },
    { keys: "mod+0", label: "Reset Zoom", group: "View", run: () => ui.setZoom(0.65) },
    { keys: "shift+space", label: "Present", group: "App", run: () => ui.setMode("present") },
    { keys: "mod+z", label: "Undo", group: "Edit", run: () => deck.undo() },
    { keys: "mod+y", label: "Redo", group: "Edit", run: () => deck.redo() },
    { keys: "mod+shift+z", label: "Redo", group: "Edit", run: () => deck.redo() },
    {
      keys: "delete",
      label: "Delete Selected",
      group: "Edit",
      run: () => {
        if (!ui.activeSlideId || !deck.deck) return;
        ui.selectedElementIds.forEach((id) => deck.deleteElement(ui.activeSlideId!, id));
        ui.setSelection([]);
      },
    },
    {
      keys: "backspace",
      label: "Delete Selected",
      group: "Edit",
      run: () => {
        if (!ui.activeSlideId || !deck.deck) return;
        ui.selectedElementIds.forEach((id) => deck.deleteElement(ui.activeSlideId!, id));
        ui.setSelection([]);
      },
    },
  ]);
}

function matchKeys(e: KeyboardEvent, pattern: string): boolean {
  const parts = pattern.split("+").map((p) => p.toLowerCase());
  const mod = parts.includes("mod");
  const ctrl = parts.includes("ctrl");
  const alt = parts.includes("alt");
  const shift = parts.includes("shift");
  const key = parts[parts.length - 1];

  const modPressed = e.ctrlKey || e.metaKey;
  if (mod && !modPressed) return false;
  if (!mod && (e.ctrlKey || e.metaKey)) return false;
  if (alt && !e.altKey) return false;
  if (!alt && e.altKey) return false;
  if (shift && !e.shiftKey) return false;
  if (!shift && e.shiftKey && key !== "space") return false;

  let actual = e.key.toLowerCase();
  if (actual === " ") actual = "space";
  return actual === key;
}
