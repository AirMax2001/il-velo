"use client";
import { useEffect, useState } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";
import { parseConditions } from "@/lib/characterEngine";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";

/* Colonna sempre visibile nel pannello DM: stato del party a colpo d'occhio
   (HP, condizioni) senza dover aprire il tab Giocatori e cercare la card
   giusta. Sincronizzata in realtime con i salvataggi dei giocatori. */
export function PartyStatusRail({ sessionId, onOpenPlayers }: { sessionId: string; onOpenPlayers: () => void }) {
  const [players, setPlayers] = useState<any[]>([]);

  async function load() {
    if (!sessionId) return;
    const d = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()).catch(() => null);
    if (d?.players) setPlayers(d.players);
  }

  useEffect(() => { load(); }, [sessionId]);
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToTable("players", sessionId, load);
    const t = setInterval(load, 30000);
    return () => { unsubscribe(); clearInterval(t); };
  }, [sessionId]);

  if (!sessionId) return null;

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-2 border-r border-white/[0.06] bg-black/20 p-3 overflow-y-auto">
      <button onClick={onOpenPlayers}
        className="text-[10px] uppercase tracking-wider text-veil-gold/60 hover:text-veil-gold text-left mb-1">
        Party ({players.length})
      </button>
      {players.length === 0 && <p className="text-[10px] text-white/25">Nessun giocatore ancora.</p>}
      {players.map(p => {
        const hpMax = Number(p.hp_max) || 0;
        const hpCur = Number(p.hp_current) || 0;
        const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;
        const conditions = parseConditions(p.conditions);
        const down = hpCur <= 0;
        return (
          <button key={p.id} onClick={onOpenPlayers}
            className={`rounded-xl border p-2 text-left transition ${down ? "border-red-500/40 bg-red-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"}`}>
            <div className="flex items-center gap-2">
              <PlayerAvatar url={p.avatar_url} name={p.character_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/85 truncate">{p.character_name}</p>
                <p className="text-[9px] text-white/30 truncate">{p.class} · lv {p.level || 1}</p>
              </div>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[9px] text-white/40">
                <span>{hpCur}/{hpMax} PF</span>
                {down && <span className="text-red-400">⚠</span>}
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-0.5">
                <div className={`h-full rounded-full ${pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {conditions.slice(0, 3).map(c => (
                  <span key={c} className="rounded-full border border-red-400/25 bg-red-400/10 px-1.5 py-0.5 text-[8px] text-red-300/80">{c}</span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </aside>
  );
}
