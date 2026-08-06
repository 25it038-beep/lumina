import { WritingTaskPlan } from "../planner/taskPlanner";
import { globalModelRouter, ModelRouteResult } from "../router/modelRouter";

export interface OptimizedPromptBundle {
  rawPrompt: string;
  intent: string;
  taskClassification: string;
  expandedContext: string;
  systemPromptReasoning: string;
  systemPromptWriting: string;
  optimizedPrompt: string;
  route: ModelRouteResult;
}

export function optimizeUserPrompt(rawPrompt: string, plan: WritingTaskPlan): OptimizedPromptBundle {
  const category = globalModelRouter.classifyTaskFromPrompt(rawPrompt);
  const route = globalModelRouter.routeTask(category);

  const expandedContext = `
DOCUMENT SPECIFICATIONS:
- Target Format: ${plan.documentType}
- Target Audience: ${plan.targetAudience} (${plan.expertiseLevel} level)
- Target Tone: ${plan.recommendedTone}
- Word Count Target: ~${plan.targetLengthWords} words
- Primary Sections: ${plan.suggestedSections.join(" | ")}
- Target Keywords: ${plan.targetKeywords.join(", ")}
`;

  const systemPromptReasoning = `You are DeepSeek R1/V3, an elite reasoning & logic engine.
Your sole mission is to analyze the task, build a flawless structural outline, map out logical arguments, synthesize data points, and anticipate counter-points.
Format your output with clear markdown headings, bulleted logic points, and explicit reasoning steps.`;

  const systemPromptWriting = `You are Meta LLaMA 3.3 70B, a world-class prose craftsman and master communicator.
Your mission is to take structured outlines and transform them into brilliant, highly engaging, crystal-clear content with compelling rhythm, impeccable tone, and professional elegance.`;

  const optimizedPrompt = `
TASK: Write a master-level ${plan.documentType} on the following request:
"${rawPrompt}"

REQUIRED SECTIONS TO COVER:
${plan.suggestedSections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

STRICT GUIDELINES:
1. Ensure deep analytical depth with concrete examples.
2. Maintain the ${plan.recommendedTone} tone tailored for ${plan.targetAudience}.
3. Include well-structured subheadings, callouts, and clean markdown tables where useful.
4. Avoid fluff, repetitive intros, or generic corporate filler.
`;

  return {
    rawPrompt,
    intent: plan.userIntent,
    taskClassification: category,
    expandedContext,
    systemPromptReasoning,
    systemPromptWriting,
    optimizedPrompt: optimizedPrompt.trim(),
    route,
  };
}
