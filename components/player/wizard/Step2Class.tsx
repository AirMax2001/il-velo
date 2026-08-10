"use client";
import classes from "@/lib/data/classes";
import type { ClassData } from "@/lib/data/classes";
import { ABILITY_LABELS, SAVE_LABELS } from "@/lib/characterEngine";
import type { AbilityName, SaveKey } from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step2Class({ ctx }: { ctx: WizardCtx }) {
  const { data, update, cls } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Classe</h2>
        <p className="text-sm text-white/50 mt-1">La classe determina il ruolo del personaggio: guerriero, incantatore, abile o supporto.</p>
      </div>
      <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
        {Object.values(classes as Record<string, ClassData>).map(c => (
          <button key={c.key} onClick={() => update("classKey", c.key)}
            className={`text-left rounded-xl border p-3 transition ${data.classKey === c.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-white text-sm">{c.name}</p>
              <div className="flex gap-1">
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40">d{c.hitDie}</span>
                {c.spellcasting && <span className="rounded bg-blue-900/30 px-2 py-0.5 text-[10px] text-blue-300">Incantatore</span>}
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-1">{c.description}</p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">{c.skillPicks} abilità</span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/35">
                TS: {c.savingThrows.map(s => SAVE_LABELS[s as SaveKey].slice(0, 3)).join("/")}
              </span>
            </div>
          </button>
        ))}
      </div>

      {cls && (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
          <p className="text-xs text-veil-gold/70 font-semibold">Caratteristiche di Classe (Livello 1)</p>
          <div className="space-y-1">
            {cls.features.map(f => (
              <div key={f.name}>
                <p className="text-xs text-white/60 font-medium">{f.name}</p>
                <p className="text-[10px] text-white/30">{f.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/30 border-t border-white/[0.05] pt-2">
            <span>⚔️ {cls.weaponProficiencies.join(", ") || "nessuna"}</span>
            {cls.armorProficiencies.length > 0 && <span>🛡️ {cls.armorProficiencies.join(", ")}</span>}
          </div>
          {cls.spellcasting && (
            <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-900/10 p-2">
              <p className="text-xs text-blue-300 font-medium">Incantatore</p>
              <p className="text-[10px] text-blue-200/50">
                Caratteristica: {ABILITY_LABELS[cls.spellcasting.spellcastingAbility as AbilityName]} ·
                Trucchetti: {cls.spellcasting.cantripsKnown} ·
                {cls.spellcasting.spellsKnown > 0 ? ` Incantesimi conosciuti: ${cls.spellcasting.spellsKnown}` : " Prepara incantesimi"} ·
                Slot 1°: {cls.spellcasting.spellSlots[1]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}