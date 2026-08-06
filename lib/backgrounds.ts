import { LayoutType, ThemeDefinition } from "./types";
import type { CSSProperties } from "react";

export type BackgroundCategory =
  | "solid" | "gradient" | "mesh" | "glass" | "minimal" | "pattern"
  | "abstract" | "image" | "illustration" | "dark" | "light" | "premium"
  | "animated" | "texture" | "brand" | "video";

export type BackgroundKind = "solid" | "gradient" | "image" | "video";

export interface SlideBackground {
  id: string;
  name: string;
  category: BackgroundCategory;
  kind: BackgroundKind;
  css: string;
  imageUrl?: string;
  videoUrl?: string;
  animated?: boolean;
  effect?: string;
  dark: boolean;
}

export const BACKGROUND_CATEGORIES: { id: BackgroundCategory; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "gradient", label: "Gradients" },
  { id: "mesh", label: "Mesh" },
  { id: "glass", label: "Glassmorphism" },
  { id: "minimal", label: "Minimal" },
  { id: "pattern", label: "Patterns" },
  { id: "abstract", label: "Abstract AI" },
  { id: "image", label: "Images" },
  { id: "illustration", label: "Illustrations" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "premium", label: "Premium" },
  { id: "animated", label: "Animated" },
  { id: "texture", label: "Textures" },
  { id: "brand", label: "Brand" },
  { id: "video", label: "Video" },
];

const B = (
  id: string, name: string, category: BackgroundCategory, kind: BackgroundKind,
  css: string, dark: boolean, extra?: Partial<SlideBackground>
): SlideBackground => ({ id, name, category, kind, css, dark, ...extra });

