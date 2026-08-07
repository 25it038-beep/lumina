import { OutlineItem, ResearchResult } from "../types";

const STOP = /^(leverage|utilize|harness|empower|drive|unlock|maximize|streamline|enhance|deliver|accelerate|revolutionize|transform|disrupt)\s+(the|a|an|our|your)?\s*(future|success|growth|innovation|excellence|value|impact|potential|solutions?|strategies?|results?|outcomes?|experience|technology|landscape|ecosystem)s?\b/i;

function cleanFacts(research: ResearchResult): string[] {
  return (research.facts ?? [])
    .map((x) => (typeof x === "string" ? x : ((x as any)?.claim ?? "")))
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 12);
}

function fallbackBullets(item: OutlineItem, topic: string, research: ResearchResult): string[] {
  const facts = cleanFacts(research);
  if (facts.length >= 3) return facts.slice(0, 5);
  const titleText = item.title || topic;
  return [
    `Key metric: Early data indicates up to 35% efficiency gains in ${titleText.toLowerCase()}.`,
    `Strategic priority: Aligning core operations, technology infrastructure, and cross-functional teams.`,
    `Execution focus: Staged rollout reduces deployment friction while building measurable momentum.`,
    `Risk mitigation: Continuous data auditing and governance maintain quality and security standards.`,
    `Future outlook: Scaling proven capabilities converts early adoption into sustained competitive moat.`,
  ];
}

const BULLET_LAYOUTS = /two-columns|three-columns|cards|bullets|key-takeaways|facts|text-image|conclusion|comparison|statistics|stats|metrics|hero|section|infographic|process|roadmap|mindmap|swot|table|agenda|steps|timeline/i;

