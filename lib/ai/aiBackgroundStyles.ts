/**
 * AI background style catalog.
 * When a user picks "Generate with AI" for backgrounds at creation time, these
 * styles are passed to FLUX-1 Schnell so the generated backgrounds match the
 * chosen aesthetic (3D, cosmetics, abstract, etc.).
 */
export interface AIBackgroundStyle {
  id: string;
  label: string;
  hint: string;
  /** Prompt fragment appended to the slide topic so FLUX keeps the look consistent. */
  prompt: string;
  dark: boolean;
}

export const AI_BACKGROUND_STYLES: AIBackgroundStyle[] = [
  {
    id: "3d-modern",
    label: "3D Modern",
    hint: "Soft 3D shapes, depth, studio lighting",
    prompt:
      "soft modern 3D render, rounded glossy organic shapes floating, depth of field, studio soft lighting, elegant premium look, no text",
    dark: true,
  },
  {
    id: "cosmetics",
    label: "Cosmetics / Beauty",
    hint: "Elegant, feminine, luxury beauty aesthetic",
    prompt:
      "luxury cosmetics beauty aesthetic, silky pastel gradients, gold accents, soft glow, rose petals and pearl textures, elegant minimal, no text",
    dark: false,
  },
  {
    id: "abstract-3d",
    label: "Abstract 3D",
    hint: "Sculptural chrome & neon forms",
    prompt:
      "abstract 3D sculpture, iridescent chrome and neon ribbons, futuristic render, cinematic lighting, high detail, no text",
    dark: true,
  },
  {
    id: "gradient-flow",
    label: "Gradient Flow",
    hint: "Smooth flowing color waves",
    prompt:
      "smooth flowing liquid gradient waves, vibrant saturated colors, silky abstract render, soft blur, no text",
    dark: true,
  },
  {
    id: "minimal-luxury",
    label: "Minimal Luxury",
    hint: "Clean, muted, high-end editorial",
    prompt:
      "minimal luxury editorial background, muted neutral tones, elegant negative space, soft grain, subtle gold line accents, no text",
    dark: false,
  },
  {
    id: "glassmorphism",
    label: "Glassmorphism",
    hint: "Frosted glass panels and bokeh",
    prompt:
      "glassmorphism style, frosted glass panels floating, bokeh light particles, soft blue-violet palette, translucent depth, no text",
    dark: true,
  },
  {
    id: "tech-neon",
    label: "Tech Neon",
    hint: "Dark grid, neon glow, circuitry",
    prompt:
      "dark futuristic tech background, glowing neon circuit lines and particles, cyber grid depth, electric blue and magenta, no text",
    dark: true,
  },
  {
    id: "nature-organic",
    label: "Nature Organic",
    hint: "Soft botanical, natural textures",
    prompt:
      "soft organic nature background, blurred botanical shapes, fresh green and earthy tones, gentle light, calm aesthetic, no text",
    dark: false,
  },
  {
    id: "space-galaxy",
    label: "Space & Galaxy",
    hint: "Deep cosmos, nebulae, stars",
    prompt:
      "deep space galaxy background, vivid nebula clouds, glowing stars, cosmic depth, rich purple and teal, cinematic, no text",
    dark: true,
  },
  {
    id: "vaporwave",
    label: "Vaporwave",
    hint: "Retro synthwave, 80s aesthetics",
    prompt:
      "retro vaporwave aesthetic, sun grid horizon, chrome and pastel palette, retro-futuristic synthwave, grainy glow, no text",
    dark: true,
  },
];

export function getAIBackgroundStyle(id: string): AIBackgroundStyle {
  return AI_BACKGROUND_STYLES.find((s) => s.id === id) ?? AI_BACKGROUND_STYLES[0];
}