"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0d12] font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white">Critical Error</h2>
          <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
            {error.message || "A critical error occurred. Please refresh the page."}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
