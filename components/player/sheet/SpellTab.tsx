"use client";
import { useState } from "react";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import {
  CONDITIONS_LIST, parseConditions, serializeConditions,
  getModifier, ALL_SKILLS, SKILL_ABILITY, ABILITY_SHORT, SKILL_LABELS,
} from "@/lib/characterEngine";
import { getSpellsForClass } from "@/lib/data/spells";
import { CLASS_ABILITIES, getArchetypeAbilities, getArchetypeForClass, getClassResources } from "@/lib/data/classAbilities";
import { SKILL_DESCRIPTIONS } from "@/components/shared/AbilityReferenceTables";
import { NumberBubbles, CollapseSection } from "./ui";
import { ResourceBar } from "./ResourceBar";
import { CombatOverlay } from "./CombatOverlay";
import type { SheetCtx } from "./types";

const SKILL_LIST = ALL_SKILLS.map(k => ({ key: k, label: SKILL_LABELS[k], ability: SKILL_ABILITY[k] }));

export function SpellTab({ ctx }: { ctx: SheetCtx }) {
  const {
    form, cd, clsKey, clsData, level, pb, attacks, conditions,
    hitDie, autoSlotTotals, spellSlots, upd, updCd, updCdAll, save,
    spellAbility, spellAbilityMod, spellDC, spellAtk, archCasting,
  } = ctx;

  const canCast = !!clsData?.spellcasting || !!spellAbility || !!archCasting;
  const spellListKey = clsData?.spellcasting ? (clsKey || "") : (archCasting?.list || clsKey || "");
  const spellAbilityLabel = spellAbility ? (ABILITY_SHORT[spellAbility] || spellAbility) : null;
  const [query, setQuery] = useState("");
  const [showCombat, setShowCombat] = useState(false);
  const [openLevels, setOpenLevels] = useState<Record<number, boolean>>({});
  const [infoOpen, setInfoOpen] = useState<Record<string, boolean>>({});
  const [resourceInfoOpen, setResourceInfoOpen] = useState(false);
  const [spellInfoOpen, setSpellInfoOpen] = useState<Record<string, boolean>>({});
  const [pfOpen, setPfOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const cantrips = (cd.cantrips || []) as string[];
  const maxSpellLv = Math.max(0, ...Object.entries(autoSlotTotals).filter(([, v]) => (v as number) > 0).map(([k]) => Number(k)), 0);
  const rawKnownSpells = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv =>
    (((cd as any)[`spells${lv}`] || []) as string[]).map(name => ({ name, lv })));
  // Mostra solo incantesimi fino al livello massimo lanciabile al livello attuale (evita liste di livelli futuri)
  const knownSpells = maxSpellLv > 0 ? rawKnownSpells.filter(s => s.lv <= maxSpellLv) : rawKnownSpells;

  const availableAbilities = (CLASS_ABILITIES[clsKey || ""] || [])
    .filter(a => a.level <= level)
    .sort((a, b) => a.level - b.level);

  const archetype = clsKey ? getArchetypeForClass(clsKey) : null;
  const archetypeKey = cd.archetype || "";
  const archetypeLabel = archetype?.options.find(o => o.key === archetypeKey)?.name;
  const archetypeAbilities = archetypeKey
    ? getArchetypeAbilities(archetypeKey).filter(a => a.level <= level)
    : [];

  const chosenSkills = SKILL_LIST.filter(s => (cd as any)[s.key]);

  const resources = clsKey ? getClassResources(clsKey) : [];
  const spent = (cd.resources || {}) as Record<string, { total?: number; expended?: number }>;

  function toggleResource(key: string, i: number, total: number) {
    const cur = spent[key]?.expended ?? 0;
    const newVal = cur > i ? i : i + 1;
    const next = { ...spent, [key]: { total, expended: Math.min(newVal, total) } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  function adjustResource(key: string, total: number, delta: number) {
    const cur = spent[key]?.expended ?? 0;
    const newVal = Math.max(0, Math.min(total, cur + delta));
    const next = { ...spent, [key]: { total, expended: newVal } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  function restResource(key: string, total: number) {
    const next = { ...spent, [key]: { total, expended: 0 } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  const spellDesc = (name: string) => getSpellsForClass(spellListKey, 0).find(s => s.name === name)
    || [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv => getSpellsForClass(spellListKey, lv)).find(s => s.name === name);

  const matches = (name: string): boolean => {
    if (!searching) return true;
    const sp = spellDesc(name);
    return name.toLowerCase().includes(q)
      || (sp?.school || "").toLowerCase().includes(q)
      || (sp?.description || "").toLowerCase().includes(q);
  };

  return (
    <div className="space-y-4">
      {conditions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {conditions.map(c => (
            <span key={c} className="rounded-full border border-red-500/40 bg-red-900/30 px-3 py-1 text-xs font-bold text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]">{c}</span>
          ))}
        </div>
      )}

      {(canCast || resources.length > 0) && (
        <div className="veil-panel p-4 space-y-5">
          {canCast && (
            <div>
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Statistiche Incantatore</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] text-blue-300/50">Caratteristica</p>
                <button onClick={()=>setInfoOpen(o=>({...o, caratt: !o.caratt}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
              </div>
              <p className="text-sm text-blue-200 font-medium">{spellAbilityLabel || "—"}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{spellAbility || ""}</p>
              {infoOpen.caratt && (
                <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                  <strong className="text-white/60">Cosa è:</strong> la caratteristica di lancio della tua classe
                  (es. Mago = INT, Chierico = SAG, Bardo = CAR).<br />
                  <strong className="text-white/60">A cosa serve:</strong> dal suo modificatore dipendono CD Inc. e Attacco.<br />
                  <strong className="text-white/60">Quando usarla:</strong> ogni volta che lanci un incantesimo.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] text-blue-300/50">CD Inc.</p>
                <button onClick={()=>setInfoOpen(o=>({...o, cd: !o.cd}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
              </div>
              <p className="text-xl font-bold text-blue-200">{spellDC}</p>
              <p className="text-[10px] text-white/25 mt-0.5">8 (base) {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : `${spellAbilityMod}`} ({spellAbilityLabel || "—"}) +{pb} (PB)</p>
              {infoOpen.cd && (
                <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                  <strong className="text-white/60">Cosa è:</strong> Classe Difficoltà Incantatore, la soglia da superare.<br />
                  <strong className="text-white/60">A cosa serve:</strong> il nemico deve fare un tiro salvezza ≥ a questo numero.<br />
                  <strong className="text-white/60">Quando usarla:</strong> con incantesimi che impongono un tiro salvezza
                  (es. Sonno, Fiamma Sacra): tira 1d20 + il suo mod. e deve superare la CD.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] text-blue-300/50">Mod Attacco</p>
                <button onClick={()=>setInfoOpen(o=>({...o, atk: !o.atk}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
              </div>
              <p className="text-xl font-bold text-blue-200">{spellAtk >= 0 ? `+${spellAtk}` : `${spellAtk}`}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{spellAbilityMod >= 0 ? `+${spellAbilityMod}` : `${spellAbilityMod}`} ({spellAbilityLabel || "—"}) +{pb} (PB)</p>
              {infoOpen.atk && (
                <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                  <strong className="text-white/60">Cosa è:</strong> il bonus al tuo tiro per colpire magico.<br />
                  <strong className="text-white/60">A cosa serve:</strong> lo sommi a 1d20 per superare la CA del bersaglio.<br />
                  <strong className="text-white/60">Quando usarla:</strong> con incantesimi con tiro per colpire
                  (es. Dardo di Fuoco, Raggio di Gelo): se il totale è ≥ CA, colpisci.
                </p>
              )}
            </div>
              </div>
            </div>
          )}
          {canCast && resources.length > 0 && <div className="h-px bg-white/[0.06]" />}
          {resources.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-sm text-veil-gold/80 font-medium">Risorse di Classe</h3>
                <button onClick={()=>setResourceInfoOpen(o=>!o)} className="w-5 h-5 rounded-full border border-veil-gold/20 bg-veil-gold/10 flex items-center justify-center text-[10px] text-veil-gold/70 hover:bg-veil-gold/20 transition" title="Mostra descrizione">i</button>
              </div>
              {resourceInfoOpen && (
                <p className="text-[10px] text-white/30 mb-3 leading-snug border-t border-white/[0.06] pt-2">
                  Capacità consumabili (come gli slot incantesimo): clicca su una pallina per spendere la risorsa,
                  sul pulsante per riposare. Il totale è automatico per classe e livello.
                </p>
              )}
              <div className="flex justify-center">
                <ResourceBar clsKey={clsKey} level={level} pb={pb} cd={cd} updCdAll={updCdAll} save={save} />
              </div>
            </div>
          )}
          {canCast && <div className="h-px bg-white/[0.06]" />}
          {canCast && (
            <div>
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3 text-center">Slot Incantesimi Disponibili</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                  const total = autoSlotTotals[lv] ?? 0;
                  if (total === 0) return null;
                  const used = spellSlots[lv]?.expended ?? 0;
                  const available = Math.max(0, total - used);
                  return (
                    <div key={lv} className="text-center flex flex-col items-center">
                      <p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { const nv = Math.min(total, used + 1); updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); save({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Spendi (− toglie un pallino)">−</button>
                        <div className="flex justify-center gap-0.5 flex-wrap">
                          {Array.from({ length: Math.min(total, 9) }, (_, i) => (
                            <button key={i} onClick={() => {
                              const newUsed = i < used ? i : i + 1;
                              updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                              save({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                            }}
                              className={`w-5 h-5 rounded-full border transition ${i < (total - used) ? "bg-blue-500/40 border-blue-400/50" : "bg-white/[0.04] border-white/10"}`}
                              title={i < (total - used) ? "Slot disponibile (clicca per usare)" : "Slot usato"} />
                          ))}
                        </div>
                        <button onClick={() => { const nv = Math.max(0, used - 1); updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); save({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Recupera (+ aggiunge un pallino)">+</button>
                      </div>
                      <p className="text-[9px] text-white/25 mt-0.5">{available} disponibili</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attacchi */}
      {/* Attacchi */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Attacchi</h3>
        {attacks.length === 0 && (
          <p className="text-xs text-white/30 text-center py-3">Nessun attacco. Le armi si aggiungono dall&apos;inventario (Equip.).</p>
        )}
        <div className="space-y-2">
          {attacks.map((a: any, i: number) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
              <input className="veil-input text-xs" placeholder="Nome arma (es. Spada Lunga)"
                value={a.name}
                onChange={e => {
                  const na = attacks.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x);
                  updCdAll({ attacks: na });
                }}
                onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
              <input className="veil-input w-16 text-xs text-center" placeholder="+5"
                value={a.bonus}
                onChange={e => {
                  const na = attacks.map((x: any, j: number) => j === i ? { ...x, bonus: e.target.value } : x);
                  updCdAll({ attacks: na });
                }}
                onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
              <input className="veil-input w-20 text-xs text-center" placeholder="1d8+3"
                value={a.damage}
                onChange={e => {
                  const na = attacks.map((x: any, j: number) => j === i ? { ...x, damage: e.target.value } : x);
                  updCdAll({ attacks: na });
                }}
                onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
              <input className="veil-input w-28 text-xs text-center" placeholder="Tipo"
                value={a.type || ""}
                onChange={e => {
                  const na = attacks.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x);
                  updCdAll({ attacks: na });
                }}
                onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
              <button onClick={() => {
                const na = attacks.filter((_: any, j: number) => j !== i);
                updCd("attacks", na);
                save({ attacks: na });
              }} className="text-red-300/40 hover:text-red-300 text-sm">×</button>
            </div>
          ))}
        </div>
        {attacks.length > 0 && (
          <p className="text-[10px] text-white/20 mt-2">Bonus · Danno · Tipo (es. tagliente, fuoco...)</p>
        )}
      </div>

      {/* Trucchetti */}
      {cantrips.length > 0 && (
        <CollapseSection
          title="Trucchetti"
          subtitle="A volontà, non consumano slot."
          badge={<span className="rounded-full bg-veil-gold/10 border border-veil-gold/20 px-2 py-0.5 text-[11px] text-veil-gold/70">{cantrips.filter(name => matches(name)).length}</span>}
        >
          <div className="space-y-2">
            {cantrips.map(name => {
              const sp = spellDesc(name);
              if (searching && !matches(name)) return null;
              const key=`cantrip-${name}`;
              const open=!!spellInfoOpen[key];
              return (
                <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white/80">{name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white/25">{sp?.school || ""}</span>
                      <button onClick={()=>setSpellInfoOpen(o=>({...o,[key]:!o[key]}))} className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold transition" title="Mostra descrizione">i</button>
                    </div>
                  </div>
                  {open && sp && <p className="text-xs text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{sp.description}</p>}
                </div>
              );
            })}
          </div>
        </CollapseSection>
      )}

      {/* Incantesimi per livello (collassabili) */}
      {knownSpells.length > 0 && (
        <CollapseSection
          title="Incantesimi"
          subtitle="Consumano slot del livello corrispondente."
          badge={<span className="rounded-full bg-veil-gold/10 border border-veil-gold/20 px-2 py-0.5 text-[11px] text-veil-gold/70">{knownSpells.map(s => s.name).filter(name => matches(name)).length}</span>}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
            const list = knownSpells.filter(s => s.lv === lv);
            if (list.length === 0) return null;
            const open = searching ? true : openLevels[lv] !== false;
            return (
              <div key={lv} className="mb-2">
                <button type="button" onClick={() => setOpenLevels(o => ({ ...o, [lv]: !open }))}
                  className="w-full flex items-center justify-between gap-2 text-left mb-1 py-1 group">
                  <p className="text-xs text-white/40">{lv}° Livello</p>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">{list.length}</span>
                    <span className={`text-white/30 text-[10px] transition-transform duration-200 group-hover:text-white/60 ${open ? "" : "-rotate-90"}`}>▼</span>
                  </span>
                </button>
                {open && (
                  <div className="space-y-2">
                    {list.map(({ name }) => {
                      const sp = spellDesc(name);
                      if (searching && !matches(name)) return null;
                      const key=`spell-${name}`;
                      const open=!!spellInfoOpen[key];
                      const descLower = (sp?.description || "").toLowerCase();
                      const isAtk = descLower.includes("tiro per colpire") || descLower.includes("tiro a distanza") || descLower.includes("tiro in mischia");
                      const hasSave = descLower.includes("deve superare un ts") || descLower.includes("tiro salvezza") || descLower.includes(" ts ");
                      return (
                        <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-white/80">{name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-white/25">{sp?.school || ""}</span>
                              <button onClick={()=>setSpellInfoOpen(o=>({...o,[key]:!o[key]}))} className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold transition" title="Mostra descrizione">i</button>
                            </div>
                          </div>
                          {open && sp && <p className="text-xs text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{sp.description}</p>}
                          {open && sp && (isAtk || hasSave) && (
                            <p className="text-[10px] mt-2 rounded bg-indigo-900/20 border border-indigo-500/20 px-2 py-1.5 leading-snug text-indigo-200/70">
                              {isAtk ? <>🎲 <strong className="text-indigo-200">Tiro per colpire:</strong> 1d20 {spellAtk >= 0 ? `+${spellAtk}` : spellAtk} (mod. {spellAbilityLabel} {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : spellAbilityMod} + comp. +{pb}) vs CA. Se colpisci → tira i danni indicati.</> : null}
                              {isAtk && hasSave ? <br /> : null}
                              {hasSave ? <>🛡️ <strong className="text-indigo-200">Tiro salvezza:</strong> bersaglio tira 1d20 + suo mod. vs CD {spellDC} (8 + {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : spellAbilityMod} + {pb}). Se fallisce → effetto pieno.</> : null}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {searching && knownSpells.filter(s => matches(s.name)).length === 0 && (
            <p className="text-xs text-white/30 text-center py-2">Nessun incantesimo corrisponde alla ricerca.</p>
          )}
        </CollapseSection>
      )}

      {/* PF + Dadi Vita + Tiri Morte - collassabile */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm text-veil-gold/80 font-medium">Punti Ferita</h3>
          <button onClick={()=>setPfOpen(o=>!o)} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold transition" title={pfOpen ? "Chiudi" : "Apri dadi e tiri"}>
            <span className={`transition-transform ${pfOpen ? "" : "-rotate-90"}`}>▼</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 mb-3">
          <div>
            <LabelWithGuide fieldKey="hp_max" label="PF Max" />
            <div className="veil-input mt-1 w-full text-center pointer-events-none opacity-60 bg-black/20">{form?.hp_max ?? "—"}</div>
          </div>
          <div>
            <LabelWithGuide fieldKey="hp_current" label="PF Correnti" />
            <input type="number" className="veil-input mt-1 w-full text-center" value={form?.hp_current ?? ""} onChange={e=>upd("hp_current", Number(e.target.value))} onBlur={()=>save({ hp_current: ctx.formRef.current?.hp_current })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="temp_hp" label="PF Temporanei" />
            <input type="number" className="veil-input mt-1 w-full text-center" value={form?.temp_hp ?? ""} onChange={e=>upd("temp_hp", Number(e.target.value))} onBlur={()=>save({ temp_hp: ctx.formRef.current?.temp_hp })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="hitDiceTotal" label="Dadi Vita" />
            <div className="veil-input mt-1 w-full text-center pointer-events-none opacity-60 bg-black/20">{hitDie ? `${level}d${hitDie}` : "—"}</div>
          </div>
        </div>
        {form?.hp_max ? (
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${((form?.hp_current||0)/form.hp_max)>0.5 ? "bg-emerald-500" : ((form?.hp_current||0)/form.hp_max)>0.25 ? "bg-yellow-500" : "bg-red-500"}`} style={{width:`${Math.max(0,Math.min(100,((form?.hp_current||0)/form.hp_max)*100))}%`}} />
          </div>
        ) : null}
        {form?.hp_max ? <p className="text-[10px] text-white/25 mt-1.5 text-center">{form?.hp_current ?? 0} / {form?.hp_max} PF {form?.temp_hp ? `+${form.temp_hp} temp` : ""}</p> : null}
        {pfOpen && (
          <>
            <div className="border-t border-white/[0.06] pt-4 mt-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Dadi Vita Rimanenti</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LabelWithGuide fieldKey="hitDiceTotal" label="Totale Dadi Vita" />
                  <div className="veil-input mt-1 w-full pointer-events-none opacity-50">
                    {hitDie ? `${level}d${hitDie}` : "—"}
                  </div>
                </div>
                <div>
                  <LabelWithGuide fieldKey="hitDiceRemaining" label="Rimanenti" />
                  <input type="text" className="veil-input mt-1 w-full"
                    value={cd.hitDiceRemaining || ""}
                    placeholder={hitDie ? `${level}d${hitDie}` : ""}
                    onChange={e => updCd("hitDiceRemaining", e.target.value)}
                    onBlur={() => save({ hitDiceRemaining: ctx.formRef.current?.character_data?.hitDiceRemaining })} />
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-4 mt-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Tiri per la Morte</h3>
              <p className="text-[10px] text-white/30 mb-3">3 successi = stabilizzato, 3 fallimenti = morte. Si azzera dopo ogni riposo breve o lungo.</p>
              <div className="grid grid-cols-2 gap-4">
                <NumberBubbles
                  label="Successi"
                  count={3}
                  filled={cd.deathSaveSuccesses || 0}
                  onToggle={i => {
                    const cur = cd.deathSaveSuccesses || 0;
                    const newVal = cur > i ? i : i + 1;
                    updCd("deathSaveSuccesses", newVal);
                    save({ deathSaveSuccesses: newVal });
                  }}
                  color="emerald"
                />
                <NumberBubbles
                  label="Fallimenti"
                  count={3}
                  filled={cd.deathSaveFailures || 0}
                  onToggle={i => {
                    const cur = cd.deathSaveFailures || 0;
                    const newVal = cur > i ? i : i + 1;
                    updCd("deathSaveFailures", newVal);
                    save({ deathSaveFailures: newVal });
                  }}
                  color="red"
                />
              </div>
            </div>
          </>
        )}
      </div>

            {/* Entra in combattimento */}
      <div className="veil-panel p-4 text-center">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-1">Combattimento</h3>
        <p className="text-[10px] text-white/30 mb-3">
          Inserisci la tua iniziativa e gestisci il tuo turno passo dopo passo, come nelle regole D&D 5.
        </p>
        <button type="button" onClick={() => setShowCombat(true)}
          className="rounded-xl border border-veil-gold/40 bg-veil-gold/10 px-5 py-3 text-sm text-veil-gold hover:bg-veil-gold/20 transition font-medium">
          ⚔️ Entra in Combattimento
        </button>
      </div>

      {showCombat && <CombatOverlay ctx={ctx} onClose={() => setShowCombat(false)} />}
    </div>
  );
}