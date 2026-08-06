"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeckStore } from "@/stores/deckStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { getTheme, THEMES } from "@/lib/themes";
import { TEMPLATES } from "@/lib/templates";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Plus, Trash2, MoreHorizontal, Clock, ArrowRight, Wand2,
  Download, Copy, Play, Settings, ChevronRight, Palette, Star, Search, LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui";
import { toast } from "sonner";
import { exportDeck } from "@/lib/export";
import { UserButton, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { scopedKeyFor } from "@/lib/auth/storage";
import { FirstLoginModal } from "@/components/auth/FirstLoginModal";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  const router = useRouter();
  const { deck, history, setDeck } = useDeckStore();
  const settings = useSettingsStore();
  const { user } = useUser();
  const [recentDecks, setRecentDecks] = useState<{ id: string; title: string; theme: string; slides: number; updatedAt: number; topic: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(scopedKeyFor("lumina-decks", user?.id));
      if (raw) {
        const data = JSON.parse(raw);
        const state = data?.state;
        const d = state?.deck;
        if (d) {
          setRecentDecks([{
            id: d.id,
            title: d.title,
            theme: d.themeId,
            slides: d.slides?.length ?? 0,
            updatedAt: d.updatedAt ?? Date.now(),
            topic: d.topic ?? "",
          }]);
        }
      }
    } catch { /* ignore */ }
  }, [user?.id]);

  const openDeck = () => {
    if (deck) router.push(`/editor/${deck.id}`);
  };

  const quickStart = (topic: string) => {
    settings.addRecentTopic(topic);
    router.push("/create");
  };

  return (
    <div className="min-h-screen">
      <div className="aurora-bg"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        {/* Nav */}
        <nav className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Lumina" className="h-9 w-9 rounded-xl object-cover shadow-glow" />
            <span className="text-lg font-bold tracking-tight text-white">Lumina</span>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
              AI Presentations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => router.push("/create")}>
              <Wand2 size={14} /> New
            </Button>
            <a href="#settings">
              <Button size="sm" variant="ghost"><Settings size={14} /></Button>
            </a>
            <UserButton />
          </div>
        </nav>

        {/* Hero */}
        <section className="mt-14 text-center">
          <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
            Presentations that{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              design themselves
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
            Tell Lumina what you want to present. It researches the web, plans the structure,
            writes the content, and designs every slide — charts, diagrams, themes and animations included.
          </p>

          {/* Prompt bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-2xl">
              <Sparkles size={18} className="ml-3 shrink-0 text-indigo-300" />
              <input
                suppressHydrationWarning
                placeholder="Build a 20-slide presentation about Artificial Intelligence in Healthcare…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    settings.addRecentTopic(e.currentTarget.value);
                    router.push("/create");
                  }
                }}
              />
              <Button size="sm" className="shrink-0" onClick={() => router.push("/create")}>
                Generate <ArrowRight size={13} />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <span className="mr-1">Sources:</span>
              {["PDF", "DOCX", "PPTX", "URL", "YouTube", "CSV", "Markdown", "Images", "Research papers"].map((s) => (
                <span key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5">{s}</span>
              ))}
            </div>
          </div>

          {/* Quick start topics */}
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🧠", title: "AI in Healthcare", desc: "Trends, use cases & ethics" },
              { icon: "🚀", title: "Startup Pitch", desc: "Market, model, roadmap" },
              { icon: "🌱", title: "Climate Action", desc: "Data & solutions" },
              { icon: "💼", title: "Business Strategy", desc: "SWOT, goals, execution" },
            ].map((q) => (
              <button
                suppressHydrationWarning
                key={q.title}
                onClick={() => quickStart(q.title)}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-indigo-400/50 hover:bg-white/[0.06]"
              >
                <div className="text-2xl">{q.icon}</div>
                <div className="mt-2 text-sm font-semibold text-slate-200 group-hover:text-white">{q.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{q.desc}</div>
              </button>
            ))}
          </div>

          {/* DeepSeek + LLaMA Content OS Card Banner */}
          <div className="mx-auto mt-6 max-w-4xl cursor-pointer rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950 p-5 shadow-2xl transition-all hover:border-indigo-400 hover:scale-[1.01]" onClick={() => router.push("/hybrid-writer")}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-900/60">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">DeepSeek + LLaMA Content Operating System</h3>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-500/40">13-Agent Engine</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">Combine DeepSeek R1 deep reasoning logic with Meta LLaMA 3.3 tone synthesis, block editor, live quality HUD, and fact checker.</p>
                </div>
              </div>
              <Button size="sm" className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white">
                Launch Writer OS <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </section>

        {/* Recent decks */}
        {deck && (
          <section className="mt-20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent presentations</h2>
              <button suppressHydrationWarning onClick={openDeck} className="flex cursor-pointer items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200">
                Continue editing <ChevronRight size={13} />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DeckCard deck={deck} onOpen={openDeck} onDelete={() => useDeckStore.getState().clear()} />
              {recentDecks.length > 0 && recentDecks[0].id !== deck.id && (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/15 p-6 text-xs text-slate-500">
                  <Plus size={14} className="mr-1" /> Imported decks appear here
                </div>
              )}
            </div>
          </section>
        )}

        {/* Templates */}
        <section className="mt-20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutTemplate size={15} className="text-indigo-300" />
              <h2 className="text-lg font-semibold text-white">Start from a template</h2>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">8 templates</span>
            </div>
            <button
              suppressHydrationWarning
              onClick={() => router.push("/create")}
              className="flex cursor-pointer items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200"
            >
              Start blank <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((tpl) => {
              const theme = getTheme(tpl.themeId);
              const startFromTemplate = () => {
                router.push(`/create?template=${tpl.id}`);
              };
              return (
                <div
                  key={tpl.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10"
                  onClick={startFromTemplate}
                >
                  <div className="relative h-32" style={{ background: theme.gradient }}>
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-95">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="glass w-16 rounded-lg p-2"
                          style={{ transform: `rotate(${(i - 1) * 5}deg) translateY(${(i - 1) * 5}px)` }}
                        >
                          <div className="h-1.5 w-3/4 rounded-full" style={{ background: theme.text, opacity: 0.9 }} />
                          <div className="mt-2 h-1 w-full rounded-full" style={{ background: theme.text, opacity: 0.4 }} />
                          <div className="mt-1 h-1 w-5/6 rounded-full" style={{ background: theme.text, opacity: 0.4 }} />
                          <div className="mt-1.5 mx-auto h-4 w-4 rounded" style={{ background: theme.primary, opacity: 0.9 }} />
                        </div>
                      ))}
                    </div>
                    <span className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-black/30 text-base backdrop-blur">
                      {tpl.emoji}
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
                      {tpl.slides.length} slides · {theme.name}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-sm font-semibold text-slate-100">{tpl.name}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{tpl.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                        <Palette size={10} className="text-indigo-300" /> For {tpl.audience}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-300 opacity-0 transition-opacity group-hover:opacity-100">
                        Use template →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Design systems */}
        <section className="mt-20">
          <div className="mb-4 flex items-center gap-2">
            <Palette size={15} className="text-indigo-300" />
            <h2 className="text-lg font-semibold text-white">Design systems</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {THEMES.map((t) => {
              const fav = settings.favorites.includes(t.id);
              return (
                <div
                  key={t.id}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/10 transition-all hover:border-indigo-400/50"
                  onClick={() => {
                    settings.setDefaultTheme(t.id);
                    router.push(`/create?theme=${t.id}`);
                  }}
                >
                  <div className="relative h-24" style={{ background: t.gradient }}>
                    <div className="absolute inset-0 flex items-center p-2.5">
                      <div className="glass h-16 w-full rounded-lg p-2">
                        <div className="h-1.5 w-2/3 rounded-full" style={{ background: t.text, opacity: 0.9 }} />
                        <div className="mt-1.5 h-1 w-1/2 rounded-full" style={{ background: t.text, opacity: 0.5 }} />
                        <div className="mt-1 h-1 w-1/3 rounded-full" style={{ background: t.text, opacity: 0.3 }} />
                      </div>
                    </div>
                    <button
                      suppressHydrationWarning
                      onClick={(e) => { e.stopPropagation(); settings.toggleFavorite(t.id); }}
                      className="absolute right-1.5 top-1.5 cursor-pointer rounded-full bg-black/30 p-1 backdrop-blur transition-opacity opacity-0 group-hover:opacity-100"
                      title="Favorite"
                    >
                      <Star size={11} className={fav ? "fill-amber-400 text-amber-400" : "text-white/80"} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <span className="text-[11px] font-medium text-slate-300">{t.name}</span>
                    {fav && <Star size={9} className="fill-amber-400 text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature strip */}
        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Search size={16} />, title: "AI Research Engine", desc: "Web search, citations, dedup, fact checks" },
            { icon: <LayoutTemplate size={16} />, title: "40+ Smart Layouts", desc: "Charts, timelines, SWOT, architecture…" },
            { icon: <Palette size={16} />, title: "20 Design Systems", desc: "Corporate to cyberpunk, light & dark" },
            { icon: <Play size={16} />, title: "Present Like a Pro", desc: "Presenter view, notes, timer, laser, drawing" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-200">{f.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{f.desc}</div>
            </div>
          ))}
        </section>

        {/* Settings */}
        <section id="settings" className="mt-20">
          <h2 className="mb-4 text-lg font-semibold text-white">AI engine</h2>
          <div className="glass max-w-3xl rounded-2xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Provider</label>
                <select
                  suppressHydrationWarning
                  value={settings.provider}
                  onChange={(e) => settings.setProvider(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
                >
                  <option value="local" className="bg-slate-900">Lumina Engine (offline, free)</option>
                  <option value="openai" className="bg-slate-900">OpenAI (GPT-4o)</option>
                  <option value="anthropic" className="bg-slate-900">Anthropic (Claude)</option>
                  <option value="gemini" className="bg-slate-900">Google (Gemini)</option>
                  <option value="openrouter" className="bg-slate-900">OpenRouter (Llama, Qwen, Mistral…)</option>
                  <option value="deepseek" className="bg-slate-900">DeepSeek</option>
                  <option value="ollama" className="bg-slate-900">Ollama (local models)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Model</label>
                <select
                  suppressHydrationWarning
                  value={settings.model}
                  onChange={(e) => settings.setModel(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
                >
                  {{
                    local: ["lumina-local-v1"],
                    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
                    anthropic: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"],
                    gemini: ["gemini-2.5-pro", "gemini-2.5-flash"],
                    openrouter: ["openai/gpt-4o", "anthropic/claude-sonnet-4-5", "meta-llama/llama-3.3-70b-instruct", "qwen/qwen-2.5-72b-instruct", "mistralai/mistral-large"],
                    deepseek: ["deepseek-chat", "deepseek-reasoner"],
                    ollama: ["llama3.3", "qwen2.5", "mistral", "gemma2"],
                  }[settings.provider]?.map((m) => (
                    <option key={m} value={m} className="bg-slate-900">{m}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">API key (optional — stored only in this browser)</label>
                <input
                  suppressHydrationWarning
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) => settings.setApiKey(e.target.value)}
                  placeholder="sk-…"
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-400/50"
                />
                <p className="mt-2 text-[11px] text-slate-500">
                  No key? No problem — the built-in offline engine generates complete decks for any topic.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
      <FirstLoginModal />
    </div>
  );
}

function DeckCard({ deck, onOpen, onDelete }: { deck: any; onOpen: () => void; onDelete: () => void }) {
  const theme = getTheme(deck.themeId);
  const router = useRouter();
  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/10">
      <div
        className="relative h-36 cursor-pointer"
        style={{ background: theme.gradient }}
        onClick={onOpen}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-90">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass h-24 w-16 rounded-lg p-2" style={{ transform: `rotate(${(i - 1) * 4}deg) translateY(${(i - 1) * 4}px)` }}>
              <div className="h-1.5 w-3/4 rounded-full" style={{ background: theme.text, opacity: 0.9 }} />
              <div className="mt-2 h-1 w-full rounded-full" style={{ background: theme.text, opacity: 0.4 }} />
              <div className="mt-1 h-1 w-5/6 rounded-full" style={{ background: theme.text, opacity: 0.4 }} />
              <div className="mt-1 h-1 w-2/3 rounded-full" style={{ background: theme.text, opacity: 0.4 }} />
            </div>
          ))}
        </div>
        <button
          suppressHydrationWarning
          onClick={(e) => { e.stopPropagation(); router.push(`/present/${deck.id}`); }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-black/60 p-2.5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
          title="Present"
        >
          <Play size={15} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-100">{deck.title}</h3>
          <button suppressHydrationWarning onClick={onDelete} className="cursor-pointer rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {timeAgo(deck.updatedAt)}
          </span>
          <span>{deck.slides?.length ?? 0} slides · <span className="capitalize">{theme.name}</span></span>
        </div>
        <div className="mt-3 flex gap-1.5">
          <button suppressHydrationWarning onClick={onOpen} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 text-[11px] text-slate-300 hover:bg-white/8 transition-colors">
            <Wand2 size={11} /> Edit
          </button>
          <button
            suppressHydrationWarning
            onClick={() => exportDeck(deck, "pptx")}
            className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 px-2.5 text-[11px] text-slate-300 hover:bg-white/8 transition-colors"
            title="Export PPTX"
          >
            <Download size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
