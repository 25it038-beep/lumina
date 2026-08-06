"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useDeckStore } from "@/stores/deckStore";
import { useUIStore } from "@/stores/uiStore";
import { useAutosave } from "@/hooks/useAutosave";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { SlidesPanel, LayersPanel } from "@/components/editor/SlidesPanel";
import { Ribbon } from "@/components/editor/Ribbon";
import { SlideSorterView } from "@/components/editor/SlideSorterView";
import { OutlineView } from "@/components/editor/OutlineView";
import { NotesPane } from "@/components/editor/NotesPane";
import { CommandPalette } from "@/components/editor/CommandPalette";
import { CollaborationBar } from "@/components/editor/CollaborationBar";
import { AIAssistant } from "@/components/editor/AIAssistant";
import { EditorTutorial, START_TOUR_EVENT } from "@/components/editor/EditorTutorial";
import { ElementTutorialModal } from "@/components/editor/ElementTutorialModal";
import { GraduationCap, HelpCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { isNewAccount, isTutorialSeen, markTutorialSeen, TUTORIAL_FLAGS } from "@/lib/auth/tutorial";

import { ElementSpotlightTour, START_ELEMENT_TOUR_EVENT } from "@/components/editor/ElementSpotlightTour";

// Lazy-loaded panels — only fetched when their tab/overlay first opens (Phase 12: code splitting).
const InspectorPanel = dynamic(() => import("@/components/editor/InspectorPanel").then((m) => m.InspectorPanel), { ssr: false });
const AssetLibrary = dynamic(() => import("@/components/editor/AssetLibrary").then((m) => m.AssetLibrary), { ssr: false });
const AICoachPanel = dynamic(() => import("@/components/editor/AICoachPanel").then((m) => m.AICoachPanel), { ssr: false });
const CommentsPanel = dynamic(() => import("@/components/editor/CommentsPanel").then((m) => m.CommentsPanel), { ssr: false });
const VersionHistoryPanel = dynamic(() => import("@/components/editor/VersionHistoryPanel").then((m) => m.VersionHistoryPanel), { ssr: false });
const AISettingsPanel = dynamic(() => import("@/components/editor/AISettingsPanel").then((m) => m.AISettingsPanel), { ssr: false });
const CustomThemeModal = dynamic(() => import("@/components/editor/CustomThemeModal").then((m) => m.CustomThemeModal), { ssr: false });
const BrandKitModal = dynamic(() => import("@/components/editor/BrandKitModal").then((m) => m.BrandKitModal), { ssr: false });
const AIMediaGenerators = dynamic(() => import("@/components/editor/AIMediaGenerators").then((m) => m.AIMediaGenerators), { ssr: false });
const PresentationPlayer = dynamic(() => import("@/components/present/PresentationPlayer").then((m) => m.PresentationPlayer), { ssr: false });

const LEFT_TABS = [
  { id: "slides", label: "Slides" },
  { id: "layers", label: "Layers" },
  { id: "assets", label: "Assets" },
] as const;

const RIGHT_TABS = [
  { id: "inspector", label: "Design" },
  { id: "themes", label: "Themes" },
  { id: "coach", label: "AI Coach" },
  { id: "gateway", label: "AI Gateway" },
  { id: "comments", label: "Comments" },
  { id: "history", label: "History" },
] as const;

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const deck = useDeckStore((s) => s.deck);
  const mode = useUIStore((s) => s.mode);
  const showLeft = useUIStore((s) => s.showLeftPanel);
  const showRight = useUIStore((s) => s.showRightPanel);
  const leftPanel = useUIStore((s) => s.leftPanel);
  const rightPanel = useUIStore((s) => s.rightPanel);
  const setLeftPanel = useUIStore((s) => s.setLeftPanel);
  const setRightPanel = useUIStore((s) => s.setRightPanel);
  const toggleLeft = useUIStore((s) => s.toggleLeftPanel);
  const toggleRight = useUIStore((s) => s.toggleRightPanel);

  const [customThemeOpen, setCustomThemeOpen] = useState(false);
  const [brandKitOpen, setBrandKitOpen] = useState(false);
  const [mediaGenMode, setMediaGenMode] = useState<"image" | "chart" | "diagram" | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [elementTutorialOpen, setElementTutorialOpen] = useState(false);
  const { user } = useUser();
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  useAutosave(true);
  useGlobalShortcuts();

  useEffect(() => {
    if (deck && deck.id !== params.id) {
      router.replace(`/editor/${deck.id}`);
    }
  }, [deck?.id, params.id]);

  useEffect(() => {
    // Show the element tutorial only to new accounts that haven't seen it —
    // the seen flag is stored on the account, so existing users never get it
    // again (even after clearing browser storage or switching devices).
    if (!user) return;
    if (!isNewAccount(user)) return;
    if (!isTutorialSeen(user, TUTORIAL_FLAGS.element)) {
      setElementTutorialOpen(true);
    }
  }, [user?.id]);

  if (!deck) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#0b0d12]">
        <div className="skeleton h-24 w-96 rounded-2xl" />
        <div className="skeleton h-12 w-64 rounded-xl" />
        <p className="text-sm text-slate-500">No presentation found. <a href="/" className="text-indigo-400 hover:underline">Create one →</a></p>
      </div>
    );
  }

  if (mode === "present") {
    return (
      <>
        <PresentationPlayer />
        <CommandPalette />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0b0d12] text-slate-200">
      <EditorToolbar
        onOpenCustomTheme={() => setCustomThemeOpen(true)}
        onOpenMediaGen={(m) => setMediaGenMode(m)}
      />
      <Ribbon
        view={view}
        onViewChange={setView}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((v) => !v)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onOpenMediaGen={(m) => setMediaGenMode(m)}
      />

      {view === "sorter" ? (
        <SlideSorterView />
      ) : view === "outline" ? (
        <OutlineView />
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {showLeft && (
            <aside data-tour="slides-panel" className="flex w-[260px] shrink-0 flex-col border-r border-white/8 bg-white/[0.02]">
              <div data-tour="left-tabs" className="flex gap-1 border-b border-white/8 p-2">
                {LEFT_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLeftPanel(t.id as any)}
                    className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      leftPanel === t.id ? "bg-indigo-500/20 text-indigo-100" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {leftPanel === "slides" ? (
                  <SlidesPanel />
                ) : leftPanel === "layers" ? (
                  <LayersPanel />
                ) : (
                  <AssetLibrary />
                )}
              </div>
            </aside>
          )}

          <main data-tour="canvas" className="relative flex-1 overflow-hidden">
            <EditorCanvas showGrid={showGrid} />
          </main>

          {showRight && (
            <aside data-tour="right-panel" className="flex w-[300px] shrink-0 flex-col border-l border-white/8 bg-white/[0.02]">
              <div data-tour="right-tabs" className="flex gap-1 border-b border-white/8 p-1.5 overflow-x-auto">
                {RIGHT_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRightPanel(t.id as any)}
                    className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      rightPanel === t.id ? "bg-indigo-500/20 text-indigo-100" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {rightPanel === "inspector" || rightPanel === "themes" || rightPanel === "layout" ? (
                  <InspectorPanel />
                ) : rightPanel === "coach" ? (
                  <AICoachPanel />
                ) : rightPanel === "gateway" ? (
                  <AISettingsPanel />
                ) : rightPanel === "comments" ? (
                  <CommentsPanel />
                ) : (
                  <VersionHistoryPanel />
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {showNotes && <NotesPane />}

      <footer data-tour="footer" className="flex h-7 shrink-0 items-center gap-3 border-t border-white/8 bg-white/[0.02] px-3 text-[10px] text-slate-500">
        <span className="font-medium text-slate-400">Lumina</span>
        <span>{deck.slides.length} slides</span>
        <span className="capitalize">{deck.themeId} theme</span>
        <CollaborationBar />
        <span className="flex-1" />
        <span>View: <span className="text-slate-300">{view}</span></span>
        <span className="hidden lg:inline">Ctrl+K — commands</span>
        <span className="hidden lg:inline">Ctrl+/ — AI</span>
        <span className="text-indigo-300/80">16:9</span>
        <button
          onClick={() => window.dispatchEvent(new Event(START_ELEMENT_TOUR_EVENT))}
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-emerald-300/90 transition-colors hover:bg-emerald-500/15 hover:text-emerald-200"
          title="Spotlight tour of elements on active slide"
        >
          <Sparkles size={11} /> Spotlight Tour
        </button>
        <button
          onClick={() => setElementTutorialOpen(true)}
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-indigo-300/90 transition-colors hover:bg-indigo-500/15 hover:text-indigo-200"
          title="Open Element Guide Tutorial"
        >
          <HelpCircle size={11} /> Element Guide
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event(START_TOUR_EVENT))}
          className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-indigo-300/90 transition-colors hover:bg-indigo-500/15 hover:text-indigo-200"
        >
          <GraduationCap size={11} /> Tour
        </button>
      </footer>

      <CommandPalette />
      <AIAssistant />
      <EditorTutorial />
      <ElementSpotlightTour />
      <ElementTutorialModal
        isOpen={elementTutorialOpen}
        onClose={() => {
          markTutorialSeen(user, TUTORIAL_FLAGS.element);
          setElementTutorialOpen(false);
        }}
      />
      <CustomThemeModal open={customThemeOpen} onClose={() => setCustomThemeOpen(false)} />
      <BrandKitModal open={brandKitOpen} onClose={() => setBrandKitOpen(false)} />
      <AIMediaGenerators mode={mediaGenMode} onClose={() => setMediaGenMode(null)} />
    </div>
  );
}
