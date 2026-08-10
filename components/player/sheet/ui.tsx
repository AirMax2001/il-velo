"use client";
import { useState } from "react";
import { LabelWithGuide } from "@/components/shared/FieldGuide";

export function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const cfg = {
    idle: ["border-white/10 text-white/30", "pronta"],
    saving: ["border-veil-gold/40 text-veil-gold animate-pulse", "salvataggio..."],
    saved: ["border-emerald-400/35 text-emerald-300", "✓ salvata"],
    error: ["border-red-400/35 text-red-300", "errore"],
  }[state];
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cfg[0]}`}>{cfg[1]}</span>;
}

export function CollapseSection({
  title, subtitle, badge, defaultOpen = false, right,
  children,
}: {
  title: React.ReactNode; subtitle?: React.ReactNode; badge?: React.ReactNode;
  defaultOpen?: boolean; right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="veil-panel p-4">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm text-veil-gold/80 font-medium">{title}</h3>
            {badge}
          </div>
          {subtitle && <p className="text-[10px] text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
          <span className={`text-veil-gold/50 text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {open && <div className="mt-3 border-t border-white/[0.05] pt-3">{children}</div>}
    </div>
  );
}

export function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

export function NumberBubbles({
  label, count, filled, onToggle, color = "emerald",
}: { label: string; count: number; filled: number; onToggle: (idx: number) => void; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/30 border-emerald-400/50 text-emerald-200",
    red: "bg-red-500/30 border-red-400/50 text-red-200",
  };
  const filledCls = colorMap[color] || colorMap.emerald;
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => onToggle(i)}
            className={`h-9 w-9 rounded-full border text-sm transition ${i < filled ? filledCls : "border-white/10 text-white/20 hover:border-white/30"}`}>
            {i < filled ? (color === "emerald" ? "✓" : "✕") : "○"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SuggestField({ label, fieldKey, value, suggestions, isTop, onChange, onPick, onBlur }: {
  label: string; fieldKey: string; value: string; suggestions: string[];
  isTop?: boolean; onChange: (v: string) => void; onPick: (v: string) => void; onBlur: () => void;
}) {
  const [showSug, setShowSug] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <LabelWithGuide fieldKey={fieldKey} label={label} />
        {suggestions.length > 0 && (
          <button onClick={() => setShowSug(s => !s)}
            className="text-[10px] text-veil-gold/40 hover:text-veil-gold transition">
            {showSug ? "▲ nascondi" : "💡 suggerimenti"}
          </button>
        )}
      </div>
      {showSug && suggestions.length > 0 && (
        <div className={`absolute ${isTop ? "bottom-full mb-1" : "top-full mt-1"} left-0 right-0 z-10 rounded-xl border border-veil-gold/20 bg-[#0d0a06] p-2 space-y-1`}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => { onChange(s); setShowSug(false); onPick(s); }}
              className="w-full text-left text-[10px] text-white/50 hover:text-white/80 rounded px-2 py-1 hover:bg-white/[0.04] transition">
              {s}
            </button>
          ))}
        </div>
      )}
      <textarea className="veil-input mt-1 w-full min-h-[60px] text-sm"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur} />
    </div>
  );
}