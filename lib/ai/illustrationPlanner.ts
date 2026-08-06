import { LayoutType } from "../types";

export type IllustrationStyle =
  | "abstract"
  | "medical"
  | "technology"
  | "education"
  | "finance"
  | "business"
  | "nature"
  | "minimal"
  | "3d"
  | "isometric";

export interface IllustrationPlan {
  style: IllustrationStyle;
  src: string; // data URI SVG
  label: string;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
}

export const STYLE_LABELS: Record<IllustrationStyle, string> = {
  abstract: "Abstract Artwork",
  medical: "Medical Artwork",
  technology: "Technology Artwork",
  education: "Educational Artwork",
  finance: "Finance Artwork",
  business: "Business Artwork",
  nature: "Nature Artwork",
  minimal: "Minimal Illustration",
  "3d": "3D Graphic",
  isometric: "Isometric Graphic",
};

const STYLE_BY_DOMAIN: Record<string, IllustrationStyle> = {
  ai: "technology",
  tech: "technology",
  health: "medical",
  business: "business",
  finance: "finance",
  education: "education",
  environment: "nature",
  marketing: "abstract",
};

const TITLE_HINTS: [RegExp, IllustrationStyle][] = [
  [/architecture|circuit|network|pipeline|system|infrastructure|algorithm/i, "technology"],
  [/health|medic|clinic|care|patient|diagnos/i, "medical"],
  [/study|learn|course|school|teaching|education|research/i, "education"],
  [/revenue|budget|cost|price|financ|investment|market/i, "finance"],
  [/growth|expand|scal|metric|kpi|business|enterprise|strategy/i, "business"],
  [/planet|climate|energy|green|sustain|forest|environment/i, "nature"],
  [/abstract|creative|color|brand/i, "abstract"],
  [/isometric|cube|3d|three dimension/i, "isometric"],
];

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

function opacity(hex: string, o: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.min(1, Math.round(o * 100) / 100)})`;
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function isometricCube(p: Palette): string {
  const s = 120;
  const top = [140, 60, 140 + s, 60, 170 + s, 94, 170, 94].join(" ");
  const left = [170, 94, 170 + s, 94, 170 + s, 94 + s, 170, 94 + s].join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<rect width="400" height="400" rx="24" fill="${opacity(p.surface, 0)}"/>
<polygon points="${top}" fill="${p.primary}" opacity="0.9"/>
<polygon points="${left}" fill="${p.secondary}" opacity="0.8"/>
<polygon points="140,60 170,94 170,214 140,180" fill="${p.accent}" opacity="0.7"/>
</svg>`;
}

