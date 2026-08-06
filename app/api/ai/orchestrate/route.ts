import { NextRequest, NextResponse } from "next/server";
import { MultiAgentOrchestrator } from "@/lib/ai/agents/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode, tone } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const orchestrator = new MultiAgentOrchestrator();
    const result = await orchestrator.executePipeline(prompt, undefined, { mode, customTone: tone });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Orchestrator execution error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute orchestration pipeline" }, { status: 500 });
  }
}
