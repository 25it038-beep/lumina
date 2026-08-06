"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b0d12] p-6 text-center text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-4 shadow-lg shadow-rose-900/30">
        <AlertTriangle size={28} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white">Something went wrong!</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
        {error.message || "An unexpected runtime error occurred."}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button onClick={() => reset()} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
          <RefreshCw size={15} /> Try Again
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}
