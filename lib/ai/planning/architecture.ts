import { LlamaProvider } from "../../providers/llamaProvider";
import { PresentationArchitecture, PlanningCallbacks, PlanningContext } from "./planner.types";
import { buildMessages } from "./context";
import { extractJsonObject, repairJson } from "./blueprint";

/**
 * architecture.ts — the Architecture Engine.
 * Determines information hierarchy, slide dependency graph, narrative
 * flow, topic grouping, knowledge graph, and the required diagrams,
 * charts, tables, illustrations and animations.
 */

export class ArchitectureEngine {
  constructor(private provider: LlamaProvider) {}

  private localArchitecture(ctx: PlanningContext): PresentationArchitecture {
    const n = ctx.slideCount;
    const hierarchy = ["Title", "Agenda", "Body sections", "Evidence & data", "Conclusion"];
    const groups: PresentationArchitecture["topic_groups"] = [];
    const chunk = Math.max(2, Math.ceil(n / 4));
    for (let g = 0; g < 4 && g * chunk < n; g++) {
      const slides: number[] = [];
      for (let i = g * chunk; i < Math.min((g + 1) * chunk, n); i++) slides.push(i);
      groups.push({ title: `Section ${g + 1}`, slides });
    }
    return {
      information_hierarchy: hierarchy,
      slide_dependencies: Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({
        from: i,
        to: i + 1,
        reason: "Sequential narrative flow",
      })),
      narrative_flow: ["Hook", "Context", "Evidence", "Insight", "Action"],
      topic_groups: groups,
      knowledge_graph: [],
      required_diagrams: [],
      required_charts: [],
      required_tables: [],
      required_illustrations: [],
      required_animations: [],
    };
  }

  async designArchitecture(ctx: PlanningContext, opts: PlanningCallbacks = {}): Promise<PresentationArchitecture> {
    const raw = await this.provider.chat(buildMessages(ctx, "architecture"), {
      signal: opts.signal,
      maxTokens: 4096,
    });
    const parsed = (extractJsonObject(raw.text) ?? repairJson(raw.text)) as any;
    if (!parsed) return this.localArchitecture(ctx);

    const list = (v: any): any[] => (Array.isArray(v) ? v : []);
    return {
      information_hierarchy: list(parsed.information_hierarchy).map(String).filter(Boolean),
      slide_dependencies: list(parsed.slide_dependencies)
        .filter((d: any) => d && typeof d === "object")
        .map((d: any, i: number) => ({
          from: Number(d.from) ?? i,
          to: Number(d.to) ?? i + 1,
          reason: String(d.reason ?? ""),
        })),
      narrative_flow: list(parsed.narrative_flow).map(String).filter(Boolean),
      topic_groups: list(parsed.topic_groups)
        .filter((g: any) => g && typeof g === "object")
        .map((g: any, i: number) => ({
          title: String(g.title ?? `Group ${i + 1}`),
          slides: list(g.slides).map((s: any) => Number(s)).filter((s: any) => !Number.isNaN(s)),
        })),
      knowledge_graph: list(parsed.knowledge_graph)
        .filter((n: any) => n && typeof n === "object")
        .map((n: any, i: number) => ({
          node: String(n.node ?? `Node ${i + 1}`),
          connects: list(n.connects).map(String),
        })),
      required_diagrams: list(parsed.required_diagrams)
        .filter((d: any) => d && typeof d === "object")
        .map((d: any, i: number) => ({
          slide: Number(d.slide) ?? i,
          type: String(d.type ?? "flowchart"),
          title: String(d.title ?? ""),
        })),
      required_charts: list(parsed.required_charts)
        .filter((c: any) => c && typeof c === "object")
        .map((c: any, i: number) => ({
          slide: Number(c.slide) ?? i,
          chart_type: String(c.chart_type ?? "bar"),
          title: String(c.title ?? ""),
          data_topic: String(c.data_topic ?? ""),
        })),
      required_tables: list(parsed.required_tables)
        .filter((t: any) => t && typeof t === "object")
        .map((t: any, i: number) => ({
          slide: Number(t.slide) ?? i,
          title: String(t.title ?? ""),
          columns: list(t.columns).map(String),
        })),
      required_illustrations: list(parsed.required_illustrations)
        .filter((il: any) => il && typeof il === "object")
        .map((il: any, i: number) => ({
          slide: Number(il.slide) ?? i,
          description: String(il.description ?? ""),
          style: String(il.style ?? ""),
        })),
      required_animations: list(parsed.required_animations)
        .filter((a: any) => a && typeof a === "object")
        .map((a: any, i: number) => ({
          slide: Number(a.slide) ?? i,
          animation_type: String(a.animation_type ?? "fade-up"),
          element: String(a.element ?? ""),
        })),
    };
  }

  /** Deterministic adjacency list derived from a slide dependency graph. */
  buildDependencyGraph(arch: PresentationArchitecture, slideCount: number): Map<number, number[]> {
    const graph = new Map<number, number[]>();
    for (let i = 0; i < slideCount; i++) graph.set(i, []);
    for (const dep of arch.slide_dependencies) {
      const from = Number(dep.from);
      const to = Number(dep.to);
      if (graph.has(from) && graph.has(to) && from !== to) {
        graph.get(from)!.push(to);
      }
    }
    return graph;
  }

  /** Detect cycles / out-of-range dependencies in the slide graph. */
  validateArchitecture(arch: PresentationArchitecture, slideCount: number): string[] {
    const problems: string[] = [];
    const seen = new Set<number>();
    const stack = new Set<number>();
    const graph = this.buildDependencyGraph(arch, slideCount);

    const visit = (node: number): boolean => {
      if (stack.has(node)) return true;
      if (seen.has(node)) return false;
      stack.add(node);
      seen.add(node);
      for (const next of graph.get(node) ?? []) {
        if (visit(next)) return true;
      }
      stack.delete(node);
      return false;
    };

    for (const n of graph.keys()) {
      if (!seen.has(n) && visit(n)) {
        problems.push(`Cycle detected in slide dependency graph at slide ${n + 1}`);
        break;
      }
    }
    for (const dep of arch.slide_dependencies) {
      if (dep.from < 0 || dep.from >= slideCount || dep.to < 0 || dep.to >= slideCount) {
        problems.push(`Dependency references out-of-range slide (${dep.from} -> ${dep.to})`);
      }
    }
    return problems;
  }
}

export function buildArchitectureEngine(provider: LlamaProvider): ArchitectureEngine {
  return new ArchitectureEngine(provider);
}