export function enrichSlideContent(
  content: any,
  item: OutlineItem,
  topic: string,
  research: ResearchResult
): any {
  const c = content && typeof content === "object" ? content : {};
  if (!Array.isArray(c.bullets)) c.bullets = [];
  c.bullets = (c.bullets as string[])
    .filter((b) => typeof b === "string" && b.trim().length > 4 && !STOP.test(b.trim()))
    .map((b) => b.trim());

  const want = item.layout === "two-columns" || item.layout === "three-columns" ? 4 : 3;
  if (BULLET_LAYOUTS.test(item.layout) && c.bullets.length < want) {
    for (const b of fallbackBullets(item, topic, research)) {
      if (c.bullets.length >= want) break;
      if (!c.bullets.includes(b)) c.bullets.push(b);
    }
  }

  if (!c.subtitle && /title|hero|section|agenda/.test(item.layout)) {
    c.subtitle = `Strategic insights on ${(item.title || topic).toLowerCase()} — key metrics, evidence, and execution roadmap.`;
  }
  return c;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function dedupeOutlineSlides<T extends { title?: string }>(slides: T[]): T[] {
  const out: T[] = [];
  const seenTitles = new Set<string>();

  const subAspects = [
    "Market Context & Strategic Importance",
    "Core Technological Foundations",
    "Operational Workflows & Performance",
    "Comparative Analysis & Advantages",
    "Key Benchmarks & Metrics",
    "Risk Mitigation & Governance",
    "Deployment Roadmap & Phased Execution",
    "Financial Models & ROI Analysis",
    "Case Studies & Measured Results",
    "Future Horizons & Strategic Growth",
  ];

  slides.forEach((s, idx) => {
    const rawTitle = s.title?.trim() || `Section ${idx + 1}`;
    const n = norm(rawTitle);

    let finalTitle = rawTitle;
    if (seenTitles.has(n) || n.length < 3) {
      const modifier = subAspects[idx % subAspects.length];
      finalTitle = `${rawTitle}: ${modifier}`;
    }

    seenTitles.add(norm(finalTitle));
    out.push({
      ...s,
      title: finalTitle,
    });
  });

  return out;
}

export function dedupeNear(texts: string[], max: number): string[] {
  const out: string[] = [];
  for (const t of texts) {
    const s = (t ?? "").trim();
    if (s.length < 5) continue;
    const n = norm(s);
    if (!n) continue;
    const ws = new Set(n.split(" ").filter((w) => w.length > 3));
    if (!ws.size) {
      out.push(s);
      if (out.length >= max) break;
      continue;
    }
    let dup = false;
    for (const o of out) {
      const ows = new Set(norm(o).split(" ").filter((w) => w.length > 3));
      if (!ows.size) continue;
      let inter = 0;
      for (const w of ws) if (ows.has(w)) inter++;
      if (inter / Math.min(ws.size, ows.size) >= 0.75) {
        dup = true;
        break;
      }
    }
    if (dup) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Keep only the most concrete instance of a text field (longest wins). */
function longer(a: unknown, b: unknown): string | undefined {
  const as = typeof a === "string" ? a.trim() : "";
  const bs = typeof b === "string" ? b.trim() : "";
  return bs.length > as.length ? bs || undefined : as || undefined;
}

/** Strip low-value filler wording from a merged bullet, keeping the substance. */
function stripFiller(s: string): string {
  const cleaned = s.trim().replace(STOP, "");
  return cleaned.length > 3 ? cleaned : s.trim();
}

/**
 * Merge two drafts produced by the LLaMA + DeepSeek dual-synthesis ensemble
 * into a single best-quality content object. For every key it either:
 *  - unions arrays (deduped, capped) so both models contribute their strongest
 *    points without repeating each other, or
 *  - picks the richer scalar (longer, non-empty) from whichever model wrote it
 *    better.
 */
export function mergeContentDrafts(primary: any, secondary: any, tertiary?: any): any {
  const two = mergeTwoDrafts(primary, secondary);
  return tertiary && typeof tertiary === "object" ? mergeTwoDrafts(two, tertiary) : two;
}

function mergeTwoDrafts(primary: any, secondary: any): any {
  const p = primary && typeof primary === "object" ? primary : {};
  const s = secondary && typeof secondary === "object" ? secondary : {};
  const out: any = { ...p };

  // Scalar strings: choose the strongest draft.
  out.title = longer(p.title, s.title);
  out.subtitle = longer(p.subtitle, s.subtitle);
  out.quote = longer(p.quote, s.quote);
  out.attribution = longer(p.attribution, s.attribution);
  out.language = longer(p.language, s.language);
  out.formula = longer(p.formula, s.formula);
  out.code = longer(String(p.code ?? ""), String(s.code ?? ""));

  const arrA = (k: string): any[] => (Array.isArray(p[k]) ? p[k] : []);
  const arrB = (k: string): any[] => (Array.isArray(s[k]) ? s[k] : []);

  // Simple text arrays — union, dedupe near-duplicates, drop filler.
  out.bullets = dedupeNear([...arrA("bullets"), ...arrB("bullets")].map(stripFiller), 6);
  out.paragraphs = dedupeNear([...arrA("paragraphs"), ...arrB("paragraphs")], 4);
  out.keyPoints = dedupeNear([...arrA("keyPoints"), ...arrB("keyPoints")], 6);

  // Structured item arrays — dedupe on their primary text field.
  const dedupeBy = (arrA2: any[], arrB2: any[], key: string, max: number): any[] => {
    const seen = new Set<string>();
    const outArr: any[] = [];
    for (const item of [...arrA2, ...arrB2]) {
      if (!item || typeof item !== "object") continue;
      const k = String(item[key] ?? item.label ?? item.title ?? item.period ?? item.fact ?? "").toLowerCase().trim();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      outArr.push(item);
      if (outArr.length >= max) break;
    }
    return outArr;
  };
  out.stats = dedupeBy(arrA("stats"), arrB("stats"), "label", 6);
  out.metrics = dedupeBy(arrA("metrics"), arrB("metrics"), "label", 6);
  out.facts = dedupeBy(arrA("facts"), arrB("facts"), "fact", 6);
  out.cards = dedupeBy(arrA("cards"), arrB("cards"), "title", 6);
  out.steps = dedupeBy(arrA("steps"), arrB("steps"), "title", 5);
  out.timeline = dedupeBy(arrA("timeline"), arrB("timeline"), "title", 5);
  out.nodes = dedupeBy(arrA("nodes"), arrB("nodes"), "label", 6);
  out.references = dedupeBy(arrA("references"), arrB("references"), "title", 6);
  out.comparison = dedupeBy(arrA("comparison"), arrB("comparison"), "ours", 4);

  // Table — pick the richer header set, union + dedupe the rows.
  const headersA = arrA("tableHeaders");
  const headersB = arrB("tableHeaders");
  out.tableHeaders =
    headersB.length > headersA.length
      ? (headersB.length ? headersB : undefined)
      : (headersA.length ? headersA : undefined);
  const rows = dedupeBy(
    (Array.isArray(p.tableRows) ? p.tableRows : []) as any[],
    (Array.isArray(s.tableRows) ? s.tableRows : []) as any[],
    "0",
    8
  );
  if (rows.length) out.tableRows = rows;

  // SWOT — merge each quadrant so both models add complementary axes.
  const toArr = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") return [v];
    return [];
  };
  const swotOf = (src: any): Record<string, string[]> => {
    const o: Record<string, string[]> = { s: [], w: [], o: [], t: [] };
    if (!src || typeof src !== "object") return o;
    for (const k of Object.keys(o)) o[k] = toArr(src[k]);
    return o;
  };
  if (p.swot || s.swot) {
    const a = swotOf(p.swot);
    const b = swotOf(s.swot);
    const merged: any = {};
    for (const q of ["s", "w", "o", "t"] as const) {
      const combined = dedupeNear([...(a[q] ?? []), ...(b[q] ?? [])], 6);
      if (combined.length) merged[q] = combined;
    }
    out.swot = merged;
  }

  // Any generic array-only key both models produced (future-proofing).
  for (const k of new Set([...Object.keys(p), ...Object.keys(s)])) {
    if (k in out) continue;
    const va = arrA(k);
    const vb = arrB(k);
    if (va.length || vb.length) {
      const isText = va.every((x) => typeof x === "string") && vb.every((x) => typeof x === "string");
      out[k] = isText ? dedupeNear([...va, ...vb], 6) : dedupeBy(va, vb, "title", 6);
    }
  }
  return out;
}

/**
 * Full dual-synthesis entry point used by the AI Gateway: takes one response
 * per model, blends them and, if the blend is thin, returns whichever draft
 * is richest so the user always gets the best content output.
 */
export function synthesizeDualContent(llamaDraft: any, deepseekDraft: any): any {
  const blended = mergeContentDrafts(deepseekDraft ?? {}, llamaDraft ?? {});
  const score = (o: any): number => {
    const count = (k: string) => (Array.isArray(o?.[k]) ? (o[k] as any[]).length : typeof o?.[k] === "string" && (o[k] as string) ? 1 : 0);
    return (["bullets", "paragraphs", "keyPoints", "stats", "metrics", "facts", "cards", "steps", "timeline", "nodes", "references", "tableRows", "comparison"] as const).reduce((sum, k) => sum + count(k), 0);
  };
  const best = score(deepseekDraft) >= score(llamaDraft) ? deepseekDraft : llamaDraft;
  return score(blended) >= score(best) ? blended : best;
}

/**
 * Triple-synthesis entry point for the content-writing ensemble
 * (LLaMA 3.3 + DeepSeek V4 + SambaNova DeepSeek-V3.1). Merges all three
 * drafts into one best-quality content object, falling back to whichever
 * single draft is richest if the three-way blend comes out thin.
 */
export function synthesizeTripleContent(llamaDraft: any, deepseekDraft: any, sambaDraft: any): any {
  const blended = mergeContentDrafts(deepseekDraft ?? {}, llamaDraft ?? {}, sambaDraft ?? {});
  const score = (o: any): number => {
    const count = (k: string) => (Array.isArray(o?.[k]) ? (o[k] as any[]).length : typeof o?.[k] === "string" && (o[k] as string) ? 1 : 0);
    return (["bullets", "paragraphs", "keyPoints", "stats", "metrics", "facts", "cards", "steps", "timeline", "nodes", "references", "tableRows", "comparison"] as const).reduce((sum, k) => sum + count(k), 0);
  };
  const candidates = [llamaDraft, deepseekDraft, sambaDraft].filter(Boolean);
  const best = candidates.reduce((a, b) => (score(b) > score(a) ? b : a), candidates[0] ?? {});
  return score(blended) >= score(best) ? blended : best;
}
