"use client";
import backgrounds from "@/lib/data/backgrounds";
import type { BackgroundData } from "@/lib/data/backgrounds";
import { getBackgroundData } from "@/lib/data/backgrounds";
import { SKILL_LABELS } from "@/lib/characterEngine";
import type { SkillKey } from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step3Background({ ctx }: { ctx: WizardCtx }) {
  const { data, update, setData, bg } = ctx;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Background</h2>
        <p className="text-sm text-white/50 mt-1">Il background racconta cosa faceva il tuo personaggio prima di diventare un avventuriero. Garantisce abilità e competenze automaticamente.</p>
      </div>
      <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
        {Object.values(backgrounds as Record<string, BackgroundData>).map(b => (
          <button key={b.key} onClick={() => {
            update("backgroundKey", b.key);
            setData(prev => {
              const oldBg = prev.backgroundKey ? getBackgroundData(prev.backgroundKey) : null;
              const oldBgSkills = (oldBg?.skillProficiencies || []) as SkillKey[];
              const filtered = prev.selectedSkills.filter(s => !oldBgSkills.includes(s));
              return { ...prev, backgroundKey: b.key, selectedSkills: filtered };
            });
          }}
            className={`text-left rounded-xl border p-3 transition ${data.backgroundKey === b.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
            <p className="font-medium text-white text-sm">{b.name}</p>
            <p className="text-[11px] text-white/40 mt-1">{b.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {b.skillProficiencies.map(s => (
                <span key={s} className="rounded bg-emerald-900/20 px-1.5 py-0.5 text-[10px] text-emerald-300/70">
                  {SKILL_LABELS[s as SkillKey] || s}
                </span>
              ))}
              {b.languages > 0 && (
                <span className="rounded bg-blue-900/20 px-1.5 py-0.5 text-[10px] text-blue-300/70">
                  +{b.languages} lingua{b.languages > 1 ? "e" : ""}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {bg && (
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
          <p className="text-xs text-veil-gold/70 font-semibold">Caratteristica: {bg.feature.name}</p>
          <p className="text-[11px] text-white/35">{bg.feature.description}</p>
          {bg.equipment.length > 0 && (
            <div className="mt-2 border-t border-white/[0.05] pt-2">
              <p className="text-[10px] text-white/30">Equipaggiamento iniziale: {bg.equipment.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}