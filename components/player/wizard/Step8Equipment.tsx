"use client";
import type { WizardCtx } from "./types";

export function Step8Equipment({ ctx }: { ctx: WizardCtx }) {
  const { data, setData, cls, bg } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Equipaggiamento Iniziale</h2>
        <p className="text-sm text-white/50 mt-1">Scegli l'equipaggiamento previsto dalla tua classe. Il tuo background fornisce ulteriori oggetti.</p>
      </div>
      {cls?.equipment.map((eq, i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-xs text-white/50 mb-2">{eq.label}</p>
          {eq.options.length === 1 ? (
            <p className="text-xs text-white/60">{eq.options[0].map(item => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.name}`).join(", ")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {eq.options.map((option, oi) => (
                <button key={oi} onClick={() => setData(prev => ({ ...prev, equipmentChoices: { ...prev.equipmentChoices, [i]: oi } }))}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${data.equipmentChoices[i] === oi ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/30 text-white/50 hover:border-white/[0.12]"}`}>
                  {option.map((item, j) => <span key={j} className="block">{item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {bg && bg.equipment.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
          <p className="text-xs text-emerald-300/70 font-medium mb-1">Equipaggiamento dal Background: {bg.name}</p>
          <p className="text-xs text-white/50">{bg.equipment.join(", ")}</p>
        </div>
      )}
    </div>
  );
}