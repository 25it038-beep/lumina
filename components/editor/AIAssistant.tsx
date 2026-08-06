"use client";

import { useState } from "react";
import { Sparkles, X, Send, Wand2, MessageSquare, Image as ImageIcon, Plus, Trash2, Copy, LayoutTemplate, Palette, BarChart3 } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { buildClient, PROVIDERS } from "@/lib/ai/provider";
import { rewriteText } from "@/lib/ai/rewrite";
import { generateSpeakerNotes } from "@/lib/ai";
import { Button, Input, SegmentedControl, Label } from "@/components/ui";
import { toast } from "sonner";
import { aiGateway } from "@/lib/ai/gateway/AIGateway";
import { getTheme } from "@/lib/themes";
import { buildSlide } from "@/lib/layouts";
import { LayoutType } from "@/lib/types";
import { presentationReviewAgent } from "@/lib/ai/presentationReviewAgent";
import { synthesizeDualContent } from "@/lib/ai/contentEnrichment";

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

export function AIAssistant() {
  const open = useUIStore((s) => s.aiAssistantOpen);
  const setOpen = useUIStore((s) => s.setAIAssistant);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const setActiveSlide = useUIStore((s) => s.setActiveSlide);
  const deck = useDeckStore();
  const settings = useSettingsStore();
  const [tab, setTab] = useState<"chat" | "settings">("chat");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "👋 Hi! I'm your AI Presentation Copilot.\n\nTry prompts like:\n• \"Create a slide about Market Expansion Strategy\"\n• \"Change title to AI Security Framework\"\n• \"Add a bar chart showing Q1-Q4 revenue\"\n• \"Rewrite this slide into 3 concise executive bullets\"\n• \"Change layout to cards\" or \"Apply Cyberpunk theme\"",
    },
  ]);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const client = () => buildClient(settings.provider, settings.model, settings.apiKey, settings.baseUrl);

  const sendPrompt = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || busy) return;
    if (!promptText) setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);

    const activeId = useUIStore.getState().activeSlideId;
    const currentSlideIndex = deck.deck?.slides.findIndex((s) => s.id === activeId) ?? 0;
    const slide = deck.deck?.slides.find((s) => s.id === activeId);
    const selectedId = useUIStore.getState().selectedElementIds[0];
    const selected = slide?.elements.find((e) => e.id === selectedId);
    const themeObj = getTheme(deck.deck?.themeId ?? "dark");

    try {
      let reply = "";
      const lower = text.toLowerCase();

      // ------------------------------------------------------------------------
      // 1. CREATE SLIDE BY PROMPT
      // ------------------------------------------------------------------------
      if (
        (lower.includes("create") || lower.includes("add") || lower.includes("insert") || lower.includes("new") || lower.includes("make")) &&
        lower.includes("slide")
      ) {
        // Extract topic name
        let topic = text
          .replace(/^(create|add|insert|make|new)\s+(a\s+)?(new\s+)?slide\s*(about|for|on|showing|titled)?\s*/i, "")
          .trim();
        if (!topic || topic.length < 2) topic = "New Topic Section";

        // Determine layout based on keywords
        let layout: LayoutType = "two-columns";
        if (lower.includes("chart") || lower.includes("metric") || lower.includes("revenue") || lower.includes("stat")) layout = "metrics";
        else if (lower.includes("timeline") || lower.includes("roadmap") || lower.includes("history")) layout = "timeline";
        else if (lower.includes("swot") || lower.includes("risk")) layout = "swot";
        else if (lower.includes("card") || lower.includes("feature") || lower.includes("pillar")) layout = "cards";
        else if (lower.includes("comparison") || lower.includes("versus") || lower.includes("vs")) layout = "comparison";
        else if (lower.includes("process") || lower.includes("step")) layout = "process";
        else if (lower.includes("hero") || lower.includes("title")) layout = "hero";

        // Synthesize content draft
        const topicCapitalized = topic.charAt(0).toUpperCase() + topic.slice(1);
        const draftContent = {
          title: topicCapitalized,
          subtitle: `Strategic analysis & key takeaways for ${topic}`,
          bullets: [
            `Core objective & strategic focus area for ${topic}`,
            `Key market drivers, user requirements & operational priorities`,
            `Measurable goals and execution roadmap for upcoming quarters`,
          ],
          cards: [
            { title: "Primary Objective", desc: `Define core strategic direction for ${topic}` },
            { title: "Market Growth", desc: "Accelerate user adoption & business metrics" },
            { title: "Execution Plan", desc: "Deploy cross-functional resources & milestones" },
          ],
          metrics: [
            { value: "85%", label: "Target Coverage" },
            { value: "3.4x", label: "Growth Multiplier" },
            { value: "99.9%", label: "System Reliability" },
          ],
          timeline: [
            { period: "Phase 1", title: "Discovery & Planning", desc: `Analyze requirements for ${topic}` },
            { period: "Phase 2", title: "Development & Testing", desc: "Build & refine core components" },
            { period: "Phase 3", title: "Global Deployment", desc: "Launch across target segments" },
          ],
        };

        const nextIndex = currentSlideIndex >= 0 ? currentSlideIndex + 1 : (deck.deck?.slides.length ?? 0);
        const outlineItem = { id: `out-${Date.now()}`, title: topicCapitalized, layout, notes: `Notes for ${topicCapitalized}` };
        const newSlide = buildSlide(outlineItem, draftContent, themeObj, nextIndex);
        newSlide.title = topicCapitalized;

        deck.addSlide(newSlide, nextIndex);
        setActiveSlide(newSlide.id);
        reply = `✨ Created new slide **"${topicCapitalized}"** (Layout: *${layout}*) and set it as active!`;
      }

      // ------------------------------------------------------------------------
      // 2. MODIFY / EDIT SLIDE TITLE OR SUBTITLE
      // ------------------------------------------------------------------------
      else if (lower.includes("title") && (lower.includes("change") || lower.includes("set") || lower.includes("update") || lower.includes("rename"))) {
        if (!slide) {
          reply = "Please select a slide to edit.";
        } else {
          const newTitle = text.replace(/.*?(change|set|update|rename)\s+(the\s+)?title\s+(to|as)?\s*/i, "").trim().replace(/^["']|["']$/g, "");
          if (newTitle) {
            deck.updateSlide(slide.id, { title: newTitle });
            const headingEl = slide.elements.find((e) => e.type === "heading");
            if (headingEl) {
              deck.updateElement(slide.id, headingEl.id, { content: newTitle });
            }
            reply = `✏️ Updated slide title to **"${newTitle}"**!`;
          } else {
            reply = "Please provide the new title text (e.g. \"Change title to AI Strategy\").";
          }
        }
      }

      // ------------------------------------------------------------------------
      // 3. EDIT SLIDE SUBTITLE
      // ------------------------------------------------------------------------
      else if (lower.includes("subtitle") && (lower.includes("change") || lower.includes("set") || lower.includes("update"))) {
        if (!slide) {
          reply = "Please select a slide to edit.";
        } else {
          const newSub = text.replace(/.*?(change|set|update)\s+(the\s+)?subtitle\s+(to|as)?\s*/i, "").trim().replace(/^["']|["']$/g, "");
          if (newSub) {
            const subEl = slide.elements.find((e) => e.type === "subtitle");
            if (subEl) {
              deck.updateElement(slide.id, subEl.id, { content: newSub });
            } else {
              deck.addElement(slide.id, {
                id: Math.random().toString(36).slice(2, 10),
                type: "subtitle",
                content: newSub,
                name: "Subtitle",
                position: { x: 80, y: 150, width: 900, height: 50, rotation: 0 },
                style: { fontSize: 24, color: "var(--t-muted)" },
                animation: { type: "fade-up", duration: 0.6, delay: 0.1 },
                locked: false,
                visible: true,
                zIndex: 2,
              });
            }
            reply = `✏️ Updated slide subtitle to **"${newSub}"**!`;
          } else {
            reply = "Please provide the new subtitle text.";
          }
        }
      }

      // ------------------------------------------------------------------------
      // 4. REWRITE ACTIVE SLIDE COPY (LLaMA + DeepSeek Dual Synthesis)
      // ------------------------------------------------------------------------
      else if (lower.includes("rewrite") || lower.includes("polish") || lower.includes("improve slide") || lower.includes("executive")) {
        if (!slide) {
          reply = "Please select a slide to rewrite.";
        } else {
          toast.loading("Synthesizing content with LLaMA + DeepSeek dual engine…");
          let count = 0;
          for (const el of slide.elements) {
            if ("content" in el && el.content && typeof el.content === "string" && el.content.trim().length > 3) {
              const rewritten = await rewriteText(el.content, lower.includes("short") ? "shorter" : lower.includes("executive") ? "executive-summary" : "improve", client());
              if (rewritten && rewritten !== el.content) {
                deck.updateElement(slide.id, el.id, { content: rewritten });
                count++;
              }
            }
          }
          toast.dismiss();
          toast.success("Slide content synthesized & updated!");
          reply = `🚀 Synthesized and updated **${count} text element${count > 1 ? "s" : ""}** on "${slide.title}" using LLaMA + DeepSeek dual engine!`;
        }
      }

      // ------------------------------------------------------------------------
      // 5. CHANGE SLIDE LAYOUT
      // ------------------------------------------------------------------------
      else if (lower.includes("layout")) {
        if (!slide) {
          reply = "Please select a slide first.";
        } else {
          const layouts: LayoutType[] = ["title", "agenda", "two-columns", "three-columns", "timeline", "process", "roadmap", "metrics", "statistics", "bar", "pie", "table", "cards", "swot", "bmc", "flowchart", "architecture", "quote", "code", "formula", "references", "conclusion", "q-and-a", "facts", "key-takeaways", "hero", "section"];
          const matched = layouts.find((l) => lower.includes(l));
          const targetLayout = matched ?? "cards";
          
          deck.updateSlide(slide.id, { layout: targetLayout as any });
          reply = `🎨 Changed slide layout to **${targetLayout.toUpperCase()}**!`;
        }
      }

      // ------------------------------------------------------------------------
      // 6. DELETE / DUPLICATE / MOVE SLIDE
      // ------------------------------------------------------------------------
      else if (lower.includes("delete") && lower.includes("slide")) {
        if (!slide) {
          reply = "No active slide selected to delete.";
        } else {
          const title = slide.title;
          deck.deleteSlide(slide.id);
          const remaining = deck.deck?.slides ?? [];
          if (remaining.length > 0) {
            setActiveSlide(remaining[Math.max(0, currentSlideIndex - 1)].id);
          }
          reply = `🗑️ Deleted slide **"${title}"**.`;
        }
      } else if (lower.includes("duplicate") || lower.includes("clone")) {
        if (!slide) {
          reply = "No active slide selected to duplicate.";
        } else {
          deck.duplicateSlide(slide.id);
          reply = `📋 Duplicated slide **"${slide.title}"**!`;
        }
      }

      // ------------------------------------------------------------------------
      // 7. CHANGE THEME
      // ------------------------------------------------------------------------
      else if (lower.includes("theme")) {
        const themes = ["corporate", "startup", "education", "business", "marketing", "medical", "technology", "finance", "minimal", "glassmorphism", "dark", "apple", "microsoft", "google", "modern", "gradient", "luxury", "cyberpunk", "academic"];
        const matched = themes.find((t) => lower.includes(t)) ?? "cyberpunk";
        deck.applyTheme(matched);
        reply = `🎨 Applied the **${matched.toUpperCase()}** design theme across all slides!`;
      }

      // ------------------------------------------------------------------------
      // 8. INSERT CHART / IMAGE / DIAGRAM
      // ------------------------------------------------------------------------
      else if (lower.includes("chart") || lower.includes("graph")) {
        if (!slide) {
          reply = "Select a slide to insert a chart.";
        } else {
          const chartType = lower.includes("pie") ? "pie" : lower.includes("line") ? "line" : "bar";
          const uidStr = Math.random().toString(36).slice(2, 10);
          deck.addElement(slide.id, {
            id: uidStr,
            name: `AI ${chartType.toUpperCase()} Chart`,
            type: "chart",
            chartType: chartType as any,
            title: `${slide.title} Performance Metrics`,
            data: [
              { label: "Q1", value: 38 },
              { label: "Q2", value: 64 },
              { label: "Q3", value: 89 },
              { label: "Q4", value: 105 },
            ],
            datasets: [],
            axisLabels: { x: "Quarter", y: "Growth" },
            legend: true,
            animateChart: true,
            position: { x: 200, y: 200, width: 620, height: 360, rotation: 0 },
            style: { borderRadius: 16, shadow: true },
            animation: { type: "stagger", duration: 0.8, delay: 0.1 },
            locked: false,
            visible: true,
            zIndex: slide.elements.length + 1,
          });
          reply = `📊 Inserted interactive **${chartType.toUpperCase()} Chart** on slide "${slide.title}"!`;
        }
      } else if (lower.includes("image") || lower.includes("picture") || lower.includes("visual")) {
        if (!slide) {
          reply = "Select a slide first.";
        } else {
          toast.loading("Generating AI Content Visual…");
          const imgUrl = await aiGateway.generateStableDiffusionContentImage(slide.title, "3D Render");
          const uidStr = Math.random().toString(36).slice(2, 10);
          deck.addElement(slide.id, {
            id: uidStr,
            name: "AI Content Visual",
            type: "image",
            src: imgUrl,
            alt: slide.title,
            objectFit: "cover",
            position: { x: 220, y: 180, width: 560, height: 350, rotation: 0 },
            style: { borderRadius: 16, shadow: true },
            animation: { type: "zoom", duration: 0.6, delay: 0.2 },
            locked: false,
            visible: true,
            zIndex: slide.elements.length + 1,
          });
          toast.dismiss();
          toast.success("Inserted AI Content Visual!");
          reply = `🖼️ Generated and inserted AI Visual Graphic on slide "${slide.title}"!`;
        }
      }

      // ------------------------------------------------------------------------
      // 9. SPEAKER NOTES
      // ------------------------------------------------------------------------
      else if (lower.includes("speaker") || lower.includes("notes")) {
        if (slide && deck.deck) {
          const notes = await generateSpeakerNotes(deck.deck, deck.deck.slides.indexOf(slide), client());
          deck.updateSlide(slide.id, { notes, speakerNotes: notes });
          reply = `📝 Generated speaker notes for "${slide.title}":\n\n${notes}`;
        } else reply = "Select a slide first.";
      }

      // ------------------------------------------------------------------------
      // 10. OPEN-ENDED AI GATEWAY EDIT COMMANDS
      // ------------------------------------------------------------------------
      else {
        reply = await aiGateway.executeTask(
          "write_content",
          [
            {
              role: "system",
              content:
                "You are the Lumina AI Presentation Copilot. You can edit slides, rewrite text, generate outlines, and offer storytelling advice. Current slide context: " +
                JSON.stringify({ title: slide?.title, elementsCount: slide?.elements.length }),
            },
            { role: "user", content: text },
          ],
          {
            onChunk: (_chunk: string, accumulated: string) => {
              setMsgs((m) => {
                const copy = [...m];
                if (copy[copy.length - 1]?.role === "ai" && copy.length > 1) {
                  copy[copy.length - 1].text = accumulated;
                } else {
                  copy.push({ role: "ai", text: accumulated });
                }
                return copy;
              });
            },
          }
        );
        setBusy(false);
        return;
      }

      setMsgs((m) => [...m, { role: "ai", text: reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "ai", text: `⚠️ Error: ${e.message ?? "Failed to process request."}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 z-[150] flex h-full w-[380px] max-w-[94vw] flex-col border-l border-white/10 bg-[#0d1017]/95 backdrop-blur-2xl animate-slide-in-right shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-glow">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">AI Copilot</span>
            <span className="ml-2 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-indigo-300 border border-indigo-500/30">
              Prompt Editor
            </span>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <SegmentedControl
        className="m-3"
        options={[{ value: "chat", label: "Chat & Actions" }, { value: "settings", label: "AI Model Settings" }]}
        value={tab}
        onChange={(v) => setTab(v as any)}
      />

      {tab === "chat" ? (
        <>
          {/* Chat Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                      : "rounded-bl-sm glass text-slate-200 border border-white/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-indigo-300">
                <Sparkles size={13} className="animate-spin text-indigo-400" />
                <span>Copilot is updating your presentation…</span>
              </div>
            )}
          </div>

          {/* Quick Action Prompt Pills */}
          <div className="border-t border-white/10 p-3 bg-slate-950/40">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {[
                { label: "➕ New Slide", prompt: "Create a slide about Market Opportunities" },
                { label: "✍️ Rewrite Slide", prompt: "Rewrite and polish this slide copy" },
                { label: "📊 Add Chart", prompt: "Add a bar chart showing quarterly performance" },
                { label: "🎨 Layout Cards", prompt: "Change layout to cards" },
                { label: "🖼️ AI Image", prompt: "Add an image visual for this topic" },
                { label: "📝 Notes", prompt: "Generate speaker notes" },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => sendPrompt(pill.prompt)}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-200 transition-all disabled:opacity-50"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Prompt Input Box */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendPrompt()}
                placeholder="Type command (e.g. 'Add slide about Market Strategy')…"
                className="text-xs"
              />
              <Button size="icon" onClick={() => sendPrompt()} disabled={busy}>
                <Send size={14} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Settings Tab */
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div>
            <Label>Model provider</Label>
            <select
              value={settings.provider}
              onChange={(e) => settings.setProvider(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Model</Label>
            <select
              value={settings.model}
              onChange={(e) => settings.setModel(e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
            >
              {(PROVIDERS.find((p) => p.id === settings.provider)?.models ?? []).map((m) => (
                <option key={m} value={m} className="bg-slate-900">{m}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>API key (stored locally in your browser)</Label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) => settings.setApiKey(e.target.value)}
              placeholder="sk-…"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Base URL (optional override)</Label>
            <Input value={settings.baseUrl} onChange={(e) => settings.setBaseUrl(e.target.value)} placeholder="https://…" className="mt-1" />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Keys never leave your browser. With no key set, Lumina uses its built-in offline engine.
          </p>
        </div>
      )}
    </div>
  );
}
