"use client";
import { useState } from "react";
import { spells } from "@/lib/data/spells";
import { CollapseSection } from "@/components/player/sheet/ui";

const LEVEL_LABELS: Record<number, string> = {
  0: "Trucchetti (livello 0 — a volontà)",
  1: "Incantesimi di 1° Livello",
  2: "Incantesimi di 2° Livello",
  3: "Incantesimi di 3° Livello",
  4: "Incantesimi di 4° Livello",
  5: "Incantesimi di 5° Livello",
  6: "Incantesimi di 6° Livello",
  7: "Incantesimi di 7° Livello",
  8: "Incantesimi di 8° Livello",
  9: "Incantesimi di 9° Livello",
};

const CLASS_LABELS: Record<string, string> = {
  bard: "Bardo",
  cleric: "Chierico",
  druid: "Druido",
  paladin: "Paladino",
  ranger: "Ranger",
  sorcerer: "Stregone",
  warlock: "Warlock",
  wizard: "Mago",
};

function SpellRow({ spell }: { spell: (typeof spells)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div key={spell.name} className="border-t border-white/[0.05]">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-white/[0.03]">
        <div className="min-w-0">
          <p className="text-xs text-white/80 font-medium">{spell.name}</p>
          <p className="text-[10px] text-veil-gold/50 mt-0.5">
            {spell.school} · {spell.castingTime} · {spell.range} · {spell.duration}
          </p>
        </div>
        <span className={`text-veil-gold/40 text-[10px] transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-white/55 leading-relaxed whitespace-pre-line">{spell.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/35">Componenti: {spell.components}</span>
            {spell.classes.map(c => (
              <span key={c} className="rounded-full border border-veil-gold/20 px-2 py-0.5 text-[10px] text-veil-gold/60">
                {CLASS_LABELS[c] || c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SpellReferenceTables({ only, expandAll }: { only?: "cantrips" | "spells"; expandAll?: boolean }) {
  const levels = spells.reduce<number[]>((acc, s) => (acc.includes(s.level) ? acc : [...acc, s.level]), []).sort((a, b) => a - b)
    .filter(l => (only === "cantrips" ? l === 0 : only === "spells" ? l > 0 : true));

  return (
    <div className="space-y-3">
      {levels.map(level => {
        const list = spells.filter(s => s.level === level);
        return (
          <CollapseSection
            key={level}
            title={LEVEL_LABELS[level]}
            badge={<span className="rounded-full border border-veil-gold/20 px-2 py-0.5 text-[10px] text-veil-gold/60">{list.length}</span>}
            defaultOpen={expandAll ? true : level === 0}
          >
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              {list.map(spell => <SpellRow key={spell.name} spell={spell} />)}
            </div>
          </CollapseSection>
        );
      })}
    </div>
  );
}