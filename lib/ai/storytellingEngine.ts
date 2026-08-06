export interface StoryArcStep {
  phase: "Problem" | "Evidence" | "Insight" | "Solution" | "Benefits" | "Implementation" | "Results" | "Future" | "Conclusion";
  title: string;
  narrativeGoal: string;
}

export class StorytellingEngine {
  generateStoryArc(topic: string, slideCount: number): StoryArcStep[] {
    const phases: StoryArcStep["phase"][] = [
      "Problem",
      "Evidence",
      "Insight",
      "Solution",
      "Benefits",
      "Implementation",
      "Results",
      "Future",
      "Conclusion",
    ];

    const steps: StoryArcStep[] = [];
    for (let i = 0; i < slideCount; i++) {
      const phase = phases[i % phases.length];
      steps.push({
        phase,
        title: `${phase}: ${topic}`,
        narrativeGoal: `Guide audience through ${phase.toLowerCase()} for ${topic}`,
      });
    }
    return steps;
  }
}

export const storytellingEngine = new StorytellingEngine();
