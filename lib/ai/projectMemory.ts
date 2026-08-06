export interface ProjectMemoryState {
  title: string;
  topic: string;
  audience: string;
  tone: string;
  themeId: string;
  citationsCount: number;
  generatedVisualsCount: number;
  lastUpdated: number;
}

class ProjectMemoryManager {
  private memory: ProjectMemoryState = {
    title: "",
    topic: "",
    audience: "General Audience",
    tone: "Professional",
    themeId: "corporate",
    citationsCount: 0,
    generatedVisualsCount: 0,
    lastUpdated: Date.now(),
  };

  updateMemory(patch: Partial<ProjectMemoryState>) {
    this.memory = { ...this.memory, ...patch, lastUpdated: Date.now() };
  }

  setAudience(audience: string) {
    this.updateMemory({ audience });
  }

  getMemory(): ProjectMemoryState {
    return { ...this.memory };
  }

  getSystemContext(): string {
    return `[Project Memory Context]
Title: ${this.memory.title || "Untitled"}
Topic: ${this.memory.topic || "General"}
Target Audience: ${this.memory.audience}
Tone: ${this.memory.tone}
Active Theme: ${this.memory.themeId}
Citations: ${this.memory.citationsCount}`;
  }
}

export const projectMemory = new ProjectMemoryManager();
