"use client";
import { useState } from "react";
import { getGuide } from "@/lib/fieldGuides";

export function FieldGuide({ fieldKey, className = "" }: { fieldKey: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const guide = getGuide(fieldKey);
  if (!guide) return null;
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-veil-gold/30 text-[9px] text-veil-gold/60 hover:bg-veil-gold/10 hover:text-veil-gold flex-shrink-0"
        title={guide.guide}
      >
        ?
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-56 rounded-xl border border-white/[0.08] bg-black/95 p-3 text-xs text-white/70 shadow-xl backdrop-blur-lg" onClick={() => setOpen(false)}>
          <p className="text-veil-gold/80 font-semibold mb-1">{guide.label}</p>
          <p className="leading-relaxed">{guide.guide}</p>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95" />
        </div>
      )}
    </span>
  );
}

export function LabelWithGuide({ fieldKey, label, className = "" }: { fieldKey: string; label: string; className?: string }) {
  return (
    <label className={`flex items-center text-xs text-white/50 ${className}`}>
      {label}
      <FieldGuide fieldKey={fieldKey} />
    </label>
  );
}
