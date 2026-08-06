"use client";

import React, { useState, useRef, useEffect } from "react";
import { SlashMenu, SlashCommandItem } from "./SlashMenu";
import { InlineAIToolbar } from "./InlineAIToolbar";
import { Copy, Download, Save, Sparkles, Wand2, RefreshCw, Check, Code, FileText } from "lucide-react";

interface BlockEditorProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  onExecuteSlashCommand: (command: string, selection?: string) => void;
  onExecuteInlineAI: (action: string, text: string) => void;
}

export function BlockEditor({ content, onChangeContent, onExecuteSlashCommand, onExecuteInlineAI }: BlockEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChangeContent(val);

    const cursor = e.target.selectionStart;
    const charBeforeCursor = val.slice(cursor - 1, cursor);
    if (charBeforeCursor === "/") {
      setShowSlashMenu(true);
    } else if (showSlashMenu && !val.includes("/")) {
      setShowSlashMenu(false);
    }
  };

  const handleSelectText = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end) {
      const selected = textareaRef.current.value.slice(start, end);
      setSelectedText(selected);
    } else {
      setSelectedText("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-950/70 rounded-2xl border border-slate-800/90 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Interactive Canvas Editor</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono">
            Type / for AI Commands
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Floating Selection AI Toolbar */}
      {selectedText && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40">
          <InlineAIToolbar selectedText={selectedText} onAction={onExecuteInlineAI} />
        </div>
      )}

      {/* Textarea Editor Canvas */}
      <div className="relative flex-1 p-6 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleSelectText}
          placeholder="Start typing your document or type '/' for AI commands..."
          className="w-full h-full min-h-[480px] bg-transparent text-slate-100 placeholder-slate-400 font-sans text-sm leading-relaxed resize-none focus:outline-none"
        />

        {/* Slash Command Dropdown */}
        {showSlashMenu && (
          <div className="absolute bottom-20 left-10">
            <SlashMenu
              onSelectCommand={(cmd) => {
                setShowSlashMenu(false);
                onExecuteSlashCommand(cmd.command, selectedText);
              }}
              onClose={() => setShowSlashMenu(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
