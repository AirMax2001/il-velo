"use client";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type CombatPopupProps = {
  combatId: string;
  onClose: () => void;
};

export function CombatPopup({ combatId, onClose }: CombatPopupProps) {
  const { resolver } = useGameEngine();
  const quest = resolver.resolveQuest(combatId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0f1015] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-white/30 hover:text-white text-lg">&times;</button>

        <div className="flex items-start gap-4 mb-5">
          <span className="text-3xl">⚔</span>
          <div>
            <h3 className="text-xl text-veil-gold">{quest?.name || combatId}</h3>
            {quest?.type && <p className="mt-0.5 text-xs text-white/30 capitalize">{quest.type}</p>}
          </div>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {quest?.description && (
            <p className="text-sm text-white/60 leading-relaxed">{quest.description}</p>
          )}

          {quest?.objectives && quest.objectives.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Obiettivi</p>
              <div className="space-y-1">
                {quest.objectives.map((obj: any, i: number) => (
                  <p key={i} className="text-xs text-white/50">◈ {obj.description}</p>
                ))}
              </div>
            </div>
          )}

          {quest?.rewards && (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-900/10 p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/60 mb-1">Ricompense</p>
              {quest.rewards.xp && <p className="text-xs text-emerald-300/80">XP: {quest.rewards.xp}</p>}
              {quest.rewards.items?.length > 0 && (
                <p className="text-xs text-emerald-300/80 mt-1">Items: {quest.rewards.items.join(", ")}</p>
              )}
              {quest.rewards.veilShift != null && (
                <p className="text-xs text-violet-300/60 mt-1">Veil Shift: {quest.rewards.veilShift > 0 ? "+" : ""}{quest.rewards.veilShift}</p>
              )}
            </div>
          )}

          {(quest?.prerequisites?.length > 0 || quest?.failConditions?.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {quest.prerequisites?.map((p: string, i: number) => (
                <span key={i} className="rounded bg-amber-900/15 px-2 py-0.5 text-[10px] text-amber-300/60">Prereq: {p}</span>
              ))}
              {quest.failConditions?.map((f: string, i: number) => (
                <span key={i} className="rounded bg-red-900/15 px-2 py-0.5 text-[10px] text-red-300/60">Fail: {f}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}