"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowLeft, ArrowRight, FileText, Link2, Youtube, Newspaper,
  Table, Upload, Brain, Search, LayoutTemplate, Palette, Wand2, Check, Wand,
  ShieldCheck, PenLine, Layers, Bot, Users, BadgeCheck,
} from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { buildClient } from "@/lib/ai/provider";
import { generateDeck, generateOutlineOnly, generateDeckFromApprovedOutline, GenerateProgress, runResearch } from "@/lib/ai";
import { architectEngine, AgentLog, DeckReviewResult } from "@/lib/ai/architectEngine";
import { setPlanningEnabled } from "@/lib/ai/planning/config";
import { PresentationOutline, SourceType, OutlineItem, ResearchResult } from "@/lib/types";
import { THEMES, getTheme } from "@/lib/themes";
import { buildTemplateOutline, getTemplate } from "@/lib/templates";
import { AI_BACKGROUND_STYLES, getAIBackgroundStyle } from "@/lib/ai/aiBackgroundStyles";
import { BACKGROUNDS, BACKGROUND_CATEGORIES } from "@/lib/backgrounds";
import { Button, Input, TextArea, SegmentedControl, Spinner, Label } from "@/components/ui";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Move, Eye } from "lucide-react";

import { CreateGuideModal } from "@/components/create/CreateGuideModal";
import { HelpCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { scopedKeyFor } from "@/lib/auth/storage";

const AUDIENCES = ["Executives", "Investors", "Customers", "Students", "Developers", "Researchers", "Teachers", "Government"];

const AGENT_ICONS: Record<string, React.ReactNode> = {
  research: <Search size={13} />,
  memory: <Brain size={13} />,
  story: <Sparkles size={13} />,
  planner: <Layers size={13} />,
  content: <PenLine size={13} />,
  designer: <LayoutTemplate size={13} />,
  review: <ShieldCheck size={13} />,
};

const SOURCES: { id: SourceType; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "prompt", label: "Prompt", icon: <Sparkles size={14} />, hint: "Describe what you want" },
  { id: "topic", label: "Topic", icon: <Brain size={14} />, hint: "Just a topic name" },
  { id: "url", label: "URL", icon: <Link2 size={14} />, hint: "Paste a website link" },
  { id: "youtube", label: "YouTube", icon: <Youtube size={14} />, hint: "Video transcript" },
  { id: "markdown", label: "Markdown", icon: <FileText size={14} />, hint: "Paste or upload .md" },
  { id: "notes", label: "Notes", icon: <Newspaper size={14} />, hint: "Your rough notes" },
  { id: "research", label: "Research paper", icon: <Search size={14} />, hint: "Abstract or PDF" },
  { id: "csv", label: "CSV / Excel", icon: <Table size={14} />, hint: "Data tables" },
  { id: "upload", label: "Import file", icon: <Upload size={14} />, hint: "PDF, DOCX, PPTX" },
];

const TONES = ["Professional", "Educational", "Marketing", "Academic", "Casual", "Inspirational", "Technical"];

const CONTENT_STYLES: { id: "minimalist" | "summarized" | "standard" | "detailed" | "executive"; label: string; hint: string }[] = [
  { id: "summarized", label: "Summarized", hint: "Concise bullet points & key takeaways" },
  { id: "minimalist", label: "Minimalist", hint: "Headline + 1 key metric or stat" },
  { id: "standard", label: "Standard", hint: "Balanced text & structured points" },
  { id: "detailed", label: "Detailed", hint: "Comprehensive descriptions & data" },
  { id: "executive", label: "Executive Pitch", hint: "High-impact metrics & callouts" },
];

type Step = "prompt" | "outline" | "generating" | "done";

