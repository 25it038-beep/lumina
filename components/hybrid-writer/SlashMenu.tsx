"use client";

import React, { useEffect, useState } from "react";
import {
  Wand2,
  Sparkles,
  FileText,
  CheckCircle,
  Table,
  BookOpen,
  ArrowRight,
  Minimize2,
  Maximize2,
  HelpCircle,
  Briefcase,
  Smile,
  GraduationCap,
  Terminal,
  Target,
  Mail,
  Share2,
  Globe,
  Quote,
  Zap,
} from "lucide-react";

export interface SlashCommandItem {
  command: string;
  label: string;
  description: string;
  category: "AI Action" | "Tone" | "Format" | "Social";
  icon: React.ReactNode;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  { command: "rewrite", label: "/rewrite", description: "Rewrite section for maximum impact", category: "AI Action", icon: <Wand2 className="w-4 h-4 text-purple-400" /> },
  { command: "improve", label: "/improve", description: "Enhance flow, syntax, & vocabulary", category: "AI Action", icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { command: "expand", label: "/expand", description: "Elaborate with deeper analytical detail", category: "AI Action", icon: <Maximize2 className="w-4 h-4 text-blue-400" /> },
  { command: "shorten", label: "/shorten", description: "Trim fluff & condense phrasing", category: "AI Action", icon: <Minimize2 className="w-4 h-4 text-rose-400" /> },
  { command: "summarize", label: "/summarize", description: "Extract executive key takeaways", category: "AI Action", icon: <FileText className="w-4 h-4 text-emerald-400" /> },
  { command: "explain", label: "/explain", description: "Simplify concept with clear analogy", category: "AI Action", icon: <HelpCircle className="w-4 h-4 text-cyan-400" /> },
  { command: "grammar", label: "/grammar", description: "Fix mechanics & syntax errors", category: "AI Action", icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
  { command: "facts", label: "/facts", description: "Verify claims & hallucination risk", category: "AI Action", icon: <CheckCircle className="w-4 h-4 text-sky-400" /> },
  { command: "citations", label: "/citations", description: "Insert inline sources & footnotes", category: "AI Action", icon: <BookOpen className="w-4 h-4 text-indigo-400" /> },
  { command: "table", label: "/table", description: "Convert bullet points into comparison table", category: "Format", icon: <Table className="w-4 h-4 text-teal-400" /> },
  { command: "continue", label: "/continue", description: "Autocomplete next strategic paragraph", category: "AI Action", icon: <Zap className="w-4 h-4 text-yellow-400" /> },

  // Tones
  { command: "professional", label: "/professional", description: "Adopt executive corporate tone", category: "Tone", icon: <Briefcase className="w-4 h-4 text-blue-400" /> },
  { command: "friendly", label: "/friendly", description: "Adopt warm, conversational tone", category: "Tone", icon: <Smile className="w-4 h-4 text-yellow-400" /> },
  { command: "academic", label: "/academic", description: "Adopt formal research paper style", category: "Tone", icon: <GraduationCap className="w-4 h-4 text-purple-400" /> },
  { command: "technical", label: "/technical", description: "Adopt deep system architect tone", category: "Tone", icon: <Terminal className="w-4 h-4 text-emerald-400" /> },
  { command: "marketing", label: "/marketing", description: "Adopt high-converting copy style", category: "Tone", icon: <Target className="w-4 h-4 text-rose-400" /> },

  // Formats
  { command: "email", label: "/email", description: "Format into executive email template", category: "Format", icon: <Mail className="w-4 h-4 text-sky-400" /> },
  { command: "blog", label: "/blog", description: "Format into SEO blog post layout", category: "Format", icon: <FileText className="w-4 h-4 text-indigo-400" /> },
  { command: "linkedin", label: "/linkedin", description: "Transform into viral LinkedIn article", category: "Social", icon: <Share2 className="w-4 h-4 text-blue-500" /> },
  { command: "twitter", label: "/twitter", description: "Convert into high-engagement thread", category: "Social", icon: <Share2 className="w-4 h-4 text-sky-400" /> },
  { command: "translate", label: "/translate", description: "Translate into target language", category: "AI Action", icon: <Globe className="w-4 h-4 text-teal-400" /> },
];

interface SlashMenuProps {
  onSelectCommand: (command: SlashCommandItem) => void;
  onClose: () => void;
}

export function SlashMenu({ onSelectCommand, onClose }: SlashMenuProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = SLASH_COMMANDS.filter(
    (c) => c.command.toLowerCase().includes(search.toLowerCase()) || c.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectCommand(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelectCommand, onClose]);

  return (
    <div className="z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-md">
      <div className="mb-2 px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Slash Command AI Studio</div>
      {filtered.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-slate-400">No command matched</div>
      ) : (
        filtered.map((item, idx) => (
          <button
            key={item.command}
            onClick={() => onSelectCommand(item)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
              idx === selectedIndex ? "bg-indigo-600/30 text-white border border-indigo-500/40" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800/90">{item.icon}</div>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-slate-200">{item.label}</div>
              <div className="truncate text-[11px] text-slate-400">{item.description}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
