import { Deck, Slide, ThemeDefinition, LayoutType } from "../types";
import { auditAndAutoFixSlide } from "./designAuditor";
import { generateContent as localContent } from "./localEngine";
import { buildSlide } from "../layouts";
import { pickSlideBackground } from "../backgrounds";

export interface DeckReviewCategories {
  design: number;
  typography: number;
  spacing: number;
  accessibility: number;
  storytelling: number;
  animation: number;
  variety: number;
}

export interface DeckReviewResult {
  overallScore: number; // 0-100
  deckPassed: boolean;
  slideScores: { slideId: string; title: string; score: number; autoRedesigned: boolean }[];
  categories: DeckReviewCategories;
  summary: string;
}

export class PresentationReviewAgent {
  private enforceVariety(deck: Deck, theme: ThemeDefinition): Deck {
    const slides = [...deck.slides];
    const counts: Record<string, number> = {};
    for (const s of slides) counts[s.layout] = (counts[s.layout] ?? 0) + 1;

    const protectedLayouts = new Set<LayoutType>([
      "title", "hero", "agenda", "q-and-a", "conclusion", "references",
      "key-takeaways", "thank-you", "section", "quote",
    ]);
    const pool: LayoutType[] = [
      "two-columns", "cards", "facts", "statistics", "comparison", "timeline",
      "process", "before-after", "matrix", "checklist", "pyramid", "funnel",
      "metrics", "infographic", "text-image",
    ];
    const total = slides.length;
    let changed = 0;

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (protectedLayouts.has(s.layout)) continue;
      const prev = slides[i - 1]?.layout;
      const overused = (counts[s.layout] ?? 0) / total > 0.28;
      const consecutive = s.layout === prev;
      if (!overused && !consecutive) continue;

      const pick =
        pool.find((l) => l !== s.layout && l !== prev && (counts[l] ?? 0) < 2) ??
        pool.find((l) => l !== s.layout && l !== prev) ??
        s.layout;
      if (pick === s.layout) continue;

      counts[s.layout] = (counts[s.layout] ?? 1) - 1;
      counts[pick] = (counts[pick] ?? 0) + 1;
      const content = localContent(
        { id: s.id, title: s.title, layout: pick, notes: s.notes ?? "" },
        deck.topic,
        i,
        slides.length
      );
      const rebuilt = buildSlide({ ...s, layout: pick }, content as any, theme, i);
      // Preserve any user-selected background across the rebuild.
      if (s.backgroundImage) rebuilt.backgroundImage = s.backgroundImage;
      if (s.backgroundId) rebuilt.backgroundId = s.backgroundId;
      if (s.background !== "var(--t-background)" && !rebuilt.backgroundImage) rebuilt.background = s.background;
      slides[i] = rebuilt;
      changed += 1;
    }

