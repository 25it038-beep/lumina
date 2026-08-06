import { Deck, Slide, ThemeDefinition, LayoutType } from "../types";

export interface LuminaPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: "ai-provider" | "theme-pack" | "layout-pack" | "exporter" | "agent" | "chart-pack";
}

export interface LuminaPlugin {
  manifest: LuminaPluginManifest;
  onInit?: () => void;
  onDeckLoad?: (deck: Deck) => void;
  onBeforeExport?: (deck: Deck, format: string) => Promise<Deck | void>;
  customLayouts?: Record<string, (slide: Slide) => Slide>;
  customThemes?: ThemeDefinition[];
}

export class LuminaPluginSDK {
  private static registeredPlugins: Map<string, LuminaPlugin> = new Map();

  public static registerPlugin(plugin: LuminaPlugin): boolean {
    if (this.registeredPlugins.has(plugin.manifest.id)) {
      console.warn(`Plugin ${plugin.manifest.id} is already registered.`);
      return false;
    }
    this.registeredPlugins.set(plugin.manifest.id, plugin);
    try {
      plugin.onInit?.();
    } catch (err) {
      console.error(`Failed to initialize plugin ${plugin.manifest.id}:`, err);
    }
    return true;
  }

  public static getPlugins(): LuminaPlugin[] {
    return Array.from(this.registeredPlugins.values());
  }

  public static getPlugin(id: string): LuminaPlugin | undefined {
    return this.registeredPlugins.get(id);
  }
}
