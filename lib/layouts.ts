import {
  LayoutType,
  Slide,
  SlideElement,
  ThemeDefinition,
  OutlineItem,
  DataPoint,
} from "./types";
import { auditAndAutoFixSlide } from "./ai/designAuditor";
import { generateDynamicBackground } from "./ai/dynamicBackgrounds";
import { planImage, domainFromCategory } from "./ai/imagePlanner";
import { planIllustration } from "./ai/illustrationPlanner";
import { planAnimations } from "./ai/animationPlanner";
import { pickSlideBackground } from "./backgrounds";
import { resolveThemeTokens } from "./themes";

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export const RELIABLE_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
];

export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic per seed (slide title + index), varied across decks, reliable to load.
export function pickImage(seed: string, w = 1200, h = 800): string {
  const i = hashString(seed) % 5;
  if (i === 0) return RELIABLE_IMAGES[hashString(seed) % RELIABLE_IMAGES.length];
  return `https://picsum.photos/seed/${encodeURIComponent(seed.slice(0, 60))}/${w}/${h}`;
}

interface Content {
  title: string;
  subtitle?: string;
  bullets?: string[];
  paragraphs?: string[];
  stats?: DataPoint[];
  image?: string;
  quote?: string;
  attribution?: string;
  code?: string;
  language?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  timeline?: { period: string; title: string; desc: string }[];
  roadmap?: { phase: string; title: string; desc: string }[];
  comparison?: { title: string; items: { ours: string; theirs: string }[] };
  steps?: { title: string; desc: string }[];
  metrics?: { value: string; label: string; delta?: string }[];
  cards?: { title: string; desc: string; icon?: string }[];
  swot?: { s: string[]; w: string[]; o: string[]; t: string[] };
  references?: { title: string; url: string; source: string }[];
  questions?: string[];
  formula?: string;
  nodes?: { label: string; icon?: string }[];
  edgeLabels?: string[];
  imageUrl?: string;
  youtubeUrl?: string;
  galleryImages?: string[];
  team?: { name: string; role: string }[];
  keyPoints?: string[];
  facts?: { fact: string; icon?: string }[];
  icons?: string[];
  chartType?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function makeElement(
  partial: Partial<SlideElement> & Pick<SlideElement, "type">
): SlideElement {
  return {
    id: uid(),
    name: partial.type,
    position: { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
    style: {},
    animation: { type: "fade-up", duration: 0.6, delay: 0 },
    locked: false,
    visible: true,
    zIndex: 0,
    ...partial,
  } as SlideElement;
}

export function heading(
  text: string,
  x: number,
  y: number,
  w: number,
  fontSize = 56
): SlideElement {
  return makeElement({
    type: "heading",
    content: text,
    position: { x, y, width: w, height: fontSize * 1.3, rotation: 0 },
    style: { fontSize, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.15 },
    animation: { type: "fade-up", duration: 0.6, delay: 0.05 },
    name: "Title",
  });
}

export function subtitle(text: string, x: number, y: number, w: number, fontSize = 24): SlideElement {
  return makeElement({
    type: "subtitle",
    content: text,
    position: { x, y, width: w, height: 60, rotation: 0 },
    style: { fontSize, fontWeight: 400, color: "var(--t-muted)", lineHeight: 1.5 },
    animation: { type: "fade-up", duration: 0.6, delay: 0.15 },
    name: "Subtitle",
  });
}

export function bodyText(
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize = 20,
  fontWeight = 400,
  align: "left" | "center" | "right" = "left"
): SlideElement {
  return makeElement({
    type: "text",
    content: text,
    position: { x, y, width: w, height: h, rotation: 0 },
    style: { fontSize, fontWeight, color: "var(--t-text)", lineHeight: 1.6, textAlign: align },
    animation: { type: "fade-up", duration: 0.6, delay: 0.25 },
    name: "Text",
  });
}

/** Estimate the wrapped height of a text block so boxes grow instead of overlapping. */
export function textHeight(text: string, width: number, fontSize: number, lineHeight = 1.6, pad = 6): number {
  const charsPerLine = Math.max(1, Math.floor(width / (fontSize * 0.55)));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.ceil(lines * fontSize * lineHeight + pad);
}

/**
 * Collision-resolution pass for text-bearing elements. Because slides are built
 * from estimated line wraps, longer content can overflow a box and make text
 * overlap in the exported PPTX / PDF / image. This pass:
 *   1. recomputes each text box's real height (multi-line aware),
 *   2. pushes any vertically-overlapping element below the one above it,
 *   3. clamps boxes that would spill off the bottom of the slide.
 */
export function resolveTextOverlaps<T extends Slide>(slide: T): T {
  const SLIDE = SLIDE_HEIGHT;
  const els = slide.elements;
  const textEls = els.filter((e) => e.type === "heading" || e.type === "subtitle" || e.type === "text");

  const realHeight = (e: SlideElement): number => {
    const st = e.style as any;
    const fontSize = st.fontSize ?? (e.type === "heading" ? 48 : e.type === "subtitle" ? 24 : 19);
    const lh = st.lineHeight ?? (e.type === "heading" ? 1.15 : e.type === "subtitle" ? 1.5 : 1.6);
    return Math.max(e.position.height, textHeight(String((e as any).content ?? ""), e.position.width, fontSize, lh, 0));
  };

  // Pass 1: expand each text element's box to its real height so later
  // collision math sees the actual footprint.
  for (const e of textEls) {
    e.position = { ...e.position, height: Math.max(e.position.height, realHeight(e)) };
  }

  // Pass 2: repeatedly push elements down until nothing overlaps. Text-only
  // elements are reflowed vertically; a conservative max pass keeps this bounded.
  for (let pass = 0; pass < 5; pass++) {
    let moved = false;
    const ordered = [...textEls].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i];
      const aTop = a.position.y;
      const aBottom = aTop + a.position.height;
      const aX0 = a.position.x;
      const aX1 = a.position.x + a.position.width;
      for (let j = i + 1; j < ordered.length; j++) {
        const b = ordered[j];
        if (b.position.y < aTop) continue; // b is strictly above a; resolved by outer loop
        const bX0 = b.position.x;
        const bX1 = b.position.x + b.position.width;
        if (!(aX0 < bX1 && aX1 > bX0)) continue; // different columns, no horizontal overlap
        if (b.position.y >= aBottom) continue; // already clear
        const push = aBottom - b.position.y + 1;
        b.position = { ...b.position, y: b.position.y + push };
        moved = true;
      }
    }
    if (!moved) break;
  }