/** Deterministic SVG illustrations rendered per style — theme-matched, never unrelated. */
export function renderIllustration(style: IllustrationStyle, seed: string, p: Palette): string {
  const h = hash(seed);
  const a = opacity(h % 2 ? p.primary : p.accent, 0.12 + (h % 3) * 0.06);
  const c = h % 2 ? p.accent : p.secondary;

  switch (style) {
    case "medical": {
      const cx = 200,
        cy = 150,
        r = 96;
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="300" cx="200" cy="200" fill="${a}"/>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.primary}" opacity="0.12"/>
<rect x="${cx - 34}" y="${cy - 22}" width="68" height="44" rx="10" fill="${p.primary}"/>
<rect x="${cx - 14}" y="${cy - 42}" width="28" height="84" rx="9" fill="${p.primary}"/>
<path d="M60 340 Q100 280 140 330 Q180 380 220 320 T300 300 T360 330" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
</svg>`);
    }
    case "technology": {
      const nodes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const nx = 60 + i * 72;
        const ny = 90 + ((h + i * 47) % 220);
        nodes.push(`<circle cx="${nx}" cy="${ny}" r="${12 + (hash(`${seed}:n${i}`) % 14)}" fill="${i % 2 ? p.primary : c}"/>`);
      }
      const links = [60, 132, 204, 276, 348]
        .map((x, i) => {
          const y0 = 70 + ((i * 47) % 220);
          const y1 = 70 + (((i + 1) * 47) % 220);
          return `<line x1="${x}" y1="${y0}" x2="${x + 72}" y2="${y1}" stroke="${c}" stroke-width="3" opacity="0.5"/>`;
        })
        .join("");
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="200" cx="200" cy="200" fill="${a}"/>
${links}
${nodes.join("")}
<rect x="120" y="300" width="160" height="52" rx="14" fill="${p.primary}" opacity="0.9"/>
<rect x="136" y="316" width="128" height="8" rx="4" fill="#ffffff" opacity="0.8"/>
</svg>`);
    }
    case "education": {
      const gx = 200,
        gy = 170,
        gw = 210,
        gh = 130;
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="190" cx="200" cy="200" fill="${a}"/>
<path d="M${gx - gw / 2} ${gy} L${gx} ${gy - gh * 0.45} L${gx + gw / 2} ${gy} Z" fill="${p.primary}" opacity="0.92"/>
<path d="M${gx - gw / 2} ${gy} L${gx - gw / 2} ${gy + gh * 0.2} Q${gx} ${gy + gh * 0.2 + 26} ${gx + gw / 2} ${gy + gh * 0.2} L${gx + gw / 2} ${gy} Z" fill="${c}" opacity="0.85"/>
<rect x="${gx - gw / 2 - 10}" y="${gy + gh * 0.2}" width="${gw + 20}" height="14" rx="7" fill="${p.secondary}"/>
<circle cx="${gx - 90}" cy="${gy + gh * 0.55}" r="7" fill="${c}" opacity="0.6"/>
<circle cx="${gx - 90}" cy="${gy + gh * 0.85}" r="7" fill="${c}" opacity="0.6"/>
</svg>`);
    }
    case "finance": {
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="190" cx="200" cy="200" fill="${a}"/>
<path d="M60 330 L340 330" stroke="${p.text}" stroke-width="3" opacity="0.4"/>
${[
          { x: 80, y: 240, col: p.primary },
          { x: 150, y: 190, col: p.secondary },
          { x: 220, y: 150, col: p.accent },
          { x: 290, y: 100, col: p.primary },
        ].map(({ x, y, col }) => `<rect x="${x}" y="${y}" width="36" height="${330 - y}" rx="8" fill="${col}" opacity="0.88"/>`).join("")}
<line x1="86" y1="250" x2="326" y2="90" stroke="${c}" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
</svg>`);
    }
    case "business": {
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="400" cx="200" cy="200" fill="${a}"/>
<circle cx="200" cy="180" r="86" fill="${p.primary}" opacity="0.12"/>
<path d="M120 220 L200 130 L260 190 L320 110" fill="none" stroke="${p.primary}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="120" cy="220" r="10" fill="${p.primary}"/>
<circle cx="200" cy="130" r="14" fill="${c}"/>
<circle cx="260" cy="190" r="11" fill="${p.primary}"/>
<circle cx="320" cy="110" r="18" fill="${p.accent}"/>
</svg>`);
    }
    case "nature": {
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<circle r="190" cx="200" cy="200" fill="${a}"/>
<path d="M200 350 C140 310 130 240 200 130 C270 240 260 310 200 350 Z" fill="${p.primary}" opacity="0.9"/>
<path d="M200 320 L200 230" stroke="${p.secondary}" stroke-width="6" stroke-linecap="round"/>
<path d="M200 260 C235 240 255 250 270 275 C245 265 225 262 200 260 Z" fill="${p.accent}"/>
<path d="M200 250 C170 232 155 245 148 270 C165 258 185 252 200 250 Z" fill="${p.accent}"/>
<circle cx="330" cy="90" r="22" fill="${p.accent}" opacity="0.7"/>
<circle cx="300" cy="76" r="11" fill="${p.accent}" opacity="0.5"/>
</svg>`);
    }
    case "3d":
    case "isometric":
      return toDataUri(isometricCube(p));
    case "minimal":
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<rect width="400" height="400" rx="24" fill="${opacity(p.surface, 0)}"/>
<circle cx="140" cy="140" r="54" fill="${c}"/>
<rect x="80" y="220" width="180" height="34" rx="17" fill="${p.primary}" opacity="0.9"/>
<rect x="80" y="270" width="120" height="34" rx="17" fill="${p.secondary}" opacity="0.7"/>
</svg>`);
    case "abstract":
    default:
      return toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<rect width="400" height="400" rx="24" fill="${opacity(p.surface, 0)}"/>
<circle cx="170" cy="170" r="${86 + (h % 30)}" fill="${a}"/>
<circle cx="240" cy="210" r="40" fill="${c}"/>
</svg>`);
  }
}

/**
 * Director stage: Illustration Planner.
 * Decides style (illustration/3D/isometric/artwork) per slide and renders a
 * deterministic, theme-matched SVG illustration — never an unrelated stock asset.
 */
export function planIllustration(
  seed: string,
  domainId: string,
  layout: LayoutType,
  title: string,
  palette: Palette
): IllustrationPlan {
  let style: IllustrationStyle = STYLE_BY_DOMAIN[domainId] ?? "abstract";
  for (const [re, s] of TITLE_HINTS) {
    if (re.test(title)) {
      style = s;
      break;
    }
  }
  if (layout === "formula" || layout === "architecture" || layout === "flowchart") style = "technology";

  return { style, src: renderIllustration(style, seed, palette), label: STYLE_LABELS[style] };
}