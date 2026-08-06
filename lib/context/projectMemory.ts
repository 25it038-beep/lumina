import type { BrandKit } from "../ai/planning/planner.types";
import { scopedKeyFor } from "../auth/storage";

/**
 * Project Memory — persistent memory for the Planning Layer.
 * Remembers preferences across sessions so future planning requests can
 * reuse relevant context: themes, writing style, audience, length,
 * industry, favorite layouts, brand kit and prior presentations.
 *
 * Persisted to localStorage (browser) with an in-memory fallback so the
 * module is safe in server-side execution.
 */

export interface PreviousPresentationEntry {
  title: string;
  topic: string;
  themeId: string;
  slideCount: number;
  archetype: string;
  createdAt: number;
}

export interface ProjectMemoryState {
  preferredThemes: string[];
  writingStyle: string;
  audiencePreferences: string[];
  preferredLength: string;
  industry: string;
  favoriteLayouts: string[];
  brandKit?: BrandKit;
  previousPresentations: PreviousPresentationEntry[];
  updatedAt: number;
}

const STORAGE_KEY = "lumina-project-memory";
const MAX_PRESENTATIONS = 24;

export const DEFAULT_PROJECT_MEMORY: ProjectMemoryState = {
  preferredThemes: [],
  writingStyle: "Professional",
  audiencePreferences: [],
  preferredLength: "medium",
  industry: "",
  favoriteLayouts: [],
  previousPresentations: [],
  updatedAt: Date.now(),
};

function safeStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    /* privacy mode / SSR */
  }
  return null;
}

class ProjectMemoryStore {
  private memory: ProjectMemoryState = DEFAULT_PROJECT_MEMORY;
  private loaded = false;

  private load(): ProjectMemoryState {
    if (this.loaded) return this.memory;
    this.loaded = true;
    const storage = safeStorage();
    if (!storage) return this.memory;
    try {
      const raw = storage.getItem(scopedKeyFor(STORAGE_KEY));
      if (raw) this.memory = { ...DEFAULT_PROJECT_MEMORY, ...JSON.parse(raw) };
    } catch {
      /* corrupted memory — start fresh */
    }
    return this.memory;
  }

  /** Drop the in-memory cache so the next access reloads from storage (used on account switch). */
  reload() {
    this.loaded = false;
  }

  private persist() {
    this.memory.updatedAt = Date.now();
    const storage = safeStorage();
    if (!storage) return;
    try {
      storage.setItem(scopedKeyFor(STORAGE_KEY), JSON.stringify(this.memory));
    } catch {
      /* storage full / unavailable */
    }
  }

  getMemory(): ProjectMemoryState {
    return { ...this.load() };
  }

  update(patch: Partial<ProjectMemoryState>) {
    this.memory = { ...this.load(), ...patch, updatedAt: Date.now() };
    this.persist();
  }

  setPreferredThemes(themes: string[]) {
    this.update({ preferredThemes: themes.slice(0, 12) });
  }

  setWritingStyle(style: string) {
    this.update({ writingStyle: style });
  }

  addAudiencePreference(audience: string) {
    const m = this.load();
    const next = [audience, ...m.audiencePreferences.filter((a) => a !== audience)].slice(0, 8);
    this.update({ audiencePreferences: next });
  }

  setPreferredLength(length: string) {
    this.update({ preferredLength: length });
  }

  setIndustry(industry: string) {
    this.update({ industry });
  }

  setFavoriteLayouts(layouts: string[]) {
    this.update({ favoriteLayouts: layouts.slice(0, 16) });
  }

  setBrandKit(brandKit?: BrandKit) {
    this.update({ brandKit });
  }

  recordPresentation(entry: Omit<PreviousPresentationEntry, "createdAt">) {
    const m = this.load();
    const full: PreviousPresentationEntry = { ...entry, createdAt: Date.now() };
    this.update({ previousPresentations: [full, ...m.previousPresentations].slice(0, MAX_PRESENTATIONS) });
  }

  previousPresentations(): PreviousPresentationEntry[] {
    return this.load().previousPresentations;
  }

  reset() {
    this.memory = { ...DEFAULT_PROJECT_MEMORY, updatedAt: Date.now() };
    this.persist();
  }

  /** Serialized, memory-shaped context snippet injected into planning prompts. */
  getContextSummary(): string {
    const m = this.load();
    const parts: string[] = [];
    if (m.preferredThemes.length) parts.push(`Preferred themes: ${m.preferredThemes.join(", ")}`);
    if (m.writingStyle) parts.push(`Writing style: ${m.writingStyle}`);
    if (m.audiencePreferences.length) parts.push(`Audiences you present to: ${m.audiencePreferences.join(", ")}`);
    if (m.preferredLength) parts.push(`Preferred presentation length: ${m.preferredLength}`);
    if (m.industry) parts.push(`Industry: ${m.industry}`);
    if (m.favoriteLayouts.length) parts.push(`Favorite layouts: ${m.favoriteLayouts.join(", ")}`);
    if (m.brandKit) {
      parts.push(`Brand kit: ${JSON.stringify(m.brandKit).slice(0, 500)}`);
    }
    if (m.previousPresentations.length) {
      parts.push(
        `Previous presentations (${m.previousPresentations.length}): ${m.previousPresentations
          .slice(0, 6)
          .map((p) => p.title)
          .join(" | ")}`
      );
    }
    return parts.length ? parts.join("\n") : "No project memory yet.";
  }
}

export const projectMemoryStore = new ProjectMemoryStore();
