import { ThemeDefinition } from "../types";

function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Enhanced slide backgrounds — 12 layered CSS gradient patterns built from the
 * theme's full palette (primary / secondary / accent / surface / text), seeded
 * per slide so every slide in a deck looks distinct while staying on-brand.
 */
export function generateDynamicBackground(theme: ThemeDefinition, index: number, seed?: string): string {
  const p = theme.primary;
  const s = theme.secondary || theme.accent;
  const a = theme.accent || theme.primary;
  const bg = theme.background;
  const surf = theme.surface || bg;
  const tx = theme.text || "#ffffff";
  const base = theme.gradient && /gradient/i.test(theme.gradient) ? theme.gradient : `linear-gradient(135deg, ${bg}, ${surf})`;

  const h = hashString(seed ? `${seed}:${index}` : String(index));
  const x1 = 5 + (h % 85);
  const x2 = 10 + ((h >> 3) % 80);
  const y1 = 5 + ((h >> 5) % 85);
  const y2 = 10 + ((h >> 8) % 80);
  const x3 = 15 + ((h >> 11) % 70);
  const y3 = 15 + ((h >> 14) % 70);
  const ang = h % 360;

  switch (h % 12) {
    case 0:
      // Aurora Mesh — three soft light blooms
      return `radial-gradient(at ${x1}% ${y1}%, ${p}40 0px, transparent 55%), radial-gradient(at ${x2}% ${y2}%, ${s}33 0px, transparent 55%), radial-gradient(at ${x3}% ${y3}%, ${a}26 0px, transparent 50%), ${base}`;
    case 1:
      // Glass Orbs — big corner glows for glassmorphism themes
      return `radial-gradient(at 12% 18%, ${p}42 0px, transparent 58%), radial-gradient(at 88% 82%, ${s}38 0px, transparent 58%), radial-gradient(at 80% 12%, ${a}2e 0px, transparent 45%), ${base}`;
    case 2:
      // Cyber Grid — faint tech grid + top glow
      return `repeating-linear-gradient(0deg, ${tx}08 0px 1px, transparent 1px 64px), repeating-linear-gradient(90deg, ${tx}08 0px 1px, transparent 1px 64px), radial-gradient(ellipse 80% 55% at 50% 0%, ${p}33 0%, transparent 65%), ${base}`;
    case 3:
      // Diagonal Stripes — angled energy bands
      return `repeating-linear-gradient(135deg, ${tx}0a 0px 16px, transparent 16px 52px), linear-gradient(120deg, ${p}30 0%, transparent 55%), ${base}`;
    case 4:
      // Conic Rays — light burst from a corner
      return `conic-gradient(from ${ang}deg at 50% 110%, ${p}26, transparent 22%, ${s}1f 40%, transparent 62%, ${a}24 80%, transparent 100%), ${base}`;
    case 5:
      // Spotlight Stage — single overhead glow
      return `radial-gradient(ellipse 90% 62% at 50% -12%, ${p}38 0%, transparent 60%), radial-gradient(circle at ${x2}% ${y2}%, ${a}22 0px, transparent 45%), ${base}`;
    case 6:
      // Horizon Rise — light from the bottom edge
      return `linear-gradient(180deg, transparent 58%, ${s}2e 100%), radial-gradient(circle at 50% 108%, ${a}38 0px, transparent 52%), ${base}`;
    case 7:
      // Wave Bands — large-scale soft diagonal waves
      return `repeating-linear-gradient(160deg, ${p}10 0px 96px, transparent 96px 192px), repeating-linear-gradient(20deg, ${s}0d 0px 128px, transparent 128px 256px), ${base}`;
    case 8:
      // Halos & Ring — centered radial ring detail
      return `radial-gradient(circle at ${x1}% ${y1}%, ${p}2e 0px, transparent 42%), radial-gradient(circle at 50% 50%, transparent 62%, ${tx}0d 63% 64.5%, transparent 65%), ${base}`;
    case 9:
      // Corner Rays — hard-stop diagonal bands
      return `linear-gradient(115deg, ${p}26 0% 12%, transparent 12% 22%, ${s}20 22% 34%, transparent 34% 46%, ${a}24 46% 58%, transparent 58%), ${base}`;
    case 10:
      // Duo Depth — two-sided glow with vignette
      return `radial-gradient(ellipse 70% 60% at 15% 85%, ${s}30 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 85% 15%, ${p}30 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, transparent 52%, ${bg}55 100%), ${base}`;
    case 11:
      // Triad Glow — three-point light layout
      return `radial-gradient(circle at ${x1}% ${y2}%, ${p}2c 0px, transparent 48%), radial-gradient(circle at ${x2}% ${y1}%, ${s}26 0px, transparent 48%), radial-gradient(circle at 50% 50%, ${a}1f 0px, transparent 60%), ${base}`;
    default:
      return base;
  }
}
