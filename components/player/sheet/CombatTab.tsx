"use client";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { CONDITIONS_LIST, parseConditions } from "@/lib/characterEngine";
import { serializeConditions } from "@/lib/characterEngine";
import { NumberBubbles } from "./ui";
import type { SheetCtx } from "./types";

export function CombatTab({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, attacks, conditions, hitDie, level, upd, updCd, updCdAll, save } = ctx;

  return (
    <div className="space-y-4">
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