"use client";
import { useState, useRef, useEffect } from "react";
import { getGuide } from "@/lib/fieldGuides";

export function FieldGuide({ fieldKey, className = "" }: { fieldKey: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const guide = getGuide(fieldKey);
  if (!guide) return null;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => { window.removeEventListener("scroll", handler, true); window.removeEventListener("resize", handler); };
  }, [open]);

  useEffect(() => {
    if (!open || !tipRef.current || !btnRef.current) return;
    const tip = tipRef.current;
    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    tip.style.position = "fixed";
    tip.style.bottom = "";
    tip.style.top = "";
    tip.style.left = "";
    tip.style.right = "";
    if (spaceBelow >= 200 || spaceBelow > spaceAbove) {
      tip.style.top = `${rect.bottom + 6}px`;
    } else {
      tip.style.bottom = `${window.innerHeight - rect.top + 6}px`;
    }
    if (spaceRight >= 240) {
      tip.style.left = `${Math.min(rect.left, window.innerWidth - 320)}px`;
    } else {
      tip.style.right = `${Math.max(0, window.innerWidth - rect.right)}px`;
      tip.style.left = "auto";
    }
  }, [open]);

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-veil-gold/30 text-[9px] text-veil-gold/60 hover:bg-veil-gold/10 hover:text-veil-gold flex-shrink-0"
      >
        ?
      </button>
      {open && (
        <>
          {isMobile ? (
            <div className="fixed inset-0 z-[200] flex items-end justify-center" onClick={() => setOpen(false)}>
              <div className="absolute inset-0 bg-black/60" />
              <div
                className="relative z-10 w-full max-w-lg rounded-t-2xl border border-white/[0.08] bg-[#0a0806] p-5 shadow-xl backdrop-blur-lg max-h-[50vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-veil-gold/50 uppercase tracking-[0.15em]">Guida</p>
                  <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white text-lg">&times;</button>
                </div>
                <p className="text-sm text-veil-gold/90 font-semibold mb-2">{guide.label}</p>
                <p className="text-sm text-white/70 leading-relaxed">{guide.guide}</p>
              </div>
            </div>
          ) : (
            <div ref={tipRef} className="fixed z-50 w-64 rounded-xl border border-white/[0.08] bg-black/95 p-3 text-xs text-white/70 shadow-xl backdrop-blur-lg" onClick={() => setOpen(false)}>
              <p className="text-veil-gold/80 font-semibold mb-1">{guide.label}</p>
              <p className="leading-relaxed">{guide.guide}</p>
            </div>
          )}
        </>
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
