"use client";
import { useEffect, useState } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type CombatWorkspaceProps = { sessionId?: string; combatId: string };

export function CombatWorkspace({ sessionId, combatId }: CombatWorkspaceProps) {
  const { engine } = useGameEngine();
  const [combat, setCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<"ordering" | "combat">("ordering");
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [showRules, setShowRules] = useState(false);
  const noteKey = combat ? `veil-combat-note-${combat.id}` : "";

  async function loadCombat() {
    if (!sessionId) return;
    let matched: any = null;
    const all = await fetch(`/api/combat?sessionId=${sessionId}`).then(r => r.json());
    const items: any[] = all.items || [];
    matched = items.find((c: any) => c.id === combatId);
    if (!matched) {
      const slugToName = combatId.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      matched = items.find((c: any) =>
        c.title?.toLowerCase() === slugToName.toLowerCase() ||
        c.title?.toLowerCase().replace(/\s+/g, "-") === combatId.toLowerCase()
      );
    }
    if (matched) {
      setCombat(matched);
      const d = await fetch(`/api/combatants?combatId=${matched.id}`).then(r => r.json());
      setCombatants(d.items || []);
    } else {
      setCombat(null);
      setCombatants([]);
    }
  }

  async function loadPlayers() {
    if (!sessionId) return;
    const d = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json());
    setPlayers(d.players || []);
  }

  useEffect(() => { loadCombat(); loadPlayers(); }, [combatId, sessionId]);

  useEffect(() => {
    if (!noteKey) return;
    const saved = localStorage.getItem(noteKey);
    if (saved) setNote(saved);
    else setNote("");
  }, [noteKey]);
  useEffect(() => { if (noteKey) localStorage.setItem(noteKey, note); }, [note, noteKey]);

  async function updateCombatant(id: string, fields: any) {
    await fetch("/api/combatants", { method: "PATCH", body: JSON.stringify({ id, ...fields }) });
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }

  function handleOrderClick(id: string) {
    setTurnOrder(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  }

  async function startCombat() {
    if (!combat?.id || turnOrder.length === 0) return;
    // Save sort_order based on click order
    for (let i = 0; i < turnOrder.length; i++) {
      await fetch("/api/combatants", {
        method: "PATCH",
        body: JSON.stringify({ id: turnOrder[i], sort_order: i, initiative: 20 - i })
      });
    }
    setCombatants(prev => prev.map(c => {
      const idx = turnOrder.indexOf(c.id);
      return idx >= 0 ? { ...c, sort_order: idx, initiative: 20 - idx } : c;
    }));
    await fetch("/api/combat", {
      method: "PATCH",
      body: JSON.stringify({ id: combat.id, turn_index: 0, round: 1, is_active: true })
    });
    setCombat({ ...combat, turn_index: 0, round: 1, is_active: true });
    engine.startCombat(combat.id);
    setPhase("combat");
    syncToTable();
  }

  function syncToTable() {
    if (!sessionId) return;
    try {
      const ordered = combatants.filter(c => !c.is_dead).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat?.title || "Combattimento",
        currentTurn: ordered[0]?.name || "",
        round: 1,
      }));
    } catch {}
  }

  async function nextTurn() {
    if (!combat?.id) return;
    const alive = [...combatants].filter(c => !c.is_dead).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    if (alive.length === 0) return;
    const nextIndex = (combat.turn_index + 1) % alive.length;
    const isNewRound = nextIndex === 0;
    await fetch("/api/combat", {
      method: "PATCH",
      body: JSON.stringify({
        id: combat.id,
        turn_index: nextIndex,
        round: isNewRound ? combat.round + 1 : combat.round
      })
    });
    setCombat((prev: any) => prev ? { ...prev, turn_index: nextIndex, round: isNewRound ? prev.round + 1 : prev.round } : null);
    if (isNewRound) engine.nextRound();
    else engine.nextTurn();
    try {
      const aliveNow = [...combatants].filter(c => !c.is_dead).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat?.title,
        currentTurn: aliveNow[nextIndex]?.name || "",
        round: isNewRound ? combat.round + 1 : combat.round,
      }));
    } catch {}
  }

  async function addPlayerToCombat(player: any) {
    if (!combat?.id) return;
    const res = await fetch("/api/combatants", {
      method: "POST",
      body: JSON.stringify({
        combat_id: combat.id,
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

  async function deleteCurrentCombat() {
    if (!combat?.id) return;
    if (!window.confirm(`Eliminare il combattimento "${combat.title}" definitivamente?`)) return;
    await fetch(`/api/combat?id=${combat.id}`, { method: "DELETE" });
    setCombat(null);
    setCombatants([]);
    setPhase("ordering");
  }

  const alive = [...combatants].filter(c => !c.is_dead).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const dead = combatants.filter(c => c.is_dead);
  const currentTurn = phase === "combat" && combat ? alive[combat.turn_index] : null;

  if (!combat) return null;

  // ── ORDERING MODAL ──
  if (phase === "ordering") {
    const notOrdered = combatants.filter(c => !turnOrder.includes(c.id));
    const ordered = turnOrder.map(id => combatants.find(c => c.id === id)).filter(Boolean);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-red-500/25 bg-[#0a0806] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">⚔</span>
              <span className="text-base font-medium text-white truncate">{combat?.title || "Combattimento"}</span>
              <button onClick={deleteCurrentCombat}
                className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs text-white/60 hover:border-red-400/50 hover:bg-red-800/30 hover:text-red-300 transition shrink-0 ml-1"
                title="Elimina combattimento">
                ✕
              </button>
            </div>
          </div>

          {/* Nemici */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/60 mb-2">Nemici</p>
            <div className="flex flex-wrap gap-2">
              {combatants.filter(c => c.type !== "player").map(c => (
                <button key={c.id} onClick={() => handleOrderClick(c.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    turnOrder.includes(c.id)
                      ? "border-red-400/40 bg-red-900/30 text-red-200"
                      : "border-red-500/20 bg-black/30 text-red-200/70 hover:border-red-400/30"
                  }`}
                >
                  {c.type === "boss" ? "⚔ " : "○ "}{c.name}
                  <span className="ml-2 text-[10px] text-white/30">CA {c.armor_class} PF {c.hp_max}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aggiungi giocatori */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-blue-400/60 mb-2">Giocatori</p>
            <div className="flex flex-wrap gap-2">
              {players.filter(p => !combatants.some((c: any) => c.name === p.character_name && c.type === "player")).map(p => (
                <button key={p.id} onClick={() => addPlayerToCombat(p)}
                  className="rounded-lg border border-blue-500/20 bg-black/30 px-3 py-1.5 text-sm text-blue-200/70 hover:border-blue-400/30">
                  + {p.character_name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {combatants.filter(c => c.type === "player").map(c => (
                <button key={c.id} onClick={() => handleOrderClick(c.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    turnOrder.includes(c.id)
                      ? "border-blue-400/40 bg-blue-900/30 text-blue-200"
                      : "border-blue-500/20 bg-black/30 text-blue-200/70 hover:border-blue-400/30"
                  }`}
                >
                  🧑 {c.name}
                  <span className="ml-2 text-[10px] text-white/30">PF {c.hp_current}/{c.hp_max}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ordine di turno */}
          <div className="rounded-xl border border-amber-500/15 bg-amber-900/10 p-4 mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-amber-400/70 mb-2">Ordine di turno</p>
            {ordered.length === 0 ? (
              <p className="text-sm text-amber-200/50">Clicca sui combattenti per impostare l'ordine. Primo cliccato = primo a turno.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ordered.map((c: any, i) => (
                  <button key={c.id} onClick={() => handleOrderClick(c.id)}
                    className="flex items-center gap-1.5 rounded-full bg-amber-900/30 border border-amber-500/30 px-3 py-1 text-sm text-amber-200 hover:bg-amber-900/40"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600/40 text-[10px] font-bold text-amber-200">{i + 1}</span>
                    {c.name}
                    <span className="ml-1 text-amber-300/50 text-xs">✕</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={startCombat}
            disabled={turnOrder.length < 2}
            className="w-full rounded-lg bg-red-600/30 border border-red-500/40 px-6 py-2.5 text-sm text-red-200 hover:bg-red-600/40 disabled:opacity-30 transition font-semibold"
          >
            {turnOrder.length < 2 ? "Ordina almeno 2 combattenti" : `Inizia combattimento (${turnOrder.length} ordinati)`}
          </button>
        </div>
      </div>
    );
  }

  // ── COMBAT PHASE ──
  return (
    <div className="rounded-2xl border border-red-500/25 bg-black/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">⚔</span>
          <span className="text-sm font-medium text-white truncate">{combat?.title || "Combattimento"}</span>
          <button onClick={deleteCurrentCombat}
            className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-xs text-white/60 hover:border-red-400/50 hover:bg-red-800/30 hover:text-red-300 transition shrink-0 ml-1"
            title="Elimina combattimento">
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRules(!showRules)}
            className="rounded-lg border border-veil-gold/20 px-3 py-1.5 text-xs text-veil-gold/70 hover:bg-veil-gold/10"
          >
            {showRules ? "Nascondi regole" : "Regole"}
          </button>
          <button onClick={nextTurn} className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-1.5 text-xs text-red-300 hover:bg-red-600/30">
            Prossimo turno →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex ${showRules ? "flex-col md:flex-row" : ""}`}>
        <div className={`flex-1 p-4 space-y-4 ${showRules ? "md:w-2/3" : "w-full"}`}>
          {/* Status bar */}
          <div className="flex items-center gap-5 rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <div className="text-center">
              <p className="text-[10px] text-white/30">Round</p>
              <p className="text-lg font-semibold text-red-400">{combat.round || 1}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/30">Turno corrente</p>
              <p className="text-lg font-semibold text-white">{currentTurn?.name || "—"}</p>
            </div>
            <div className="text-xs text-white/30 ml-auto">{alive.length} in vita · {dead.length} eliminati</div>
          </div>

          {/* Enemies */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/60 mb-3">Nemici</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alive.filter(c => c.type !== "player").map(c => (
                <div key={c.id} className={`relative rounded-xl border-2 p-4 ${
                  currentTurn?.id === c.id ? "border-red-400/60 bg-red-900/20" : "border-red-500/20 bg-black/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-red-300">{c.type === "boss" ? "⚔" : "○"}</span>
                      <span className="font-medium text-white text-sm">{c.name}</span>
                    </div>
                    <button onClick={() => updateCombatant(c.id, { is_dead: true })} className="text-xs text-white/20 hover:text-red-300">✕</button>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/40">PF</span>
                      <span className={c.hp_current <= 0 ? "text-red-300" : "text-emerald-400"}>{c.hp_current}/{c.hp_max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${c.hp_current <= 0 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.max(0, (c.hp_current / Math.max(1, c.hp_max)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 1) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-1</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-10</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 1) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30">+1</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30">+5</button>
                    <button onClick={() => updateCombatant(c.id, { is_dead: !c.is_dead })} className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white/50 hover:bg-white/20">{c.is_dead ? "Ripristina" : "Uccidi"}</button>
                  </div>
                  <div className="mt-1 text-[10px] text-white/30">CA {c.armor_class} · HP {c.hp_current}/{c.hp_max}</div>
                  {currentTurn?.id === c.id && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-[10px] text-black font-bold">▶</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/60 mb-3">Giocatori</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alive.filter(c => c.type === "player").map(c => (
                <div key={c.id} className={`relative rounded-xl border-2 p-4 ${
                  currentTurn?.id === c.id ? "border-blue-400/60 bg-blue-900/20" : "border-blue-500/20 bg-black/20"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white text-sm">{c.name}</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white/40">PF</span>
                      <span className="text-blue-300">{c.hp_current}/{c.hp_max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${Math.max(0, (c.hp_current / Math.max(1, c.hp_max)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 1) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+1</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 1) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200">-1</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200">-5</button>
                    <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200">-10</button>
                  </div>
                  <div className="mt-1 text-[10px] text-white/30">PF {c.hp_current}/{c.hp_max}</div>
                  {currentTurn?.id === c.id && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-[10px] text-black font-bold">▶</span>}
                </div>
              ))}
            </div>
          </div>

          {dead.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-2">Eliminati</p>
              <div className="flex flex-wrap gap-2">
                {dead.map(c => (
                  <span key={c.id} className="rounded border border-white/[0.04] bg-black/30 px-2 py-1 text-xs text-white/30 line-through">
                    {c.name}
                    <button onClick={() => updateCombatant(c.id, { is_dead: false })} className="ml-2 text-emerald-400/50 hover:text-emerald-300">↻</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Note DM</p>
            <textarea className="w-full rounded-lg border border-white/[0.06] bg-black/30 p-2 text-sm text-white/60 resize-none focus:outline-none" rows={2}
              placeholder="Note per questo combattimento..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {/* Rules sidebar */}
        {showRules && (
          <div className="border-t md:border-t-0 md:border-l border-white/[0.06] p-4 md:w-1/3 space-y-4 overflow-y-auto max-h-[500px]">
            <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50">Regole Combattimento</p>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">🎲 Iniziativa</p>
              <p className="text-xs text-white/50">d20 + modificatore Destrezza. Determina l'ordine di turno dal più alto al più basso.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">🎯 Il turno</p>
              <p className="text-xs text-white/50">Azione + Azione Bonus + Movimento (9m) + Reazione (1/round).</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">⚔ Attaccare</p>
              <p className="text-xs text-white/50">d20 + modificatore (FOR/DES) + bonus competenza. Colpisci se ≥ CA.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">💥 Danni</p>
              <p className="text-xs text-white/50">Tira il dado danno + modificatore. Critico (20): tira i dadi due volte.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">❤️ PF</p>
              <p className="text-xs text-white/50">A 0 PF: tiri salvezza morte (d20, CD 10).</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