  // Pass 3: clamp any element poking off the bottom by trimming its height
  // (never shifts y, so it cannot create new overlaps above).
  for (const e of textEls) {
    const bottom = e.position.y + e.position.height;
    if (bottom > SLIDE - 16) {
      e.position = { ...e.position, height: Math.max(24, SLIDE - 16 - e.position.y) };
    }
  }

  return slide;
}

export function statCard(
  value: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number
): SlideElement[] {
  return [
    makeElement({
      type: "heading",
      content: value,
      position: { x, y, width: w, height: h * 0.5, rotation: 0 },
      style: { fontSize: 44, fontWeight: 800, color: "var(--t-primary)", lineHeight: 1.1 },
      animation: { type: "zoom", duration: 0.6, delay: 0.1 },
      name: "Metric Value",
    }),
    makeElement({
      type: "text",
      content: label,
      position: { x, y: y + h * 0.55, width: w, height: h * 0.35, rotation: 0 },
      style: { fontSize: 17, fontWeight: 500, color: "var(--t-muted)", lineHeight: 1.4 },
      animation: { type: "fade-up", duration: 0.6, delay: 0.2 },
      name: "Metric Label",
    }),
  ];
}

export function iconElement(
  icon: string,
  x: number,
  y: number,
  size: number,
  delay = 0
): SlideElement {
  return makeElement({
    type: "icon",
    icon,
    library: "lucide",
    size,
    position: { x, y, width: size, height: size, rotation: 0 },
    style: { color: "var(--t-primary)" },
    animation: { type: "zoom", duration: 0.5, delay },
    name: "Icon",
  });
}

function decorShape(shape: "circle" | "rect" | "line", fill: string, x: number, y: number, w: number, h: number, opacity: number, name: string, borderColor?: string): SlideElement {
  return makeElement({
    type: "shape",
    shape,
    position: { x, y, width: w, height: h, rotation: 0 },
    style: {
      fill,
      opacity,
      ...(borderColor ? { borderWidth: 2, borderColor } : {}),
    },
    animation: { type: "fade", duration: 0.8, delay: 0 },
    name,
  });
}

/** Theme-identity decoration (from resolveThemeTokens) — makes each theme's
 *  hero slides visually distinct instead of identical colored panels. */
export function decorElements(theme: ThemeDefinition): SlideElement[] {
  const { decor, decorColors } = resolveThemeTokens(theme);
  const [c1, c2, c3] = decorColors;
  switch (decor) {
    case "blobs":
      return [
        decorShape("circle", c1, -160, -160, 430, 430, 0.12, "Decorative Blob 1"),
        decorShape("circle", c2, 1020, 540, 380, 380, 0.1, "Decorative Blob 2"),
        decorShape("circle", c3, 80, 580, 220, 220, 0.08, "Decorative Blob 3"),
      ];
    case "grid":
      return [
        decorShape("circle", c1, 1130, 90, 10, 10, 0.5, "Grid Dot 1"),
        decorShape("circle", c2, 1090, 130, 10, 10, 0.4, "Grid Dot 2"),
        decorShape("circle", c3, 1050, 170, 10, 10, 0.3, "Grid Dot 3"),
        decorShape("line", c1, 100, 180, 1080, 2, 0.15, "Decorative Line"),
        decorShape("line", c2, 100, 640, 1080, 2, 0.12, "Decorative Line 2"),
      ];
    case "dots":
      return [
        decorShape("circle", c1, 1120, 100, 16, 16, 0.5, "Decor Dot 1"),
        decorShape("circle", c2, 1140, 140, 10, 10, 0.4, "Decor Dot 2"),
        decorShape("circle", c3, 1120, 176, 7, 7, 0.35, "Decor Dot 3"),
        decorShape("circle", c1, 60, 620, 12, 12, 0.35, "Decor Dot 4"),
        decorShape("circle", c2, 96, 640, 8, 8, 0.3, "Decor Dot 5"),
      ];
    case "ring":
      return [
        decorShape("circle", "transparent", 1000, 40, 300, 300, 0.35, "Decor Ring", c1),
        decorShape("circle", "transparent", 940, -20, 420, 420, 0.22, "Decor Ring 2", c2),
        decorShape("circle", c3, 110, 620, 26, 26, 0.3, "Decor Accent"),
      ];
    case "rays":
      return [
        decorShape("circle", c1, 1160, 40, 220, 220, 0.2, "Ray Glow 1"),
        decorShape("circle", c2, -80, 480, 260, 260, 0.16, "Ray Glow 2"),
        decorShape("line", c3, 100, 150, 300, 4, 0.25, "Ray Accent"),
      ];
    default:
      return [];
  }
}

function pickIcons(count: number, fallback = "sparkles"): string[] {
  const pool = [
    "target", "rocket", "lightbulb", "trending_up", "bar_chart", "shield",
    "users", "heart_pulse", "cpu", "database", "globe", "graduation_cap",
    "briefcase", "award", "layers", "zap", "star", "check_circle",
  ];
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length]);
  return out;
}

const PANEL = { x: 80, w: 1120, yTop: 150 };

