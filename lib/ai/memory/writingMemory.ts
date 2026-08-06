export interface PersonalWritingMemory {
  brandVoice: string;
  companyName: string;
  preferredTone: string;
  prohibitedWords: string[];
  preferredVocabulary: string[];
  targetAudience: string;
  readingLevel: string;
  defaultFormat: string;
}

const DEFAULT_MEMORY: PersonalWritingMemory = {
  brandVoice: "Authoritative, visionary, & highly technical yet engaging",
  companyName: "Enterprise AI Systems",
  preferredTone: "Deep & Analytical",
  prohibitedWords: ["synergy", "game-changer", "revolutionary", "unprecedented", "paradigm shift"],
  preferredVocabulary: ["architectural foundation", "empirical benchmark", "multi-agent orchestration", "production-grade"],
  targetAudience: "Executive Decision Makers & System Architects",
  readingLevel: "Executive & Professional (Grade 10-12)",
  defaultFormat: "Markdown Document with Callouts & Tables",
};

export class WritingMemoryStore {
  private static STORAGE_KEY = "lumina_writing_memory_v1";

  public static getMemory(): PersonalWritingMemory {
    if (typeof window === "undefined") return DEFAULT_MEMORY;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? { ...DEFAULT_MEMORY, ...JSON.parse(raw) } : DEFAULT_MEMORY;
    } catch {
      return DEFAULT_MEMORY;
    }
  }

  public static saveMemory(memory: Partial<PersonalWritingMemory>): PersonalWritingMemory {
    const current = this.getMemory();
    const updated = { ...current, ...memory };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save memory to localStorage:", e);
      }
    }
    return updated;
  }
}
