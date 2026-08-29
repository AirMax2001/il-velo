"use client";
import { useState } from "react";
import { getFeaturesAtLevel } from "@/lib/data/leveling";
import { CLASS_ABILITIES, getArchetypeForClass, getArchetypeAbilities, getArchetypeCasting } from "@/lib/data/classAbilities";

type Props = {
  clsKey: string | null;
  clsData: any;
  level: number;
  cd: any;
  onClose: () => void;
  onPickArchetype: (key: string) => void;
};

export function ClassPopup({ clsKey, clsData, level, cd, onClose, onPickArchetype }: Props) {
  const [openLevels, setOpenLevels] = useState<Set<number>>(() => new Set(Array.from({ length: level }, (_, i) => i + 1)));
  const [classFeatInfoOpen, setClassFeatInfoOpen] = useState<Record<string, boolean>>({});
  if (!clsKey || !clsData) return null;

  const arch = getArchetypeForClass(clsKey);
  const picked = cd?.archetype || "";
  const pickedOpt = arch ? arch.options.find(o => o.key === picked) : null;

  const toggleLevel = (lv: number) => {
    setOpenLevels(prev => { const next = new Set(prev); next.has(lv) ? next.delete(lv) : next.add(lv); return next; });
  };

  // Class abilities excluding passive ones - show all active abilities including resource-based ones
  const abilitiesNoDie = (CLASS_ABILITIES[clsKey] || []).filter(a => {
    if (a.level > level) return false;
    if (a.action === "passiva") return false;
    return true;
  });
  // Archetype abilities excluding passive ones
  const archetypeNoDie = getArchetypeAbilities(picked).filter(a => {
    if (a.level > level) return false;
    if (a.action === "passiva") return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[70] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="veil-panel p-5 border-veil-gold/40 shadow-[0_0_40px_rgba(218,180,113,0.15)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg text-veil-gold font-bold">{clsData.name}</h2>
            <button onClick={onClose} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:text-white/80 transition">✕ Chiudi</button>
          </div>

          {/* Archetipo */}
          {arch && level >= arch.level && (
            <div className="mb-5">
              <h3 className="text-sm text-veil-gold font-medium mb-2">🎭 Archetipo</h3>
              {pickedOpt ? (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-900/[0.08] p-4">
                  <p className="text-sm text-emerald-300/90 font-medium">{pickedOpt.name} <span className="text-[10px] text-white/30">(sceglio al {arch.level}° livello)</span></p>
                  <p className="text-[11px] text-white/50 mt-1">{pickedOpt.description}</p>
                  {(() => {
                    const acts = getArchetypeAbilities(picked);
                    const cast = getArchetypeCasting(picked);
                    const changes = cast ? [cast.label] : [];
                    acts.forEach(a => changes.push(`${a.name} (${a.effect})`));
                    if (changes.length === 0) return null;
                    return (
                      <div className="mt-2 space-y-1">
                        {changes.map(c => (
                          <p key={c} className="text-[10px] text-indigo-300/60 leading-snug">✨ {c}</p>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="text-[9px] text-white/20 mt-2">Scelto al {arch.level}° livello — non modificabile.</p>
                </div>
              ) : level >= arch.level ? (
                <div className="space-y-2 mt-2">
                  {arch.options.map(o => {
                    const acts = getArchetypeAbilities(o.key);
                    const cast = getArchetypeCasting(o.key);
                    return (
                      <button key={o.key} type="button" onClick={() => onPickArchetype(o.key)}
                        className="w-full text-left rounded-xl border border-white/[0.06] bg-black/30 hover:border-veil-gold/30 hover:bg-white/[0.02] p-3 transition">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-white/80 font-medium">{o.name}</p>
                          {cast && (
                            <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] text-violet-300/80 border-violet-400/25 bg-violet-500/10">
                              {cast.ki ? "✨ magie in Ki" : "✨ sblocca la magia"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/45 mt-1 leading-snug">{o.description}</p>
                        {acts.length > 0 && (
                          <p className="text-[10px] text-indigo-300/50 mt-1.5">
                            Cosa cambia: {acts.map(a => a.name).join(" · ")}
                            {cast ? ` · ${cast.label}` : ""}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-white/35">Scegli al {arch.level}° livello.</p>
              )}
            </div>
          )}

          {/* Abilità senza dado */}
          {abilitiesNoDie.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm text-veil-gold font-medium mb-2">✦ Abilità di Classe</h3>
              <div className="space-y-1.5">
                {abilitiesNoDie.map(a => (
                  <div key={a.key} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-veil-gold/80 font-medium">{a.name}</p>
                      <span className="text-[9px] text-white/30 rounded-full bg-white/[0.04] px-2 py-0.5">{a.action}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{a.effect}</p>
                    <span className="text-[9px] text-white/30 mt-1 inline-block">Usi: {a.uses}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilità archetipo senza dado */}
          {archetypeNoDie.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm text-veil-gold font-medium mb-2">🎭 Abilità Archetipo</h3>
              <div className="space-y-1.5">
                {archetypeNoDie.map(a => (
                  <div key={a.key} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-veil-gold/80 font-medium">{a.name}</p>
                      <span className="text-[9px] text-white/30 rounded-full bg-white/[0.04] px-2 py-0.5">{a.action}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{a.effect}</p>
                    <span className="text-[9px] text-white/30 mt-1 inline-block">Usi: {a.uses}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tratti per livello */}
          <div>
            <h3 className="text-sm text-veil-gold font-medium mb-2">✦ Tratti per Livello</h3>
            <div className="space-y-2">
              {Array.from({ length: level }, (_, i) => i + 1).map(lv => {
                const feats = getFeaturesAtLevel(clsKey, lv);
                const isOpen = openLevels.has(lv);
                return (
                  <div key={lv} className="rounded-xl border border-white/[0.06] bg-black/20 overflow-hidden">
                    <button type="button" onClick={() => toggleLevel(lv)}
                      className="w-full flex items-center justify-between px-3 py-2">
                      <p className="text-xs text-white/65 font-medium">Livello {lv}</p>
                      <span className={`text-[10px] text-veil-gold/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-1.5">
                        {feats.length === 0 ? (
                          <p className="text-[10px] text-white/20 italic">Nessuna abilità o tratto a questo livello.</p>
                        ) : (
                          feats.map(f => {
                            const key = `feat-${lv}-${f.name}`;
                            const open = !!classFeatInfoOpen[key];
                            return (
                              <div key={f.name} className="rounded-lg bg-black/20 border border-white/[0.06] p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs text-veil-gold/80 font-medium">✦ {f.name}</p>
                                  <button onClick={() => setClassFeatInfoOpen(o => ({...o, [key]: !o[key]}))} className="w-5 h-5 rounded-full border border-veil-gold/20 bg-veil-gold/10 flex items-center justify-center text-[10px] text-veil-gold/60 hover:bg-veil-gold/20 transition shrink-0" title="Mostra descrizione">i</button>
                                </div>
                                {open && <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{f.description}</p>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}