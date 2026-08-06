import { ProviderClient } from "./provider";

export type RewriteMode =
  | "shorter"
  | "longer"
  | "professional"
  | "academic"
  | "marketing"
  | "simple"
  | "creative"
  | "executive-summary"
  | "bullet-points"
  | "improve";

export const REWRITE_MODES: { id: RewriteMode; label: string; icon: string }[] = [
  { id: "improve", label: "Improve", icon: "wand" },
  { id: "shorter", label: "Shorten", icon: "compress" },
  { id: "longer", label: "Expand", icon: "expand" },
  { id: "professional", label: "Professional", icon: "briefcase" },
  { id: "academic", label: "Academic", icon: "graduation-cap" },
  { id: "marketing", label: "Marketing", icon: "megaphone" },
  { id: "simple", label: "Simplify", icon: "circle-dot" },
  { id: "creative", label: "Creative", icon: "palette" },
  { id: "executive-summary", label: "Executive Summary", icon: "file-text" },
  { id: "bullet-points", label: "Bullet Points", icon: "list" },
];

const SYSTEM_PROMPT: Record<RewriteMode, string> = {
  shorter: "Rewrite to be much shorter while keeping all essential meaning. Remove filler words.",
  longer: "Rewrite to be substantially longer, adding detail, context and elaboration while keeping the meaning.",
  professional: "Rewrite in a polished, professional business tone. Confident, clear, and precise.",
  academic: "Rewrite in formal academic style with precise terminology and measured claims.",
  marketing: "Rewrite as persuasive marketing copy. Benefit-driven, energetic, and memorable.",
  simple: "Rewrite in plain, simple language a 12-year-old could understand. Short sentences.",
  creative: "Rewrite creatively with vivid imagery, metaphors and engaging rhythm.",
  "executive-summary": "Rewrite as an executive summary: the essential points in 3-4 crisp sentences.",
  "bullet-points": "Rewrite as clean, parallel bullet points. Each point one line. No markdown asterisks.",
  improve: "Rewrite to be clearer, more fluent and more impactful. Keep the length similar.",
};

export async function rewriteText(
  text: string,
  mode: RewriteMode,
  client: ProviderClient
): Promise<string> {
  if (!text.trim()) return text;

  if (client.providerId === "local") {
    const words = text.split(/\s+/).filter(Boolean);
    switch (mode) {
      case "shorter": {
        const keep = Math.max(8, Math.round(words.length * 0.6));
        return words.slice(0, keep).join(" ").replace(/[,;]\s*$/m, ".") + ".";
      }
      case "longer": {
        const mid = words.slice(0, Math.round(words.length / 2)).join(" ");
        const tail = words.slice(Math.round(words.length / 2)).join(" ");
        return `${mid} — and importantly, this matters because the underlying trend continues to reshape the landscape — ${tail}`;
      }
      case "professional":
        return "Professionally: " + text.charAt(0).toUpperCase() + text.slice(1);
      case "academic":
        return text.charAt(0).toUpperCase() + text.slice(1).replace(/\./g, ". ") + " This assertion is supported by contemporary evidence.";
      case "marketing":
        return `Transform your results: ${text.toLowerCase()}`;
      case "simple":
        return text.replace(/\b(utilize|leverage|facilitate|commence|subsequent)\b/g, (w) =>
          ({ utilize: "use", leverage: "use", facilitate: "help", commence: "start", subsequent: "later" })[w] ?? w
        );
      case "creative":
        return `Picture this: ${text}`;
      case "executive-summary": {
        const first = words.slice(0, Math.min(18, words.length)).join(" ");
        const last = words.slice(-6).join(" ");
        return `${first}. In short, ${last}.`;
      }
      case "bullet-points": {
        const parts = text.split(/[.;]/).filter((p) => p.trim().length > 3);
        return parts.slice(0, 5).map((p) => p.trim().replace(/^\s*[-•*]\s*/, "")).join("\n");
      }
      default:
        return text.trim();
    }
  }

  try {
    const out = await client.chat([
      { role: "system", content: SYSTEM_PROMPT[mode] + " Return only the rewritten text, no explanations." },
      { role: "user", content: text.slice(0, 4000) },
    ]);
    return out.trim();
  } catch {
    return text.trim();
  }
}
