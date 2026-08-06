"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Sparkles, Type, MousePointerClick, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui";
import { isNewAccount, isTutorialSeen, markTutorialSeen, TUTORIAL_FLAGS } from "@/lib/auth/tutorial";

const STEPS = [
  {
    icon: Type,
    title: "Describe your idea",
    body: "Type a topic on the home screen — “20 slides on AI in healthcare” — Lumina researches the web and plans the structure for you.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Wand2,
    title: "AI designs the deck",
    body: "Outlines, content, charts, diagrams, themes and animations are generated automatically. No slides to build by hand.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: MousePointerClick,
    title: "Edit anything, export anywhere",
    body: "Click or double-click any element — even AI-generated ones — to change it. Export to PPTX or present straight from the browser.",
    color: "from-fuchsia-500 to-pink-500",
  },
];

export function FirstLoginModal() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Existing users never see the welcome tutorial again, and the seen flag
    // is remembered on the account (not just this browser).
    if (!isNewAccount(user)) return;
    if (isTutorialSeen(user, TUTORIAL_FLAGS.firstLogin)) return;
    setOpen(true);
  }, [isLoaded, user?.id]);

  const dismiss = () => {
    setOpen(false);
    markTutorialSeen(user, TUTORIAL_FLAGS.firstLogin);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white">
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-20" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Welcome to Lumina</h2>
              <p className="text-xs text-white/80">{user?.firstName ?? "Let's build something great"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-sm text-slate-400">
            Everything is saved to your account automatically. Here's how it works:
          </p>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${s.color}`}>
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step {i + 1}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{s.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.body}</p>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={dismiss}
              className="cursor-pointer text-xs text-slate-500 transition-colors hover:text-slate-300"
            >
              Skip tutorial
            </button>
            <Button
              size="sm"
              onClick={() => {
                dismiss();
                router.push("/create");
              }}
            >
              Start creating <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}