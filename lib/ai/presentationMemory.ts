import { Deck, LayoutType } from "../types";

export interface DeckFingerprint {
  topic: string;
  topicHash: number;
  archetype: string;
  themeId: string;
  layouts: string[];
  backgrounds: string[];
  images: string[];
  titleWords: string[];
  recordedAt: number;
}

const MAX_HISTORY = 24;

export function hashTopic(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

export function fingerprintDeck(deck: Deck, archetype = "generic"): DeckFingerprint {
  return {
    topic: deck.topic,
    topicHash: hashTopic(deck.topic.toLowerCase()),
    archetype,
    themeId: deck.themeId,
    layouts: deck.slides.map((s) => s.layout),
    backgrounds: deck.slides.map((s) => s.backgroundId ?? s.background).filter(Boolean),
    images: deck.slides
      .flatMap((s) => [s.backgroundImage, (s.elements.find((e) => e.type === "image") as any)?.src].filter(Boolean) as string[])
      .filter((u) => u.includes("http")),
    titleWords: new Set(deck.slides.map((s) => s.title.toLowerCase())).size > 0
      ? [...new Set(deck.slides.map((s) => s.title.toLowerCase()))]
      : [],
    recordedAt: Date.now(),
  };
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const hits = a.filter((x) => setB.has(x)).length;
  return hits / Math.max(a.length, b.length);
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  const setB = new Set(b);
  const union = new Set([...a, ...b]);
  const inter = a.filter((x) => setB.has(x)).length;
  return union.size ? inter / union.size : 0;
}

export class PresentationMemory {
  private history: DeckFingerprint[] = [];

  record(deck: Deck, archetype?: string) {
    const fp = fingerprintDeck(deck, archetype);
    this.history.unshift(fp);
    this.history = this.history.slice(0, MAX_HISTORY);
  }

  all(): DeckFingerprint[] {
    return [...this.history];
  }

  mostSimilarTo(topic: string): { fp: DeckFingerprint; score: number } | null {
    if (!this.history.length) return null;
    const th = hashTopic(topic.toLowerCase());
    let best: { fp: DeckFingerprint; score: number } | null = null;
    for (const fp of this.history) {
      if (fp.topicHash === th) {
        const layoutScore = overlap(fp.layouts, fp.layouts);
        const bgScore = overlap(fp.backgrounds, fp.backgrounds);
        const score = Math.round((layoutScore * 0.4 + bgScore * 0.4 + 0.2) * 100);
        if (!best || score > best.score) best = { fp, score };
      }
    }
    if (best) return best;
    const wordSet = new Set(topic.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    let topScore = 0;
    let topFp: DeckFingerprint | null = null;
    for (const fp of this.history) {
      const shared = fp.titleWords.filter((w) => wordSet.has(w)).length;
      const score = shared > 0 ? Math.round((shared / wordSet.size) * 100) : 0;
      if (score > topScore) {
        topScore = score;
        topFp = fp;
      }
    }
    return topFp ? { fp: topFp, score: Math.min(100, topScore) } : null;
  }

  /** True when a recent deck for the same topic would be too similar — signal the director to re-roll. */
  needsRedesign(topic: string, threshold = 55): boolean {
    const sim = this.mostSimilarTo(topic);
    return sim !== null && sim.score >= threshold;
  }

  /** Theme ids used in the last N decks, to exclude from selection. */
  recentThemeIds(n = 6): string[] {
    return [...new Set(this.history.slice(0, n).map((fp) => fp.themeId))].filter(Boolean);
  }

  /** Layouts used heavily in the most similar deck — favor different ones. */
  avoidLayouts(topic: string, maxTop = 4): LayoutType[] {
    const sim = this.mostSimilarTo(topic);
    if (!sim) return [];
    const counts: Record<string, number> = {};
    for (const l of sim.fp.layouts) counts[l] = (counts[l] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTop)
      .map(([l]) => l as LayoutType);
  }
}

export const presentationMemory = new PresentationMemory();
