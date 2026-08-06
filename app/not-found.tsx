import Link from "next/link";
import { Sparkles, Home, Plus } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0d12] p-6 text-center text-white">
      {/* Aurora background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-160px] left-[-120px] h-[520px] w-[520px] rounded-full opacity-20"
          style={{ background: "#4f46e5", filter: "blur(90px)" }}
        />
        <div
          className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full opacity-15"
          style={{ background: "#a855f7", filter: "blur(90px)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Lumina" className="mb-6 h-16 w-16 rounded-2xl object-cover shadow-glow" />
        <h1 className="text-7xl font-bold tracking-tight text-white">404</h1>
        <h2 className="mt-3 text-2xl font-semibold text-slate-200">Page not found</h2>
        <p className="mt-3 max-w-sm text-sm text-slate-400 leading-relaxed">
          The slide or page you're looking for doesn't exist or was moved. Let's get you back on track.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-400 transition-all"
          >
            <Home size={15} /> Back to Home
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
          >
            <Plus size={15} /> New Presentation
          </Link>
        </div>
      </div>
    </div>
  );
}
