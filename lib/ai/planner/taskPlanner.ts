export interface WritingTaskPlan {
  userIntent: string;
  writingGoal: string;
  targetAudience: string;
  expertiseLevel: "Beginner" | "Intermediate" | "Expert" | "Executive";
  documentType: "Blog Post" | "Technical Essay" | "Marketing Copy" | "Executive Brief" | "Research Paper" | "Social Post" | "Documentation";
  suggestedSections: string[];
  recommendedTone: string;
  targetLengthWords: number;
  language: string;
  targetKeywords: string[];
  identifiedGaps: string[];
  executionStrategy: string;
}

export function planWritingTask(prompt: string, userTonePreference?: string): WritingTaskPlan {
  const p = prompt.toLowerCase();
  
  let docType: WritingTaskPlan["documentType"] = "Blog Post";
  if (p.includes("technical") || p.includes("architecture") || p.includes("code") || p.includes("api")) {
    docType = "Technical Essay";
  } else if (p.includes("executive") || p.includes("brief") || p.includes("proposal") || p.includes("strategy")) {
    docType = "Executive Brief";
  } else if (p.includes("ad ") || p.includes("landing page") || p.includes("copy") || p.includes("marketing") || p.includes("sales")) {
    docType = "Marketing Copy";
  } else if (p.includes("paper") || p.includes("research") || p.includes("study") || p.includes("academic")) {
    docType = "Research Paper";
  } else if (p.includes("tweet") || p.includes("linkedin") || p.includes("post")) {
    docType = "Social Post";
  }

  let wordCount = 1200;
  if (docType === "Social Post") wordCount = 300;
  if (docType === "Executive Brief") wordCount = 800;
  if (docType === "Research Paper" || docType === "Technical Essay") wordCount = 2000;

  const suggestedSections: string[] = [];
  if (docType === "Executive Brief") {
    suggestedSections.push("Executive Summary", "Strategic Context", "Key Findings & Data", "Actionable Recommendations", "Next Steps");
  } else if (docType === "Technical Essay") {
    suggestedSections.push("Introduction & Problem Statement", "Architectural Blueprint", "Deep Technical Breakdown", "Implementation Considerations", "Conclusion");
  } else if (docType === "Marketing Copy") {
    suggestedSections.push("The Core Challenge", "The Breakthrough Solution", "Key Benefits & Features", "Social Proof & Results", "Call to Action");
  } else {
    suggestedSections.push("Introduction", "Key Takeaways & Core Concepts", "In-Depth Analysis & Practical Examples", "Future Outlook & Final Thoughts");
  }

  const keywords = prompt
    .split(/\s+/)
    .filter((w) => w.length > 4 && !["about", "which", "should", "would", "could", "write", "create"].includes(w.toLowerCase()))
    .slice(0, 5);

  return {
    userIntent: `Create a high-impact ${docType} addressing: "${prompt}"`,
    writingGoal: `Produce authoritative, comprehensive content optimized for reader retention & clarity.`,
    targetAudience: docType === "Executive Brief" ? "C-Suite & Decision Makers" : docType === "Technical Essay" ? "Engineers & System Architects" : "General Tech & Business Readers",
    expertiseLevel: docType === "Technical Essay" ? "Expert" : docType === "Executive Brief" ? "Executive" : "Intermediate",
    documentType: docType,
    suggestedSections,
    recommendedTone: userTonePreference || (docType === "Executive Brief" ? "Authoritative & Concise" : docType === "Technical Essay" ? "Deep & Analytical" : "Engaging & Persuasive"),
    targetLengthWords: wordCount,
    language: "English (US)",
    targetKeywords: keywords,
    identifiedGaps: ["Real-world benchmarks & data points", "Specific domain examples", "Counter-arguments & mitigation"],
    executionStrategy: `Phase 1: DeepSeek R1 structural logic & CoT outline. Phase 2: LLaMA 3.3 tone & narrative prose synthesis. Phase 3: Fact verification & quality scoring.`,
  };
}
