export interface AISlashCommand {
  command: string;
  label: string;
  description: string;
  category: "Generation" | "Edit" | "Design" | "Media" | "Structure";
  action: (args?: string) => void;
}

export const SLASH_COMMANDS = [
  { command: "/generate", label: "Generate Slide", description: "Generate a new AI slide from prompt", category: "Generation" },
  { command: "/rewrite", label: "Rewrite Text", description: "Polishes and improves selected text", category: "Edit" },
  { command: "/summarize", label: "Summarize Slide", description: "Creates key summary bullet points", category: "Edit" },
  { command: "/expand", label: "Expand Points", description: "Elaborates on selected points with data", category: "Edit" },
  { command: "/shorten", label: "Make Concise", description: "Shortens text while keeping core insights", category: "Edit" },
  { command: "/improve", label: "Improve Writing", description: "Enhances vocabulary and tone", category: "Edit" },
  { command: "/design", label: "Auto Design", description: "Applies Figma-grade layout and glassmorphism", category: "Design" },
  { command: "/animate", label: "Add Animations", description: "Adds subtle staggered entrance animations", category: "Design" },
  { command: "/theme", label: "Switch Theme", description: "Applies matching adaptive theme", category: "Design" },
  { command: "/image", label: "AI Image", description: "Generates high-res visual for slide", category: "Media" },
  { command: "/chart", label: "AI Chart", description: "Inserts interactive data chart", category: "Media" },
  { command: "/icon", label: "Insert Icon", description: "AddsLucide vector icon badge", category: "Media" },
  { command: "/layout", label: "Change Layout", description: "Switches to Bento Grid, Split, or Cards", category: "Structure" },
  { command: "/translate", label: "Translate Deck", description: "Translates presentation to 20+ languages", category: "Edit" },
  { command: "/explain", label: "Explain Concept", description: "Generates explanatory callout box", category: "Generation" },
  { command: "/speaker-notes", label: "Generate Notes", description: "Creates talking points and timing", category: "Generation" },
  { command: "/add-slide", label: "Add Slide", description: "Inserts new slide into presentation", category: "Structure" },
  { command: "/delete-slide", label: "Delete Slide", description: "Removes active slide", category: "Structure" },
  { command: "/duplicate-slide", label: "Duplicate Slide", description: "Duplicates active slide", category: "Structure" },
  { command: "/regenerate", label: "Regenerate Slide", description: "Redesigns active slide from scratch", category: "Generation" },
  { command: "/branding", label: "Brand Kit", description: "Applies corporate brand tokens and logos", category: "Design" },
];
