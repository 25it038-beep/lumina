import { ICONS, ICON_NAMES } from "../icons";
import { LayoutType } from "../types";

type IconPack = "lucide" | "heroicons" | "material" | "tabler" | "phosphor";

interface IconPackProfile {
  pack: IconPack;
  display: string;
  matches: string[]; // icon names present in the shared registry for this pack
}

const PACK_THEMES: Record<IconPack, { match: (t: string) => boolean; display: string }> = {
  lucide: { match: (t) => /lucide|light|clean|minimal|modern|apple/i.test(t), display: "Lucide" },
  heroicons: { match: (t) => /heroicon|sharp|utility|outline|gov/i.test(t), display: "Heroicons" },
  material: { match: (t) => /material|rounded|google/i.test(t), display: "Material" },
  tabler: { match: (t) => /tabler|grid|tech|engineering|code/i.test(t), display: "Tabler" },
  phosphor: { match: (t) => /phosphor|bold|duotone|vivid|creative|marketing/i.test(t), display: "Phosphor" },
};

const DOMAIN_ICON_SETS: Record<string, string[]> = {
  ai: ["bot", "brain", "cpu", "network", "sparkles", "wand_2", "database", "zap", "layers", "code"],
  tech: ["cpu", "server", "cloud", "code", "terminal", "monitor", "laptop", "wifi", "settings", "shield"],
  health: ["stethoscope", "heart_pulse", "activity", "pill", "syringe", "dna", "microscope", "hospital", "thermometer", "flask_conical"],
  business: ["briefcase", "building", "trending_up", "target", "rocket", "handshake", "presentation", "lightbulb", "award", "users"],
  finance: ["dollar_sign", "euro", "bitcoin", "coins", "credit_card", "banknote", "percent", "calculator", "piggy_bank", "line_chart"],
  education: ["graduation_cap", "book_open", "book", "library", "pencil", "pen_tool", "ruler", "flask_conical", "atom", "globe"],
  environment: ["leaf", "tree_pine", "flower", "sun", "cloud_sun", "globe", "map_pin", "heart", "shield", "zap"],
  marketing: ["megaphone", "share_2", "target", "trending_up", "sparkles", "zap", "users", "message_circle", "star", "flame"],
  generic: ["sparkles", "lightbulb", "target", "star", "check_circle", "arrow_right", "layers", "grid", "zap", "rocket"],
};

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Director stage: Icon Planner.
 * Chooses a coherent icon pack + domain-matched icon names for a slide,
 * seeded per deck so different presentations get different icon flavor.
 */
export function planIcons(
  seed: string,
  domainId: string,
  layout: LayoutType,
  count = 3,
  themeName = ""
): { pack: IconPack; packDisplay: string; icons: string[] } {
  const pool = DOMAIN_ICON_SETS[domainId] ?? DOMAIN_ICON_SETS.generic;

  let pack: IconPack = "lucide";
  for (const [id, profile] of Object.entries(PACK_THEMES)) {
    if (profile.match(themeName)) {
      pack = id as IconPack;
      break;
    }
  }
  if (pack === "lucide") {
    const packs: IconPack[] = ["lucide", "heroicons", "material", "tabler", "phosphor"];
    pack = packs[hash(`${seed}:pack`) % packs.length];
  }

  const start = hash(`${seed}:${layout}`) % pool.length;
  const icons: string[] = [];
  for (let i = 0; i < count; i++) {
    icons.push(pool[(start + i) % pool.length]);
  }

  return { pack, packDisplay: PACK_THEMES[pack].display, icons };
}

export function searchIconNames(query: string, limit = 24): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return ICON_NAMES.slice(0, limit);
  const scored = ICON_NAMES.map((name) => {
    const meta = ICONS[name];
    let score = 0;
    if (name.includes(q)) score += 10;
    if (meta.name.toLowerCase().includes(q)) score += 8;
    if (meta.keywords.some((k) => k.includes(q))) score += 4;
    return { name, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.name);
}

export function iconForDomain(domainId: string, index = 0): string {
  const pool = DOMAIN_ICON_SETS[domainId] ?? DOMAIN_ICON_SETS.generic;
  return pool[index % pool.length];
}
