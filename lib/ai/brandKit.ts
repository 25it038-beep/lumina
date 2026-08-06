import { ThemeDefinition, IconStyle } from "../types";

export interface BrandKit {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: string;
  bodyFont: string;
  iconStyle: IconStyle;
  borderRadius: number;
}

export const DEFAULT_BRAND_KIT: BrandKit = {
  companyName: "Acme Corp",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
  primaryColor: "#6366f1",
  secondaryColor: "#ec4899",
  accentColor: "#38bdf8",
  backgroundColor: "#0b0f19",
  headingFont: "Inter",
  bodyFont: "Inter",
  iconStyle: "lucide",
  borderRadius: 16,
};

export function createThemeFromBrandKit(brand: BrandKit): ThemeDefinition {
  return {
    id: `brand-${brand.companyName.toLowerCase().replace(/\s+/g, "-")}`,
    name: `${brand.companyName} Brand Theme`,
    category: "corporate",
    isDark: true,
    primary: brand.primaryColor,
    secondary: brand.secondaryColor,
    accent: brand.accentColor,
    background: brand.backgroundColor,
    surface: "#131b2e",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    border: "rgba(255,255,255,0.15)",
    gradient: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 100%)`,
    headingFont: brand.headingFont,
    bodyFont: brand.bodyFont,
    iconStyle: brand.iconStyle,
    animationStyle: "fade-up",
    spacing: 32,
    radius: brand.borderRadius,
    glass: true,
  };
}
