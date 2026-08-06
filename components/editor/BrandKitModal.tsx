"use client";

import { useState } from "react";
import { ShieldCheck, Check } from "lucide-react";
import { useDeckStore } from "@/stores/deckStore";
import { DEFAULT_BRAND_KIT, createThemeFromBrandKit, BrandKit } from "@/lib/ai/brandKit";
import { Button, Input, Label, Slider, Modal } from "@/components/ui";
import { toast } from "sonner";

interface BrandKitModalProps {
  open: boolean;
  onClose: () => void;
}

export function BrandKitModal({ open, onClose }: BrandKitModalProps) {
  const applyTheme = useDeckStore((s) => s.applyTheme);
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND_KIT);

  const saveBrandKit = () => {
    const brandTheme = createThemeFromBrandKit(brand);
    // Custom theme apply
    applyTheme(brandTheme.id);
    toast.success(`Brand Kit for "${brand.companyName}" applied across presentation!`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enterprise Brand Kit"
      description="Logo, color tokens, and corporate font system"
      width="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveBrandKit}>
            <Check size={14} /> Apply Brand Kit
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-slate-200">
        <div>
          <Label>Company / Brand Name</Label>
          <Input
            value={brand.companyName}
            onChange={(e) => setBrand({ ...brand, companyName: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Primary Brand Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={brand.primaryColor}
                onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15"
              />
              <Input
                value={brand.primaryColor}
                onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <Label>Secondary Color</Label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={brand.secondaryColor}
                onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })}
                className="h-8 w-10 cursor-pointer rounded bg-transparent border border-white/15"
              />
              <Input
                value={brand.secondaryColor}
                onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Logo Image URL</Label>
          <Input
            value={brand.logoUrl}
            onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
            className="mt-1"
          />
        </div>

        <Slider
          label="Card Corner Radius"
          value={brand.borderRadius}
          min={4}
          max={32}
          onChange={(v) => setBrand({ ...brand, borderRadius: v })}
        />
      </div>
    </Modal>
  );
}
