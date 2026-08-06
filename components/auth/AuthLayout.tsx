import { Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0b0d12]">
      <div className="aurora-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 dot-grid opacity-40" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="animate-slide-up flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Lumina</span>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
            AI Presentations
          </span>
        </div>

        <div className="mt-8 w-full max-w-md animate-scale-in rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-400/40 hover:shadow-glow">
          {children}
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}