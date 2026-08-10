"use client";
import {
  ALL_SAVES, SAVE_ABILITY, SAVE_LABELS, getModifier,
  type SaveKey,
} from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step6Saves({ ctx }: { ctx: WizardCtx }) {
  const { cls, finalScores, pb } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Tiri Salvezza</h2>
        <p className="text-sm text-white/50 mt-1">I tiri salvezza derivano automaticamente dalla classe. Non si possono scegliere al livello 1.</p>
      </div>
      <div className="grid gap-2">
        {ALL_SAVES.map(save => {
          const isProficient = cls?.savingThrows.includes(save) || false;
          const ability = SAVE_ABILITY[save];
          const abilityScore = finalScores?.[ability] ?? 10;
          const modVal = getModifier(abilityScore);
          const total = isProficient ? modVal + pb : modVal;
          return (
            <div key={save} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${isProficient ? "border-veil-gold/20 bg-veil-gold/[0.04]" : "border-white/[0.04] bg-black/20 opacity-50"}`}>
              <div className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${isProficient ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                {isProficient ? "✓" : ""}
              </div>
              <span className={`text-sm flex-1 ${isProficient ? "text-white/80" : "text-white/40"}`}>{SAVE_LABELS[save]}</span>
              <span className={`text-sm font-bold ${isProficient ? "text-veil-gold" : "text-white/30"}`}>
                {total >= 0 ? `+${total}` : `${total}`}
              </span>
              {isProficient && <span className="text-[10px] text-veil-gold/40">mod+PB({pb})</span>}
            </div>
          );
        })}
      </div>
      {cls && (
        <p className="text-[11px] text-white/30 text-center">
          I {cls.name} sono competenti in {cls.savingThrows.map(s => SAVE_LABELS[s as SaveKey]).join(" e ")}.
          Puoi aggiungere competenze extra dalla scheda personaggio dopo la creazione.
        </p>
      )}
    </div>
  );
}