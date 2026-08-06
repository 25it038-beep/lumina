"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2, User, CornerDownRight } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { Button, Input, Divider } from "@/components/ui";
import { toast } from "sonner";

interface CommentThread {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;
  resolved: boolean;
  replies: { author: string; text: string; timestamp: string }[];
}

export function CommentsPanel() {
  const deck = useDeckStore((s) => s.deck);
  const activeSlideId = useUIStore((s) => s.activeSlideId);
  const [threads, setThreads] = useState<CommentThread[]>([
    {
      id: "c1",
      author: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      text: "@Sarah check the market growth metrics on this slide — should we use 37% or 40%?",
      timestamp: "10m ago",
      resolved: false,
      replies: [
        { author: "Sarah Jenkins", text: "37% is accurate per the McKinsey 2025 report!", timestamp: "5m ago" },
      ],
    },
    {
      id: "c2",
      author: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      text: "The glassmorphism theme on this slide looks super clean! 🔥",
      timestamp: "1h ago",
      resolved: true,
      replies: [],
    },
  ]);

  const [input, setInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  if (!deck || !activeSlideId) return null;
  const slide = deck.slides.find((s) => s.id === activeSlideId);

  const addComment = () => {
    if (!input.trim()) return;
    const newThread: CommentThread = {
      id: `c-${Date.now()}`,
      author: "You",
      text: input.trim(),
      timestamp: "Just now",
      resolved: false,
      replies: [],
    };
    setThreads([newThread, ...threads]);
    setInput("");
    toast.success("Comment posted");
  };

  const addReply = (threadId: string) => {
    const text = replyInputs[threadId]?.trim();
    if (!text) return;
    setThreads(
      threads.map((t) =>
        t.id === threadId
          ? { ...t, replies: [...t.replies, { author: "You", text, timestamp: "Just now" }] }
          : t
      )
    );
    setReplyInputs({ ...replyInputs, [threadId]: "" });
    toast.success("Reply added");
  };

  const toggleResolve = (threadId: string) => {
    setThreads(
      threads.map((t) => (t.id === threadId ? { ...t, resolved: !t.resolved } : t))
    );
  };

  return (
    <div className="flex h-full flex-col p-4 space-y-4 overflow-y-auto text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Slide Comments & Mentions
          </h3>
        </div>
        <span className="text-[10px] text-slate-400">{threads.filter((t) => !t.resolved).length} active</span>
      </div>

      {/* New Comment Input */}
      <div className="space-y-2">
        <Input
          placeholder="Add a comment or @mention a team member..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={addComment}>
            <Send size={12} /> Post Comment
          </Button>
        </div>
      </div>

      <Divider />

      {/* Threads list */}
      <div className="space-y-3">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border p-3 space-y-2 transition-all ${
              t.resolved
                ? "border-white/5 bg-white/[0.01] opacity-60"
                : "border-white/10 bg-white/[0.03] shadow-md"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {t.avatar ? (
                  <img src={t.avatar} alt={t.author} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-200">
                    {t.author.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-semibold text-white">{t.author}</span>
                <span className="text-[10px] text-slate-500">{t.timestamp}</span>
              </div>
              <button
                onClick={() => toggleResolve(t.id)}
                className={`cursor-pointer text-[10px] flex items-center gap-1 rounded-full px-2 py-0.5 ${
                  t.resolved ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <CheckCircle2 size={11} /> {t.resolved ? "Resolved" : "Resolve"}
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{t.text}</p>

            {/* Replies */}
            {t.replies.length > 0 && (
              <div className="pl-4 border-l-2 border-indigo-500/30 space-y-2 pt-1">
                {t.replies.map((r, ri) => (
                  <div key={ri} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CornerDownRight size={10} className="text-indigo-400" />
                      <span className="font-medium text-slate-200">{r.author}</span>
                      <span>· {r.timestamp}</span>
                    </div>
                    <p className="text-slate-300 pl-3">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            {!t.resolved && (
              <div className="flex gap-1.5 pt-1">
                <Input
                  placeholder="Reply..."
                  value={replyInputs[t.id] ?? ""}
                  onChange={(e) => setReplyInputs({ ...replyInputs, [t.id]: e.target.value })}
                  className="h-7 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && addReply(t.id)}
                />
                <Button size="sm" variant="secondary" onClick={() => addReply(t.id)}>
                  Reply
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
