"use server";

import { aiGateway } from "@/lib/ai/gateway";

export async function generateDesignForTopic(topic: string, slideCount: number = 10) {
  const prompt = `
    Conduct thorough research and create a detailed presentation outline for the topic: "${topic}".
    Generate approximately ${slideCount} slides.
    For each slide, provide a comprehensive title, a specific layout, and detailed speaker notes/content points.
    
    Return the result strictly as a JSON object with this structure:
    {
      "title": string,
      "subtitle": string,
      "slides": [
        {
          "title": string,
          "layout": "title" | "title-image" | "two-columns" | "hero" | "content" | "agenda" | "conclusion" | "statistics" | "key-takeaways",
          "notes": string,
          "contentPoints": string[]
        }
      ]
    }
  `;

  const response = await aiGateway.executeTask("generate_outline", [{ role: "user", content: prompt }]);
  
  try {
    const outline = JSON.parse(response);
    return outline;
  } catch (e) {
    console.error("Failed to parse AI design:", e);
    return null;
  }
}
