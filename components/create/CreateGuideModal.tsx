"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Wand2,
  Sliders,
  Palette,
  Bot,
  Layers,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Brain,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui";

interface CreateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CREATION_STEPS = [
  {
    id: "sources",
    target: "create-sources",
    title: "1. Select Input Source",
    subtitle: "Choose from 9 input modes: Prompt, Topic, URL, YouTube, Notes, PDF, CSV",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    highlights: [
      "Prompt Mode: Type a descriptive presentation request",
      "URL / YouTube Mode: Extract website pages or video transcripts",
      "File Upload Mode: Import PDFs, DOCX, PPTX, or CSV data tables",
    ],
    tips: "Tip: Select 'CSV' or 'Upload' to automatically generate animated charts & data tables.",
  },
  {
    id: "textarea",
    target: "create-textarea",
    title: "2. Describe Topic & Goals",
    subtitle: "Type your topic prompt or paste document text",
    icon: Sparkles,
    color: "from-indigo-500 to-violet-600",
    highlights: [
      "Enter any presentation topic, brief, or detailed outline requirements",
      "OCR Engine: Uploaded PDFs and images are automatically converted to text",
      "Shortcut: Press Ctrl+Enter (or Cmd+Enter) anytime to start building your outline",
    ],
    tips: "Tip: Click any of the example prompt pills below to auto-fill sample ideas.",
  },
  {
    id: "controls",
    target: "create-controls",
    title: "3. Slide Count, Audience & Tone",
    subtitle: "Configure target audience and presentation length",
    icon: Bot,
    color: "from-emerald-500 to-teal-600",
    highlights: [
      "Multi-Agent Architect: Enable Research, Story, & Review agents (95%+ quality score)",
      "Target Audience: Select Executives, Investors, Customers, Students, or Developers",
      "Slide Length: Drag slider from 5 to 30 slides",
    ],
    tips: "Tip: Selecting your audience (e.g. 'Executives') automatically tailors callout metrics.",
  },
  {
    id: "density",
    target: "create-density",
    title: "4. Content Density & Generation Style",
    subtitle: "Control how much detail the AI writes on each slide",
    icon: Sliders,
    color: "from-amber-500 to-orange-600",
    highlights: [
      "Summarized Mode: Crisp, punchy bullet points & key takeaways",
      "Minimalist Mode: High-impact headlines with single stat callouts",
      "Executive Pitch Mode: Tailored for fundraising and boardroom decks",
      "Detailed Mode: Comprehensive data descriptions & multi-paragraph insights",
    ],
    tips: "Tip: Choose 'Executive Pitch' for investor decks and strategic keynotes.",
  },
  {
    id: "themes",
    target: "create-themes",
    title: "5. Themes & AI Background Generator",
    subtitle: "Select built-in background presets or FLUX 1.0 AI backgrounds",
    icon: Palette,
    color: "from-fuchsia-500 to-pink-600",
    highlights: [
      "FLUX AI Backgrounds: Generate 4 candidate images for your prompt & pick 1",
      "Library Presets: Choose Solid, Gradient, Mesh, Glassmorphism, or Dark backgrounds",
      "Design Systems: Select Apple Keynote, Tesla Dark, Google Light, or custom palettes",
    ],
    tips: "Tip: You can change the background per slide later in the editor.",
  },
  {
    id: "generate",
    target: "create-generate-btn",
    title: "6. Build & Customize Outline",
    subtitle: "Kick off AI research and multi-agent deck synthesis",
    icon: ArrowRight,
    color: "from-rose-500 to-red-600",
    highlights: [
      "AI Architect Pipeline: Runs Llama 3.3 70B & DeepSeek V4 Pro in parallel",
      "Interactive Review: Edit section titles and layouts before deck generation",
      "Approve & Finish: 1-click deck generation with full inline editing afterwards",
    ],
    tips: "You're all set! Click 'Build Outline' to start crafting your presentation.",
  },
];

export function CreateGuideModal({ isOpen, onClose }: CreateGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<"below" | "above" | "right" | "left" | "center">("below");

  const measureElement = useCallback((idx: number) => {
    const stepObj = CREATION_STEPS[idx];
    if (!stepObj) {
      setRect(null);
      setCardPos("center");
      return;
    }

    const domNode = document.querySelector<HTMLElement>(`[data-tour="${stepObj.target}"]`);
    if (!domNode) {
      setRect(null);
      setCardPos("center");
      return;
    }

    const r = domNode.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });

      const gap = 16;
      const cardHeight = 240;

      const below = r.top + r.height + gap + cardHeight;
      const above = r.top - gap - cardHeight;

      if (below <= window.innerHeight - 10) setCardPos("below");
      else if (above >= 10) setCardPos("above");
      else setCardPos("center");
    } else {
      setRect(null);
      setCardPos("center");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    measureElement(currentStep);

    const update = () => measureElement(currentStep);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, currentStep, measureElement]);

  if (!isOpen) return null;

  const step = CREATION_STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === CREATION_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      try {
        localStorage.setItem("lumina_create_guide_seen", "true");
      } catch {}
      onClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden animate-fade-in">
      {/* Darkened Canvas Mask */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="create-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(11, 13, 18, 0.75)"
          mask="url(#create-spotlight-mask)"
        />
      </svg>

      {/* Glowing Target Ring */}
      {rect && (
        <div
          className="absolute border-2 border-indigo-400/90 shadow-[0_0_24px_rgba(99,102,241,0.6)] transition-all duration-300 animate-pulse"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            borderRadius: 14,
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        className="pointer-events-auto absolute transition-all duration-300"
        style={(() => {
          if (!rect || cardPos === "center") {
            return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
          }
          const gap = 16;
          if (cardPos === "below") {
            return {
              top: Math.min(window.innerHeight - 340, rect.top + rect.height + gap),
              left: Math.max(16, Math.min(window.innerWidth - 640, rect.left)),
            };
          }
          return {
            top: Math.max(16, rect.top - 320),
            left: Math.max(16, Math.min(window.innerWidth - 640, rect.left)),
          };
        })()}
      >
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className={`relative flex items-center justify-between bg-gradient-to-r ${step.color} p-5 text-white`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Icon size={20} />
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                  Creator Guide — Step {currentStep + 1} of {CREATION_STEPS.length}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-black/20 p-2 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            <p className="text-xs font-medium text-slate-300">{step.subtitle}</p>

            <div className="space-y-2.5 rounded-xl border border-white/5 bg-slate-950/60 p-3.5">
              {step.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {step.tips && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2.5 text-[11px] text-indigo-200">
                {step.tips}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/40 px-5 py-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors ${
                currentStep === 0 ? "opacity-30 cursor-not-allowed text-slate-500" : "text-slate-300 hover:text-white"
              }`}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="flex items-center gap-1.5">
              {CREATION_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStep ? "w-5 bg-indigo-500" : "w-1.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
              >
                Skip Tour
              </button>
              <Button size="sm" onClick={handleNext} className="gap-1 text-xs">
                <span>{isLast ? "Start Creating" : "Next Step"}</span>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
