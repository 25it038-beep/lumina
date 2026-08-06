import { aiGateway } from "./gateway/AIGateway";
import { planImage, domainFromCategory } from "./imagePlanner";
import { getAIBackgroundStyle, AIBackgroundStyle } from "./aiBackgroundStyles";
import { Slide, OutlineItem } from "../types";

/**
 * Run an async map with a bounded concurrency limit. FLUX requests are slow, so
 * fanning them out (instead of awaiting one at a time) is what lets a whole deck
 * finish instead of only the first slide.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) break;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = undefined as unknown as R;
      }
    }
  };
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Builds a descriptive, content-aware prompt for FLUX-1 Schnell so the generated
 * image is semantically related to the slide it belongs to.
 */
export function buildVisualPrompt(title: string, topic: string, layout?: string, style = "Illustration"): string {
  const clean = [title, topic].filter(Boolean).map((s) => s.trim().replace(/\s+/g, " ")).join(": ");
  return `${clean} — ${layout ?? "slide"} visual, ${style} style, presentation slide background, 8k, highly detailed, cinematic lighting, no text, no watermark`;
}

/**
 * Generates a FLUX image for a slide. Falls back to a deterministic domain-matched
 * stock image if the FLUX endpoint is unavailable.
 */
export async function generateSlideVisual(
  title: string,
  topic: string,
  layout?: string,
  style = "Illustration",
  domainId?: string
): Promise<string> {
  const prompt = buildVisualPrompt(title, topic, layout, style);
  try {
    return await aiGateway.generateFluxBackground(prompt, style);
  } catch {
    return planImage(`${title}:${topic}:${layout}`, domainId ?? domainFromCategory("corporate"), layout, title);
  }
}

/**
 * Layouts that benefit most from a full-bleed generated background image.
 */
export function layoutUsesVisual(layout?: string): boolean {
  if (!layout) return true;
  return [
    "title",
    "hero",
    "title-image",
    "text-image",
    "gallery",
    "section",
    "quote-image",
    "infographic",
    "bento",
    "bento-grid",
  ].includes(layout);
}

/**
 * Builds a prompt for a styled slide background (3D, cosmetics, etc.) using the
 * slide topic/content so each background is unique but on-brand.
 */
export function buildBackgroundPrompt(topic: string, slideTitle: string, style: AIBackgroundStyle): string {
  return `${topic}, ${slideTitle} — ${style.prompt}, presentation slide background, wide 16:9, 8k, no text, no watermark`;
}

/**
 * Generates a FLUX background image for a slide in the requested AI style.
 * Falls back to a deterministic stock background if FLUX is unavailable.
 */
export async function generateSlideBackground(
  topic: string,
  slideTitle: string,
  style: AIBackgroundStyle,
  layout?: string,
  domainId?: string
): Promise<string> {
  const prompt = buildBackgroundPrompt(topic, slideTitle, style);
  try {
    return await aiGateway.generateFluxBackground(prompt, style.label);
  } catch {
    return planImage(`${slideTitle}:${topic}:bg:${style.id}`, domainId ?? domainFromCategory("corporate"), layout, slideTitle);
  }
}