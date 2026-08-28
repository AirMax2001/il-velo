"use client";
import { useEffect, useState } from "react";
import { DungeonMapMaker } from "./DungeonMapMaker";

type TableWorkspaceProps = { sessionId: string };

export function TableWorkspace({ sessionId }: TableWorkspaceProps) {
  const [displayMode, setDisplayMode] = useState<"scene" | "world_map" | "battle_grid">("battle_grid");
  const [savedStatus, setSavedStatus] = useState<string>("");

  useEffect(() => {
    if (!sessionId) return;
    // Sincronizza la vista dell'iPad / schermo tavolo via API world_state
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, displayMode }),
    })
      .then(() => {
        setSavedStatus("Sincronizzato sul Tavolo ✓");
        setTimeout(() => setSavedStatus(""), 2500);
      })
      .catch(() => {});
  }, [sessionId, displayMode]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Barra Superiore: Selettore Vista Tavolo (iPad) */}
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-2.5 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-veil-gold animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Vista Tavolo (iPad)</span>
        </div>
        <div className="flex gap-1 ml-2">
          {(["scene", "world_map", "battle_grid"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition ${
                displayMode === mode
                  ? "border-veil-gold/50 bg-veil-gold/20 text-veil-gold shadow"
                  : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {mode === "scene" ? "📺 Scena" : mode === "world_map" ? "🗺 Mappa Mondo" : "⚔️ Griglia Tattica"}
            </button>
          ))}
        </div>
        {savedStatus && (
          <span className="text-[11px] text-emerald-400 font-medium animate-fade-in ml-2">
            {savedStatus}
          </span>
        )}
        <div className="ml-auto">
          <a
            href={`/table?sessionId=${sessionId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-xs font-semibold text-veil-gold hover:bg-veil-gold/20 transition shadow"
          >
            Apri Schermo Tavolo ↗
          </a>
        </div>
      </div>

      {/* Map Maker — occupa tutto lo spazio rimanente */}
      <div className="min-h-0 flex-1">
        <DungeonMapMaker sessionId={sessionId} />
      </div>
    </div>
  );
}

