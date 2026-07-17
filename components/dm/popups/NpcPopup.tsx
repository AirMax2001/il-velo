"use client";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type NpcPopupProps = {
  npcId: string;
  onClose: () => void;
};

export function NpcPopup({ npcId, onClose }: NpcPopupProps) {
  const { resolver, state } = useGameEngine();
  const npc = resolver.resolveNPC(npcId);
  if (!npc) return null;

  const relationship = state.save.npcRelationships[npc.id] || "neutral";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0f1015] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-white/30 hover:text-white text-lg">&times;</button>

        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-stone-800/50 text-2xl text-stone-400 font-semibold">
            {npc.emoji || npc.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="text-xl text-veil-gold">{npc.name}</h3>
            {npc.titles?.length > 0 && (
              <p className="mt-0.5 text-sm text-white/50">{npc.titles.join(", ")}</p>
            )}
            <p className="mt-1 text-xs text-white/30 capitalize">{npc.type || "npc"}</p>
          </div>
        </div>

        {npc.statBlock && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-900/20 px-2.5 py-1 text-xs text-emerald-300">HP {npc.statBlock.hp}</span>
            <span className="rounded-lg border border-sky-500/20 bg-sky-900/20 px-2.5 py-1 text-xs text-sky-300">CA {npc.statBlock.ac}</span>
            <span className="rounded-lg border border-amber-500/20 bg-amber-900/20 px-2.5 py-1 text-xs text-amber-300 capitalize">{relationship}</span>
          </div>
        )}

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {npc.secrets?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Segreti</p>
              <div className="space-y-1">
                {npc.secrets.map((s: string, i: number) => (
                  <p key={i} className="rounded-lg bg-red-900/10 border border-red-500/10 px-3 py-1.5 text-xs text-red-200/70">◈ {s}</p>
                ))}
              </div>
            </div>
          )}

          {npc.dialogues && Object.keys(npc.dialogues).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Dialoghi</p>
              {Object.entries(npc.dialogues).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-orange-500/10 bg-orange-900/8 px-3 py-1.5 mb-1">
                  <p className="text-[10px] text-orange-300/60">{key}</p>
                  <p className="text-xs text-white/50">{String(val)}</p>
                </div>
              ))}
            </div>
          )}

          {npc.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {npc.tags.map((t: string) => (
                <span key={t} className="rounded bg-white/8 px-2 py-0.5 text-[10px] text-white/40">{t}</span>
              ))}
            </div>
          )}

          {npc.dmNotes && (
            <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50 mb-1">Note DM</p>
              <p className="text-xs text-veil-gold/70">{npc.dmNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}