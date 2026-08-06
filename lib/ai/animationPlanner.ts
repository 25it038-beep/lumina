import { AnimationType, LayoutType } from "../types";
import { classifyTopic } from "./localEngine";

export interface AnimationPlan {
  layoutAnimation: AnimationType;
  elementAnimation: AnimationType;
  stagger: boolean;
  reason: string;
}

const LAYOUT_ANIMATIONS: Partial<Record<LayoutType, AnimationType>> = {
  title: "zoom-in",
  hero: "fade-up",
  agenda: "stagger",
  "key-takeaways": "fade-up",
  section: "slide-left",
  "q-and-a": "pop",
  "thank-you": "zoom",
  conclusion: "fade-down",
  references: "fade",
  quote: "fade-up",
  "quote-image": "fade",
  metrics: "pop",
  statistics: "stagger",
  timeline: "slide-right",
  roadmap: "slide-left",
  process: "slide-right",
  milestones: "draw",
  pyramid: "fade-up",
  funnel: "scale",
  matrix: "stagger",
  "before-after": "fade",
  cards: "stagger",
  checklist: "stagger",
  vision: "zoom-in",
  mission: "fade-up",
  team: "stagger",
};

const ELEMENT_ANIMATIONS: Partial<Record<LayoutType, AnimationType>> = {
  cards: "pop",
  metrics: "scale",
  statistics: "pop",
  timeline: "slide-left",
  process: "slide-left",
  roadmap: "fade-up",
  pyramid: "fade-up",
  funnel: "scale",
  matrix: "pop",
  checklist: "slide-up",
  "before-after": "fade",
  vision: "zoom",
  mission: "slide-up",
  milestones: "scale",
  team: "fade-up",
};

function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Director stage: Animation Planner.
 * Assigns coherent motion presets per layout, varied by topic so decks feel different.
 */
export function planAnimations(
  layout: LayoutType,
  topic: string,
  index: number,
  themeAnimation: AnimationType = "fade-up"
): AnimationPlan {
  const domain = classifyTopic(topic).id;
  const seed = hash(`${topic}:${layout}:${index}:${domain}`);

  const layoutAnimation = LAYOUT_ANIMATIONS[layout] ?? themeAnimation;
  const baseElement = ELEMENT_ANIMATIONS[layout] ?? "fade-up";

  // Vary the element animation by seed — same layout can animate differently per deck.
  const variants: AnimationType[] = ["fade-up", "slide-up", "zoom", "pop", "scale", "blur"];
  const elementAnimation = hash(`${seed}:el`) % 3 === 0 ? variants[seed % variants.length] : baseElement;
  const stagger = ["cards", "checklist", "statistics", "matrix", "agenda", "team"].includes(layout) || seed % 5 === 0;

  return {
    layoutAnimation,
    elementAnimation,
    stagger,
    reason: `Layout '${layout}' → ${layoutAnimation}; elements → ${elementAnimation}${stagger ? " (staggered)" : ""}`,
  };
}
