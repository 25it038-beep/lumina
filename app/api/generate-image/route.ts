import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway/AIGateway";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Body {
  prompt: string;
  style?: string;
  seed?: number;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  const style = (body.style ?? "Illustration").trim();

  try {
    const url = await aiGateway.generateFluxBackground(prompt, style);
    return NextResponse.json({ url, model: "flux-1-schnell" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
