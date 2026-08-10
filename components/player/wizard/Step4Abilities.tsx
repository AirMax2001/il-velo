"use client";
import {
  ALL_ABILITIES, ABILITY_LABELS, ABILITY_SHORT, STANDARD_ARRAY,
  POINT_BUY_COST, POINT_BUY_MAX, POINT_BUY_RANGE,
  formatMod, getModifier, rollAbilityScores,
  type AbilityName,
} from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step4Abilities({ ctx }: { ctx: WizardCtx }) {
  const { data, update, setData, cls, finalScores, hp } = ctx;
  const METHOD_LABELS = { standard_array: "Standard Array", point_buy: "Point Buy", roll_4d6: "Tira 4d6" } as const;

  // Caratteristiche consigliate: quelle primarie della classe + Costituzione (per i PF)
  const recommended: AbilityName[] = (() => {
    const list: AbilityName[] = [...((cls?.primaryAbility as AbilityName[]) || [])];
    if (cls && !list.includes("constitution")) list.push("constitution");
    return list;
  })();

  // Distribuzione automatica: punteggi più alti alle caratteristiche consigliate
  function autoDistribute() {
    const priority: AbilityName[] = [];
    ((cls?.primaryAbility as AbilityName[]) || []).forEach(a => { if (!priority.includes(a)) priority.push(a); });
    if (!priority.includes("constitution")) priority.push("constitution");
    ALL_ABILITIES.forEach(a => { if (!priority.includes(a)) priority.push(a); });
    const sorted = [...STANDARD_ARRAY].sort((a, b) => b - a);
    const newIndices: Partial<Record<AbilityName, number>> = {};
    priority.forEach((a, i) => { newIndices[a] = STANDARD_ARRAY.indexOf(sorted[i]); });
    setData(prev => ({ ...prev, assignedIndices: newIndices }));
  }

  function getStdScore(a: AbilityName): number | undefined {
    const idx = data.assignedIndices[a];
    return idx !== undefined ? STANDARD_ARRAY[idx] : undefined;
  }

  function assignStdIndex(a: AbilityName, idx: number) {
    setData(prev => {
      const newIndices = { ...prev.assignedIndices };
      const existing = Object.entries(newIndices).find(([, i]) => i === idx);
      if (existing) delete newIndices[existing[0] as AbilityName];
      newIndices[a] = idx;
      return { ...prev, assignedIndices: newIndices };
    });
  }

  function setPointBuyScore(a: AbilityName, v: number) {
    if (v < POINT_BUY_RANGE.min || v > POINT_BUY_RANGE.max) return;
    setData(prev => ({ ...prev, baseScores: { ...prev.baseScores, [a]: v } }));
  }

  const pointBuyUsed = ALL_ABILITIES.reduce((s, a) => s + (POINT_BUY_COST[data.baseScores[a] ?? 0] || 0), 0);
  const pointBuyLeft = POINT_BUY_MAX - pointBuyUsed;

  function doRoll() {
    const rolled = rollAbilityScores().sort((a, b) => b - a);
    setData(prev => ({ ...prev, rolledScores: rolled, rolledAssigned: {} }));
  }
  function assignRolledIndex(a: AbilityName, idx: number) {
    setData(prev => {
      const newAssign = { ...prev.rolledAssigned };
      const existing = Object.entries(newAssign).find(([, i]) => i === idx);
      if (existing) delete newAssign[existing[0] as AbilityName];
      newAssign[a] = idx;
      return { ...prev, rolledAssigned: newAssign };
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Caratteristiche</h2>
        <p className="text-sm text-white/50 mt-1">I sei punteggi fondamentali del personaggio. Scegli il metodo di generazione.</p>
      </div>

      {/* Method selector */}
      <div className="flex gap-2">
        {(["standard_array", "point_buy", "roll_4d6"] as const).map(m => (
          <button key={m} onClick={() => {
            update("abilityMethod", m);
            setData(prev => ({ ...prev, assignedIndices: {}, baseScores: {}, rolledScores: [], rolledAssigned: {} }));
          }}
            className={`rounded-xl border px-3 py-2 text-xs transition flex-1 ${data.abilityMethod === m ? "border-veil-gold/50 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/30 text-white/50 hover:border-white/[0.12]"}`}>
            {METHOD_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Standard Array */}
      {data.abilityMethod === "standard_array" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-white/35">Assegna ciascuno dei valori [{STANDARD_ARRAY.join(", ")}] a una caratteristica.</p>
            {cls && (
              <button onClick={autoDistribute}
                className="shrink-0 rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[11px] text-veil-gold hover:bg-veil-gold/20 transition">
                ✨ Distribuzione Consigliata
              </button>
            )}
          </div>
          <div className="grid gap-2">
            {ALL_ABILITIES.map(a => {
              const assignedIdx = data.assignedIndices[a];
              const isRecommended = recommended.includes(a);
              return (
                <div key={a} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                  <div className="w-28 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-white/60">{ABILITY_LABELS[a]}</span>
                      {isRecommended && (
                        <span className="rounded bg-veil-gold/20 px-1.5 py-0.5 text-[9px] text-veil-gold" title={`Consigliata per ${cls?.name || "la classe"}`}>Consigliata ⭐</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap flex-1">
                    {STANDARD_ARRAY.map((v, idx) => {
                      const usedByOther = Object.entries(data.assignedIndices).some(([k, i]) => i === idx && k !== a);
                      const isSelected = assignedIdx === idx;
                      return (
                        <button key={idx} onClick={() => assignStdIndex(a, idx)}
                          className={`rounded-lg px-2.5 py-1 text-xs transition min-w-[32px] ${isSelected ? "bg-veil-gold/20 border border-veil-gold/50 text-veil-gold font-bold" : usedByOther ? "bg-white/[0.03] text-white/20 border border-white/[0.04] cursor-not-allowed line-through" : "bg-white/10 text-white/60 hover:bg-white/20 border border-transparent"}`}
                          disabled={usedByOther}>
                          {v}
                        </button>
                      );
                    })}
                  </div>
                  {assignedIdx !== undefined && (
                    <span className="text-sm text-veil-gold font-bold w-8 text-right">{formatMod(STANDARD_ARRAY[assignedIdx])}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Point Buy */}
      {data.abilityMethod === "point_buy" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/35">Valori da {POINT_BUY_RANGE.min} a {POINT_BUY_RANGE.max}.</p>
            <span className={`text-xs font-medium ${pointBuyLeft < 0 ? "text-red-400" : pointBuyLeft === 0 ? "text-emerald-400" : "text-veil-gold"}`}>
              Punti: {pointBuyUsed}/{POINT_BUY_MAX} ({pointBuyLeft >= 0 ? `${pointBuyLeft} rimasti` : `${Math.abs(pointBuyLeft)} superato!`})
            </span>
          </div>
          <div className="grid gap-2">
            {ALL_ABILITIES.map(a => {
              const v = data.baseScores[a] ?? POINT_BUY_RANGE.min;
              const cost = POINT_BUY_COST[v] || 0;
              const isRecommended = recommended.includes(a);
              return (
                <div key={a} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                  <div className="w-28 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-white/60">{ABILITY_LABELS[a]}</span>
                      {isRecommended && (
                        <span className="rounded bg-veil-gold/20 px-1.5 py-0.5 text-[9px] text-veil-gold">Consigliata ⭐</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setPointBuyScore(a, v - 1)} disabled={v <= POINT_BUY_RANGE.min}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20 disabled:opacity-30">−</button>
                  <span className="w-8 text-center text-lg font-bold text-white">{v}</span>
                  <button onClick={() => setPointBuyScore(a, v + 1)} disabled={v >= POINT_BUY_RANGE.max || pointBuyLeft <= (POINT_BUY_COST[v + 1] || 0) - cost}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20 disabled:opacity-30">+</button>
                  <span className="text-xs text-veil-gold">{formatMod(v)}</span>
                  <span className="text-[10px] text-white/25 ml-auto">costo {cost}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Roll 4d6 */}
      {data.abilityMethod === "roll_4d6" && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/35">Tira 4d6 per ogni caratteristica, scarta il dado più basso. Poi assegna i valori.</p>
          <button onClick={doRoll}
            className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2 text-xs text-veil-gold hover:bg-veil-gold/20 w-full">
            {data.rolledScores.length > 0 ? `🎲 Ritira — Valori attuali: [${data.rolledScores.join(", ")}]` : "🎲 Tira i dadi"}
          </button>
          {data.rolledScores.length > 0 && (
            <div className="grid gap-2">
              {ALL_ABILITIES.map(a => {
                const assignedIdx = data.rolledAssigned[a];
                const isRecommended = recommended.includes(a);
                return (
                  <div key={a} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                    <div className="w-28 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white/60">{ABILITY_LABELS[a]}</span>
                        {isRecommended && (
                          <span className="rounded bg-veil-gold/20 px-1.5 py-0.5 text-[9px] text-veil-gold">Consigliata ⭐</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap flex-1">
                      {data.rolledScores.map((v, idx) => {
                        const usedByOther = Object.entries(data.rolledAssigned).some(([k, i]) => i === idx && k !== a);
                        const isSelected = assignedIdx === idx;
                        return (
                          <button key={idx} onClick={() => assignRolledIndex(a, idx)}
                            className={`rounded-lg px-2.5 py-1 text-xs transition min-w-[32px] ${isSelected ? "bg-veil-gold/20 border border-veil-gold/50 text-veil-gold font-bold" : usedByOther ? "bg-white/[0.03] text-white/20 border border-white/[0.04] cursor-not-allowed" : "bg-white/10 text-white/60 hover:bg-white/20 border border-transparent"}`}
                            disabled={usedByOther}>
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    {assignedIdx !== undefined && (
                      <span className="text-sm text-veil-gold font-bold w-8 text-right">{formatMod(data.rolledScores[assignedIdx])}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Preview con bonus razziali */}
      {finalScores && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
          <p className="text-xs text-emerald-300/80 font-semibold mb-2">Punteggi Finali (con bonus razziali)</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {ALL_ABILITIES.map(a => (
              <div key={a} className="text-center rounded-lg bg-black/20 p-2">
                <p className="text-white/35 text-[10px]">{ABILITY_SHORT[a]}</p>
                <p className="text-lg font-bold text-white">{finalScores[a]}</p>
                <p className="text-veil-gold text-xs">{formatMod(finalScores[a])}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-500/10 grid grid-cols-2 gap-2 text-[10px] text-white/40">
            <span>PF iniziali: <strong className="text-white/60">{hp}</strong></span>
            <span>Iniziativa: <strong className="text-white/60">{formatMod(finalScores.dexterity)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}