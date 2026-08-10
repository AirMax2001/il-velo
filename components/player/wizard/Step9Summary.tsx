"use client";
import {
  ALL_ABILITIES, ABILITY_SHORT, SKILL_LABELS, formatMod,
  type SkillKey,
} from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step9Summary({ ctx }: { ctx: WizardCtx }) {
  const { data, race, subRace, cls, bg, bgSkills, raceSkills, subRaceSkills, finalScores, hp, calculatedAC, errors, saving, finish } = ctx;
  const autoSkills = new Set<SkillKey>([...bgSkills, ...raceSkills, ...subRaceSkills]);
  const allSelectedSkills = [...new Set([...data.selectedSkills, ...autoSkills])];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Riepilogo</h2>
        <p className="text-sm text-white/50 mt-1">Controlla il tuo personaggio prima di completare la creazione.</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-3">
          <p className="text-xs text-red-300 font-semibold mb-1">Errori da correggere:</p>
          {errors.map((err, i) => <p key={i} className="text-xs text-red-200/70">• {err}</p>)}
        </div>
      )}

      <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.03] p-4 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-veil-gold/60">Nome</span><p className="text-white/80 font-medium mt-0.5">{data.name}</p></div>
          <div><span className="text-veil-gold/60">Allineamento</span><p className="text-white/80 mt-0.5">{data.alignment}</p></div>
          <div><span className="text-veil-gold/60">Razza</span><p className="text-white/80 mt-0.5">{race?.name}{subRace ? ` (${subRace.name})` : ""}</p></div>
          <div><span className="text-veil-gold/60">Classe</span><p className="text-white/80 mt-0.5">{cls?.name} · Livello 1</p></div>
          <div><span className="text-veil-gold/60">Background</span><p className="text-white/80 mt-0.5">{bg?.name}</p></div>
          <div><span className="text-veil-gold/60">Età</span><p className="text-white/80 mt-0.5">{data.age || "—"}</p></div>
        </div>
        <div className="border-t border-white/[0.06] pt-2">
          <span className="text-veil-gold/60">Caratteristiche</span>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {ALL_ABILITIES.map(a => finalScores && (
              <span key={a} className="text-white/60">
                {ABILITY_SHORT[a]}: <strong className="text-white">{finalScores[a]}</strong> <span className="text-veil-gold/60">({formatMod(finalScores[a])})</span>
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-2 grid grid-cols-3 gap-2">
          <div><span className="text-veil-gold/60">PF</span><p className="text-white/80 font-bold">{hp}</p></div>
          <div><span className="text-veil-gold/60">CA</span><p className="text-white/80 font-bold">{calculatedAC}</p></div>
          <div><span className="text-veil-gold/60">Velocità</span><p className="text-white/80 font-bold">{race?.speed || 30}m</p></div>
        </div>
        {allSelectedSkills.length > 0 && (
          <div className="border-t border-white/[0.06] pt-2">
            <span className="text-veil-gold/60">Abilità competenti</span>
            <p className="text-white/60 mt-0.5">{allSelectedSkills.map(s => SKILL_LABELS[s]).join(", ")}</p>
          </div>
        )}
        {data.selectedSpells.length > 0 && (
          <div className="border-t border-white/[0.06] pt-2">
            <span className="text-veil-gold/60">Incantesimi/Trucchetti</span>
            <p className="text-white/60 mt-0.5">{data.selectedSpells.join(", ")}</p>
          </div>
        )}
      </div>

      <button onClick={finish} disabled={saving}
        className="w-full rounded-xl bg-veil-gold/20 border border-veil-gold/40 px-6 py-3 text-sm font-semibold text-veil-gold hover:bg-veil-gold/30 disabled:opacity-50 transition">
        {saving ? "⏳ Salvataggio in corso..." : "✨ Completa Creazione"}
      </button>
    </div>
  );
}