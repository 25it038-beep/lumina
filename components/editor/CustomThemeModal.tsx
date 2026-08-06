"use client";

import { useState } from "react";
import { Palette, X, Check } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { Button, Input, Label, Slider, Modal } from "@/components/ui";
import { ThemeDefinition } from "@/lib/types";
import { toast } from "sonner";

interface CustomThemeModalProps {
  open: boolean;
  onClose: () => void;
}

export function CustomThemeModal({ open, onClose }: CustomThemeModalProps) {
  const applyTheme = useDeckStore((s) => s.applyTheme);
  const deck = useDeckStore((s) => s.deck);

  const [name, setName] = useState("Custom Brand Theme");
  const [primary, setPrimary] = useState("#6366f1");
  const [secondary, setSecondary] = useState("#ec4899");
  const [accent, setAccent] = useState("#22d3ee");
  const [background, setBackground] = useState("#0b0d12");
  const [surface, setSurface] = useState("#141821");
  const [text, setText] = useState("#f8fafc");
  const [radius, setRadius] = useState(16);
  const [glass, setGlass] = useState(true);

  if (!open) return null;

  const saveCustomTheme = () => {
    const customId = `custom-${Date.now()}`;
    const newTheme: ThemeDefinition = {
      id: customId,
      name,
      category: "modern",
      isDark: true,
      primary,
      secondary,
      accent,
      background,
      surface,
      text,
      textMuted: "#94a3b8",
      border: "rgba(255,255,255,0.15)",
      gradient: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      headingFont: "Inter",
      bodyFont: "Inter",
      iconStyle: "lucide",
      animationStyle: "fade-up",
      spacing: 32,
      radius,
      glass,
    };

    applyTheme(newTheme.id);
    toast.success(`Custom theme "${name}" created and applied!`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Custom Theme"
      width="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={saveCustomTheme}>
            <Check size={14} /> Save & Apply Theme
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-200">
        <div>
          <Label>Theme Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Primary Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15" />
              <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
          </div>

          <div>
            <Label>Secondary Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15" />
              <Input value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
          </div>

          <div>
            <Label>Background Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15" />
              <Input value={background} onChange={(e) => setBackground(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
          </div>

          <div>
            <Label>Surface/Card Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={surface} onChange={(e) => setSurface(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15" />
              <Input value={surface} onChange={(e) => setSurface(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
          </div>
        </div>

        <Slider label="Border Radius" value={radius} min={0} max={32} onChange={(v) => setRadius(v)} />

        {/* Theme Preview Card */}
        <div className="rounded-2xl p-4 border border-white/15 relative overflow-hidden shadow-xl" style={{ backgroundColor: background }}>
          <div className="p-3 rounded-xl border border-white/10" style={{ backgroundColor: surface, borderRadius: radius }}>
            <div className="h-2 w-24 rounded-full" style={{ backgroundColor: primary }} />
            <div className="mt-2 h-1.5 w-16 rounded-full" style={{ backgroundColor: secondary }} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
