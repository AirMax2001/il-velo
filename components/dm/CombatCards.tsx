"use client";
import { useEffect, useState } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type CombatCardsProps = { sessionId?: string };

export function CombatCards({ sessionId }: CombatCardsProps) {
  const { engine, state, resolver } = useGameEngine();

  const [combats, setCombats] = useState<any[]>([]);
  const [activeCombat, setActiveCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const noteKey = activeCombat ? `veil-combat-note-${activeCombat.id}` : "";

  async function load() {
    if (!sessionId) return;
    const d = await fetch(`/api/combat?sessionId=${sessionId}`).then(r => r.json());
    setCombats(d.items || []);
  }
  useEffect(() => { if (sessionId) { load(); loadPlayers(); } }, [sessionId]);

  async function loadPlayers() {
    if (!sessionId) return;
    const d = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json());
    setPlayers(d.players || []);
  }

  async function loadCombatants(combatId: string) {
    const d = await fetch(`/api/combatants?combatId=${combatId}`).then(r => r.json());
    setCombatants(d.items || []);
  }

  async function selectCombat(c: any) {
    setActiveCombat(c);
    await loadCombatants(c.id);
    engine.startCombat(c.id);
  }

  async function updateCombatant(id: string, fields: any) {
    await fetch("/api/combatants", { method: "PATCH", body: JSON.stringify({ id, ...fields }) });
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }

  async function removeCombatant(id: string) {
    await fetch(`/api/combatants?id=${id}`, { method: "DELETE" });
    setCombatants(prev => prev.filter(c => c.id !== id));
  }

  async function addPlayerToCombat(player: any) {
    if (!activeCombat) return;
    const res = await fetch("/api/combatants", {
      method: "POST",
      body: JSON.stringify({
        combat_id: activeCombat.id,
        name: player.character_name,
        type: "player",
        hp_max: player.hp_max || 20,
        hp_current: player.hp_current || player.hp_max || 20,
        armor_class: 12,
        initiative: 10,
      })
    });
    const data = await res.json();
    if (data.item) setCombatants(prev => [...prev, data.item]);
  }

  async function nextTurn() {
    if (!activeCombat) return;
    const alive = combatants.filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
    const nextIndex = (activeCombat.turn_index + 1) % alive.length;
    const isNewRound = nextIndex === 0;
    await fetch("/api/combat", {
      method: "PATCH",
      body: JSON.stringify({ id: activeCombat.id, turn_index: nextIndex, round: isNewRound ? activeCombat.round + 1 : activeCombat.round })
    });
    setActiveCombat((prev: any) => prev ? { ...prev, turn_index: nextIndex, round: isNewRound ? prev.round + 1 : prev.round } : null);
    if (isNewRound) engine.nextRound();
    else engine.nextTurn();
  }

  useEffect(() => {
    if (!noteKey) return;
    const saved = localStorage.getItem(noteKey);
    if (saved) setNote(saved);
    else setNote("");
  }, [noteKey]);
  useEffect(() => { if (noteKey) localStorage.setItem(noteKey, note); }, [note, noteKey]);

  if (!sessionId) return <p className="text-white/40">Nessuna campagna attiva</p>;

  const alive = [...combatants].filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
  const dead = combatants.filter(c => c.is_dead);
  const currentTurn = activeCombat ? alive[activeCombat.turn_index] : null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Combattimento</h2>
        <div className="flex gap-2">
          {activeCombat && (
            <button onClick={nextTurn} className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-5 py-2 text-sm text-veil-gold hover:bg-veil-gold/20">
              Prossimo turno &rarr;
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {combats.map(c => (
          <button key={c.id} onClick={() => selectCombat(c)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              activeCombat?.id === c.id
                ? "border-red-400/30 bg-red-900/20 text-red-200"
                : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"
            }`}>
            {c.title} {c.is_active ? "⚔" : ""}
          </button>
        ))}
      </div>

      {activeCombat && (
        <>
          <div className="flex items-center gap-5 rounded-2xl border border-red-500/15 bg-red-900/10 p-4 mb-6">
            <div className="text-center">
              <p className="text-[10px] text-white/30">Round</p>
              <p className="text-xl font-semibold text-red-300">{activeCombat.round || 1}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/30">Turno</p>
              <p className="text-xl font-semibold text-white">{currentTurn?.name || "—"}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/60 mb-3">Nemici</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alive.filter(c => c.type !== "player").map(c => (
                <div key={c.id} className={`relative rounded-2xl border-2 p-4 ${
                  currentTurn?.id === c.id ? "border-red-400/60 bg-red-900/20" : "border-red-500/20 bg-black/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-300">{c.type === "boss" ? "⚔" : "○"}</span>
                      <span className="font-medium text-white">{c.name}</span>
                    </div>
                    <button onClick={() => removeCombatant(c.id)} className="text-xs text-white/20 hover:text-red-300">&times;</button>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/40">HP</span>
                      <span className={c.hp_current <= 0 ? "text-red-300" : "text-emerald-400"}>{c.hp_current}/{c.hp_max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.hp_current <= 0 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.max(0, (c.hp_current / Math.max(1, c.hp_max)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-10</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30">+5</button>
                    <button onClick={() => updateCombatant(c.id, { is_dead: !c.is_dead })} className="ml-auto rounded-lg bg-white/10 px-2 py-1 text-xs text-white/50 hover:bg-white/20">{c.is_dead ? "Ripristina" : "Uccidi"}</button>
                  </div>
                  <div className="mt-1 text-[10px] text-white/30">Init: {c.initiative} &middot; CA {c.armor_class}</div>
                  {currentTurn?.id === c.id && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-[10px] text-black font-bold">&gt;</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/60 mb-3">Giocatori</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alive.filter(c => c.type === "player").map(c => (
                <div key={c.id} className={`relative rounded-2xl border-2 p-4 ${
                  currentTurn?.id === c.id ? "border-blue-400/60 bg-blue-900/20" : "border-blue-500/20 bg-black/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{c.name}</span>
                    <button onClick={() => removeCombatant(c.id)} className="text-xs text-white/20 hover:text-red-300">&times;</button>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/40">HP</span>
                      <span className="text-blue-300">{c.hp_current}/{c.hp_max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${Math.max(0, (c.hp_current / Math.max(1, c.hp_max)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 10) })} className="rounded-lg bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+10</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200">-5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200">-10</button>
                  </div>
                  <div className="mt-1 text-[10px] text-white/30">Init: {c.initiative}</div>
                  {currentTurn?.id === c.id && <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-[10px] text-black font-bold">&gt;</span>}
                </div>
              ))}
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-white/30 hover:text-white/60">+ Aggiungi giocatori al combattimento</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {players.filter(p => !combatants.some((c: any) => c.name === p.character_name && c.type === "player")).map(p => (
                  <button key={p.id} onClick={() => addPlayerToCombat(p)} className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-1.5 text-xs text-white/50 hover:border-white/[0.12]">
                    + {p.character_name}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {dead.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-2">Eliminati</p>
              <div className="flex flex-wrap gap-2">
                {dead.map(c => (
                  <span key={c.id} className="rounded-lg border border-white/[0.04] bg-black/30 px-3 py-1.5 text-xs text-white/30 line-through">
                    {c.name}
                    <button onClick={() => updateCombatant(c.id, { is_dead: false })} className="ml-2 text-emerald-400/50 hover:text-emerald-300">&circlearrowleft;</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Note DM</p>
            <textarea className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/60 resize-none focus:outline-none" rows={3}
              placeholder="Note per questo combattimento..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}