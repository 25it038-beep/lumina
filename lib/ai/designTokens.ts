export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    glassBorder: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: {
      hero: number;
      h1: number;
      h2: number;
      h3: number;
      body: number;
      caption: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    gridUnit: number;
  };
  effects: {
    blur: string;
    shadow: string;
    radius: number;
  };
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primary: "#6366f1",
    secondary: "#a855f7",
    accent: "#38bdf8",
    background: "#0b0f19",
    surface: "#131b2e",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    border: "rgba(255, 255, 255, 0.12)",
    glassBorder: "rgba(255, 255, 255, 0.2)",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    scale: {
      hero: 64,
      h1: 48,
      h2: 32,
      h3: 24,
      body: 18,
      caption: 14,
    },
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    gridUnit: 8,
  },
  effects: {
    blur: "blur(16px)",
    shadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
    radius: 16,
  },
};
