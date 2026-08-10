"use client";
import races from "@/lib/data/races";
import type { RaceData } from "@/lib/data/races";
import { AbilityName, ABILITY_SHORT } from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step1Race({ ctx }: { ctx: WizardCtx }) {
  const { data, update, race, subRace } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Razza</h2>
        <p className="text-sm text-white/50 mt-1">La razza influenza le statistiche, la velocità, i linguaggi e le abilità speciali del personaggio.</p>
      </div>
      <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
        {Object.values(races as Record<string, RaceData>).map(r => (
          <button key={r.key} onClick={() => { update("raceKey", r.key); update("subRaceKey", ""); }}
            className={`text-left rounded-xl border p-3 transition ${data.raceKey === r.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-white text-sm">{r.name}</p>
              <span className="text-[10px] text-white/30">{r.speed}m · {r.size}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(r.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/80">
                  {ABILITY_SHORT[k as AbilityName]}+{v}
                </span>
              ))}
              {r.darkvision && <span className="rounded bg-indigo-900/30 px-1.5 py-0.5 text-[10px] text-indigo-300/70">Scurovisione {r.darkvision}m</span>}
            </div>
          </button>
        ))}
      </div>

      {race?.hasSubRace && race.subRaces && race.subRaces.length > 0 && (
        <div>
          <p className="text-xs text-veil-gold/60 mb-2 font-medium">Sottorazza *</p>
          <div className="grid gap-2 md:grid-cols-2">
            {race.subRaces.map(sr => (
              <button key={sr.key} onClick={() => update("subRaceKey", sr.key)}
                className={`text-left rounded-xl border p-3 transition ${data.subRaceKey === sr.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
                <p className="text-sm font-medium text-white">{sr.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(sr.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
                    <span key={k} className="rounded bg-emerald-900/20 px-1.5 py-0.5 text-[10px] text-emerald-300/70">
                      {ABILITY_SHORT[k as AbilityName]}+{v}
                    </span>
                  ))}
                </div>
                {sr.description && <p className="text-[10px] text-white/35 mt-1">{sr.description}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {race && (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
          <p className="text-xs text-veil-gold/70 font-semibold">Tratti Razziali</p>
          <div className="space-y-1">
            {[...race.traits, ...(subRace?.traits || [])].map(t => (
              <div key={t.name}>
                <p className="text-xs text-white/60 font-medium">{t.name}</p>
                <p className="text-[10px] text-white/30">{t.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/30 border-t border-white/[0.05] pt-2">
            <span>🏃 Velocità: {race.speed}m</span>
            <span>📏 Taglia: {race.size}</span>
            <span>🗣️ {race.languages.join(", ")}</span>
            {race.darkvision && <span>👁️ Scurovisione: {race.darkvision}m</span>}
          </div>
        </div>
      )}
    </div>
  );
}