export const BACKGROUNDS: SlideBackground[] = [
  // ── 1. Solid Colors ──────────────────────────────────────────────
  B("solid-white", "Pure White", "solid", "solid", "#ffffff", false),
  B("solid-black", "Pure Black", "solid", "solid", "#000000", true),
  B("solid-gray", "Soft Gray", "solid", "solid", "#f1f5f9", false),
  B("solid-slate", "Slate Gray", "solid", "solid", "#64748b", true),
  B("solid-blue", "Royal Blue", "solid", "solid", "#2563eb", true),
  B("solid-indigo", "Indigo", "solid", "solid", "#4f46e5", true),
  B("solid-purple", "Purple", "solid", "solid", "#7c3aed", true),
  B("solid-violet", "Violet", "solid", "solid", "#8b5cf6", true),
  B("solid-green", "Green", "solid", "solid", "#16a34a", true),
  B("solid-emerald", "Emerald", "solid", "solid", "#059669", true),
  B("solid-orange", "Orange", "solid", "solid", "#f97316", true),
  B("solid-amber", "Amber", "solid", "solid", "#f59e0b", true),
  B("solid-red", "Red", "solid", "solid", "#ef4444", true),
  B("solid-pink", "Pink", "solid", "solid", "#ec4899", true),
  B("solid-teal", "Teal", "solid", "solid", "#14b8a6", true),
  B("solid-cream", "Cream", "solid", "solid", "#faf6ef", false),

  // ── 2. Gradient Backgrounds ──────────────────────────────────────
  B("grad-blue", "Blue Linear", "gradient", "gradient", "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #60a5fa 100%)", true),
  B("grad-purple", "Purple Linear", "gradient", "gradient", "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 60%, #c084fc 100%)", true),
  B("grad-sunset", "Sunset", "gradient", "gradient", "linear-gradient(135deg, #f97316 0%, #ec4899 55%, #a855f7 100%)", true),
  B("grad-ocean", "Ocean", "gradient", "gradient", "linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #38bdf8 100%)", true),
  B("grad-neon", "Neon Glow", "gradient", "gradient", "linear-gradient(135deg, #00ff9d 0%, #00e5ff 50%, #7c3aed 100%)", true),
  B("grad-midnight", "Midnight", "gradient", "gradient", "linear-gradient(180deg, #020617 0%, #0f172a 60%, #1e293b 100%)", true),
  B("grad-dawn", "Dawn", "gradient", "gradient", "linear-gradient(160deg, #fecdd3 0%, #fda4af 35%, #c084fc 100%)", true),
  B("grad-lime", "Lime Slate", "gradient", "gradient", "linear-gradient(135deg, #365314 0%, #65a30d 100%)", true),
  B("grad-coral", "Coral Sky", "gradient", "gradient", "linear-gradient(180deg, #fb7185 0%, #f97316 100%)", true),
  B("grad-radial-blue", "Radial Blue", "gradient", "gradient", "radial-gradient(circle at 30% 30%, #3b82f6 0%, #1e3a8a 60%, #0f172a 100%)", true),
  B("grad-radial-gold", "Radial Gold", "gradient", "gradient", "radial-gradient(circle at 50% 40%, #fbbf24 0%, #b45309 60%, #1c1917 100%)", true),
  B("grad-tricolor", "Tri-Color", "gradient", "gradient", "linear-gradient(90deg, #ef4444 0%, #f59e0b 33%, #10b981 66%, #3b82f6 100%)", true),
  B("grad-browser", "Browser Sunset", "gradient", "gradient", "linear-gradient(120deg, #ff7e5f 0%, #feb47b 50%, #86a8e7 100%)", true),
  B("grad-aurora", "Aurora", "gradient", "gradient", "linear-gradient(135deg, #38bdf8 0%, #a78bfa 50%, #34d399 100%)", true),
  B("grad-emerald", "Emerald Flow", "gradient", "gradient", "linear-gradient(135deg, #064e3b 0%, #10b981 60%, #6ee7b7 100%)", true),

  // ── 3. Mesh Gradients (AI-style blobs) ───────────────────────────
  B("mesh-blue-purple", "Blue + Purple", "mesh", "gradient", "radial-gradient(at 15% 20%, #2563eb99 0px, transparent 50%), radial-gradient(at 85% 80%, #7c3aed99 0px, transparent 50%), radial-gradient(at 70% 15%, #38bdf866 0px, transparent 45%), #0b1020", true),
  B("mesh-green-cyan", "Green + Cyan", "mesh", "gradient", "radial-gradient(at 20% 25%, #10b98199 0px, transparent 50%), radial-gradient(at 80% 75%, #06b6d499 0px, transparent 50%), radial-gradient(at 60% 10%, #34d39966 0px, transparent 45%), #04110b", true),
  B("mesh-pink-orange", "Pink + Orange", "mesh", "gradient", "radial-gradient(at 25% 20%, #ec489999 0px, transparent 50%), radial-gradient(at 80% 80%, #f9731699 0px, transparent 50%), radial-gradient(at 65% 12%, #fbbf2466 0px, transparent 45%), #12080a", true),
  B("mesh-indigo-violet", "Indigo + Violet", "mesh", "gradient", "radial-gradient(at 18% 28%, #6366f199 0px, transparent 50%), radial-gradient(at 82% 72%, #a855f799 0px, transparent 50%), radial-gradient(at 55% 15%, #8b5cf666 0px, transparent 45%), #0a0714", true),
  B("mesh-dark", "Dark Mesh", "mesh", "gradient", "radial-gradient(at 10% 10%, #0ea5e955 0px, transparent 50%), radial-gradient(at 90% 90%, #6366f14d 0px, transparent 50%), radial-gradient(at 80% 10%, #f472b640 0px, transparent 45%), #05060f", true),
  B("mesh-pastel", "Pastel Mesh", "mesh", "gradient", "radial-gradient(at 20% 25%, #fbcfe899 0px, transparent 50%), radial-gradient(at 80% 75%, #bfdbfe99 0px, transparent 50%), radial-gradient(at 65% 15%, #bbf7d080 0px, transparent 45%), #fdf4f4", false),
  B("mesh-magenta", "Magenta Bloom", "mesh", "gradient", "radial-gradient(at 15% 15%, #f472b699 0px, transparent 50%), radial-gradient(at 85% 85%, #fb718599 0px, transparent 50%), radial-gradient(at 75% 20%, #a855f766 0px, transparent 45%), #16060f", true),
  B("mesh-sky", "Sky Mesh", "mesh", "gradient", "radial-gradient(at 20% 20%, #7dd3fc99 0px, transparent 50%), radial-gradient(at 80% 80%, #93c5fd99 0px, transparent 50%), radial-gradient(at 60% 10%, #99f6e480 0px, transparent 45%), #062033", true),
  B("mesh-cyber", "Cyber Mesh", "mesh", "gradient", "radial-gradient(at 12% 18%, #00ff9d66 0px, transparent 45%), radial-gradient(at 88% 82%, #00e5ff55 0px, transparent 45%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px 1px, transparent 1px 60px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px 1px, transparent 1px 60px), #03060a", true),

  // ── 4. Glassmorphism ─────────────────────────────────────────────
  B("glass-dark", "Frosted Dark", "glass", "gradient", "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", true),
  B("glass-light", "Frosted Light", "glass", "gradient", "linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)", false),
  B("glass-blue", "Frosted Blue", "glass", "gradient", "linear-gradient(160deg, #0b1020 0%, #1e3a8a 100%)", true),
  B("glass-violet", "Frosted Violet", "glass", "gradient", "linear-gradient(160deg, #171030 0%, #4c1d95 100%)", true),
  B("glass-mint", "Frosted Mint", "glass", "gradient", "linear-gradient(160deg, #04231b 0%, #065f46 100%)", true),
  B("glass-slate", "Frosted Slate", "glass", "gradient", "linear-gradient(160deg, #0f172a 0%, #334155 100%)", true),

  // ── 5. Minimal Backgrounds ───────────────────────────────────────
  B("min-white", "Clean White", "minimal", "solid", "#ffffff", false),
  B("min-gray", "Soft Gray", "minimal", "solid", "#f5f5f5", false),
  B("min-beige", "Light Beige", "minimal", "solid", "#f5f0e8", false),
  B("min-black", "Pure Black", "minimal", "solid", "#050505", true),
  B("min-offwhite", "Warm Off-White", "minimal", "solid", "#fafaf8", false),
  B("min-silver", "Silver Mist", "minimal", "solid", "#eef0f2", false),
  B("min-charcoal", "Charcoal", "minimal", "solid", "#18181b", true),
  B("min-cloud", "Cloud White", "minimal", "gradient", "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)", false),
  B("min-fog", "Fog", "minimal", "gradient", "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)", false),

  // ── 6. Pattern Backgrounds ───────────────────────────────────────
  B("pat-dots", "Dots", "pattern", "gradient", "radial-gradient(rgba(15,23,42,0.12) 1.5px, transparent 1.5px) 0 0/26px 26px, #fafafa", false),
  B("pat-dots-dark", "Dark Dots", "pattern", "gradient", "radial-gradient(rgba(255,255,255,0.14) 1.5px, transparent 1.5px) 0 0/26px 26px, #0b0f19", true),
  B("pat-grid", "Grid", "pattern", "gradient", "linear-gradient(rgba(15,23,42,0.1) 1px, transparent 1px) 0 0/48px 48px, linear-gradient(90deg, rgba(15,23,42,0.1) 1px, transparent 1px) 0 0/48px 48px, #ffffff", false),
  B("pat-grid-dark", "Dark Grid", "pattern", "gradient", "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px) 0 0/48px 48px, linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px) 0 0/48px 48px, #0b0f19", true),
  B("pat-hex", "Hexagon", "pattern", "gradient", "repeating-linear-gradient(60deg, rgba(15,23,42,0.07) 0px 2px, transparent 2px 36px), repeating-linear-gradient(-60deg, rgba(15,23,42,0.07) 0px 2px, transparent 2px 36px), repeating-linear-gradient(0deg, rgba(15,23,42,0.07) 0px 2px, transparent 2px 62px), #fafafa", false),
  B("pat-waves", "Waves", "pattern", "gradient", "repeating-linear-gradient(160deg, rgba(15,23,42,0.08) 0px 3px, transparent 3px 90px), repeating-linear-gradient(20deg, rgba(15,23,42,0.05) 0px 3px, transparent 3px 130px), #f8fafc", false),
  B("pat-diagonal", "Diagonal Lines", "pattern", "gradient", "repeating-linear-gradient(135deg, rgba(15,23,42,0.09) 0px 2px, transparent 2px 22px), #ffffff", false),
  B("pat-diagonal-dark", "Dark Diagonal", "pattern", "gradient", "repeating-linear-gradient(135deg, rgba(255,255,255,0.09) 0px 2px, transparent 2px 22px), #0b0f19", true),
  B("pat-geometric", "Geometric", "pattern", "gradient", "repeating-linear-gradient(45deg, #2563eb14 0px 14px, transparent 14px 28px), repeating-linear-gradient(-45deg, #7c3aed14 0px 14px, transparent 14px 28px), #f8fafc", false),
  B("pat-stripes", "Bold Stripes", "pattern", "gradient", "repeating-linear-gradient(90deg, #1e293b0d 0px 40px, transparent 40px 80px), #ffffff", false),

  // ── 7. Abstract AI Backgrounds ───────────────────────────────────
  B("abs-liquid", "Liquid Blobs", "abstract", "gradient", "radial-gradient(circle at 20% 30%, #7c3aed66 0%, transparent 40%), radial-gradient(circle at 75% 25%, #ec489955 0%, transparent 40%), radial-gradient(circle at 50% 80%, #06b6d466 0%, transparent 45%), radial-gradient(circle at 90% 70%, #f59e0b40 0%, transparent 35%), #0a0a1a", true),
  B("abs-fluid", "Fluid Waves", "abstract", "gradient", "repeating-linear-gradient(150deg, #38bdf81f 0px 60px, transparent 60px 140px), repeating-linear-gradient(30deg, #a78bfa1f 0px 90px, transparent 90px 190px), radial-gradient(circle at 50% 0%, #6366f133 0%, transparent 55%), #070b18", true),
  B("abs-organic", "Organic Shapes", "abstract", "gradient", "radial-gradient(ellipse 55% 45% at 25% 70%, #14b8a640 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 75% 30%, #f472b640 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 60% 75%, #fbbf2433 0%, transparent 55%), #0a0f0a", true),
  B("abs-noise", "Noise Texture", "abstract", "gradient", "repeating-conic-gradient(rgba(255,255,255,0.035) 0% 2%, transparent 2% 4%), #0b0d12", true),
  B("abs-particles", "Particles", "abstract", "gradient", "radial-gradient(circle at 15% 22%, rgba(255,255,255,0.5) 1px, transparent 2px) 0 0/70px 70px, radial-gradient(circle at 60% 45%, rgba(255,255,255,0.35) 1px, transparent 2px) 0 0/90px 90px, radial-gradient(circle at 80% 70%, rgba(255,255,255,0.45) 1px, transparent 2px) 0 0/110px 110px, #05060f", true),
  B("abs-ribbon", "Ribbon Effect", "abstract", "gradient", "linear-gradient(115deg, #6366f1cc 0% 14%, transparent 14% 26%, #ec4899cc 26% 40%, transparent 40% 52%, #06b6d4cc 52% 66%, transparent 66% 78%, #f59e0bcc 78% 90%, transparent 90%), #0b0f19", true),
  B("abs-grain", "Grain", "abstract", "gradient", "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 1%, transparent 1% 3%) 0 0/120px 120px, #f5f5f4", false),
  B("abs-aurora-flow", "Aurora Flow", "abstract", "gradient", "linear-gradient(180deg, #38bdf833 0%, transparent 45%), repeating-linear-gradient(115deg, #a78bfa22 0px 140px, transparent 140px 280px), radial-gradient(at 80% 90%, #34d39933 0px, transparent 50%), #071225", true),

  // ── 8. Image Backgrounds ─────────────────────────────────────────
  B("img-space", "Deep Space", "image", "image", "linear-gradient(180deg, #020617 0%, #0f172a 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-space/1600/900" }),
  B("img-city", "City Skyline", "image", "image", "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-city/1600/900" }),
  B("img-nature", "Nature", "image", "image", "linear-gradient(180deg, #052e16 0%, #166534 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-nature/1600/900" }),
  B("img-mountains", "Mountains", "image", "image", "linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-mountain/1600/900" }),
  B("img-ocean", "Ocean Depth", "image", "image", "linear-gradient(180deg, #082f49 0%, #0c4a6e 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-ocean/1600/900" }),
  B("img-tech", "Tech Abstract", "image", "image", "linear-gradient(180deg, #030712 0%, #0b0f19 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-tech/1600/900" }),
  B("img-forest", "Forest", "image", "image", "linear-gradient(180deg, #052e16 0%, #1c1917 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-forest/1600/900" }),
  B("img-business", "Corporate", "image", "image", "linear-gradient(180deg, #0f172a 0%, #334155 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-business/1600/900" }),
  B("img-blur-city", "Blurred City", "image", "image", "radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 80%)", true, { imageUrl: "https://picsum.photos/seed/bg-blurcity/1600/900" }),
  B("img-sunrise", "Sunrise", "image", "image", "linear-gradient(180deg, #fbbf24 0%, #f97316 60%, #7c2d12 100%)", true, { imageUrl: "https://picsum.photos/seed/bg-sunrise/1600/900" }),

  // ── 9. Illustration Backgrounds ──────────────────────────────────
  B("ill-flat", "Flat Color Block", "illustration", "gradient", "linear-gradient(160deg, #fef3c7 0%, #fde68a 40%, #f59e0b 100%)", true),
  B("ill-isometric", "Isometric", "illustration", "gradient", "linear-gradient(160deg, #dcfce7 0%, #86efac 45%, #16a34a 100%)", true),
  B("ill-corporate", "Corporate Illustration", "illustration", "gradient", "linear-gradient(160deg, #e0f2fe 0%, #7dd3fc 45%, #0369a1 100%)", true),
  B("ill-handdrawn", "Hand-Drawn", "illustration", "gradient", "repeating-linear-gradient(12deg, #f5f5f4 0px 18px, #fafaf9 18px 36px), linear-gradient(160deg, #fefce8 0%, #fde68a 100%)", false),
  B("ill-retro", "Retro Flat", "illustration", "gradient", "linear-gradient(160deg, #ffe4e6 0%, #fda4af 45%, #e11d48 100%)", true),

  // ── 10. Dark Themes ──────────────────────────────────────────────
  B("dark-gradient", "Dark Gradient", "dark", "gradient", "linear-gradient(135deg, #020617 0%, #0f172a 70%, #1e293b 100%)", true),
  B("dark-glass", "Dark Glass", "dark", "gradient", "linear-gradient(160deg, #0a0f1e 0%, #111a30 100%)", true),
  B("dark-mesh", "Dark Mesh", "dark", "gradient", "radial-gradient(at 20% 20%, #6366f140 0px, transparent 50%), radial-gradient(at 80% 80%, #ec489933 0px, transparent 50%), #04060c", true),
  B("dark-space", "Space", "dark", "gradient", "radial-gradient(circle at 25% 25%, #ffffff0f 0px 1px, transparent 2px) 0 0/90px 90px, radial-gradient(circle at 70% 60%, #ffffff0f 0px 1px, transparent 2px) 0 0/140px 140px, linear-gradient(180deg, #010409 0%, #0d1117 100%)", true),
  B("dark-midnight", "Midnight Blue", "dark", "gradient", "linear-gradient(160deg, #00112e 0%, #062a5e 100%)", true),
  B("dark-carbon", "Carbon Black", "dark", "gradient", "linear-gradient(180deg, #09090b 0%, #18181b 100%)", true),

  // ── 11. Light Themes ─────────────────────────────────────────────
  B("light-white", "Pure White", "light", "solid", "#ffffff", false),
  B("light-cream", "Cream", "light", "solid", "#fdfaf4", false),
  B("light-gray", "Soft Gray", "light", "solid", "#f3f4f6", false),
  B("light-sky", "Sky Blue", "light", "gradient", "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)", false),
  B("light-mint", "Mint", "light", "gradient", "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)", false),
  B("light-warm", "Warm Neutral", "light", "gradient", "linear-gradient(180deg, #fefcfb 0%, #f5efe6 100%)", false),

  // ── 12. Premium AI Themes ────────────────────────────────────────
  B("prem-cyberpunk", "Cyberpunk", "premium", "gradient", "linear-gradient(135deg, #ff2d78 0%, #7c3aed 50%, #00e5ff 100%)", true),
  B("prem-futuristic", "Futuristic", "premium", "gradient", "radial-gradient(at 30% 20%, #00e5ff4d 0px, transparent 45%), repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px 1px, transparent 1px 54px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px 1px, transparent 1px 54px), #030712", true),
  B("prem-tech", "Tech", "premium", "gradient", "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)", true),
  B("prem-startup", "Startup", "premium", "gradient", "radial-gradient(at 80% 20%, #8b5cf666 0px, transparent 50%), radial-gradient(at 15% 85%, #06b6d466 0px, transparent 50%), #0d0b1e", true),
  B("prem-enterprise", "Enterprise", "premium", "gradient", "linear-gradient(135deg, #0b1220 0%, #1e3a8a 100%)", true),
  B("prem-luxury", "Luxury", "premium", "gradient", "linear-gradient(160deg, #0b0a08 0%, #292524 60%, #d4af37 220%)", true),
  B("prem-gold", "Gold & Black", "premium", "gradient", "radial-gradient(at 50% 30%, #d4af372e 0px, transparent 50%), linear-gradient(180deg, #0b0a08 0%, #171512 100%)", true),
  B("prem-finance", "Finance", "premium", "gradient", "linear-gradient(135deg, #04120c 0%, #0a2116 70%, #065f46 100%)", true),
  B("prem-health", "Healthcare", "premium", "gradient", "linear-gradient(160deg, #f0fdfa 0%, #99f6e4 100%)", false),
  B("prem-education", "Education", "premium", "gradient", "linear-gradient(160deg, #eef2ff 0%, #c7d2fe 100%)", false),
  B("prem-creative", "Creative Agency", "premium", "gradient", "radial-gradient(at 20% 25%, #ec489966 0px, transparent 50%), radial-gradient(at 80% 75%, #3b82f666 0px, transparent 50%), #fdf2f8", false),
  B("prem-ai", "AI Hologram", "premium", "gradient", "radial-gradient(circle at 50% 35%, #a78bfa40 0%, transparent 55%), linear-gradient(180deg, #0a0a1a 0%, #14142a 100%)", true),

  // ── 13. Animated Backgrounds (presentation mode) ─────────────────
  B("anim-gradient", "Moving Gradient", "animated", "gradient", "linear-gradient(120deg, #667eea, #764ba2, #f093fb, #667eea)", true, { animated: true }),
  B("anim-aurora", "Live Aurora", "animated", "gradient", "linear-gradient(120deg, #38bdf8, #a78bfa, #34d399, #38bdf8)", true, { animated: true }),
  B("anim-ocean", "Deep Ocean Drift", "animated", "gradient", "linear-gradient(120deg, #0c4a6e, #0369a1, #38bdf8, #0c4a6e)", true, { animated: true }),
  B("anim-sunset", "Sunset Pulse", "animated", "gradient", "linear-gradient(120deg, #f97316, #ec4899, #a855f7, #f97316)", true, { animated: true }),
  B("anim-neon", "Neon Pulse", "animated", "gradient", "linear-gradient(120deg, #00ff9d, #00e5ff, #ff2d78, #00ff9d)", true, { animated: true }),
  B("anim-space", "Space Drift", "animated", "gradient", "linear-gradient(120deg, #0f172a, #1e293b, #334155, #0f172a)", true, { animated: true }),
  B("anim-pastel", "Pastel Shift", "animated", "gradient", "linear-gradient(120deg, #fbcfe8, #c7d2fe, #bbf7d0, #fbcfe8)", false, { animated: true }),
  B("eff-blobs", "Floating Blobs", "animated", "gradient", "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", true, { effect: "blobs", animated: true }),
  B("eff-particles", "Floating Particles", "animated", "gradient", "linear-gradient(160deg, #05060f 0%, #0b1020 100%)", true, { effect: "particles", animated: true }),
  B("eff-stars", "Stars", "animated", "gradient", "linear-gradient(180deg, #010409 0%, #0d1117 100%)", true, { effect: "stars", animated: true }),
  B("eff-waves", "Waves", "animated", "gradient", "linear-gradient(180deg, #0b1020 0%, #16243f 100%)", true, { effect: "waves", animated: true }),
  B("eff-neural", "Neural Network", "animated", "gradient", "linear-gradient(180deg, #030712 0%, #0b1020 100%)", true, { effect: "neural", animated: true }),
  B("eff-ribbon", "3D Ribbons", "animated", "gradient", "linear-gradient(180deg, #0a0a1a 0%, #14142a 100%)", true, { effect: "ribbon", animated: true }),
  B("eff-noise", "Noise Animation", "animated", "gradient", "linear-gradient(180deg, #0b0d12 0%, #151a24 100%)", true, { effect: "noise", animated: true }),
  B("eff-aurora", "Aurora Drift", "animated", "gradient", "linear-gradient(180deg, #071225 0%, #0f1b33 100%)", true, { effect: "aurora-drift", animated: true }),
  B("eff-grid", "Geometric Grid Glow", "animated", "gradient", "linear-gradient(180deg, #070c18 0%, #0d1527 100%)", true, { effect: "geometric-grid", animated: true }),
  B("eff-orbs", "Glass Ambient Orbs", "animated", "gradient", "linear-gradient(180deg, #080a14 0%, #121626 100%)", true, { effect: "glass-orbs", animated: true }),
  B("eff-constellations", "Glowing Constellations", "animated", "gradient", "linear-gradient(180deg, #020617 0%, #0b1329 100%)", true, { effect: "glowing-constellations", animated: true }),
  B("eff-blob-morph", "Liquid Morph", "animated", "gradient", "linear-gradient(160deg, #0a0a1a 0%, #12122a 100%)", true, { effect: "blob-morph", animated: true }),
  B("eff-layered-waves", "Layered Waves", "animated", "gradient", "linear-gradient(180deg, #071225 0%, #0f1b33 100%)", true, { effect: "layered-waves", animated: true }),
  B("eff-contour", "Contour Lines", "animated", "gradient", "linear-gradient(160deg, #0b1020 0%, #16243f 100%)", true, { effect: "contour", animated: true }),
  B("eff-neon-rings", "Neon Rings", "animated", "gradient", "linear-gradient(180deg, #070c18 0%, #0d1527 100%)", true, { effect: "neon-rings", animated: true }),
  B("eff-confetti", "Confetti", "animated", "gradient", "linear-gradient(180deg, #141021 0%, #1e1631 100%)", true, { effect: "confetti", animated: true }),
  B("eff-petals", "Falling Petals", "animated", "gradient", "linear-gradient(180deg, #0d1527 0%, #1a142b 100%)", true, { effect: "petals", animated: true }),
  B("eff-metaballs", "Metaballs", "animated", "gradient", "linear-gradient(160deg, #0a0a1a 0%, #101426 100%)", true, { effect: "metaballs", animated: true }),
  B("eff-orbit", "Orbital Motion", "animated", "gradient", "linear-gradient(180deg, #04060f 0%, #0b1020 100%)", true, { effect: "orbit", animated: true }),
  B("eff-spin-mesh", "Spinning Mesh", "animated", "gradient", "linear-gradient(180deg, #0a0714 0%, #14102a 100%)", true, { effect: "spin-mesh", animated: true }),
  B("eff-pulse-ring", "Pulse Rings", "animated", "gradient", "linear-gradient(180deg, #05060f 0%, #0d0b1e 100%)", true, { effect: "pulse-ring", animated: true }),
  B("eff-aurora-blobs", "Aurora Blobs", "animated", "gradient", "linear-gradient(180deg, #071225 0%, #101a33 100%)", true, { effect: "aurora-blobs", animated: true }),

  // ── 14. Textures / Decorative ────────────────────────────────────
  B("tex-paper", "Paper", "texture", "gradient", "linear-gradient(180deg, #fdfcf8 0%, #f5f0e6 100%)", false),
  B("tex-marble", "Marble", "texture", "gradient", "repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0px 3px, transparent 3px 60px), repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px 2px, transparent 2px 55px), linear-gradient(160deg, #f8fafc 0%, #d8dee9 100%)", false),
  B("tex-concrete", "Concrete", "texture", "gradient", "repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px 1px, transparent 1px 7px), linear-gradient(180deg, #e5e7eb 0%, #cbd5e1 100%)", false),
  B("tex-wood", "Wood", "texture", "gradient", "repeating-linear-gradient(90deg, rgba(120,53,15,0.08) 0px 3px, transparent 3px 90px), linear-gradient(180deg, #78350f 0%, #451a03 100%)", true),
  B("tex-metallic", "Metallic", "texture", "gradient", "linear-gradient(180deg, #e5e7eb 0%, #9ca3af 50%, #4b5563 100%)", true),
  B("tex-grain-light", "Noise Grain", "texture", "gradient", "repeating-conic-gradient(rgba(0,0,0,0.05) 0% 1%, transparent 1% 2.5%) 0 0/100px 100px, #ffffff", false),
  B("tex-fabric", "Fabric Weave", "texture", "gradient", "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.04) 0px 2px, transparent 2px 12px), #f5f5f4", false),

  // ── 15. Brand Backgrounds ────────────────────────────────────────
  B("brand-gradient", "Brand Gradient", "brand", "gradient", "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)", true),
  B("brand-corporate", "Corporate Identity", "brand", "gradient", "linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)", true),
  B("brand-duotone", "Brand Duotone", "brand", "gradient", "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)", true),
  B("brand-soft", "Soft Brand Wash", "brand", "gradient", "linear-gradient(160deg, #eef2ff 0%, #fae8ff 100%)", false),
  B("brand-royal", "Royal Brand", "brand", "gradient", "linear-gradient(160deg, #111827 0%, #4f46e5 100%)", true),

  // ── 16. Video Backgrounds ────────────────────────────────────────
  B("vid-aurora", "Aurora Video", "video", "video", "linear-gradient(120deg, #38bdf8, #a78bfa, #34d399)", true, { videoUrl: "https://cdn.pixabay.com/video/2021/10/24/92983-628354160_large.mp4", animated: true }),
  B("vid-ocean", "Ocean Video", "video", "video", "linear-gradient(120deg, #0c4a6e, #0369a1, #38bdf8)", true, { videoUrl: "https://cdn.pixabay.com/video/2017/03/09/8044-209128410_large.mp4", animated: true }),
  B("vid-abstract", "Abstract Video", "video", "video", "linear-gradient(120deg, #667eea, #764ba2, #f093fb)", true, { videoUrl: "https://cdn.pixabay.com/video/2016/06/15/4252-167673547_large.mp4", animated: true }),
];

