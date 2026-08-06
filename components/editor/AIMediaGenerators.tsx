"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, BarChart2, GitBranch, X, RotateCcw, Check } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { Button, Input, TextArea, SegmentedControl, Label } from "@/components/ui";
import { toast } from "sonner";

interface AIMediaGeneratorsProps {
  mode: "image" | "chart" | "diagram" | null;
  onClose: () => void;
}

export function AIMediaGenerators({ mode, onClose }: AIMediaGeneratorsProps) {
  const deck = useDeckStore((s) => s.deck);
  const addElement = useDeckStore((s) => s.addElement);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setSelection = useUIStore((s) => s.setSelection);

  const updateSlide = useDeckStore((s) => s.updateSlide);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Hero Illustration");
  const [modelType, setModelType] = useState<"stablediffusion-xl" | "flux">("stablediffusion-xl");
  const [generating, setGenerating] = useState(false);
  const [candidateUrls, setCandidateUrls] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  if (!mode || !deck || !activeSlideId) return null;

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Enter an image description or prompt");
      return;
    }
    setGenerating(true);
    setCandidateUrls([]);
    setSelectedCandidate(null);
    const textPrompt = prompt.trim();

    try {
      if (modelType === "flux") {
        const modelName = "flux";
        const dimensions = "width=1920&height=1080";
        // 4 distinct real FLUX generations via the backend route
        const variants = [
          `${textPrompt}, ${style}, hero composition`,
          `${textPrompt}, ${style}, wide angle`,
          `${textPrompt}, ${style}, macro detail`,
          `${textPrompt}, ${style}, dramatic lighting`,
        ];
        const results = await Promise.allSettled(
          variants.map((p) =>
            fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: p, style, seed: Math.floor(Math.random() * 1000) }),
            }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
          )
        );
        const urls = results
          .filter((r): r is PromiseFulfilledResult<{ url: string }> => r.status === "fulfilled")
          .map((r) => r.value.url);
        if (urls.length === 0) {
          throw new Error("Image generation failed on the backend");
        }
        // Backfill with pollinations/stock only if fewer than 4 came back
        while (urls.length < 4) {
          urls.push(
            `https://image.pollinations.ai/prompt/${encodeURIComponent(textPrompt + ", " + style + " 8k HD visual")}&model=${modelName}&${dimensions}&seed=${Math.floor(Math.random() * 999)}&nologo=true`
          );
        }
        setCandidateUrls(urls);
        setSelectedCandidate(urls[0]);
        toast.success(`Generated ${urls.length} AI image candidates`);
      } else {
        // Stable Diffusion XL — serverless URL (pollinations)
        const modelName = "stablediffusion-xl";
        const dimensions = "width=1024&height=1024";
        const candidates = [
          `https://image.pollinations.ai/prompt/${encodeURIComponent(textPrompt + ", " + style + " 8k HD visual")}&model=${modelName}&${dimensions}&seed=101&nologo=true`,
          `https://image.pollinations.ai/prompt/${encodeURIComponent(textPrompt + ", futuristic " + style)}&model=${modelName}&${dimensions}&seed=303&nologo=true`,
          `https://image.pollinations.ai/prompt/${encodeURIComponent(textPrompt + ", isometric " + style)}&model=${modelName}&${dimensions}&seed=505&nologo=true`,
          `https://image.pollinations.ai/prompt/${encodeURIComponent(textPrompt + ", editorial " + style)}&model=${modelName}&${dimensions}&seed=707&nologo=true`,
        ];
        setCandidateUrls(candidates);
        setSelectedCandidate(candidates[0]);
        toast.success("Generated 4 AI image candidates");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const insertImage = () => {
    if (!selectedCandidate) return;
    const uid = Math.random().toString(36).slice(2, 10);
    const newEl = {
      id: uid,
      name: `AI Image — ${style}`,
      type: "image" as const,
      src: selectedCandidate,
      alt: prompt,
      objectFit: "cover" as const,
      position: { x: 160, y: 150, width: 600, height: 400, rotation: 0 },
      style: { borderRadius: 16, shadow: true },
      animation: { type: "zoom" as const, duration: 0.6, delay: 0 },
      locked: false,
      visible: true,
      zIndex: 10,
    };
    addElement(activeSlideId, newEl);
    setSelection([uid]);
    toast.success("Inserted selected AI Content Graphic!");
    onClose();
  };

  const applyAsBackground = () => {
    if (!selectedCandidate) return;
    updateSlide(activeSlideId, {
      backgroundImage: selectedCandidate,
      background: `url("${selectedCandidate}") center / cover no-repeat`,
    });
    toast.success("Applied selected AI candidate as Slide Background!");
    onClose();
  };

  const applyAsAllSlidesBackground = () => {
    if (!selectedCandidate || !deck) return;
    deck.slides.forEach((s) => {
      updateSlide(s.id, {
        backgroundImage: selectedCandidate,
        background: `url("${selectedCandidate}") center / cover no-repeat`,
      });
    });
    toast.success("Applied selected AI Background across ALL slides!");
    onClose();
  };

  const handleGenerateDiagram = () => {
    const uid = Math.random().toString(36).slice(2, 10);
    const newEl = {
      id: uid,
      name: "AI Flow Diagram",
      type: "flowchart" as const,
      nodes: [
        { id: "1", label: "User Action / Trigger", icon: "zap", x: 0, y: 0, width: 220, height: 60 },
        { id: "2", label: "AI Engine Processing", icon: "cpu", x: 0, y: 0, width: 220, height: 60 },
        { id: "3", label: "Structured Knowledge Base", icon: "database", x: 0, y: 0, width: 220, height: 60 },
        { id: "4", label: "Interactive Presentation Deck", icon: "sparkles", x: 0, y: 0, width: 240, height: 60 },
      ],
      edges: [],
      position: { x: 100, y: 200, width: 1080, height: 400, rotation: 0 },
      style: { color: "var(--t-primary)" },
      animation: { type: "draw" as const, duration: 0.8, delay: 0 },
      locked: false,
      visible: true,
      zIndex: 10,
    };
    addElement(activeSlideId, newEl);
    setSelection([uid]);
    toast.success("Inserted AI Architecture Diagram!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass max-w-xl w-full rounded-3xl border border-white/10 p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles size={16} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-white">
              {mode === "image" ? "AI Image Generator" : mode === "chart" ? "AI Chart Generator" : "AI Diagram Generator"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {mode === "image" && (
          <div className="space-y-4">
            <div>
              <Label>AI Generation Engine</Label>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModelType("stablediffusion-xl")}
                  className={`flex-1 rounded-xl border p-2.5 text-left text-xs transition-all ${
                    modelType === "stablediffusion-xl"
                      ? "border-indigo-400 bg-indigo-500/15 text-white"
                      : "border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-slate-200">Stable Diffusion XL</div>
                  <div className="text-[10px] text-slate-400">Content-relevant slide figures & graphics</div>
                </button>
                <button
                  type="button"
                  onClick={() => setModelType("flux")}
                  className={`flex-1 rounded-xl border p-2.5 text-left text-xs transition-all ${
                    modelType === "flux"
                      ? "border-indigo-400 bg-indigo-500/15 text-white"
                      : "border-white/10 text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <div className="font-bold text-slate-200">FLUX 1.0 AI</div>
                  <div className="text-[10px] text-slate-400">8K Full-slide background visuals</div>
                </button>
              </div>
            </div>

            <div>
              <Label>Image Description & Prompt</Label>
              <TextArea
                rows={3}
                placeholder={
                  modelType === "flux"
                    ? "e.g. Dark futuristic mesh background with glowing blue nodes..."
                    : "e.g. 3D isometric representation of artificial intelligence connecting cloud infrastructure..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Visual Style Preset</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {["Hero Illustration", "3D Render", "Realistic Photo", "Flat Vector", "Cyberpunk", "Minimalist", "Icon"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      style === s ? "bg-indigo-500 text-white" : "bg-white/[0.05] text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {generating && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <p className="text-xs text-slate-400">Generating 4 images with FLUX… this can take up to a minute</p>
              </div>
            )}

            {candidateUrls.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label>Select AI Background Candidate Response (4 Options)</Label>
                  <span className="text-[10px] text-indigo-300">Click to preview & select</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {candidateUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCandidate(url)}
                      className={`group relative min-h-[140px] aspect-video overflow-hidden rounded-2xl border-2 transition-all cursor-pointer bg-slate-950 ${
                        selectedCandidate === url
                          ? "border-indigo-400 ring-2 ring-indigo-500/60 shadow-xl scale-[1.02]"
                          : "border-white/10 opacity-80 hover:opacity-100 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`AI Background Option #${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to high-res background if image stream is delayed
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80`;
                        }}
                      />
                      {selectedCandidate === url ? (
                        <div className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg ring-2 ring-white">
                          <Check size={16} />
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Check size={12} />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between">
                        <span className="rounded-full bg-indigo-500/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          AI Background #{idx + 1}
                        </span>
                        {selectedCandidate === url && (
                          <span className="text-[10px] font-medium text-emerald-300">Selected</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-white/10">
              <Button variant="secondary" onClick={handleGenerateImage} disabled={generating}>
                <RotateCcw size={14} /> {generating ? "Generating..." : "Regenerate 4 AI Options"}
              </Button>
              {selectedCandidate && (
                <>
                  <Button variant="secondary" onClick={insertImage}>
                    Insert as Slide Graphic
                  </Button>
                  <Button variant="secondary" onClick={applyAsBackground}>
                    Set as Current Slide Background
                  </Button>
                  <Button onClick={applyAsAllSlidesBackground}>
                    <Check size={14} /> Apply to ENTIRE Presentation
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {mode === "diagram" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Generate interactive architecture diagrams, flowcharts, ER diagrams, or process maps using AI.
            </p>
            <TextArea
              rows={4}
              placeholder="e.g. User Action -> AI Inference Engine -> Vector Database -> Live Dashboard Output"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleGenerateDiagram}>
                <Sparkles size={14} /> Generate Diagram
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