export default function CreatePage() {
  const router = useRouter();
  const { user } = useUser();
  const setDeck = useDeckStore((s) => s.setDeck);
  const settings = useSettingsStore();

  const [source, setSource] = useState<SourceType>("prompt");
  const [input, setInput] = useState("");
  const [slideCount, setSlideCount] = useState(12);
  const [tone, setTone] = useState("Professional");
  const [theme, setTheme] = useState("");
  const [contentStyle, setContentStyle] = useState<"minimalist" | "summarized" | "standard" | "detailed" | "executive">("summarized");
  const [backgroundMode, setBackgroundMode] = useState<"ai" | "available">("available");
  const [backgroundStyle, setBackgroundStyle] = useState("3d-modern");
  const [bgPrompt, setBgPrompt] = useState("");
  const [bgCandidates, setBgCandidates] = useState<string[]>([]);
  const [bgSelected, setBgSelected] = useState<string | null>(null);
  const [bgGenerating, setBgGenerating] = useState(false);
  const [availBgId, setAvailBgId] = useState<string | null>(null);
  const [availBgCategory, setAvailBgCategory] = useState<string>("all");
  const [availBgSearch, setAvailBgSearch] = useState("");
  const [step, setStep] = useState<Step>("prompt");
  const [outline, setOutline] = useState<PresentationOutline | null>(null);
  const [researchData, setResearchData] = useState<ResearchResult | null>(null);
  const [progress, setProgress] = useState<GenerateProgress>({ phase: "research", label: "", percent: 0 });
  const [deckId, setDeckId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileStatus, setFileStatus] = useState<"idle" | "extracting" | "done" | "error">("idle");
  const [fileStatusText, setFileStatusText] = useState("");
  const [architectMode, setArchitectMode] = useState(true);
  const [audience, setAudience] = useState("Executives");
  const [agentLogs, setAgentLogs] = useState<AgentLog[] | null>(null);
  const [review, setReview] = useState<DeckReviewResult | null>(null);
  const [createGuideOpen, setCreateGuideOpen] = useState(false);

  const examples = [
    "Build a 20-slide presentation about Artificial Intelligence in Healthcare",
    "Quantum computing explained — from basics to business impact",
    "Launch strategy for a sustainable fashion startup",
    "The future of work: remote, hybrid, and distributed teams",
    "Blockchain and Web3 for beginners",
  ];

  const pickExample = (ex: string) => {
    setSource("topic");
    setInput(ex);
  };

  const EXTRACT_URL = process.env.NEXT_PUBLIC_EXTRACT_URL || "http://localhost:8000/api/extract";
  const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "tsv"];

  const extractFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120000);
      const form = new FormData();
      form.append("file", file);
      form.append("ocr", "true");
      const resp = await fetch(EXTRACT_URL, { method: "POST", body: form, signal: controller.signal });
      clearTimeout(timer);
      if (!resp.ok) throw new Error(`Extract service error (${resp.status})`);
      const data = await resp.json();
      const text: string = data?.text ?? "";
      if (!text.trim()) throw new Error("No text found in file");
      const meta = [
        `File: ${file.name} (${data.method ?? "extracted"}, ${data.chars ?? text.length} chars${data.ocrPages ? `, ${data.ocrPages} page(s) OCR` : ""})`,
      ].join("\n");
      return `${meta}\n\n${text.slice(0, 60000)}`;
    } catch (err) {
      if (TEXT_EXTENSIONS.includes(ext)) {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onload = () => resolve(String(reader.result ?? "").slice(0, 20000));
          reader.onerror = () => resolve("");
          reader.readAsText(file);
        });
      }
      throw err;
    }
  };

  const handleFileSelected = async (file: File) => {
    setFileName(file.name);
    setFileStatus("extracting");
    setFileStatusText(`Reading ${file.name}…`);
    try {
      const text = await extractFileContent(file);
      setFileStatus("done");
      setFileStatusText(`${file.name} imported`);
      setInput(`[File: ${file.name}]\n\n${text}`);
    } catch (err) {
      setFileStatus("error");
      setFileStatusText("Extraction failed — backend offline? (npm run backend)");
      toast.error("Could not read file. Is the OCR backend running on :8000?");
    }
  };

  useEffect(() => {
    // Sync the persisted planning toggle into the runtime planner config.
    setPlanningEnabled(settings.planningEnabled);
  }, [settings.planningEnabled]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(scopedKeyFor("lumina_create_guide_seen", user?.id));
      if (!seen) {
        setCreateGuideOpen(true);
      }
    } catch {}
  }, [user?.id]);

  useEffect(() => {
    const t0 = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get("theme");
      if (themeParam && THEMES.some((t) => t.id === themeParam)) {
        setTheme(themeParam);
        toast.success(`Design system applied: ${getTheme(themeParam).name}`);
      }
      const tplParam = params.get("template");
      if (tplParam) {
        const tpl = getTemplate(tplParam);
        if (tpl) {
          setArchitectMode(true);
          (async () => {
            setStep("generating");
            setProgress({ phase: "research", label: "Loading template structure…", percent: 20 });
            setTheme(tpl.themeId);
            setInput(tpl.name);
            const research = await runResearch(tpl.name);
            setResearchData(research);
            const outline = buildTemplateOutline(tpl, tpl.name);
            setOutline(outline);
            setAgentLogs([
              { agent: "research", title: "Research Agent", detail: `Pinned template brief for ${tpl.name} with ${research.citations.length} sources.` },
              { agent: "planner", title: "Slide Planner", detail: `Loaded ${outline.slides.length} template slides tailored to ${tpl.audience}.` },
              { agent: "designer", title: "UI Designer Engine", detail: `Pre-applied the ${getTheme(tpl.themeId).name} design system deck-wide.` },
            ]);
            setStep("outline");
            toast.success(`Template loaded — ${tpl.name}. Customize the outline, then generate.`);
          })();
        }
      }
    }, 0);
    return () => clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBackgroundOptions = () => {
    const topic = input.trim() || bgPrompt.trim();
    if (!topic) {
      toast.error("Describe your desired background first");
      return;
    }
    setBgGenerating(true);
    const style = getAIBackgroundStyle(backgroundStyle);
    const fullPrompt = `${topic}${bgPrompt.trim() ? `, ${bgPrompt.trim()}` : ""}, ${style.label} style, presentation slide background, wide 16:9, 8k, highly detailed, no text, no watermark`;
    const candidates = [1, 2, 3, 4].map((seed) => {
      const seededPrompt = `${fullPrompt}, variation ${seed}, seed ${seed * 42}`;
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(seededPrompt)}?model=flux&width=1920&height=1080&seed=${seed * 777}&nologo=true`;
    });
    setBgCandidates(candidates);
    setBgSelected(candidates[0]);
    setBgGenerating(false);
    toast.success("Generated 4 AI background options — pick the one you like!");
  };

  const startOutlineGeneration = async () => {
    if (!input.trim()) {
      toast.error("Enter a topic or prompt first");
      return;
    }
    settings.addRecentTopic(input.trim());
    setStep("generating");
    setProgress({ phase: "research", label: "Researching topic…", percent: 10 });

    try {
      if (architectMode) {
        setProgress({ phase: "research", label: "Research Agent: collecting verified facts…", percent: 10 });
        const research = await runResearch(input.trim());
        setResearchData(research);
        setProgress({ phase: "outline", label: "Multi-agent pipeline: story → planner → outline…", percent: 45 });
        const arch = await architectEngine.runArchitectOutline(input.trim(), slideCount, tone, audience);
        setOutline(arch.outline);
        setAgentLogs(arch.logs);
        setStep("outline");
        toast.success("Architect pipeline drafted the outline! Review the agent log below.");
        return;
      }

      const client = buildClient(settings.provider, settings.model, settings.apiKey, settings.baseUrl);
      const res = await generateOutlineOnly(
        {
          input: input.trim(),
          sourceType: source,
          slideCount,
          tone,
          theme: theme || undefined,
          provider: settings.provider,
          model: settings.model,
        },
        client,
        { onProgress: setProgress }
      );
      setOutline(res.outline);
      setResearchData(res.research);
      setStep("outline");
      toast.success("Outline created! Review and customize your slides below.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create outline");
      setStep("prompt");
    }
  };

  const approveAndGenerateSlides = async () => {
    if (!outline || !researchData) return;
    setStep("generating");
    setProgress({ phase: "theme", label: "Generating slides from approved outline…", percent: 5 });

    const selectedBg = availBgId ? BACKGROUNDS.find((b) => b.id === availBgId) : null;
    const deckBackground = selectedBg
      ? {
          id: selectedBg.id,
          css: selectedBg.css,
          imageUrl: selectedBg.imageUrl,
          videoUrl: selectedBg.videoUrl,
          animated: selectedBg.animated,
          effect: selectedBg.effect,
          name: selectedBg.name,
          dark: selectedBg.dark,
        }
      : undefined;

    try {
      if (architectMode) {
        const arch = await architectEngine.runArchitectDeck(
          {
            prompt: input.trim(),
            sourceType: source,
            slideCount: outline.slides.length,
            tone,
            theme: theme || undefined,
            contentStyle,
            provider: settings.provider,
            model: settings.model,
            audience,
            backgroundMode,
            backgroundStyle,
            deckBackgroundImage: bgSelected ?? undefined,
            deckBackground,
          },
          outline,
          researchData,
          { onProgress: setProgress }
        );
        setDeckId(arch.deck.id);
        setDeck(arch.deck);
        setAgentLogs(arch.logs);
        setReview(arch.review);
        setStep("done");
        toast.success(`Presentation ready! Design score: ${arch.review.overallScore}%`);
        return;
      }

      const client = buildClient(settings.provider, settings.model, settings.apiKey, settings.baseUrl);
      const result = await generateDeckFromApprovedOutline(
        outline,
        {
          input: input.trim(),
          sourceType: source,
          slideCount: outline.slides.length,
          tone,
          theme: theme || undefined,
          contentStyle,
          provider: settings.provider,
          model: settings.model,
          backgroundMode,
          backgroundStyle,
          deckBackgroundImage: bgSelected ?? undefined,
          deckBackground,
        },
        researchData,
        client,
        { onProgress: setProgress }
      );
      setOutline(result.outline);
      setDeckId(result.deck.id);
      setDeck(result.deck);
      setStep("done");
      toast.success("Presentation ready!");
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
      setStep("outline");
    }
  };

  const openEditor = () => {
    if (deckId) router.push(`/editor/${deckId}`);
  };

  const moveItem = (from: number, to: number) => {
    if (!outline) return;
    const slides = [...outline.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    setOutline({ ...outline, slides });
  };

  const deleteItem = (idx: number) => {
    if (!outline || outline.slides.length <= 3) {
      toast.error("Outline must have at least 3 slides");
      return;
    }
    const slides = outline.slides.filter((_, i) => i !== idx);
    setOutline({ ...outline, slides });
  };

  const addSlideItem = () => {
    if (!outline) return;
    const newSlide: OutlineItem = {
      id: `s-${Date.now()}`,
      title: "New Section Title",
      layout: "two-columns",
      notes: "Supporting details for this section",
    };
    setOutline({ ...outline, slides: [...outline.slides, newSlide] });
  };

  const updateItemTitle = (idx: number, title: string) => {
    if (!outline) return;
    const slides = [...outline.slides];
    slides[idx] = { ...slides[idx], title };
    setOutline({ ...outline, slides });
  };

  const updateItemLayout = (idx: number, layout: any) => {
    if (!outline) return;
    const slides = [...outline.slides];
    slides[idx] = { ...slides[idx], layout };
    setOutline({ ...outline, slides });
  };

  const phaseLabel: Record<string, string> = {
    research: "Researching the web",
    outline: "Planning the structure",
    content: "Writing content",
    layout: "Designing layouts",
    theme: "Applying theme",
    done: "Finalizing",
  };

  return (
    <div className="min-h-screen">
      <div className="aurora-bg"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2 text-white">
          <ArrowLeft size={16} className="text-slate-400" />
          <span className="text-sm font-medium">Back</span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateGuideOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-500/25 hover:text-white"
          >
            <HelpCircle size={13} className="text-indigo-400" />
            <span>Create Guide</span>
          </button>
          <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5">
            <Wand size={12} className="text-indigo-300" />
            <span className="text-xs text-slate-300">
              {settings.provider === "local" ? "Lumina Engine (offline)" : `${settings.provider} · ${settings.model}`}
            </span>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        {step === "prompt" && (
          <div className="animate-slide-up">
            <div className="mb-10 mt-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">What should we create?</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-slate-400">
                Lumina researches, plans, writes and designs a complete presentation. You can edit everything afterwards.
              </p>
            </div>

            {/* Source selector */}
            <div data-tour="create-sources" className="mb-4 flex flex-wrap justify-center gap-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  title={s.hint}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    source === s.id
                      ? "border-indigo-400/70 bg-indigo-500/25 text-indigo-100 shadow-lg shadow-indigo-500/10"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/25 hover:text-slate-200"
                  }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>

            <div data-tour="create-textarea" className="glass relative rounded-3xl p-2 shadow-2xl">
              <TextArea
                rows={5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  source === "prompt"
                    ? 'Try: "Build a 20-slide presentation about Artificial Intelligence in Healthcare — covering market size, use cases, ethical concerns, and future outlook"'
                    : source === "url"
                      ? "Paste a website URL…"
                      : source === "youtube"
                        ? "Paste a YouTube video URL…"
                        : source === "csv"
                          ? "Paste CSV data… (Lumina will turn it into charts and tables)"
                          : source === "upload"
                            ? "Select a PDF, DOCX, PPTX, XLSX, image or Markdown file… (OCR reads scanned docs and images)"
                            : "Describe your topic…"
                }
                className="border-0 bg-transparent text-[15px] leading-relaxed focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) startOutlineGeneration();
                }}
              />
              <div className="flex items-center justify-between border-t border-white/10 px-2 py-2">
                <span className="text-[11px] text-slate-500">
                  {source === "upload" && fileStatusText ? (
                    <span className={fileStatus === "error" ? "text-rose-300" : fileStatus === "done" ? "text-emerald-300" : "text-amber-200"}>
                      {fileStatusText}
                    </span>
                  ) : (
                    "Ctrl+Enter to build outline"
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {source === "upload" && (
                    <>
                      <input
                        id="file-input"
                        type="file"
                        accept=".pdf,.docx,.pptx,.xlsx,.md,.txt,.csv,.tsv,.html,.rtf,.png,.jpg,.jpeg,.webp,.bmp,.tiff"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileSelected(f);
                          e.target.value = "";
                        }}
                      />
                      <label
                        htmlFor="file-input"
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                          fileStatus === "extracting"
                            ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                            : fileStatus === "error"
                              ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                              : fileStatus === "done"
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                                : "border-white/15 text-slate-300 hover:bg-white/8"
                        }`}
                        title="PDF, DOCX, PPTX, XLSX, images (OCR) and more"
                      >
                        {fileStatus === "extracting"
                          ? "⏳ Reading…"
                          : fileStatus === "error"
                            ? "⚠ Retry"
                            : fileName
                              ? `✓ ${fileName}`
                              : "Choose file…"}
                      </label>
                    </>
                  )}
                  <Button data-tour="create-generate-btn" onClick={startOutlineGeneration}>
                    Build Outline <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Architect mode toggle */}
            <div data-tour="create-controls" className="mx-auto mt-6 max-w-2xl rounded-2xl glass p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Multi-Agent Architect</span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">ON</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Research Agent → Storytelling → Slide Planner → Content Writers → UI Designer → Review Agent (95%+)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setArchitectMode(!architectMode)}
                  className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    architectMode ? "bg-indigo-500" : "bg-white/15"
                  }`}
                  title="Toggle multi-agent pipeline"
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      architectMode ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
              {architectMode && (
                <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="shrink-0 text-indigo-300" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Audience</span>
                    <div className="flex flex-wrap gap-1.5">
                      {AUDIENCES.map((a) => (
                        <button
                          key={a}
                          onClick={() => setAudience(a)}
                          className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                            audience === a ? "bg-indigo-500/80 text-white" : "bg-white/[0.05] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-white/[0.07] pt-3">
                    <Brain size={13} className="shrink-0 text-fuchsia-300" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Llama Planning Layer</div>
                      <p className="text-[10px] text-slate-500">
                        Context Engine → Llama Planning Engine → Blueprint → AI Orchestrator
                      </p>
                    </div>
                    <button
                      onClick={() => settings.setPlanningEnabled(!settings.planningEnabled)}
                      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        settings.planningEnabled ? "bg-fuchsia-500" : "bg-white/15"
                      }`}
                      title="Toggle Llama planning (Context Engine + Blueprint generation)"
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                          settings.planningEnabled ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Examples */}
            <div className="mt-6">
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-500">Try one of these</p>
              <div className="flex flex-wrap justify-center gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => pickExample(ex)}
                    className="cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-indigo-400/50 hover:text-indigo-200"
                  >
                    {ex.length > 64 ? ex.slice(0, 63) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="glass rounded-2xl p-4">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Slides</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="mt-1 text-center text-2xl font-bold text-white">{slideCount}</div>
              </div>
              <div className="glass rounded-2xl p-4">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tone</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                        tone === t ? "bg-indigo-500/80 text-white" : "bg-white/[0.05] text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-4">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
                >
                  <option value="" className="bg-slate-900">Auto (match topic)</option>
                  {THEMES.map((t, idx) => (
                    <option key={`${t.id}-${idx}`} value={t.id} className="bg-slate-900">{t.name}</option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] text-slate-500">20 design systems included</p>
              </div>

              {/* Content Style & Density Selector */}
              <div data-tour="create-density" className="glass rounded-2xl p-4 sm:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Content Density & Style</label>
                  <span className="text-[10px] text-indigo-300">
                    {CONTENT_STYLES.find((cs) => cs.id === contentStyle)?.hint}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {CONTENT_STYLES.map((cs) => (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => setContentStyle(cs.id)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center cursor-pointer transition-all ${
                        contentStyle === cs.id
                          ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-xs font-bold">{cs.label}</span>
                      <span className="text-[9px] opacity-70 leading-tight">{cs.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background mode: AI-generated vs available */}
              <div data-tour="create-themes" className="glass rounded-2xl p-4 sm:col-span-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Slide Backgrounds</label>
                  <span className="text-[10px] text-slate-500">
                    {backgroundMode === "ai" ? "AI-generated for the entire deck" : "From the built-in library"}
                  </span>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-xl bg-white/[0.04] p-1.5">
                  <button
                    onClick={() => setBackgroundMode("available")}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      backgroundMode === "available"
                        ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Palette size={13} /> Available Backgrounds
                  </button>
                  <button
                    onClick={() => setBackgroundMode("ai")}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      backgroundMode === "ai"
                        ? "bg-fuchsia-500/80 text-white shadow-lg shadow-fuchsia-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Wand2 size={13} /> Generate with AI (FLUX)
                  </button>
                </div>

                {backgroundMode === "ai" ? (
                  <>
                    <div>
                      <Label>Describe your AI background</Label>
                      <div className="mt-1.5 flex items-start gap-2">
                        <TextArea
                          rows={2}
                          value={bgPrompt}
                          onChange={(e) => setBgPrompt(e.target.value)}
                          placeholder="e.g. Dark futuristic mesh with glowing blue nodes, subtle depth of field, cinematic lighting…"
                          className="flex-1"
                        />
                        <Button onClick={generateBackgroundOptions} disabled={bgGenerating} className="mt-0.5 shrink-0">
                          <Wand2 size={14} /> {bgGenerating ? "Generating…" : "Generate Options"}
                        </Button>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Uses your deck topic + style preset. You&apos;ll get 4 options to pick from.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                      {AI_BACKGROUND_STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setBackgroundStyle(s.id)}
                          title={s.hint}
                          className={`cursor-pointer rounded-xl border p-2 text-left transition-all ${
                            backgroundStyle === s.id
                              ? "border-fuchsia-400/70 bg-fuchsia-500/15"
                              : "border-white/10 bg-white/[0.03] hover:border-white/25"
                          }`}
                        >
                          <span className="block text-[11px] font-semibold text-slate-200">{s.label}</span>
                          <span className="mt-0.5 block text-[9px] leading-tight text-slate-500">{s.hint}</span>
                        </button>
                      ))}
                    </div>

                    {bgCandidates.length > 0 && (
                      <div>
                        <Label>Select the background for your entire presentation</Label>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {bgCandidates.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setBgSelected(url)}
                              className={`group relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                                bgSelected === url
                                  ? "border-fuchsia-400 ring-2 ring-fuchsia-500/50 shadow-lg scale-[1.02]"
                                  : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
                              }`}
                            >
                              <img src={url} alt={`AI Background option ${idx + 1}`} className="h-full w-full object-cover" />
                              {bgSelected === url && (
                                <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 text-white shadow-md">
                                  <Check size={12} />
                                </span>
                              )}
                              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-white backdrop-blur">
                                Option #{idx + 1}
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-fuchsia-300">
                          <Check size={11} />
                          {bgSelected ? "Selected image will be applied as the background of every slide in the deck." : "Pick one of the generated options."}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {[{ id: "all", label: `All (${BACKGROUNDS.length})` }, ...BACKGROUND_CATEGORIES].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setAvailBgCategory(c.id)}
                          className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
                            availBgCategory === c.id
                              ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                              : "border-white/10 text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <Input
                      placeholder="Search backgrounds…"
                      value={availBgSearch}
                      onChange={(e) => setAvailBgSearch(e.target.value)}
                      className="mb-2 h-8 text-xs"
                    />

                    <div className="max-h-72 overflow-y-auto rounded-xl pr-1">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {BACKGROUNDS.filter((b) => {
                          if (availBgCategory !== "all" && b.category !== availBgCategory) return false;
                          if (availBgSearch && !`${b.name} ${b.category}`.toLowerCase().includes(availBgSearch.toLowerCase())) return false;
                          return true;
                        }).map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setAvailBgId(b.id)}
                            className={`group relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                              availBgId === b.id
                                ? "border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg scale-[1.02]"
                                : "border-white/10 opacity-75 hover:opacity-100 hover:border-white/30"
                            }`}
                            title={b.name}
                          >
                            <div
                              className="absolute inset-0"
                              style={{ background: b.css, backgroundSize: "cover", backgroundPosition: "center" }}
                            />
                            {b.imageUrl && (
                              <img src={b.imageUrl} alt={b.name} className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-left backdrop-blur">
                              <span className="block truncate text-[10px] font-medium text-white">{b.name}</span>
                              <span className="block text-[8px] capitalize text-indigo-300">{b.category}</span>
                            </div>
                            {availBgId === b.id && (
                              <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
                                <Check size={12} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-300">
                      <Check size={11} />
                      {availBgId
                        ? `"${BACKGROUNDS.find((b) => b.id === availBgId)?.name}" will be applied as the background of every slide in the deck.`
                        : "Select one background — it will be applied to every slide in the deck."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INTERACTIVE OUTLINE BUILDER */}
        {step === "outline" && outline && (
          <div className="mx-auto mt-6 max-w-4xl animate-slide-up">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                  Step 2 of 3 · Smart Outline
                </span>
                <h2 className="mt-2 text-3xl font-bold text-white">{outline.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{outline.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setStep("prompt")}>
                  Edit Prompt
                </Button>
                <Button onClick={approveAndGenerateSlides}>
                  Approve & Generate Slides <Sparkles size={14} />
                </Button>
              </div>
            </div>

            {agentLogs && agentLogs.length > 0 && (
              <div className="mb-6 glass rounded-2xl p-4 border border-fuchsia-500/20">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
                    <Bot size={13} /> Agent Pipeline
                  </span>
                  <span className="text-[10px] text-slate-400">{agentLogs.length} agent steps</span>
                </div>
                <div className="space-y-1.5">
                  {agentLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        log.agent === "review" ? "bg-emerald-500/10" : "bg-white/[0.03]"
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
                        {AGENT_ICONS[log.agent] ?? <Sparkles size={11} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{log.title}</span>
                          <Check size={11} className="shrink-0 text-emerald-400" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">{log.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {researchData && (
              <div className="mb-6 glass rounded-2xl p-4 border border-indigo-500/20">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">AI Research & Verified Facts</span>
                  <span className="text-[10px] text-slate-400">{researchData.citations.length} citations</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-300">
                  {researchData.facts.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2.5">
                      <Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{f.claim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">{outline.slides.length} slides planned</span>
              <Button size="sm" variant="secondary" onClick={addSlideItem}>
                <Plus size={14} /> Add Slide
              </Button>
            </div>

            <div className="space-y-2.5">
              {outline.slides.map((s, i) => (
                <div
                  key={s.id}
                  className="glass flex items-center gap-3 rounded-2xl border border-white/10 p-3 transition-all hover:border-indigo-400/40"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xs font-bold text-indigo-200">
                    {i + 1}
                  </span>

                  <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center">
                    <input
                      value={s.title}
                      onChange={(e) => updateItemTitle(i, e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-indigo-400/50"
                    />
                    <select
                      value={s.layout}
                      onChange={(e) => updateItemLayout(i, e.target.value)}
                      className="h-8 rounded-lg border border-white/10 bg-white/[0.05] px-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-400/50"
                    >
                      {[
                        "title", "agenda", "two-columns", "three-columns", "timeline", "process",
                        "roadmap", "metrics", "statistics", "bar", "pie", "table", "cards",
                        "swot", "bmc", "flowchart", "architecture", "quote", "code", "formula",
                        "references", "conclusion", "q-and-a", "facts", "key-takeaways", "hero", "section"
                      ].map((l) => (
                        <option key={l} value={l} className="bg-slate-900 capitalize">{l}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => i > 0 && moveItem(i, i - 1)}
                      disabled={i === 0}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => i < outline.slides.length - 1 && moveItem(i, i + 1)}
                      disabled={i === outline.slides.length - 1}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={() => deleteItem(i)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                      title="Delete slide"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={approveAndGenerateSlides}>
                Approve Outline & Generate Presentation <Sparkles size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="mx-auto mt-16 max-w-xl animate-scale-in">
            <div className="glass rounded-3xl p-8 shadow-2xl">
              <div className="mb-8 flex items-center justify-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600">
                    <Brain size={32} className="animate-pulse text-white" />
                  </div>
                  <div className="absolute -inset-2 rounded-3xl border-2 border-indigo-400/30 animate-ping" />
                </div>
              </div>

              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-white">{progress.label}</h2>
                <p className="mt-1 text-xs text-slate-500">{phaseLabel[progress.phase] ?? progress.phase} · {progress.percent}%</p>
              </div>

              <div className="mb-8 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 sm:grid-cols-4">
                {(["research", "outline", "content", "layout", "theme"] as const).map((p) => {
                  const order = ["research", "outline", "content", "layout", "theme"];
                  const activeIdx = order.indexOf(progress.phase);
                  const idx = order.indexOf(p);
                  return (
                    <div
                      key={p}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${
                        idx < activeIdx ? "text-emerald-300" : idx === activeIdx ? "text-indigo-200 bg-indigo-500/10" : "text-slate-600"
                      }`}
                    >
                      {idx < activeIdx ? <Check size={11} /> : <Spinner size={11} />}
                      <span className="capitalize">{p}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              <ShieldCheck size={14} className="shrink-0 text-amber-300" />
              <span>
                <strong>Note:</strong> The AI-generated content may be inaccurate. Please verify all facts and figures once again before presenting.
              </span>
            </div>
          </div>
        )}

        {step === "done" && outline && (
          <div className="mx-auto mt-10 max-w-4xl animate-slide-up">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">{outline.title}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">{outline.subtitle}</p>
              </div>
              <Button onClick={openEditor}>
                Open in Editor <ArrowRight size={14} />
              </Button>
            </div>

            {review && (
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="glass rounded-2xl p-5 sm:col-span-1">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck size={13} /> Design Review Score
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3.5" />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={`${(review.overallScore / 100) * 100} 100`}
                        />
                      </svg>
                      <span className="absolute text-2xl font-bold text-white">{review.overallScore}%</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      <p className="font-semibold text-emerald-300">{review.deckPassed ? "Passed ≥ 95%" : "Below threshold"}</p>
                      <p className="mt-1">
                        {review.slideScores.filter((s) => s.autoRedesigned).length} of {review.slideScores.length} slides auto-redesigned
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{review.summary}</p>
                </div>

                <div className="glass rounded-2xl p-5 sm:col-span-2">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Category Scores</div>
                  <div className="space-y-2">
                    {(
                      [
                        ["Design", review.categories.design],
                        ["Typography", review.categories.typography],
                        ["Spacing", review.categories.spacing],
                        ["Accessibility", review.categories.accessibility],
                        ["Storytelling", review.categories.storytelling],
                        ["Animation", review.categories.animation],
                      ] as [string, number][]
                    ).map(([label, score]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-[11px] text-slate-400">{label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${score >= 95 ? "bg-emerald-400" : score >= 85 ? "bg-amber-400" : "bg-rose-400"}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-slate-300">{score}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <BadgeCheck size={12} className="text-emerald-400" />
                    Review Agent re-audits every slide and regenerates anything below 95%.
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {outline.slides.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-indigo-400/40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-[11px] font-bold text-indigo-200">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-200">{s.title}</div>
                    <div className="text-[10px] capitalize text-slate-500">{s.layout}</div>
                  </div>
                  <LayoutTemplate size={13} className="shrink-0 text-slate-500" />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Palette size={12} className="text-indigo-300" />
              <span>Every element is editable — drag, resize, retheme, reanimate.</span>
            </div>
          </div>
        )}
      </div>

      <CreateGuideModal isOpen={createGuideOpen} onClose={() => setCreateGuideOpen(false)} />
    </div>
  );
}
