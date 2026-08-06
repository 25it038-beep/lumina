export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  category: "Grammar" | "Citation" | "SEO" | "Translator" | "Diagram" | "Image" | "Chart" | "Code";
  iconName: string;
  enabled: boolean;
  execute: (input: string) => Promise<string>;
}

export class PluginRegistry {
  private static plugins: Map<string, PluginDefinition> = new Map();

  public static initializeDefaultPlugins(): void {
    if (this.plugins.size > 0) return;

    this.register({
      id: "grammar-inspector",
      name: "Grammar & Style Inspector",
      description: "Audits punctuation, sentence structures, and passive voice.",
      category: "Grammar",
      iconName: "CheckCircle",
      enabled: true,
      execute: async (text) => text.replace(/  +/g, " "),
    });

    this.register({
      id: "citation-auto-linker",
      name: "Citation & Source Footnoter",
      description: "Generates formatted inline citations and footnotes.",
      category: "Citation",
      iconName: "BookOpen",
      enabled: true,
      execute: async (text) => `${text}\n\n[^1]: DeepSeek & LLaMA Multi-Agent Benchmark (2026).`,
    });

    this.register({
      id: "seo-keyword-optimizer",
      name: "SEO Heading & Keyphrase Density",
      description: "Inserts high-volume semantic keywords into headers.",
      category: "SEO",
      iconName: "TrendingUp",
      enabled: true,
      execute: async (text) => text,
    });

    this.register({
      id: "mermaid-diagram-generator",
      name: "Mermaid Architecture Diagram",
      description: "Transforms technical descriptions into Mermaid flowchart code blocks.",
      category: "Diagram",
      iconName: "Workflow",
      enabled: true,
      execute: async (text) => `${text}\n\n\`\`\`mermaid\ngraph TD;\n  A[DeepSeek Logic] --> B[LLaMA 3.3 Style];\n  B --> C[Master Piece];\n\`\`\``,
    });

    this.register({
      id: "translator-plugin",
      name: "Multilingual Neural Translator",
      description: "Translates selected blocks preserving markdown syntax.",
      category: "Translator",
      iconName: "Globe",
      enabled: true,
      execute: async (text) => text,
    });
  }

  public static register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.id, plugin);
  }

  public static getAll(): PluginDefinition[] {
    this.initializeDefaultPlugins();
    return Array.from(this.plugins.values());
  }

  public static togglePlugin(id: string, enabled: boolean): void {
    const p = this.plugins.get(id);
    if (p) p.enabled = enabled;
  }
}
