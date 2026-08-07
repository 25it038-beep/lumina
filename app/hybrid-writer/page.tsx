"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { MultiAgentOrchestrator, OrchestrationResult, AgentStageStatus, AgentStageId } from "@/lib/ai/agents/orchestrator";
import { analyzeDocumentQuality, DocumentQualityMetrics } from "@/lib/ai/quality/qualityAnalyzer";
import { FactChecker, ParagraphFactAudit } from "@/lib/ai/citations/factChecker";
import { ResearchEngine, ResearchResult } from "@/lib/ai/research/researchEngine";
import { WritingMemoryStore, PersonalWritingMemory } from "@/lib/ai/memory/writingMemory";
import { ExportEngine, ExportFormat } from "@/lib/ai/exporters/exportEngine";
import { PluginRegistry, PluginDefinition } from "@/lib/ai/plugins/pluginSystem";

import { BlockEditor } from "@/components/hybrid-writer/BlockEditor";
import { OutlinePanel, OutlineSection } from "@/components/hybrid-writer/OutlinePanel";
import { LiveAgentTracker } from "@/components/hybrid-writer/LiveAgentTracker";
import { QualityHUD } from "@/components/hybrid-writer/QualityHUD";
import { ResearchPanel } from "@/components/hybrid-writer/ResearchPanel";
import { ComparisonView } from "@/components/hybrid-writer/ComparisonView";
import { VersionHistoryModal, DocumentVersionSnapshot } from "@/components/hybrid-writer/VersionHistoryModal";

import {
  Sparkles,
  Wand2,
  Cpu,
  Layers,
  Download,
  History,
  ShieldCheck,
  Brain,
  Sliders,
  Play,
  FileText,
  Search,
  BookOpen,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
} from "lucide-react";

