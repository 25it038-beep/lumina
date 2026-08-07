"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, LayoutTemplate, FileDown } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui";
import { Footer } from "@/components/Footer";

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useUser();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b0d12]">
      <div className="aurora-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 dot-grid opacity-40" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo */}
        <div className="animate-scale-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Lumina logo"
            className="mx-auto h-24 w-24 rounded-3xl object-cover shadow-glow ring-1 ring-white/10"
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2.5 animate-slide-up">
          <span className="text-3xl font-extrabold tracking-tight text-white">Lumina</span>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200">
            AI Presentations
          </span>
        </div>

        <p className="mt-8 text-xl font-medium leading-relaxed text-slate-200 animate-slide-up sm:text-2xl">
          Welcome,{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {user?.fullName || user?.firstName || user?.username || "creator"}
          </span>
          . Let&apos;s explore the creative mind.
        </p>

        <div className="mx-auto mt-6 max-w-md">
          <div className="border-l-2 border-indigo-400/50 pl-4 text-left">
            <p className="text-sm italic leading-relaxed text-slate-400">
              “Every great presentation begins with a single spark of imagination. Turn your ideas
              into designs that move people.”
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/")}>
            Start creating <ArrowRight size={16} />
          </Button>
          <Button size="lg" variant="secondary" onClick={() => router.push("/create")}>
            <LayoutTemplate size={16} /> New presentation
          </Button>
        </div>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { icon: <Sparkles size={16} />, title: "AI research & design", desc: "Outline, content, charts and themes generated for you." },
            { icon: <LayoutTemplate size={16} />, title: "40+ smart layouts", desc: "Timelines, SWOT, architecture, pricing, metrics and more." },
            { icon: <FileDown size={16} />, title: "Export anywhere", desc: "PPTX, PDF, PNG, SVG, HTML, Reveal or Markdown in one click." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">{f.icon}</div>
              <div className="text-sm font-semibold text-slate-200">{f.title}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}