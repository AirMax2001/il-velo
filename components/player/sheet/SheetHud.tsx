"use client";
import { useState } from "react";
import type { SheetCtx } from "./types";
import { ResourceBar } from "./ResourceBar";

/* Barra sempre visibile sopra i tab: tutto ciò che serve "in tavolo"
   (HP, CA, iniziativa, condizioni, risorse di classe, tiro rapido)
   senza dover navigare per trovarlo. */
export function SheetHud({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, conditions, clsKey, level, pb, dexMod, updCdAll, save, upd } = ctx;
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);

  const hpMax = Number(form?.hp_max) || 0;
  const hpCur = Number(form?.hp_current) || 0;
  const tempHp = Number(form?.temp_hp) || 0;
  const hpPct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;
  const ac = Number(cd.armorClass) || 10;
  const initiative = cd.initiative !== undefined ? Number(cd.initiative) : dexMod;
  const down = hpCur <= 0;

  function adjustHp(delta: number) {
    const next = Math.max(0, Math.min(hpMax || 999, hpCur + delta));
    upd("hp_current", next);
    save({ hp_current: next });
  }

  function rollD20() {
    setRolling(true);
    const r = 1 + Math.floor(Math.random() * 20);
    setTimeout(() => { setRoll(r); setRolling(false); }, 220);
  }

  return (
    <div className="sticky top-0 z-20 -mx-2 sm:-mx-4 lg:-mx-8 mb-3 border-b border-veil-gold/15 bg-[#10141b]/97 backdrop-blur-md px-2 sm:px-4 lg:px-8 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* HP */}
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <button type="button" onClick={() => adjustHp(-1)}
            className="w-6 h-6 rounded-lg border border-red-400/25 text-red-300/80 text-xs hover:bg-red-400/10">−</button>
          <div className="w-20">
            <div className="flex items-baseline gap-1 justify-center">
              <span className={`text-sm font-medium ${down ? "text-red-400" : "text-white/85"}`}>{hpCur}</span>
              <span className="text-[10px] text-white/30">/ {hpMax}</span>
              {tempHp > 0 && <span className="text-[9px] text-cyan-300/70">+{tempHp}</span>}
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-0.5">
              <div className={`h-full rounded-full transition-all ${hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <button type="button" onClick={() => adjustHp(1)}
            className="w-6 h-6 rounded-lg border border-emerald-400/25 text-emerald-300/80 text-xs hover:bg-emerald-400/10">+</button>
        </div>

        {/* CA / Iniziativa */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="text-center">
            <div className="text-white/85 font-medium">🛡 {ac}</div>
            <div className="text-[9px] text-white/30">CA</div>
          </div>
          <div className="text-center">
            <div className="text-white/85 font-medium">{initiative >= 0 ? `+${initiative}` : initiative}</div>
            <div className="text-[9px] text-white/30">Iniz.</div>
          </div>
        </div>

        {/* Condizioni */}
        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {conditions.map(c => (
              <span key={c} className="rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 text-[9px] text-red-300/80">{c}</span>
            ))}
          </div>
        )}
        {down && (
          <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[9px] text-red-300 animate-pulse">
            ⚠ a 0 PF — tiri salvezza contro la morte
          </span>
        )}

        {/* Risorse di classe compatte */}
        {clsKey && (
          <ResourceBar clsKey={clsKey} level={level} pb={pb} cd={cd} updCdAll={updCdAll} save={save} compact />
        )}

        {/* Tiro rapido d20 */}
        <button type="button" onClick={rollD20}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-veil-gold/25 px-2.5 py-1 text-[11px] text-veil-gold/85 hover:bg-veil-gold/10 transition">
          <span className={rolling ? "animate-spin inline-block" : ""}>🎲</span>
          {roll !== null ? <span className="font-medium">{roll}</span> : "d20"}
        </button>
      </div>
    </div>
  );
}
