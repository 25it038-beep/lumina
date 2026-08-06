"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/25 border border-white/10",
  secondary: "bg-white/8 text-slate-200 hover:bg-white/14 border border-white/10 backdrop-blur",
  ghost: "text-slate-300 hover:bg-white/8 hover:text-white",
  danger: "bg-rose-500/90 text-white hover:bg-rose-500 border border-rose-400/30",
  outline: "border border-white/15 text-slate-200 hover:bg-white/8 bg-transparent",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
  icon: "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", iconOnly, children, ...props }, ref) => (
    <button
      ref={ref}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        iconOnly && "px-0",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export const GlassPanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-glass",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassPanel.displayName = "GlassPanel";

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => (
    <Button ref={ref} size="icon" variant="ghost" className={cn("rounded-lg", className)} {...props}>
      {children}
    </Button>
  )
);
IconButton.displayName = "IconButton";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      suppressHydrationWarning
      className={cn(
        "h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      suppressHydrationWarning
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-colors resize-none",
        className
      )}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label ref={ref} className={cn("text-xs font-medium text-slate-400", className)} {...props}>
      {children}
    </label>
  )
);
Label.displayName = "Label";

export interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className }) => (
  <div className={cn("flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5 gap-0.5", className)}>
    {options.map((o) => (
      <button
        key={o.value}
        suppressHydrationWarning
        onClick={() => onChange(o.value)}
        className={cn(
          "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer",
          value === o.value
            ? "bg-indigo-500/80 text-white shadow"
            : "text-slate-400 hover:text-slate-200"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const Slider: React.FC<{
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
}> = ({ value, min = 0, max = 100, step = 1, onChange, label }) => (
  <div className="flex items-center gap-3">
    {label && <span className="text-xs text-slate-400 shrink-0 w-20">{label}</span>}
    <input
      type="range"
      suppressHydrationWarning
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 accent-indigo-500 h-1.5"
    />
    <span className="text-xs text-slate-400 w-10 text-right tabular-nums">{Math.round(value)}</span>
  </div>
);

export const ColorField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label?: string;
}> = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2">
    {label && <span className="text-xs text-slate-400 w-20">{label}</span>}
    <div className="relative h-8 w-9 rounded-md overflow-hidden border border-white/15 bg-white/5">
      <input
        type="color"
        suppressHydrationWarning
        value={value.startsWith("#") ? value : "#6366f1"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <div className="absolute inset-0" style={{ background: value }} />
    </div>
    <input
      suppressHydrationWarning
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 flex-1 rounded-md border border-white/10 bg-white/[0.05] px-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-400/50"
    />
  </div>
);

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("animate-spin", className)}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-indigo-300">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    {description && <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse rounded-lg bg-white/[0.06]", className)} />
);

export const Tooltip: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-[10px] font-medium text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {label}
    </span>
  </span>
);

export const Chip: React.FC<{
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ active, onClick, children, className }) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-all cursor-pointer",
      active
        ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-200"
        : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]",
      className
    )}
  >
    {children}
  </button>
);

export const Divider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("h-px w-full bg-white/[0.07]", className)} />
);

export const Badge: React.FC<{
  tone?: "indigo" | "green" | "amber" | "rose" | "slate";
  children: React.ReactNode;
  className?: string;
}> = ({ tone = "indigo", children, className }) => {
  const tones = {
    indigo: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200",
    green: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    slate: "border-white/10 bg-white/[0.06] text-slate-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
};

export const Card: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}> = ({ title, description, children, className, actions }) => (
  <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-4", className)}>
    {(title || actions) && (
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);

export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cn(
      "inline-flex items-center gap-2.5 disabled:opacity-40 cursor-pointer",
      label && "text-xs text-slate-300"
    )}
  >
    <span
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-indigo-500" : "bg-white/10 border border-white/15"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-4"
        )}
      />
    </span>
    {label}
  </button>
);

export const Progress: React.FC<{
  value: number;
  className?: string;
  barClassName?: string;
}> = ({ value, className, barClassName }) => (
  <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]", className)}>
    <div
      className={cn("h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all duration-300", barClassName)}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; badge?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className }) => (
  <div className={cn("flex gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5", className)}>
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
          active === t.id
            ? "bg-indigo-500/80 text-white shadow"
            : "text-slate-400 hover:text-slate-200"
        )}
      >
        {t.icon}
        {t.label}
        {t.badge}
      </button>
    ))}
  </div>
);

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, description, children, footer, width = "max-w-md" }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn("w-full rounded-2xl border border-white/10 bg-[#12141d] shadow-2xl animate-pop-in", width)}>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-100">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-white/[0.07] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Accordion: React.FC<{
  items: { id: string; title: React.ReactNode; content: React.ReactNode }[];
  defaultOpen?: string[];
}> = ({ items, defaultOpen = [] }) => {
  const [open, setOpen] = React.useState<string[]>(defaultOpen);
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
            <button
              onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== item.id) : [...o, item.id]))}
              className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.04]"
            >
              {item.title}
              <span className={cn("text-slate-500 transition-transform", isOpen && "rotate-180")}>▾</span>
            </button>
            {isOpen && <div className="border-t border-white/[0.06] px-3.5 py-3">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};

export const Kbd: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <kbd
    className={cn(
      "inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/15 bg-white/[0.06] px-1.5 text-[10px] font-semibold text-slate-300",
      className
    )}
  >
    {children}
  </kbd>
);