export function getBackground(id: string): SlideBackground | undefined {
  return BACKGROUNDS.find((b) => b.id === id);
}

function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

const LAYOUT_CATEGORIES: Partial<Record<LayoutType, BackgroundCategory[]>> = {
  title: ["premium", "mesh", "dark", "image", "animated"],
  hero: ["premium", "mesh", "dark", "image"],
  section: ["premium", "dark", "mesh"],
  agenda: ["minimal", "light", "pattern"],
  conclusion: ["premium", "dark", "minimal"],
  "q-and-a": ["glass", "minimal", "light"],
  "key-takeaways": ["premium", "glass", "dark"],
  references: ["minimal", "light", "pattern"],
};

const DEFAULT_CATEGORIES: BackgroundCategory[] = ["gradient", "mesh", "abstract", "pattern", "minimal", "glass", "animated", "premium"];

/** AI picker — layout-aware, deterministic per slide seed, on-brand variety. */
export function pickSlideBackground(layout: LayoutType, theme: ThemeDefinition, seed: string): SlideBackground {
  const h = hashString(`${seed}:${theme.id}`);
  const cats = LAYOUT_CATEGORIES[layout] ?? DEFAULT_CATEGORIES;
  const cat = cats[h % cats.length];
  const pool = BACKGROUNDS.filter((b) => b.category === cat);
  const item = pool[(h >> 3) % Math.max(pool.length, 1)] ?? BACKGROUNDS[(h >> 4) % BACKGROUNDS.length];
  return item;
}

/** React style object for a slide background (incl. animation + image layers). */
export function backgroundStyle(
  bg: string | undefined,
  imageUrl: string | undefined,
  animated: boolean | undefined
): CSSProperties {
  const style: React.CSSProperties = {
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  };
  const layers: string[] = [];
  if (imageUrl) layers.push(`url("${imageUrl}")`);
  if (bg && bg.includes("gradient")) {
    layers.push(bg);
  } else {
    style.backgroundColor = bg ?? "transparent";
  }
  if (layers.length > 0) {
    style.backgroundImage = layers.join(", ");
  }
  if (animated) {
    style.backgroundSize = "400% 400%";
    style.animation = "bg-shift 16s ease infinite";
  }
  return style;
}
