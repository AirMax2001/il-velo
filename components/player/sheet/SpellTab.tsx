"use client";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import {
  CONDITIONS_LIST, parseConditions, serializeConditions,
  getModifier, ALL_SKILLS, SKILL_ABILITY, ABILITY_SHORT, SKILL_LABELS,
} from "@/lib/characterEngine";
import { getSpellsForClass } from "@/lib/data/spells";
import { CLASS_ABILITIES, type ClassAbility } from "@/lib/data/classAbilities";
import { NumberBubbles } from "./ui";
import type { SheetCtx } from "./types";

const SKILL_LIST = ALL_SKILLS.map(k => ({ key: k, label: SKILL_LABELS[k], ability: SKILL_ABILITY[k] }));

export function SpellTab({ ctx }: { ctx: SheetCtx }) {
  const {
    form, cd, clsKey, clsData, level, pb, attacks, conditions,
    hitDie, autoSlotTotals, spellSlots, upd, updCd, updCdAll, save,
  } = ctx;

  const canCast = !!clsData?.spellcasting;
  const cantrips = (cd.cantrips || []) as string[];
  const knownSpells = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv =>
    (((cd as any)[`spells${lv}`] || []) as string[]).map(name => ({ name, lv })));

  const selectedAbilities: ClassAbility[] = (cd.classAbilities || [])
    .map(key => (CLASS_ABILITIES[clsKey || ""] || []).find(a => a.key === key))
    .filter((a): a is ClassAbility => !!a);

  const chosenSkills = SKILL_LIST.filter(s => (cd as any)[s.key]);

  const spellDesc = (name: string) => getSpellsForClass(clsKey || "", 0).find(s => s.name === name)
    || [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv => getSpellsForClass(clsKey || "", lv)).find(s => s.name === name);

  return (
    <div className="space-y-4">
      {/* Slot incantesimi disponibili */}
      {canCast && (
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Slot Incantesimi Disponibili</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
              const total = autoSlotTotals[lv] ?? 0;
              const used = spellSlots[lv]?.expended ?? 0;
              const available = Math.max(0, total - used);
              return (
                <div key={lv} className="text-center">
                  <p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p>
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
                  {total > 0 && <p className="text-[9px] text-white/25 mt-0.5">{available} disponibili</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attacchi */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-veil-gold/80 font-medium">Attacchi</h3>
          <button onClick={() => updCdAll({ attacks: [...attacks, { name: "", bonus: "", damage: "", type: "" }] })}
            className="text-xs text-veil-gold/60 hover:text-veil-gold border border-veil-gold/20 rounded-lg px-2 py-1 transition">
            + Aggiungi
          </button>
        </div>
        {attacks.length === 0 && (
          <p className="text-xs text-white/30 text-center py-3">Nessun attacco. Clicca "+ Aggiungi" per inserirne uno.</p>
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
              <input className="veil-input w-20 text-xs text-center" placeholder="Tipo"
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

      {/* Abilità selezionate */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Abilità</h3>
        {chosenSkills.length === 0 && (
          <p className="text-xs text-white/30 text-center py-2">Nessuna abilità selezionata. Sceglile nel tab Nucleo.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {chosenSkills.map(sk => {
            const score = Number(cd[sk.ability as keyof typeof cd]) || 10;
            const mod = getModifier(score);
            const total = mod + pb;
            return (
              <div key={sk.key} className="flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-900/[0.05] px-2.5 py-1.5">
                <span className="flex-1 text-xs text-white/70">{sk.label}</span>
                <span className="text-[10px] text-white/25">{ABILITY_SHORT[sk.ability]}</span>
                <span className="text-xs font-medium text-emerald-300">{total >= 0 ? `+${total}` : `${total}`}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Caratteristiche di classe attivabili */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Capacità di Classe</h3>
        <p className="text-[10px] text-white/30 mb-3">
          Attivate nel tab Nucleo → Caratteristiche di Classe ({selectedAbilities.length} attive).
        </p>
        {selectedAbilities.length === 0 && (
          <p className="text-xs text-white/30 text-center py-2">
            Nessuna capacità attivabile selezionata. Vai nel tab Nucleo, sezione "Caratteristiche di Classe", e spunta le capacità da usare in gioco.
          </p>
        )}
        <div className="space-y-2">
          {selectedAbilities.map(a => (
            <div key={a.key} className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-white/80 font-medium">✦ {a.name}</p>
                <div className="flex gap-1">
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] text-indigo-300/80">{a.action}</span>
                  {a.die && <span className="rounded-full bg-veil-gold/15 px-2 py-0.5 text-[10px] text-veil-gold/70">🎲 {a.die}</span>}
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">{a.uses}</span>
                </div>
              </div>
              <p className="text-[11px] text-white/40 mt-1.5">{a.effect}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trucchetti */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Trucchetti</h3>
        <p className="text-[10px] text-white/30 mb-2">A volontà, non consumano slot.</p>
        {cantrips.length === 0 && <p className="text-xs text-white/30 text-center py-2">Nessun trucchetto selezionato ({clsData?.name || "—"} non ne ha o non ancora).</p>}
        <div className="space-y-2">
          {cantrips.map(name => {
            const sp = spellDesc(name);
            return (
              <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white/80">{name}</p>
                  <span className="text-[10px] text-white/25">{sp?.school || ""}</span>
                </div>
                {sp && <p className="text-[11px] text-white/40 mt-1">{sp.description}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Incantesimi */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Incantesimi</h3>
        <p className="text-[10px] text-white/30 mb-2">Consumano slot del livello corrispondente.</p>
        {knownSpells.length === 0 && <p className="text-xs text-white/30 text-center py-2">Nessun incantesimo selezionato.</p>}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
          const list = knownSpells.filter(s => s.lv === lv);
          if (list.length === 0) return null;
          return (
            <div key={lv} className="mb-2">
              <p className="text-xs text-white/30 mb-1">{lv}° Livello</p>
              <div className="space-y-2">
                {list.map(({ name }) => {
                  const sp = spellDesc(name);
                  return (
                    <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-white/80">{name}</p>
                        <span className="text-[10px] text-white/25">{sp?.school || ""}</span>
                      </div>
                      {sp && <p className="text-[11px] text-white/40 mt-1">{sp.description}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dadi vita tracciamento */}
      <div className="veil-panel p-4">
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

      {/* Tiri per la morte */}
      <div className="veil-panel p-4">
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

      {/* Condizioni */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Condizioni</h3>
        <p className="text-[10px] text-white/30 mb-3">Le condizioni vengono assegnate dal DM. Qui puoi anche aggiungerle manualmente.</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {conditions.map(c => (
            <span key={c} className="rounded-full border border-red-500/30 bg-red-900/20 px-2.5 py-1 text-xs text-red-300/80 flex items-center gap-1">
              {c}
              <button onClick={() => {
                const nc = conditions.filter(x => x !== c);
                upd("conditions", serializeConditions(nc));
                save({ conditions: serializeConditions(nc) });
              }} className="text-red-300/40 hover:text-red-300 ml-0.5">×</button>
            </span>
          ))}
          {conditions.length === 0 && <span className="text-xs text-white/25">Nessuna condizione attiva</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {CONDITIONS_LIST.filter(c => !conditions.includes(c)).map(c => (
            <button key={c} onClick={() => {
              const nc = [...conditions, c];
              upd("conditions", serializeConditions(nc));
              save({ conditions: serializeConditions(nc) });
            }} className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/35 hover:border-white/25 hover:text-white/60 transition">
              + {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}