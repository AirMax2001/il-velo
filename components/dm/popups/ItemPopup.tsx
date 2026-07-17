"use client";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type ItemPopupProps = {
  itemId: string;
  onClose: () => void;
};

export function ItemPopup({ itemId, onClose }: ItemPopupProps) {
  const { resolver } = useGameEngine();
  const item = resolver.resolveItem(itemId);

  if (!item) return null;

  const rarityColors: Record<string, string> = {
    common: "text-white/50 border-white/10",
    uncommon: "text-emerald-300 border-emerald-500/20",
    rare: "text-sky-300 border-sky-500/20",
    legendary: "text-veil-gold border-veil-gold/30",
    artifact: "text-purple-300 border-purple-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0f1015] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-white/30 hover:text-white text-lg">&times;</button>

        <div className="flex items-start gap-4 mb-5">
          <span className="text-3xl">{item.emoji || (item.rarity === "legendary" || item.rarity === "artifact" ? "🌟" : "◆")}</span>
          <div>
            <h3 className="text-xl text-veil-gold">{item.name}</h3>
            <span className={`inline-block mt-1 rounded-lg border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${rarityColors[item.rarity] || rarityColors.common}`}>
              {item.rarity}
            </span>
            {item.type && <span className="ml-2 text-xs text-white/40 capitalize">{item.type}</span>}
          </div>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          <p className="text-sm text-white/60 leading-relaxed">{item.description}</p>

          {item.effects && item.effects.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Effetti</p>
              <div className="space-y-1">
                {item.effects.map((e: string, i: number) => (
                  <p key={i} className="text-xs text-violet-200/70">✦ {e}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {item.value != null && <span className="rounded bg-veil-gold/8 px-2 py-0.5 text-[10px] text-veil-gold">{item.value} ◎</span>}
            {item.weight != null && <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] text-white/40">{item.weight} kg</span>}
            {item.requiresAttunement && <span className="rounded bg-purple-900/20 px-2 py-0.5 text-[10px] text-purple-300">Richiede sintonia</span>}
            {item.charges != null && <span className="rounded bg-amber-900/20 px-2 py-0.5 text-[10px] text-amber-300">{item.charges} cariche</span>}
          </div>
        </div>
      </div>
    </div>
  );
}