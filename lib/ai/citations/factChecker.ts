export interface ParagraphFactAudit {
  paragraphIndex: number;
  confidenceScore: number; // 0 - 100
  explanation: string;
}

const HEDGE_WORDS = [
  "maybe", "perhaps", "probably", "possibly", "could be", "might be", "apparently",
  "seems", "reportedly", "allegedly", "sort of", "kind of", "i think", "i believe",
  "some claim", "it is said", "they say", "estimates suggest",
];

const UNVERIFIED_MARKERS = [
  "100%", "guaranteed", "always", "never", "no one", "everyone", "literally",
  "best ever", "world record", "revolutionary", "miraculous", "secret trick",
];

const NUMERIC_PATTERN = /(?:\d[\d,]*\.?\d*)\s*(?:%|million|billion|trillion|thousand|people|users|dollars|years)/i;
const CITATION_PATTERN = /(?:\[\d+\]|\(\d{4}\)|according to|per (?:the )?[A-Z]|source:|cited in|doi|arxiv|nber|pmid|plos|nature\.com|sciencedirect)/i;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);
}

function auditParagraph(paragraph: string, index: number): ParagraphFactAudit {
  const lower = paragraph.toLowerCase();
  const words = paragraph.split(/\s+/).filter(Boolean);
  const sentenceCount = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  let score = 78;

  if (CITATION_PATTERN.test(paragraph)) score += 12;
  if (NUMERIC_PATTERN.test(paragraph)) score += 8;
  if (sentenceCount >= 3 && sentenceCount <= 7) score += 4;
  if (words.length < 8) score += 3;

  const hedgeHits = HEDGE_WORDS.filter((w) => lower.includes(w));
  const unverifiedHits = UNVERIFIED_MARKERS.filter((w) => lower.includes(w));

  score -= hedgeHits.length * 7;
  score -= unverifiedHits.length * 9;

  if (paragraph.toUpperCase() === paragraph && words.length > 5) score -= 15;
  const oddChars = (paragraph.match(/[!?]{2,}/g) || []).length;
  score -= oddChars * 4;

  const confidenceScore = Math.max(10, Math.min(98, score));

  const explanation = buildExplanation(hedgeHits, unverifiedHits, citationCount(paragraph), NUMERIC_PATTERN.test(paragraph), sentenceCount);

  return { paragraphIndex: index, confidenceScore, explanation };
}

function citationCount(paragraph: string): number {
  return (paragraph.match(CITATION_PATTERN) || []).length;
}

function buildExplanation(
  hedgeHits: string[],
  unverifiedHits: string[],
  citations: number,
  hasNumerics: boolean,
  sentences: number
): string {
  const parts: string[] = [];
  if (hedgeHits.length) parts.push(`Hedging language detected (“${hedgeHits.slice(0, 2).join(", ")}”)`);
  if (unverifiedHits.length) parts.push(`Absolute claims without sources (“${unverifiedHits.slice(0, 2).join(", ")}”)`);
  if (citations === 0 && hasNumerics) parts.push("Numbers present but no citation found");
  if (citations > 0) parts.push(`${citations} citation marker${citations > 1 ? "s" : ""} found`);
  if (sentences < 3) parts.push("Short paragraph — low claim density");
  if (parts.length === 0) parts.push("No unsupported claims detected");
  return parts.join("; ") + ".";
}

export const FactChecker = {
  auditDocument(text: string): ParagraphFactAudit[] {
    return splitParagraphs(text).map(auditParagraph);
  },

  auditParagraph(text: string, index = 0): ParagraphFactAudit {
    return auditParagraph(text.trim(), index);
  },
};
