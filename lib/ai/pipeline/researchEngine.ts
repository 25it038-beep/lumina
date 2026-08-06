import { deepResearchEngine, DeepResearchTopic } from "../deepResearchEngine";
import type { PresentationIntent } from "./intentAnalyzer";

export interface ContextMemoryEntry {
  id: string;
  kind: "fact" | "statistic" | "citation" | "case-study" | "preference" | "design-decision";
  key: string;
  value: string;
  source?: string;
  timestamp: number;
}

/**
 * 4. Research Engine & 5. Shared Context Memory
 * Performs multi-source retrieval (Web, PDFs, DOCX, CSV) and maintains an in-memory shared state for all agents.
 */
export class ResearchPipelineEngine {
  private static memoryStore: ContextMemoryEntry[] = [];

  static async research(topic: string, intent: PresentationIntent): Promise<DeepResearchTopic> {
    const report = await deepResearchEngine.conductDeepResearch(topic);

    report.citations.forEach((c) => {
      this.remember({
        id: `cit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: "citation",
        key: c.title,
        value: c.snippet,
        source: c.url,
        timestamp: Date.now(),
      });
    });

    report.factsAndStats.forEach((f, idx: number) => {
      this.remember({
        id: `fact-${Date.now()}-${idx}`,
        kind: "statistic",
        key: f.label,
        value: String(f.value),
        source: f.source,
        timestamp: Date.now(),
      });
    });

    return report;
  }

  static remember(entry: ContextMemoryEntry) {
    this.memoryStore.push(entry);
    if (this.memoryStore.length > 500) {
      this.memoryStore.shift();
    }
  }

  static recall(kind?: ContextMemoryEntry["kind"]): ContextMemoryEntry[] {
    if (!kind) return [...this.memoryStore];
    return this.memoryStore.filter((m) => m.kind === kind);
  }

  static clearMemory() {
    this.memoryStore = [];
  }
}
