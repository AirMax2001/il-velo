"use client";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type LocationPopupProps = {
  locationId: string;
  onClose: () => void;
};

export function LocationPopup({ locationId, onClose }: LocationPopupProps) {
  const { resolver } = useGameEngine();
  const loc = resolver.resolveLocation(locationId);
  const npcs = resolver.resolveNpcsAtLocation(locationId);
  const connected = resolver.resolveConnectedLocations(locationId);

  if (!loc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0f1015] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-white/30 hover:text-white text-lg">&times;</button>

        <div className="flex items-start gap-4 mb-5">
          <span className="text-4xl">{loc.emoji || "📍"}</span>
          <div>
            <h3 className="text-xl text-veil-gold">{loc.name}</h3>
            {loc.type && <p className="mt-0.5 text-sm text-white/50 capitalize">{loc.type}</p>}
          </div>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {loc.description && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Descrizione</p>
              <p className="text-sm text-white/60 leading-relaxed">{loc.description}</p>
            </div>
          )}

          {loc.ambient && (
            <div className="rounded-lg border border-cyan-500/10 bg-cyan-900/8 px-3 py-2">
              <p className="text-[10px] text-cyan-300/60 uppercase tracking-[0.15em]">Ambiente</p>
              <p className="text-xs text-cyan-200/70 mt-0.5">{loc.ambient}</p>
            </div>
          )}

          {loc.lootTable && loc.lootTable.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Possibile loot</p>
              <div className="flex flex-wrap gap-1">
                {loc.lootTable.map((item: string, i: number) => (
                  <span key={i} className="rounded bg-emerald-900/15 px-2 py-0.5 text-[10px] text-emerald-300/60">{item}</span>
                ))}
              </div>
            </div>
          )}

          {loc.hazards && loc.hazards.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-red-300/50 mb-1">Pericoli</p>
              <div className="flex flex-wrap gap-1">
                {loc.hazards.map((h: string, i: number) => (
                  <span key={i} className="rounded bg-red-900/15 px-2 py-0.5 text-[10px] text-red-300/60">{h}</span>
                ))}
              </div>
            </div>
          )}

          {npcs.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">NPC presenti</p>
              <div className="flex flex-wrap gap-1">
                {npcs.map((n: any) => (
                  <span key={n.id} className="rounded-lg border border-stone-500/20 bg-stone-900/30 px-2.5 py-1 text-xs text-stone-300/70">○ {n.name}</span>
                ))}
              </div>
            </div>
          )}

          {connected.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Luoghi collegati</p>
              <div className="flex flex-wrap gap-1">
                {connected.map((l: any) => (
                  <span key={l.id} className="rounded-lg border border-cyan-500/20 bg-cyan-900/20 px-2.5 py-1 text-xs text-cyan-200/70">{l.emoji || "📍"} {l.name}</span>
                ))}
              </div>
            </div>
          )}

          {loc.dmNotes && (
            <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50 mb-1">Note DM</p>
              <p className="text-xs text-veil-gold/70">{loc.dmNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}