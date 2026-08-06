export function Footer() {
  return (
    <footer className="mt-24 flex flex-col items-center gap-2 border-t border-white/5 pt-8 text-center">
      <p className="text-xs text-slate-600">
        Join with us to explore more innovative ideas with AI-powered solutions —{" "}
        <a
          href="https://hs-ai-studio.onrender.com/#solutions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-300 underline-offset-4 transition-colors hover:text-indigo-200 hover:underline"
        >
          HS AI Studio
        </a>
      </p>
      <div className="flex gap-4 text-[11px] text-slate-600">
        <span>© {new Date().getFullYear()} HS AI Ecosystem. All rights reserved.</span>
      </div>
    </footer>
  );
}