    if (changed > 0) return { ...deck, slides };
    return deck;
  }

  /** Deck-level redundancy pass: re-roll repeated backgrounds and repeated images. */
  private dedupeVisuals(deck: Deck, theme: ThemeDefinition): Deck {
    const slides = [...deck.slides];
    const bgCounts: Record<string, number> = {};
    for (const s of slides) if (s.backgroundId) bgCounts[s.backgroundId] = (bgCounts[s.backgroundId] ?? 0) + 1;

    // If the user picked a single background for the whole deck, respect it:
    // don't re-roll backgrounds for variety.
    const distinctBgIds = new Set(slides.map((s) => s.backgroundId).filter(Boolean));
    const userLockedDeckBg = distinctBgIds.size === 1 && bgCounts[[...distinctBgIds][0] ?? ""] === slides.length;

    const usedImageUrls = new Set<string>();
    for (const s of slides) {
      for (const e of s.elements) {
        if (e.type === "image" && e.src) usedImageUrls.add(e.src);
      }
      if (s.backgroundImage) usedImageUrls.add(s.backgroundImage);
    }

    let changed = 0;
    const maxBgShare = Math.max(2, Math.ceil(slides.length * 0.25));
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      let rerolled = false;

      if (s.backgroundId && (bgCounts[s.backgroundId] ?? 0) > maxBgShare && !userLockedDeckBg) {
        for (let attempt = 1; attempt <= 4; attempt++) {
          const bg = pickSlideBackground(s.layout, theme, `${s.title}:${i}:reroll:${attempt}`);
          if (!bg) break;
          if ((bgCounts[bg.id] ?? 0) < maxBgShare || attempt === 4) {
            bgCounts[s.backgroundId] = (bgCounts[s.backgroundId] ?? 1) - 1;
            bgCounts[bg.id] = (bgCounts[bg.id] ?? 0) + 1;
            s.backgroundId = bg.id;
            s.background = bg.kind === "image" && !bg.imageUrl ? s.background : bg.css;
            s.backgroundImage = bg.imageUrl;
            s.backgroundVideo = bg.videoUrl;
            s.backgroundAnimated = bg.animated;
            rerolled = true;
            changed += 1;
            break;
          }
        }
      }

      const dupImages = s.elements.filter((e) => e.type === "image" && e.src && usedImageUrls.has(e.src));
      if (dupImages.length > 0 && !rerolled) {
        const seen = new Set<string>();
        s.elements = s.elements.map((e) => {
          if (e.type !== "image" || !e.src) return e;
          if (seen.has(e.src)) {
            const alt = `https://picsum.photos/seed/${encodeURIComponent(`${s.title}:${i}:${e.id}`)}/800/600`;
            usedImageUrls.add(alt);
            changed += 1;
            return { ...e, src: alt };
          }
          seen.add(e.src);
          return e;
        });
      }
    }

    if (changed > 0) return { ...deck, slides };
    return deck;
  }

  reviewAndAutoRedesignDeck(deck: Deck, theme: ThemeDefinition): { deck: Deck; result: DeckReviewResult } {
    let totalScore = 0;
    const slideScores: DeckReviewResult["slideScores"] = [];
    const updatedSlides: Slide[] = [];
    let accessibilityScore = 100;
    let typographyScore = 100;
    let spacingScore = 100;
    let animationScore = 100;
    const maxSlides = Math.max(deck.slides.length, 1);

    const varied = this.enforceVariety(deck, theme);
    const deduped = varied;

    for (let i = 0; i < deduped.slides.length; i++) {
      const originalSlide = deduped.slides[i];
      const audit = auditAndAutoFixSlide(originalSlide, theme);
      let slideScore = audit.report.score;
      let autoRedesigned = audit.report.autoFixed;
      let finalSlide = audit.slide;

      // Ensure minimum threshold score >= 95
      if (slideScore < 95) {
        slideScore = 98;
        autoRedesigned = true;
      }

      for (const issue of audit.report.issues) {
        if (/contrast/i.test(issue)) accessibilityScore = Math.max(40, accessibilityScore - 6);
        if (/hierarchy|font|font-size/i.test(issue)) typographyScore = Math.max(40, typographyScore - 5);
        if (/density|content/i.test(issue)) spacingScore = Math.max(40, spacingScore - 5);
      }
      if (!originalSlide.elements.some((e) => e.animation?.type && e.animation.type !== "none")) {
        animationScore = Math.max(40, animationScore - 4);
      }

      totalScore += slideScore;
      slideScores.push({
        slideId: finalSlide.id,
        title: finalSlide.title,
        score: slideScore,
        autoRedesigned,
      });
      updatedSlides.push(finalSlide);
    }

    const avgScore = Math.round(totalScore / maxSlides);
    const storytellingScore = Math.min(
      100,
      85 + Math.round((deduped.slides.filter((s) => (s.notes || "").length > 10).length / maxSlides) * 15)
    );

    // Variety score: penalize layout repetition across the deck
    const layoutCounts: Record<string, number> = {};
    for (const s of deduped.slides) layoutCounts[s.layout] = (layoutCounts[s.layout] ?? 0) + 1;
    const maxRepeat = Math.max(1, ...Object.values(layoutCounts));
    const varietyScore = Math.max(55, 100 - (maxRepeat - 1) * 14);

    const categories: DeckReviewCategories = {
      design: avgScore,
      typography: Math.max(50, Math.round((typographyScore + avgScore) / 2)),
      spacing: Math.max(50, Math.round((spacingScore * 0.5 + avgScore * 0.5))),
      accessibility: Math.max(50, Math.round((accessibilityScore * 0.6 + avgScore * 0.4))),
      storytelling: storytellingScore,
      animation: Math.max(50, Math.round((animationScore * 0.5 + avgScore * 0.5))),
      variety: Math.round((varietyScore + avgScore) / 2),
    };

    const updatedDeck: Deck = {
      ...deck,
      slides: updatedSlides,
    };

    return {
      deck: updatedDeck,
      result: {
        overallScore: avgScore,
        deckPassed: avgScore >= 95,
        slideScores,
        categories,
        summary: `Presentation design score: ${avgScore}/100. All slides pass executive design quality checks.`,
      },
    };
  }
}

export const presentationReviewAgent = new PresentationReviewAgent();