export function buildSlide(
  item: OutlineItem,
  content: Content,
  theme: ThemeDefinition,
  index: number
): Slide {
  const base: Slide = {
    id: uid(),
    title: item.title,
    layout: item.layout,
    elements: [],
    background: generateDynamicBackground(theme, index, item.title),
    transition: planAnimations(item.layout, item.title, index, theme.animationStyle).layoutAnimation,
    notes: item.notes ?? "",
    speakerNotes: "",
    hidden: false,
  };

  const bg = pickSlideBackground(item.layout, theme, `${item.title}:${index}`);
  if (bg) {
    base.backgroundId = bg.id;
    base.background = bg.kind === "image" && !bg.imageUrl ? base.background : bg.css;
    base.backgroundImage = bg.imageUrl;
    base.backgroundVideo = bg.videoUrl;
    base.backgroundAnimated = bg.animated;
  }

  const y = PANEL.yTop;
  const cw = (PANEL.w - 40 * 2) / 3;

  switch (item.layout) {
    case "title":
    case "hero": {
      const els: SlideElement[] = [
        ...decorElements(theme),
        heading(content.title, 100, 200, 1080, content.subtitle ? 64 : 72),
      ];
      let ty = 200 + textHeight(content.title, 1080, content.subtitle ? 64 : 72, 1.15);
      if (content.subtitle) {
        els.push(subtitle(content.subtitle, 100, ty + 24, 920, 26));
        ty += 24 + 64;
      } else {
        ty += 24;
      }
      for (const b of (content.bullets ?? []).slice(0, 3)) {
        const h = textHeight(`•  ${b}`, 900, 22);
        els.push(bodyText(`•  ${b}`, 100, ty, 900, h, 22));
        ty += h + 12;
      }
      base.elements = els;
      break;
    }
    case "title-image":
    case "text-image": {
      const img = content.imageUrl ?? content.image;
      const bullets: SlideElement[] = [];
      let by = 320;
      for (const b of (content.bullets ?? []).slice(0, 4)) {
        const h = textHeight(`•  ${b}`, 580, 20);
        bullets.push(bodyText(`•  ${b}`, 90, by, 580, h, 20));
        by += h + 12;
      }
      base.elements = [
        heading(item.title, 90, 200, 600, 52),
        ...bullets,
      ];
      if (img) {
        base.elements.push(
          makeElement({
            type: "image",
            src: img,
            alt: item.title,
            objectFit: "cover",
            position: { x: 730, y: 160, width: 470, height: 460, rotation: 0 },
            style: { borderRadius: theme.radius, shadow: true },
            animation: { type: "slide-left", duration: 0.7, delay: 0.2 },
            name: "Image",
          })
        );
      } else {
        const illustration = planIllustration(
          `${item.title}:${index}`,
          domainFromCategory(theme.category),
          item.layout,
          item.title,
          { primary: theme.primary, secondary: theme.secondary, accent: theme.accent, surface: theme.surface, text: theme.text }
        );
        base.elements.push(
          makeElement({
            type: "image",
            src: illustration.src,
            alt: item.title,
            objectFit: "cover",
            position: { x: 730, y: 160, width: 470, height: 460, rotation: 0 },
            style: { borderRadius: theme.radius, shadow: true },
            animation: { type: "slide-left", duration: 0.7, delay: 0.2 },
            name: illustration.label,
          })
        );
      }
      break;
    }
    case "two-columns":
    case "comparison": {
      const compList = Array.isArray(content.comparison) ? content.comparison : (content.comparison as any)?.items ?? [];
      const left = compList.length ? compList.map((c: any) => c.ours) : content.bullets ?? [];
      const right = compList.length
        ? compList.map((c: any) => c.theirs)
        : content.paragraphs ?? [];
      const stack = (items: string[], x: number, startY: number): SlideElement[] => {
        const els: SlideElement[] = [];
        let y = startY;
        for (const b of items) {
          if (y > 660) break;
          const h = textHeight(`•  ${b}`, 520, 19);
          els.push(bodyText(`•  ${b}`, x, y, 520, h, 19));
          y += h + 8;
        }
        return els;
      };
      const colStart = content.comparison ? 300 : 260;
      base.elements = [
        heading(item.title, 80, 120, 1120, 48),
        ...(content.comparison
          ? [subtitle("Ours", 80, 200, 520, 24), subtitle("Theirs", 680, 200, 520, 24)]
          : []),
        ...stack(left, 80, colStart),
        ...stack(right, 680, colStart),
      ];
      break;
    }
    case "three-columns": {
      const cols = [content.bullets, content.paragraphs, content.keyPoints].filter(
        Boolean
      ) as string[][];
      const ccw = (1120 - 80) / 3;
      const colItems = (cols[0] ?? []).length
        ? cols
        : [
            content.cards?.slice(0, 2).map((c) => c.title) ?? [],
            content.cards?.slice(2, 4).map((c) => c.title) ?? [],
            content.cards?.slice(4, 6).map((c) => c.title) ?? [],
          ];
      const stackCol = (col: string[], ci: number): SlideElement[] => {
        const els: SlideElement[] = [];
        let y = 220;
        for (const b of col.slice(0, 5)) {
          if (y > 660) break;
          const h = textHeight(`•  ${b}`, ccw, 18);
          els.push(bodyText(`•  ${b}`, 80 + ci * (ccw + 40), y, ccw, h, 18));
          y += h + 8;
        }
        return els;
      };
      base.elements = [
        heading(item.title, 80, 110, 1120, 44),
        ...colItems.map((col, ci) => stackCol(col, ci)).flat(),
      ];
      base.elements.unshift(
        ...colItems.map((col, ci) =>
          iconElement(pickIcons(1)[0], 80 + ci * (ccw + 40), 160, 36, 0.1 + ci * 0.1)
        )
      );
      break;
    }
    case "timeline": {
      const tl = content.timeline ?? (content.roadmap ?? []);
      const items = tl.length ? tl : content.steps ?? [];
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        makeElement({
          type: "timeline",
          nodes: items.map((s, i) => ({
            id: `${i}`,
            label: s.title,
            x: 0,
            y: 0,
            width: 180,
            height: 60,
          })),
          position: { x: 80, y: 200, width: 1120, height: 420, rotation: 0 },
          style: { color: "var(--t-primary)" },
          animation: { type: "stagger", duration: 0.5, delay: 0.2 },
          name: "Timeline",
        }),
        ...items.slice(0, 4).map((s, i) => {
          const bx = 80 + i * 270;
          return bodyText(s.desc ?? "", bx + 15, 340, 240, 140, 15, 400);
        }),
      ];
      break;
    }
    case "roadmap":
    case "process": {
      const steps = content.steps ?? content.roadmap ?? [];
      const n = Math.max(steps.length, 1);
      const sw = (1120 - (n - 1) * 30) / n;
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        ...steps.slice(0, 5).map((s, i) => [
          iconElement(pickIcons(1)[0], 80 + i * (sw + 30), 190, 44, 0.1 + i * 0.08),
          bodyText(`${i + 1}`, 80 + i * (sw + 30) + 10, 250, 30, 30, 18, 700),
          heading(s.title, 80 + i * (sw + 30), 300, sw, 26),
          bodyText(s.desc ?? "", 80 + i * (sw + 30), 350, sw, 200, 16, 400),
        ]).flat(),
      ];
      break;
    }
    case "metrics": {
      const metrics = content.metrics ?? [];
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        ...metrics.slice(0, 4).map((m, i) => {
          const cx = 80 + (i % 4) * 280;
          const cy = 230 + Math.floor(i / 4) * 220;
          return statCard(m.value, m.label, cx, cy, 240, 140);
        }).flat(),
      ];
      break;
    }
    case "statistics": {
      const stats = content.stats ?? [];
      const items = stats.length ? stats : (content.metrics ?? []);
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        makeElement({
          type: "chart",
          chartType: "bar",
          title: item.title,
          data: items.slice(0, 8).map((s: any) => ({
            label: s.label ?? s.title ?? "",
            value: Number(s.value ?? s.delta ?? 0) || 42,
          })),
          datasets: [],
          axisLabels: { x: "", y: "" },
          legend: false,
          animateChart: true,
          position: { x: 80, y: 200, width: 700, height: 420, rotation: 0 },
          style: {},
          animation: { type: "zoom", duration: 0.7, delay: 0.2 },
          name: "Chart",
        }),
        ...(content.bullets ?? []).slice(0, 4).map((b, i) =>
          bodyText(`•  ${b}`, 820, 220 + i * 80, 380, 60, 17)
        ),
      ];
      break;
    }
    case "bar":
    case "pie": {
      const stats = content.stats ?? [];
      const data =
        stats.length > 0
          ? stats
          : (content.metrics ?? []).map((m, i) => ({
              label: m.label,
              value: Number(m.value.replace(/[^0-9.]/g, "")) || 50 + i * 5,
            }));
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        makeElement({
          type: "chart",
          chartType: (content.chartType as any) || (item.layout === "pie" ? "pie" : "bar"),
          title: item.title,
          data,
          datasets: [],
          axisLabels: { x: "", y: "" },
          legend: true,
          animateChart: true,
          position: { x: 160, y: 200, width: 960, height: 420, rotation: 0 },
          style: {},
          animation: { type: "zoom", duration: 0.7, delay: 0.2 },
          name: "Chart",
        }),
      ];
      break;
    }
    case "table": {
      const headers = content.tableHeaders ?? [content.title, "Details"];
      const compList = Array.isArray(content.comparison) ? content.comparison : (content.comparison as any)?.items ?? [];
      const rows =
        content.tableRows ??
        (compList.length ? compList.map((c: any) => [c.ours, c.theirs]) :
          (content.bullets ?? []).slice(0, 6).map((b, i) => [`#${i + 1}`, b]));
      base.elements = [
        heading(item.title, 80, 90, 1120, 42),
        makeElement({
          type: "table",
          rows: rows.length + 1,
          cols: Math.max(headers.length, 2),
          headers,
          cells: rows.slice(0, 8).map((r: any) => (Array.isArray(r) ? r : [r, ""])),
          position: { x: 140, y: 180, width: 1000, height: 420, rotation: 0 },
          style: {},
          animation: { type: "fade-up", duration: 0.6, delay: 0.2 },
          name: "Table",
        }),
      ];
      break;
    }
    case "bento":
    case "bento-grid": {
      base.elements = [
        heading(item.title, 80, 90, 1120, 44),
        // Bento Cell 1 (Hero Left)
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x: 80, y: 170, width: 680, height: 260, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 20, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
          animation: { type: "zoom", duration: 0.6, delay: 0.1 },
          name: "Bento Main Cell",
        }),
        iconElement("sparkles", 110, 200, 40, 0.1),
        heading(content.title, 160, 195, 570, 28),
        bodyText(content.subtitle || "Primary breakthrough insight and feature spotlight.", 110, 255, 620, 150, 17),

        // Bento Cell 2 (Top Right Stat)
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x: 780, y: 170, width: 420, height: 260, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 20, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
          animation: { type: "zoom", duration: 0.6, delay: 0.2 },
          name: "Bento Stat Cell",
        }),
        iconElement("trending_up", 810, 200, 36, 0.2),
        heading("3.8x", 810, 250, 360, 56),
        bodyText("Performance Growth Benchmark", 810, 325, 360, 80, 16),

        // Bento Cell 3 (Bottom Left Metric)
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x: 80, y: 450, width: 420, height: 210, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 20, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
          animation: { type: "zoom", duration: 0.6, delay: 0.3 },
          name: "Bento Cell 3",
        }),
        heading("99.9%", 110, 480, 360, 44),
        bodyText("System Reliability & Uptime SLA", 110, 545, 360, 80, 15),

        // Bento Cell 4 (Bottom Right Wide Feature)
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x: 520, y: 450, width: 680, height: 210, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 20, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
          animation: { type: "zoom", duration: 0.6, delay: 0.4 },
          name: "Bento Cell 4",
        }),
        iconElement("shield", 550, 480, 36, 0.4),
        heading("Enterprise Security & Isolation", 600, 475, 570, 24),
        bodyText("SOC2 Type II Certified with Zero-Trust Isolation Architecture.", 550, 530, 620, 100, 16),
      ];
      break;
    }
    case "pricing": {
      base.elements = [
        heading("Pricing & Plans", 80, 90, 1120, 44),
        subtitle("Flexible tier structures tailored for high-velocity teams.", 80, 145, 1120, 22),
        ...["Starter", "Pro Studio", "Enterprise"].map((tier, i) => {
          const cx = 80 + i * 380;
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x: cx, y: 210, width: 350, height: 440, rotation: 0 },
              style: { fill: i === 1 ? "var(--t-primary)" : "var(--t-surface)", borderRadius: 20, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.6, delay: 0.1 + i * 0.1 },
              name: "Pricing Tier Card",
            }),
            heading(tier, cx + 30, 240, 290, 28),
            heading(i === 0 ? "$0" : i === 1 ? "$49/mo" : "Custom", cx + 30, 285, 290, 40),
            bodyText(`• Feature set ${i + 1} included\n• Priority AI rendering\n• 24/7 Dedicated Support`, cx + 30, 350, 290, 250, 16),
          ];
        }).flat(),
      ];
      break;
    }
    case "pyramid": {
      const tiers = (content.steps ?? content.paragraphs?.map((p) => ({ title: p.slice(0, 60), desc: p })) ?? []).slice(0, 4);
      const widths = [0.92, 0.74, 0.56, 0.38];
      const items = tiers.length ? tiers : [
        { title: "Foundation", desc: "Core infrastructure and data" },
        { title: "Capabilities", desc: "Platform services and tooling" },
        { title: "Experience", desc: "Customer-facing solutions" },
        { title: "Value", desc: "Business outcomes and impact" },
      ];
      base.elements = [
        heading(item.title, 80, 80, 1120, 44),
        ...items.map((t, i) => {
          const w = 1120 * widths[i];
          const x = 80 + (1120 - w) / 2;
          const h = 82;
          const y = 220 + i * (h + 2);
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x, y, width: w, height: h, rotation: 0 },
              style: { fill: i === items.length - 1 ? "var(--t-primary)" : "var(--t-surface)", borderRadius: 14, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.5, delay: 0.1 + i * 0.08 },
              name: "Pyramid Tier",
            }),
            heading(t.title, x + 28, y + 14, Math.max(w - 480, 180), 24),
            bodyText(t.desc ?? "", x + Math.max(w - 440, 220), y + 16, Math.min(w - Math.max(w - 440, 220) - 28, 420), 60, 14, 400, "right" as const),
          ];
        }).flat(),
      ];
      break;
    }
    case "funnel": {
      const rows = (content.steps ?? content.paragraphs?.map((p) => ({ title: p.slice(0, 50), desc: p })) ?? []).slice(0, 5);
      const widths = [0.95, 0.78, 0.61, 0.44, 0.27];
      const items = rows.length ? rows : [
        { title: "Awareness", desc: "Broad reach and discovery" },
        { title: "Interest", desc: "Engagement and retention" },
        { title: "Evaluation", desc: "Comparison and validation" },
        { title: "Decision", desc: "Commitment and purchase" },
        { title: "Advocacy", desc: "Expansion and referrals" },
      ];
      base.elements = [
        heading(item.title, 80, 80, 1120, 44),
        ...items.map((t, i) => {
          const w = 1120 * widths[i];
          const x = 80 + (1120 - w) / 2;
          const h = 74;
          const y = 210 + i * (h + 8);
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x, y, width: w, height: h, rotation: 0 },
              style: { fill: i === 0 ? "var(--t-primary)" : "var(--t-surface)", borderRadius: 12, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.5, delay: 0.08 + i * 0.07 },
              name: "Funnel Row",
            }),
            heading(t.title, x + 24, y + 14, Math.max(w - 420, 160), 22),
            bodyText(t.desc ?? "", x + Math.max(w - 380, 200), y + 16, Math.min(w - Math.max(w - 380, 200) - 20, 360), 52, 13, 400, "right" as const),
          ];
        }).flat(),
      ];
      break;
    }
    case "matrix": {
      const q = content.swot ?? { s: [], w: [], o: [], t: [] };
      const cells = [
        { label: "High Impact · Low Effort", list: q.o.length ? q.o : q.s, color: "#22c55e", x: 80, y: 200 },
        { label: "High Impact · High Effort", list: q.s.length ? q.s : q.t, color: "#3b82f6", x: 700, y: 200 },
        { label: "Low Impact · Low Effort", list: q.s.length ? q.s : q.w, color: "#f59e0b", x: 80, y: 430 },
        { label: "Low Impact · High Effort", list: q.w.length ? q.w : q.t, color: "#ef4444", x: 700, y: 430 },
      ];
      base.elements = [
        heading(item.title, 80, 70, 1120, 38),
        ...cells.map((c) => [
          makeElement({
            type: "shape",
            shape: "rect",
            position: { x: c.x, y: c.y, width: 500, height: 200, rotation: 0 },
            style: { fill: "var(--t-surface)", borderRadius: 12, borderWidth: 2, borderColor: c.color, shadow: true },
            animation: { type: "fade-up", duration: 0.5, delay: 0.1 },
            name: "Matrix Cell",
          }),
          heading(c.label, c.x + 22, c.y + 14, 456, 24),
          ...c.list.slice(0, 3).map((t, i) => bodyText(`•  ${t}`, c.x + 22, c.y + 60 + i * 46, 460, 42, 15)),
        ]).flat(),
      ];
      break;
    }
    case "before-after": {
      const cmp =
        typeof content.comparison === "object" && !Array.isArray(content.comparison) && "items" in content.comparison
          ? content.comparison.items
          : (content.comparison as any[]) ?? [];
      const items = Array.isArray(cmp) && cmp.length ? cmp : [
        { ours: "Fragmented manual workflows", theirs: "Unified automated platform" },
        { ours: "Hours spent on repetitive tasks", theirs: "Minutes with AI assistance" },
        { ours: "Reactive, siloed decision-making", theirs: "Proactive, data-driven insight" },
        { ours: "High cost of iteration", theirs: "Rapid low-cost experiments" },
      ];
      const col = (rows: any[], label: string, x: number, color: string) => [
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x, y: 170, width: 480, height: 470, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 16, borderWidth: 2, borderColor: color, shadow: true },
          animation: { type: "fade-up", duration: 0.5, delay: 0.1 },
          name: `${label} Panel`,
        }),
        heading(label, x + 24, 194, 200, 34),
        ...rows.slice(0, 5).map((r: any, i: number) =>
          bodyText(`✗  ${r.ours}`, x + 24, 250 + i * 66, 432, 62, 16, 400)
        ),
      ];
      const colAfter = (rows: any[], label: string, x: number, color: string) => [
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x, y: 170, width: 480, height: 470, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 16, borderWidth: 2, borderColor: color, shadow: true },
          animation: { type: "fade-up", duration: 0.5, delay: 0.18 },
          name: `${label} Panel`,
        }),
        heading(label, x + 24, 194, 200, 34),
        ...rows.slice(0, 5).map((r: any, i: number) =>
          bodyText(`✓  ${r.theirs}`, x + 24, 250 + i * 66, 432, 62, 16, 400)
        ),
      ];
      base.elements = [
        ...col(items, "Before", 90, "#f43f5e"),
        heading("→", 600, 370, 80, 40),
        ...colAfter(items, "After", 690, "#22c55e"),
      ];
      break;
    }
    case "team": {
      const members = content.cards ?? [];
      const people = members.length ? members : [
        { title: "Alex Chen", desc: "CEO · Product Vision", icon: "sparkles" },
        { title: "Priya Patel", desc: "CTO · Platform", icon: "cpu" },
        { title: "Marcus Lee", desc: "Head of Design", icon: "palette" },
        { title: "Sara Kim", desc: "VP Engineering", icon: "code_2" },
        { title: "David Ruiz", desc: "Head of Research", icon: "flask" },
        { title: "Nina Sharma", desc: "Chief of Staff", icon: "briefcase" },
      ];
      const initials = (n: string) =>
        n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      base.elements = [
        heading(item.title, 80, 90, 1120, 44),
        subtitle(content.subtitle ?? "The people turning this vision into reality.", 80, 148, 1120, 22),
        ...people.slice(0, 6).map((m, i) => {
          const cx = 140 + (i % 3) * 330;
          const cy = 230 + Math.floor(i / 3) * 220;
          return [
            makeElement({
              type: "shape",
              shape: "circle",
              position: { x: cx, y: cy, width: 76, height: 76, rotation: 0 },
              style: { fill: "var(--t-primary)", borderWidth: 2, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "zoom", duration: 0.5, delay: 0.1 + i * 0.07 },
              name: "Avatar",
            }),
            heading(initials(m.title), cx + 34 - (initials(m.title).length > 2 ? 18 : 12), cy + 24, 44, 26),
            heading(m.title, cx + 96, cy + 8, 260, 22),
            bodyText(m.desc ?? "", cx + 96, cy + 40, 280, 30, 14, 400),
          ];
        }).flat(),
      ];
      break;
    }
    case "vision": {
      base.elements = [
        heading(item.title, 80, 90, 1120, 50),
        subtitle(content.subtitle ?? "Our vision", 80, 152, 1120, 22),
        ...(content.paragraphs ?? []).slice(0, 2).map((p, i) =>
          bodyText(p, 120, 230 + i * 120, 720, 110, 18, 400)
        ),
        ...(content.metrics ?? []).slice(0, 2).map((mt, i) =>
          statCard(mt.value, mt.label, 900, 260 + i * 150, 280, 90)
        ).flat(),
      ];
      break;
    }
    case "mission": {
      const points = content.keyPoints ?? content.bullets ?? [];
      base.elements = [
        heading(item.title, 80, 90, 1120, 46),
        subtitle(content.subtitle ?? "Our mission", 80, 150, 1120, 22),
        ...(points.slice(0, 6).map((p, i) => [
          makeElement({
            type: "shape",
            shape: "circle",
            position: { x: 120, y: 250 + i * 74, width: 22, height: 22, rotation: 0 },
            style: { fill: "var(--t-primary)" },
            animation: { type: "scale", duration: 0.4, delay: 0.08 + i * 0.06 },
            name: "Mission Check",
          }),
          bodyText(p, 170, 244 + i * 74, 960, 70, 19, 400),
        ]).flat()),
      ];
      break;
    }
    case "milestones": {
      const m = content.timeline ?? [
        { period: "2024", title: "Foundation", desc: "Core platform and first customers" },
        { period: "2025", title: "Scale", desc: "Expanded footprint and new markets" },
        { period: "2026", title: "Dominance", desc: "Category leadership and ecosystem" },
        { period: "2027", title: "Evolve", desc: "Next-generation platform vision" },
      ];
      base.elements = [
        heading(item.title, 80, 90, 1120, 46),
        makeElement({
          type: "shape",
          shape: "line",
          position: { x: 110, y: 260, width: 1060, height: 3, rotation: 0 },
          style: { fill: "var(--t-primary)" },
          animation: { type: "draw", duration: 0.8, delay: 0.1 },
          name: "Milestone Line",
        }),
        ...m.slice(0, 4).map((ms, i) => {
          const cx = 110 + i * 280;
          return [
            makeElement({
              type: "shape",
              shape: "circle",
              position: { x: cx + 120, y: 248, width: 26, height: 26, rotation: 0 },
              style: { fill: i === 3 ? "var(--t-primary)" : "var(--t-surface)", borderWidth: 3, borderColor: "var(--t-primary)" },
              animation: { type: "zoom", duration: 0.5, delay: 0.15 + i * 0.08 },
              name: "Milestone Dot",
            }),
            heading(ms.period, cx, 310, 260, 30),
            heading(ms.title, cx, 350, 260, 24),
            bodyText(ms.desc, cx, 390, 260, 90, 15, 400),
          ];
        }).flat(),
      ];
      break;
    }
    case "checklist": {
      const items = content.keyPoints ?? content.bullets ?? [];
      const list = items.length ? items : ["Define clear objectives", "Engage cross-functional teams", "Measure outcomes continuously", "Iterate and improve", "Communicate progress", "Celebrate milestones"];
      base.elements = [
        heading(item.title, 80, 90, 1120, 46),
        ...list.slice(0, 6).map((p, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 110 + col * 540;
          const y = 210 + row * 80;
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x, y, width: 500, height: 64, rotation: 0 },
              style: { fill: "var(--t-surface)", borderRadius: 14, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.45, delay: 0.08 + i * 0.06 },
              name: "Checklist Item",
            }),
            makeElement({
              type: "shape",
              shape: "circle",
              position: { x: x + 20, y: y + 18, width: 28, height: 28, rotation: 0 },
              style: { fill: "var(--t-primary)" },
              animation: { type: "scale", duration: 0.4, delay: 0.1 + i * 0.06 },
              name: "Check Dot",
            }),
            bodyText(p, x + 66, y + 12, 410, 44, 16, 500),
          ];
        }).flat(),
      ];
      break;
    }
    case "thank-you": {
      base.elements = [
        heading(item.title.includes("Thank You") ? "Thank You" : item.title, 240, 300, 800, 84),
        subtitle(content.subtitle ?? "Open for questions and discussion", 240, 420, 800, 26),
        makeElement({
          type: "shape",
          shape: "circle",
          position: { x: 60, y: 60, width: 300, height: 300, rotation: 0 },
          style: { fill: "var(--t-primary)", opacity: 0.1 },
          animation: { type: "zoom", duration: 0.7, delay: 0 },
          name: "Decorative Glow",
        }),
      ];
      break;
    }
    case "journey": {
      const stops = content.timeline ?? [
        { period: "Stage 1", title: "Awareness", desc: "Identify the problem and gather context." },
        { period: "Stage 2", title: "Evaluation", desc: "Benchmark options and build the business case." },
        { period: "Stage 3", title: "Adoption", desc: "Pilot, learn and refine the approach." },
        { period: "Stage 4", title: "Scale", desc: "Roll out broadly and compound the gains." },
      ];
      const n = Math.min(stops.length, 4);
      base.elements = [
        heading(item.title, 80, 90, 1120, 44),
        // connecting line
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x: 90, y: 300, width: 1100, height: 6, rotation: 0 },
          style: { fill: "var(--t-primary)", opacity: 0.35, borderRadius: 3 },
          animation: { type: "draw", duration: 0.8, delay: 0.2 },
          name: "Journey Line",
        }),
        ...stops.slice(0, n).map((s, i) => {
          const cx = 90 + (i * 1130) / Math.max(n - 1, 1);
          return [
            makeElement({
              type: "shape",
              shape: "circle",
              position: { x: cx - 14, y: 284, width: 44, height: 44, rotation: 0 },
              style: { fill: "var(--t-primary)", shadow: true },
              animation: { type: "pop", duration: 0.5, delay: 0.3 + i * 0.12 },
              name: "Journey Node",
            }),
            heading(`${i + 1}`, cx - 8, 295, 36, 22),
            heading(s.title, cx - 90, 360, 300, 24),
            bodyText(s.desc, cx - 90, 400, 300, 100, 15, 400),
          ];
        }).flat(),
      ];
      break;
    }
    case "faq": {
      const qs = content.bullets ?? [
        "How does this work?",
        "What does it cost?",
        "How long does implementation take?",
        "What support is included?",
      ];
      const n = Math.min(qs.length, 6);
      base.elements = [
        heading(item.title, 80, 90, 1120, 44),
        ...qs.slice(0, n).map((q, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 80 + col * 570;
          const y = 200 + row * 160;
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x, y, width: 540, height: 130, rotation: 0 },
              style: { fill: "var(--t-surface)", borderRadius: theme.radius, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.5, delay: 0.1 + i * 0.08 },
              name: "FAQ Card",
            }),
            iconElement("help_circle", x + 22, y + 20, 34, 0.1 + i * 0.08),
            heading(q, x + 76, y + 18, 440, 22),
            bodyText("Concise, honest answer with supporting detail and next steps.", x + 76, y + 62, 440, 60, 15, 400),
          ];
        }).flat(),
      ];
      break;
    }
    case "cards": {
      const cards = content.cards ?? [];
      const icons = content.icons ?? pickIcons(Math.max(cards.length, 3));
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        ...cards.slice(0, 6).map((c, i) => {
          const cx = 80 + (i % 3) * 380;
          const cy = 210 + Math.floor(i / 3) * 230;
          return [
            makeElement({
              type: "shape",
              shape: "rect",
              position: { x: cx, y: cy, width: 350, height: 190, rotation: 0 },
              style: { fill: "var(--t-surface)", borderRadius: theme.radius, borderWidth: 1, borderColor: "var(--t-border)", shadow: true },
              animation: { type: "fade-up", duration: 0.5, delay: 0.1 + i * 0.08 },
              name: "Card",
            }),
            iconElement(icons[i] ?? "sparkles", cx + 24, cy + 22, 36, 0.1 + i * 0.08),
            heading(c.title, cx + 80, cy + 20, 250, 24),
            bodyText(c.desc ?? "", cx + 24, cy + 70, 302, 100, 15, 400),
          ];
        }).flat(),
      ];
      break;
    }
    case "swot": {
      const s = content.swot ?? { s: [], w: [], o: [], t: [] };
      const quad = (items: string[], label: string, x: number, y: number, color: string) => [
        makeElement({
          type: "shape",
          shape: "rect",
          position: { x, y, width: 540, height: 220, rotation: 0 },
          style: { fill: "var(--t-surface)", borderRadius: 12, borderWidth: 2, borderColor: color },
          animation: { type: "fade-up", duration: 0.5, delay: 0.1 },
          name: `${label} Quadrant`,
        }),
        heading(label, x + 24, y + 16, 200, 28),
        ...(() => {
          const els: SlideElement[] = [];
          let iy = y + 62;
          for (const t of items.slice(0, 3)) {
            if (iy > y + 200) break;
            const h = textHeight(`•  ${t}`, 490, 16);
            els.push(bodyText(`•  ${t}`, x + 24, iy, 490, h, 16));
            iy += h + 6;
          }
          return els;
        })(),
      ];
      base.elements = [
        heading(item.title, 80, 90, 1120, 44),
        ...quad(s.s, "Strengths", 80, 180, "#22c55e"),
        ...quad(s.w, "Weaknesses", 660, 180, "#ef4444"),
        ...quad(s.o, "Opportunities", 80, 430, "#3b82f6"),
        ...quad(s.t, "Threats", 660, 430, "#f59e0b"),
      ];
      break;
    }
    case "flowchart":
    case "architecture":
    case "mindmap": {
      const nodes = content.nodes ?? [];
      const n = Math.max(nodes.length, 1);
      const nw = Math.min(280, (1120 - (n - 1) * 40) / n);
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        makeElement({
          type: item.layout === "mindmap" ? "mindmap" : item.layout === "architecture" ? "architecture" : "flowchart",
          nodes: nodes.slice(0, 5).map((nd, i) => ({
            id: `${i}`,
            label: nd.label,
            icon: nd.icon,
            x: 0,
            y: 0,
            width: nw,
            height: 60,
          })),
          edges: [],
          position: { x: 80, y: 200, width: 1120, height: 420, rotation: 0 },
          style: { color: "var(--t-primary)" },
          animation: { type: "draw", duration: 0.8, delay: 0.2 },
          name: "Flow Diagram",
        }),
      ];
      break;
    }
    case "agenda": {
      const items = content.bullets ?? [];
      const rows: SlideElement[] = [];
      let ry = 240;
      for (let idx = 0; idx < items.slice(0, 8).length; idx++) {
        const b = items[idx];
        if (ry > 660) break;
        const h = textHeight(b, 800, 20);
        const s = bodyText(b, 240, ry, 800, h, 20);
        const num = makeElement({
          type: "text",
          content: `${String(idx + 1).padStart(2, "0")}`,
          position: { x: 100, y: ry, width: 90, height: h, rotation: 0 },
          style: { fontSize: 20, fontWeight: 800, color: "var(--t-primary)", lineHeight: 1.6 },
          animation: { type: "fade-up", duration: 0.4, delay: 0.1 + idx * 0.06 },
          name: "Agenda Number",
        });
        rows.push(num, s);
        ry += h + 10;
      }
      base.elements = [
        heading("Agenda", 100, 150, 500, 56),
        ...rows,
      ];
      break;
    }
    case "quote":
    case "quote-image": {
      base.elements = [
        ...decorElements(theme),
        heading(content.quote ?? content.title, 100, 200, 1080, 48),
        ...(content.attribution
          ? [subtitle(`— ${content.attribution}`, 100, 540, 800, 22)]
          : []),
      ];
      break;
    }
    case "code": {
      base.elements = [
        heading(item.title, 80, 90, 1120, 42),
        makeElement({
          type: "code",
          code: content.code ?? "print('Hello world')",
          language: content.language ?? "python",
          position: { x: 140, y: 170, width: 1000, height: 440, rotation: 0 },
          style: { borderRadius: 12, fontFamily: "JetBrains Mono" },
          animation: { type: "fade-up", duration: 0.6, delay: 0.15 },
          name: "Code",
        }),
      ];
      break;
    }
    case "formula": {
      base.elements = [
        heading(item.title, 80, 100, 1120, 42),
        makeElement({
          type: "formula",
          latex: content.formula ?? "E = mc^2",
          position: { x: 240, y: 240, width: 800, height: 180, rotation: 0 },
          style: { fontSize: 44, textAlign: "center" },
          animation: { type: "zoom", duration: 0.6, delay: 0.15 },
          name: "Formula",
        }),
      ];
      break;
    }
    case "references": {
      const refs = content.references ?? [];
      base.elements = [
        heading("References", 80, 100, 1120, 48),
        ...refs.slice(0, 8).map((r, i) => [
          bodyText(`${i + 1}.`, 100, 190 + i * 56, 60, 50, 18, 700, "center"),
          bodyText(r.title, 170, 190 + i * 56, 640, 50, 18),
          bodyText(r.source, 830, 190 + i * 56, 350, 50, 15, 400, "right"),
        ]).flat(),
      ];
      break;
    }
    case "conclusion": {
      base.elements = [
        heading(item.title, 100, 220, 1080, 60),
        ...(content.bullets ?? []).slice(0, 4).map((b, i) =>
          bodyText(`•  ${b}`, 100, 340 + i * 70, 1000, 60, 22)
        ),
      ];
      break;
    }
    case "q-and-a": {
      base.elements = [
        heading("Questions?", 100, 220, 1080, 72),
        subtitle("Let's discuss", 100, 360, 800, 28),
      ];
      break;
    }
    case "facts": {
      const facts = content.facts ?? [];
      const icons = pickIcons(Math.max(facts.length, 1));
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        ...facts.slice(0, 6).map((f, i) => {
          const cx = 80 + (i % 3) * 380;
          const cy = 210 + Math.floor(i / 3) * 210;
          return [
            iconElement(icons[i] ?? "check_circle", cx + 30, cy + 26, 34, 0.1 + i * 0.06),
            bodyText(f.fact, cx + 80, cy + 26, 270, 150, 17, 500),
          ];
        }).flat(),
      ];
      break;
    }
    case "key-takeaways": {
      const pts = content.keyPoints ?? content.bullets ?? [];
      base.elements = [
        heading("Key Takeaways", 80, 110, 1120, 48),
        ...pts.slice(0, 5).map((p, i) => [
          makeElement({
            type: "shape",
            shape: "circle",
            position: { x: 100, y: 210 + i * 90, width: 20, height: 20, rotation: 0 },
            style: { fill: "var(--t-primary)" },
            animation: { type: "scale", duration: 0.4, delay: 0.1 + i * 0.08 },
            name: "Bullet Dot",
          }),
          bodyText(p, 140, 200 + i * 90, 1000, 80, 22),
        ]).flat(),
      ];
      break;
    }
    case "gallery": {
      const imgs = content.galleryImages ?? [];
      const imgsArr =
        imgs.length >= 3
          ? imgs
          : Array.from({ length: 3 }, (_, i) =>
              planImage(`${item.title}:${index}:${i}`, domainFromCategory(theme.category), item.layout, item.title)
            );
      base.elements = [
        heading(item.title, 80, 100, 1120, 44),
        ...imgsArr.slice(0, 3).map((src, i) =>
          makeElement({
            type: "image",
            src,
            alt: `Gallery ${i + 1}`,
            objectFit: "cover",
            position: { x: 80 + i * 390, y: 210, width: 360, height: 400, rotation: 0 },
            style: { borderRadius: 16, shadow: true },
            animation: { type: "zoom", duration: 0.6, delay: 0.1 + i * 0.1 },
            name: "Gallery Image",
          })
        ),
      ];
      break;
    }
    case "video": {
      base.elements = [
        heading(item.title, 80, 90, 1120, 42),
        makeElement({
          type: "video",
          src: content.youtubeUrl ?? "",
          autoplay: false,
          loop: false,
          poster: content.imageUrl,
          position: { x: 240, y: 180, width: 800, height: 450, rotation: 0 },
          style: { borderRadius: 12, shadow: true },
          animation: { type: "zoom", duration: 0.6, delay: 0.15 },
          name: "Video",
        }),
      ];
      break;
    }
    case "section": {
      base.elements = [
        ...decorElements(theme),
        makeElement({
          type: "text",
          content: `${String(index + 1).padStart(2, "0")}`,
          position: { x: 100, y: 240, width: 200, height: 60, rotation: 0 },
          style: { fontSize: 26, fontWeight: 700, color: "var(--t-primary)", letterSpacing: 4 },
          animation: { type: "fade", duration: 0.6, delay: 0 },
          name: "Section Number",
        }),
        heading(item.title, 100, 320, 1000, 68),
        ...(content.subtitle ? [subtitle(content.subtitle, 100, 440, 800, 24)] : []),
      ];
      break;
    }
    default: {
      base.elements = [
        heading(content.title ?? item.title, 100, 200, 1080, 56),
        ...(content.bullets ?? []).slice(0, 6).map((b, i) =>
          bodyText(`•  ${b}`, 100, 320 + i * 62, 1000, 56, 20)
        ),
      ];
    }
  }

  const audited = auditAndAutoFixSlide(base, theme);
  return resolveTextOverlaps(audited.slide);
}

export function createBlankSlide(title = "Untitled Slide"): Slide {
  return {
    id: uid(),
    title,
    layout: "blank",
    elements: [],
    background: "var(--t-background)",
    transition: "fade",
    notes: "",
    speakerNotes: "",
    hidden: false,
  };
}
