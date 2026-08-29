"use client";
import { useState } from "react";
import { getRaceData } from "@/lib/data/races";
import { ABILITY_SHORT } from "@/lib/characterEngine";

type Props = {
  raceKey: string;
  subRaceKey?: string;
  onClose: () => void;
};

export function RacePopup({ raceKey, subRaceKey, onClose }: Props) {
  const [traitInfoOpen, setTraitInfoOpen] = useState<Record<string, boolean>>({});
  const raceData = getRaceData(raceKey);
  if (!raceData) return null;

  const subRace = subRaceKey && raceData.subRaces ? raceData.subRaces.find(sr => sr.key === subRaceKey) : undefined;

  return (
    <div className="fixed inset-0 z-[70] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="veil-panel p-5 border-veil-gold/40 shadow-[0_0_40px_rgba(218,180,113,0.15)]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg text-veil-gold font-bold">{raceData.name}</h2>
              <p className="text-[11px] text-white/40 mt-0.5">{raceData.description}</p>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:text-white/80 transition">✕ Chiudi</button>
          </div>

          {/* Sottorazza */}
          {raceData.subRaces && raceData.subRaces.length > 0 && subRaceKey && (
            <div className="mb-4">
              <p className="text-[10px] text-white/35">Sottorazza</p>
              <div className="veil-input w-full pointer-events-none opacity-60 bg-black/20 text-white/60">{subRace?.name || subRaceKey}</div>
              <p className="text-[9px] text-white/20 mt-1">Scelta alla creazione, non modificabile.</p>
            </div>
          )}

          {/* Bonus caratteristiche */}
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(raceData.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">
                {ABILITY_SHORT[k] || k}+{v} <span className="text-[8px] opacity-60">già incluso</span>
              </span>
            ))}
            {subRace?.abilityBonuses && Object.entries(subRace.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">
                {ABILITY_SHORT[k] || k}+{v} (sottorazza) <span className="text-[8px] opacity-60">già incluso</span>
              </span>
            ))}
          </div>
          <p className="text-[9px] text-white/20 mb-4">I bonus sopra sono già sommati nei punteggi di Caratteristiche — non aggiungerli di nuovo.</p>

          {/* Resistenze */}
          {(raceData.resistances || []).length > 0 && (
            <div className="space-y-2 mb-4">
              {(raceData.resistances || []).map((r: string) => {
                const key = `resist-${r}`;
                const open = !!traitInfoOpen[key];
                return (
                  <div key={r} className="rounded-lg bg-black/20 p-2 border border-red-500/10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-red-300/70 font-medium">✦ Resistenza: {r} <span className="text-[9px] text-white/20">(razza)</span></p>
                      <button onClick={() => setTraitInfoOpen(o => ({...o, [key]: !o[key]}))} className="w-5 h-5 rounded-full border border-red-400/20 bg-red-900/15 flex items-center justify-center text-[10px] text-red-300/60 hover:bg-red-900/25 transition">i</button>
                    </div>
                    {open && <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">Hai resistenza ai danni da {r} (danni dimezzati) e vantaggio ai tiri salvezza contro l'avvelenamento se è veleno.</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tratti razziali */}
          <div className="space-y-2 mb-4">
            {raceData.traits.map(t => {
              const key = `race-${t.name}`;
              const open = !!traitInfoOpen[key];
              return (
                <div key={t.name} className="rounded-lg bg-black/20 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-emerald-400/70 font-medium">✦ {t.name} <span className="text-[9px] text-white/20">(razza)</span></p>
                    <button onClick={() => setTraitInfoOpen(o => ({...o, [key]: !o[key]}))} className="w-5 h-5 rounded-full border border-emerald-400/20 bg-emerald-900/15 flex items-center justify-center text-[10px] text-emerald-300/60 hover:bg-emerald-900/25 transition" title="Mostra descrizione">i</button>
                  </div>
                  {open && <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{t.description}</p>}
                </div>
              );
            })}
          </div>

          {/* Tratti sottorazza */}
          {subRace?.traits && subRace.traits.length > 0 && (
            <div className="space-y-2">
              {subRace.traits.map(t => {
                const key = `sub-${t.name}`;
                const open = !!traitInfoOpen[key];
                return (
                  <div key={t.name} className="rounded-lg bg-black/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-emerald-400/70 font-medium">✦ {t.name} <span className="text-[9px] text-white/20">(sottorazza)</span></p>
                      <button onClick={() => setTraitInfoOpen(o => ({...o, [key]: !o[key]}))} className="w-5 h-5 rounded-full border border-emerald-400/20 bg-emerald-900/15 flex items-center justify-center text-[10px] text-emerald-300/60 hover:bg-emerald-900/25 transition" title="Mostra descrizione">i</button>
                    </div>
                    {open && <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{t.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}