export default function HybridWriterPage() {
  const [prompt, setPrompt] = useState("");
  const [pipelineMode, setPipelineMode] = useState<"sequential" | "parallel" | "consensus">("sequential");
  const [selectedTone, setSelectedTone] = useState("Deep & Analytical");
  const [isExecuting, setIsExecuting] = useState(false);

  const [documentContent, setDocumentContent] = useState("");
  const [deepseekOutline, setDeepseekOutline] = useState("");
  const [llamaDraft, setLlamaDraft] = useState("");

  // System states
  const [orchestratorStages, setOrchestratorStages] = useState<Record<AgentStageId, AgentStageStatus>>({
    planning: { id: "planning", name: "1. Task Planner", agentRole: "Planner Agent", modelUsed: "Lumina Intelligence", status: "idle" },
    research: { id: "research", name: "2. Knowledge & Context Research", agentRole: "Research Agent", modelUsed: "Search Engine", status: "idle" },
    reasoning: { id: "reasoning", name: "3. Deep Reasoning & Logic", agentRole: "Reasoning Agent", modelUsed: "deepseek-ai/deepseek-r1", status: "idle" },
    outline: { id: "outline", name: "4. Document Tree Builder", agentRole: "Outline Agent", modelUsed: "Outline Engine", status: "idle" },
    writing: { id: "writing", name: "5. Creative & Tone Synthesis", agentRole: "Writing Agent", modelUsed: "meta/llama-3.3-70b-instruct", status: "idle" },
    editing: { id: "editing", name: "6. Structural & Flow Editing", agentRole: "Editor Agent", modelUsed: "meta/llama-3.3-70b-instruct", status: "idle" },
    style: { id: "style", name: "7. Brand Voice & Memory", agentRole: "Style Agent", modelUsed: "Memory Engine", status: "idle" },
    "fact-checking": { id: "fact-checking", name: "8. Fact Verification", agentRole: "Fact Checker Agent", modelUsed: "deepseek-ai/deepseek-r1", status: "idle" },
    grammar: { id: "grammar", name: "9. Mechanics & Grammar", agentRole: "Grammar Agent", modelUsed: "Grammar Rules", status: "idle" },
    citations: { id: "citations", name: "10. Citation & Footnotes", agentRole: "Citation Agent", modelUsed: "Citation Engine", status: "idle" },
    seo: { id: "seo", name: "11. SEO & Search Intent", agentRole: "SEO Agent", modelUsed: "SEO Engine", status: "idle" },
    readability: { id: "readability", name: "12. Readability Audit", agentRole: "Readability Agent", modelUsed: "Flesch-Kincaid Engine", status: "idle" },
    publishing: { id: "publishing", name: "13. Publisher Bundle", agentRole: "Publisher Agent", modelUsed: "Export Suite", status: "idle" },
  });

  const [qualityMetrics, setQualityMetrics] = useState<DocumentQualityMetrics>(analyzeDocumentQuality(""));
  const [researchData, setResearchData] = useState<ResearchResult | undefined>(undefined);
  const [factAudits, setFactAudits] = useState<ParagraphFactAudit[]>([]);
  const [versions, setVersions] = useState<DocumentVersionSnapshot[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const [leftSidebarTab, setLeftSidebarTab] = useState<"outline" | "research" | "plugins">("outline");
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Auto-analyze document quality
  useEffect(() => {
    setQualityMetrics(analyzeDocumentQuality(documentContent));
    setFactAudits(FactChecker.auditDocument(documentContent));
  }, [documentContent]);

  // Execute Multi-Agent Orchestration Pipeline
  const handleRunOrchestrator = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);

    try {
      const research = await ResearchEngine.conductResearch(prompt);
      setResearchData(research);

      const orchestrator = new MultiAgentOrchestrator();
      const res = await orchestrator.executePipeline(
        prompt,
        (stageId, status, fullOutputs) => {
          setOrchestratorStages((prev) => ({ ...prev, [stageId]: status }));
        },
        { mode: pipelineMode, customTone: selectedTone }
      );

      setDeepseekOutline(res.deepSeekOutline);
      setLlamaDraft(res.llamaDraft);
      setDocumentContent(res.finalContent);

      // Save version snapshot
      const newSnapshot: DocumentVersionSnapshot = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        actionLabel: `Multi-Agent Run (${pipelineMode})`,
        wordCount: res.finalContent.split(/\s+/).length,
        content: res.finalContent,
      };
      setVersions((prev) => [newSnapshot, ...prev]);
    } catch (err: any) {
      console.error("Pipeline error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Slash Commands executor
  const handleSlashCommand = (cmd: string, selection?: string) => {
    const target = selection || documentContent;
    if (cmd === "rewrite") {
      setDocumentContent((prev) => `${prev}\n\n> **[AI Rewritten Section]**: Enhanced structural clarity and tone.`);
    } else if (cmd === "expand") {
      setDocumentContent((prev) => `${prev}\n\n> **[Expanded Analysis]**: Adding deeper empirical context.`);
    } else if (cmd === "shorten") {
      setDocumentContent((prev) => prev.slice(0, Math.round(prev.length * 0.8)));
    } else if (cmd === "table") {
      setDocumentContent(
        (prev) =>
          `${prev}\n\n| Pillar | DeepSeek R1 Reasoning | Meta LLaMA 3.3 Tone |\n| :--- | :--- | :--- |\n| Core Strengths | Logic, CoT & Math | Fluid Prose & Narrative |\n| Role | Architecture Outline | Creative Synthesis |`
      );
    }
  };

  // Inline AI Toolbar executor
  const handleInlineAIAction = (action: string, text: string) => {
    handleSlashCommand(action, text);
  };

  // Build document outline sections
  const outlineSections: OutlineSection[] = documentContent
    .split("\n")
    .filter((line) => line.startsWith("#"))
    .map((line, idx) => {
      const level = line.startsWith("###") ? 3 : line.startsWith("##") ? 2 : 1;
      const title = line.replace(/^#+\s*/, "");
      return { id: `sec-${idx}`, title, level, wordCount: 150 };
    });

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header Command Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900/90 border-b border-slate-800 shadow-lg backdrop-blur-xl z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-900/50">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100 tracking-tight">Enterprise AI Content OS</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                DeepSeek R1 + LLaMA 3.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Multi-Agent Intelligent Writing Operating System</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Selector */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setPipelineMode("sequential")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                pipelineMode === "sequential" ? "bg-indigo-600 text-white font-medium shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sequential Pipeline
            </button>
            <button
              onClick={() => setPipelineMode("parallel")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                pipelineMode === "parallel" ? "bg-indigo-600 text-white font-medium shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Parallel Studio
            </button>
            <button
              onClick={() => setPipelineMode("consensus")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                pipelineMode === "consensus" ? "bg-indigo-600 text-white font-medium shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Consensus Audit
            </button>
          </div>

          <button
            onClick={() => setShowVersionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-850 text-slate-200 hover:bg-slate-800 border border-slate-700/80 transition-all"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            History ({versions.length})
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-900/30 transition-all">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col w-40 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-50">
              {(["markdown", "docx", "pdf", "html", "latex", "json", "notion"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => ExportEngine.exportDocument(documentContent, fmt)}
                  className="px-2.5 py-1.5 text-left text-xs text-slate-300 hover:bg-indigo-600/30 hover:text-white rounded-md uppercase tracking-wider font-mono"
                >
                  Export {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-slate-800/80 bg-slate-900/40 p-3 flex flex-col gap-3">
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setLeftSidebarTab("outline")}
              className={`flex-1 py-1 rounded-md text-center font-medium ${leftSidebarTab === "outline" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Outline
            </button>
            <button
              onClick={() => setLeftSidebarTab("research")}
              className={`flex-1 py-1 rounded-md text-center font-medium ${leftSidebarTab === "research" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Research
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {leftSidebarTab === "outline" ? (
              <OutlinePanel
                sections={outlineSections}
                onRegenerateSection={(id) => handleSlashCommand("rewrite")}
                onDeleteSection={(id) => {}}
                onAddSection={() => setDocumentContent((prev) => `${prev}\n\n## New Strategic Section\n\nEnter section text...`)}
              />
            ) : (
              <ResearchPanel research={researchData} />
            )}
          </div>
        </aside>

        {/* Center Main Studio Canvas */}
        <main className="flex-1 flex flex-col p-4 overflow-y-auto gap-4 bg-slate-950">
          {/* Prompt Entry Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunOrchestrator()}
                placeholder="Enter topic, target goal, or document request (e.g. Write an executive brief on AI agent architecture...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={handleRunOrchestrator}
                disabled={isExecuting || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/40 disabled:opacity-50 transition-all"
              >
                {isExecuting ? <Zap className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                Execute Multi-Agent OS
              </button>
            </div>
          </div>

          {/* Canvas or Comparison View */}
          <div className="flex-1 min-h-[500px]">
            {pipelineMode === "parallel" ? (
              <ComparisonView
                deepseekOutput={deepseekOutline}
                llamaOutput={llamaDraft}
                onAcceptSnippet={(text) => setDocumentContent(text)}
                onBlendOutputs={() =>
                  setDocumentContent(
                    `# Blended Masterpiece: ${prompt}\n\n## DeepSeek Logic Framework\n${deepseekOutline}\n\n## Meta LLaMA 3.3 Stylistic Synthesis\n${llamaDraft}`
                  )
                }
              />
            ) : (
              <BlockEditor
                content={documentContent}
                onChangeContent={setDocumentContent}
                onExecuteSlashCommand={handleSlashCommand}
                onExecuteInlineAI={handleInlineAIAction}
              />
            )}
          </div>
        </main>

        {/* Right Inspector Sidebar */}
        {rightSidebarOpen && (
          <aside className="w-80 border-l border-slate-800/80 bg-slate-900/40 p-3 flex flex-col gap-3 overflow-y-auto">
            <LiveAgentTracker stages={orchestratorStages} />
            <QualityHUD metrics={qualityMetrics} />

            {/* Fact Check Inspector */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fact Audit ({factAudits.length} Paragraphs)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {factAudits.slice(0, 3).map((audit, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-300">Paragraph #{audit.paragraphIndex + 1}</span>
                      <span className="font-mono text-emerald-400">{audit.confidenceScore}% Score</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{audit.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        versions={versions}
        onRestoreVersion={(ver) => setDocumentContent(ver.content)}
      />
    </div>
  );
}
