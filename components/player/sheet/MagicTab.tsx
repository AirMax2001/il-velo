"use client";
import { getSpellsForClass, getSpellByName } from "@/lib/data/spells";
import { getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit, WARLOCK_SLOT_LEVEL } from "@/lib/data/leveling";
import { getArchetypeSlotsAtLevel } from "@/lib/data/classAbilities";
import { preparedSpellLimit } from "@/lib/characterEngine";
import type { SheetCtx } from "./types";

export function MagicTab({ ctx }: { ctx: SheetCtx }) {
  const { cd, clsKey, clsData, level, pb, spellAbility, spellAbilityMod, updCd, updCdAll, save, archCasting } = ctx;
  const hasSpellcasting = !!clsData?.spellcasting || !!spellAbility || !!archCasting;

  const listKey = clsData?.spellcasting ? (clsKey || "") : (archCasting?.list || clsKey || "");
  const autoSlotTotals = archCasting?.slots
    ? getArchetypeSlotsAtLevel(cd.archetype || "", level)
    : clsKey ? getSpellSlotsAtLevel(clsKey, level) : {};
  const cantripLimit = archCasting?.cantripsKnown ?? (clsKey ? getCantripsKnown(clsKey, level) : 0);
  const preparedLimit = clsKey ? preparedSpellLimit(clsKey, level, spellAbilityMod) : 0;
  const spellLimit = archCasting?.spellsKnown
    ? archCasting.spellsKnown(level)
    : ((clsKey ? getSpellsKnownLimit(clsKey, level) : 0) || preparedLimit || 999);
  const totalKnown = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, lvl) =>
    acc + ((((cd as any)[`spells${lvl}`]) || []) as string[]).length, 0);

  const spellSlots = (cd.spellSlots || {}) as Record<number, { total?: number; expended?: number }>;

  return (
    <div className="space-y-4">
      {!hasSpellcasting && (
        <div className="veil-panel p-6 text-center">
          <p className="text-3xl mb-3">⚔️</p>
          <p className="text-white/40">{clsData?.name || "Questa classe"} non usa la magia.</p>
          <p className="text-[11px] text-white/25 mt-1">Se hai oggetti magici o capacità speciali, usa la sezione Attacchi.</p>
        </div>
      )}

      {hasSpellcasting && (
        <>
          {/* Magie pagate in Ki (es. Via dell'Ombra) */}
          {archCasting?.ki && (
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Arti delle Ombre</h3>
              <p className="text-[10px] text-white/30 mb-3">
                Magie della Via dell'Ombra che lanci spendendo <strong className="text-veil-gold/70">2 Ki</strong> ciascuna
                (vedi Punti Ki nel tab Combattimento). Non consumano slot.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {archCasting.ki.spells.map(name => {
                  const sp = getSpellByName(name);
                  if (!sp) return null;
                  return (
                    <div key={name} className="rounded-lg border border-indigo-500/15 bg-indigo-950/10 px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs text-white/70 font-medium">{name}</p>
                        <span className="text-[9px] text-indigo-300/60">{sp.school}</span>
                        <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[9px] text-indigo-200/80">2 Ki</span>
                      </div>
                      <p className="text-[10px] text-white/35 mt-1 leading-snug">{sp.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trucchetti */}
          <div className="veil-panel p-4">
            <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Trucchetti</h3>
            <p className="text-[10px] text-white/30 mb-2">
              I trucchetti sono a volontà, non consumano slot. Selezionali dalla lista PHB
              {cantripLimit > 0 && <> (max <strong className="text-veil-gold/70">{cantripLimit}</strong>)</>}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1 mb-2">
              {listKey && getSpellsForClass(listKey, 0).map(sp => {
                const isSel = (cd.cantrips || []).includes(sp.name);
                const atLimit = (cd.cantrips || []).length >= cantripLimit;
                return (
                  <label key={sp.name} className={`flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                    <div className="flex items-center gap-2 w-full">
                      <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                        checked={isSel}
                        disabled={!isSel && atLimit}
                        onChange={e => {
                          const cur = cd.cantrips || [];
                          if (e.target.checked && cur.length >= cantripLimit) return;
                          const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                          updCd("cantrips", next);
                          save({ cantrips: next });
                        }} />
                      <span className="flex-1 text-white/70">{sp.name}</span>
                      <span className="text-[9px] text-white/25">{sp.school}</span>
                    </div>
                    <p className="text-[10px] text-white/30 pl-6 leading-snug">{sp.description}</p>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {(cd.cantrips || []).map((c: string) => (
                <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
              ))}
              {cantripLimit > 0 && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/30">{(cd.cantrips || []).length}/{cantripLimit}</span>}
            </div>
          </div>

          {/* Slot incantesimi */}
          <div className="veil-panel p-4">
            <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Slot Incantesimi</h3>
            <p className="text-[10px] text-white/30 mb-3 leading-relaxed">
              Uno <strong className="text-white/50">slot incantesimo</strong> è una carica di magia di un certo livello:
              lanciare un incantesimo consuma uno slot del suo livello (o di uno superiore, se vuoi potenziarlo).
              Ogni pallina è uno slot: cliccala per segnarlo come usato. Gli slot totali sono automatici per
              classe e livello e si <strong className="text-white/50">recuperano tutti con un riposo lungo</strong>.
              {clsKey === "warlock" && <> I tuoi slot sono sempre di livello {WARLOCK_SLOT_LEVEL[level] ?? 1}.</>}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                const total = autoSlotTotals[lv] ?? 0;
                const used = spellSlots[lv]?.expended ?? 0;
                const available = Math.max(0, total - used);
                return (
                  <div key={lv} className="text-center">
                    <p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="veil-input w-10 text-center text-xs p-1 opacity-70" title="Totale automatico">{total || "—"}</div>
                      <span className="text-[10px] text-white/20">/</span>
                      <input type="number" className="veil-input w-10 text-center text-xs p-1" placeholder="0" min={0} max={Math.max(total, 0)}
                        value={used || ""}
                        disabled={total === 0}
                        onChange={e => updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Number(e.target.value) } } })}
                        onBlur={() => save({ spellSlots: ctx.formRef.current?.character_data?.spellSlots })} />
                    </div>
                    <div className="flex justify-center gap-0.5 flex-wrap">
                      {Array.from({ length: Math.min(total, 9) }, (_, i) => (
                        <button key={i} onClick={() => {
                          const newUsed = i < used ? i : i + 1;
                          updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                          save({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                        }}
                          className={`w-4 h-4 rounded-full border transition ${i < (total - used) ? "bg-blue-500/40 border-blue-400/50" : "bg-white/[0.04] border-white/10"}`}
                          title={i < (total - used) ? "Slot disponibile (clicca per usare)" : "Slot usato"}
                        />
                      ))}
                    </div>
                    {total > 0 && <p className="text-[9px] text-white/20 mt-0.5">{available} disponibili</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista incantesimi */}
          <div className="veil-panel p-4">
            <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Incantesimi Noti/Preparati</h3>
            <p className="text-[10px] text-white/30 mb-2">
              Scegli i tuoi incantesimi dalla lista PHB per ogni livello di slot. I livelli superiori si sbloccano
              salendo di livello.
              {spellLimit >= 999 ? "" : <> Il totale è limitato a <strong className="text-veil-gold/70">{spellLimit}</strong>
                {clsKey === "paladin" ? " (metà livello + mod CAR)" : clsData?.spellcasting?.spellsKnown ? " incantesimi conosciuti" : " preparati (livello + mod)"}.</>}
            </p>

            {/* 1° livello: ingera guidata PHB */}
            <div className="mb-3">
              <label className="text-xs text-white/40 mb-1 block">1° Livello</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1 mb-2">
                {listKey && getSpellsForClass(listKey, 1).map(sp => {
                  const cur = (cd.spells1 || []) as string[];
                  const isSel = cur.includes(sp.name);
                  const atGlobalLimit = totalKnown >= spellLimit;
                  return (
                    <label key={sp.name} className={`flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                      <div className="flex items-center gap-2 w-full">
                        <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                          checked={isSel}
                          disabled={!isSel && atGlobalLimit}
                          onChange={e => {
                            if (e.target.checked && atGlobalLimit) return;
                            const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                            updCd("spells1", next);
                            save({ spells1: next });
                          }} />
                        <span className="flex-1 text-white/70">{sp.name}</span>
                        <span className="text-[9px] text-white/25">{sp.school}</span>
                      </div>
                      <p className="text-[10px] text-white/30 pl-6 leading-snug">{sp.description}</p>
                    </label>
                  );
                })}
              </div>
              {(cd.spells1 || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(cd.spells1 || []).map((c: string) => (
                    <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Livelli 2-9: selezione guidata PHB, si sbloccano con lo slot */}
            {[2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
              const unlocked = (autoSlotTotals[lv] ?? 0) > 0 || (clsKey === "warlock" && WARLOCK_SLOT_LEVEL[level] >= lv);
              const list = listKey ? getSpellsForClass(listKey, lv) : [];
              const cur = ((cd as any)[`spells${lv}`] || []) as string[];
              return (
                <div key={lv} className="mb-3">
                  <label className={`text-xs mb-1 block ${unlocked ? "text-white/40" : "text-white/20"}`}>
                    {lv}° Livello {unlocked && <span className="ml-1 text-[9px] text-emerald-300/50">sbloccato</span>}
                  </label>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1 mb-2 ${unlocked ? "" : "opacity-40 pointer-events-none"}`}>
                    {list.map(sp => {
                      const isSel = cur.includes(sp.name);
                      const atGlobalLimit = totalKnown >= spellLimit;
                      return (
                        <label key={sp.name} className={`flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                          <div className="flex items-center gap-2 w-full">
                            <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                              checked={isSel}
                              disabled={!isSel && atGlobalLimit}
                              onChange={e => {
                                if (e.target.checked && atGlobalLimit) return;
                                const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                                updCd(`spells${lv}` as any, next);
                                save({ [`spells${lv}`]: next });
                              }} />
                            <span className="flex-1 text-white/70">{sp.name}</span>
                            <span className="text-[9px] text-white/25">{sp.school}</span>
                          </div>
                          <p className="text-[10px] text-white/30 pl-6 leading-snug">{sp.description}</p>
                        </label>
                      );
                    })}
                    {list.length === 0 && (
                      <p className="text-[10px] text-white/25 col-span-2">
                        {unlocked ? "Nessun incantesimo PHB registrato per questo livello nella tua classe." : "Si sblocca quando avrai slot di questo livello."}
                      </p>
                    )}
                  </div>
                  {cur.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {cur.map((c: string) => (
                        <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Contatore globale noti/preparati */}
            {spellLimit < 999 && (
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/[0.06]">
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/40 transition-all" style={{ width: `${Math.min(100, (totalKnown / Math.max(1, spellLimit)) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-white/40 flex-shrink-0">
                  {totalKnown}/{spellLimit} incantesimi
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}