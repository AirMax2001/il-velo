"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type CombatWorkspaceProps = { sessionId?: string; combatId: string; onDelete?: () => void; onClose?: () => void };

type CombatantEntry = {
  id: string;
  name: string;
  type: string;
  initiative: number;
  hp_current: number;
  hp_max: number;
  armor_class: number;
  is_dead: boolean;
  sort_order: number;
};

export function CombatWorkspace({ sessionId, combatId, onDelete, onClose }: CombatWorkspaceProps) {
  const { engine } = useGameEngine();
  const [combat, setCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<CombatantEntry[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<"setup" | "combat" | "ended">("setup");
  const [showRules, setShowRules] = useState(false);
  const [note, setNote] = useState("");
  const [_, forceUpdate] = useState(0);
  const noteKey = combat ? `veil-combat-note-${combat.id}` : "";
  const endedRef = useRef(false);

  const rerender = useCallback(() => forceUpdate(n => n + 1), []);

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
      const items: CombatantEntry[] = (d.items || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        initiative: c.initiative ?? 0,
        hp_current: c.hp_current ?? c.hp_max ?? 20,
        hp_max: c.hp_max ?? 20,
        armor_class: c.armor_class ?? 10,
        is_dead: c.is_dead ?? false,
        sort_order: c.sort_order ?? 0,
      }));
      setCombatants(items);
      // If combat was active, resume in combat phase
      if (matched.is_active && matched.turn_index != null && items.some(c => c.sort_order > 0)) {
        setPhase("combat");
      }
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

  // Persistence: auto-save combatant state to DB
  const persistCombatant = useCallback(async (id: string, fields: any) => {
    await fetch("/api/combatants", { method: "PATCH", body: JSON.stringify({ id, ...fields }) }).catch(() => {});
  }, []);

  const persistCombat = useCallback(async (fields: any) => {
    if (!combat?.id) return;
    await fetch("/api/combat", { method: "PATCH", body: JSON.stringify({ id: combat.id, ...fields }) }).catch(() => {});
  }, [combat?.id]);

  function updateCombatantState(id: string, fields: Partial<CombatantEntry>) {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
    // Persist immediately
    persistCombatant(id, fields);
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
        initiative: 0,
      })
    });
    const data = await res.json();
    if (data.item) {
      setCombatants(prev => [...prev, {
        id: data.item.id,
        name: data.item.name,
        type: data.item.type,
        initiative: data.item.initiative ?? 0,
        hp_current: data.item.hp_current ?? data.item.hp_max ?? 20,
        hp_max: data.item.hp_max ?? 20,
        armor_class: data.item.armor_class ?? 10,
        is_dead: data.item.is_dead ?? false,
        sort_order: data.item.sort_order ?? 0,
      }]);
    }
  }

  function setInitiative(id: string, value: number) {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, initiative: value } : c));
  }

  async function startCombat() {
    if (!combat?.id || combatants.length === 0) return;
    // Sort all creatures by initiative descending
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    // Save sort_order
    for (let i = 0; i < sorted.length; i++) {
      await persistCombatant(sorted[i].id, { sort_order: i, initiative: sorted[i].initiative });
    }
    setCombatants(prev => prev.map(c => ({
      ...c,
      sort_order: sorted.findIndex(s => s.id === c.id),
    })));
    // Save initiative values individually
    for (const c of sorted) {
      await persistCombatant(c.id, { initiative: c.initiative });
    }
    await persistCombat({ turn_index: 0, round: 1, is_active: true });
    setCombat((prev: any) => prev ? { ...prev, turn_index: 0, round: 1, is_active: true } : null);
    engine.startCombat(combat.id);
    setPhase("combat");
    syncToTable(sorted);
  }

  function syncToTable(orderedOverride?: CombatantEntry[]) {
    if (!sessionId || !combat) return;
    try {
      const ordered = orderedOverride ?? [...combatants].filter(c => !c.is_dead).sort((a, b) => a.sort_order - b.sort_order);
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat.title,
        currentTurn: ordered[0]?.name || "",
        round: 1,
      }));
    } catch {}
  }

  async function nextTurn() {
    if (!combat?.id) return;
    const alive = [...combatants].filter(c => !c.is_dead).sort((a, b) => a.sort_order - b.sort_order);
    if (alive.length === 0) return;
    const nextIndex = (combat.turn_index + 1) % alive.length;
    const isNewRound = nextIndex === 0;
    const newRound = isNewRound ? (combat.round || 1) + 1 : (combat.round || 1);
    await persistCombat({ turn_index: nextIndex, round: newRound });
    setCombat((prev: any) => prev ? { ...prev, turn_index: nextIndex, round: newRound } : null);
    if (isNewRound) engine.nextRound();
    else engine.nextTurn();
    try {
      const aliveNow = [...combatants].filter(c => !c.is_dead).sort((a, b) => a.sort_order - b.sort_order);
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat?.title,
        currentTurn: aliveNow[nextIndex]?.name || "",
        round: newRound,
      }));
    } catch {}
  }

  async function deleteCurrentCombat(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!combat?.id) return;
    if (!window.confirm(`Eliminare definitivamente questo combattimento?`)) return;
    await fetch(`/api/combat?id=${combat.id}`, { method: "DELETE" });
    setCombat(null);
    setCombatants([]);
    if (onDelete) onDelete();
  }

  // ── Derived state ──
  const sortedAlive = [...combatants].filter(c => !c.is_dead).sort((a, b) => a.sort_order - b.sort_order);
  const sortedAll = [...combatants].filter(c => !c.is_dead).sort((a, b) => a.sort_order - b.sort_order);
  const dead = combatants.filter(c => c.is_dead);
  const currentTurn = phase === "combat" && combat ? sortedAlive[combat.turn_index] : null;

  // Auto-detect combat end
  useEffect(() => {
    if (phase !== "combat" || endedRef.current) return;
    const enemiesAlive = combatants.some(c => c.type !== "player" && c.type !== "ally" && !c.is_dead);
    if (!enemiesAlive && combatants.length > 0) {
      endedRef.current = true;
      setPhase("ended");
    }
  }, [combatants, phase]);

  // Reset endedRef when phase changes away from combat
  useEffect(() => {
    if (phase !== "ended") endedRef.current = false;
  }, [phase]);

  if (!combat) return null;

  // ══════════════════════════════ SETUP PHASE ══════════════════════════════
  if (phase === "setup") {
    const enemies = combatants.filter(c => c.type !== "player");
    const playersInCombat = combatants.filter(c => c.type === "player");

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-2xl rounded-2xl border border-red-500/25 bg-[#0a0806] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚔</span>
              <span className="text-base font-semibold text-white">{combat.title}</span>
            </div>
            <button onClick={deleteCurrentCombat}
              className="shrink-0 rounded-lg border-2 border-red-400/50 bg-red-900/50 px-3 py-1 text-sm text-red-200 font-bold hover:bg-red-700/60 hover:border-red-300/70 transition"
              title="Elimina combattimento">
              ✕
            </button>
          </div>

          <p className="text-xs text-white/40 mb-6 leading-relaxed">
            Inserisci i valori di iniziativa per ogni creatura dopo aver tirato i dadi.
          </p>

          {/* Giocatori */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.15em] text-blue-400/60 mb-3">Giocatori</p>
            <div className="space-y-2">
              {playersInCombat.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-blue-500/15 bg-blue-900/10 px-4 py-2.5">
                  <span className="text-sm text-blue-200 font-medium min-w-[120px]">🧑 {c.name}</span>
                  <span className="text-[10px] text-white/30">PF {c.hp_current}/{c.hp_max}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Iniziativa</span>
                    <input type="number" min={0} max={99}
                      className="w-16 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-white text-center focus:outline-none focus:border-blue-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={c.initiative || ""}
                      onChange={e => setInitiative(c.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
              {/* Add players not yet in combat */}
              {players.filter(p => !combatants.some(c => c.name === p.character_name)).map(p => (
                <button key={p.id} onClick={() => addPlayerToCombat(p)}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-blue-500/20 bg-black/20 px-4 py-2.5 text-sm text-blue-300/60 hover:border-blue-400/40 hover:text-blue-200 transition w-full">
                  + Aggiungi {p.character_name}
                </button>
              ))}
            </div>
          </div>

          {/* Nemici */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.15em] text-red-400/60 mb-3">Nemici</p>
            <div className="space-y-2">
              {enemies.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-red-500/15 bg-red-900/10 px-4 py-2.5">
                  <span className={`text-sm font-medium min-w-[120px] ${c.type === "boss" ? "text-red-200" : "text-red-200/80"}`}>
                    {c.type === "boss" ? "⚔ " : "○ "}{c.name}
                  </span>
                  <span className="text-[10px] text-white/30">CA {c.armor_class} PF {c.hp_max}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-white/40 uppercase">Iniziativa</span>
                    <input type="number" min={0} max={99}
                      className="w-16 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-white text-center focus:outline-none focus:border-red-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={c.initiative || ""}
                      onChange={e => setInitiative(c.id, parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { if (onClose) onClose(); else setPhase("setup"); }}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-6 py-2.5 text-sm text-white/50 hover:bg-black/50 transition font-medium">
              Annulla
            </button>
            <button onClick={startCombat}
              disabled={combatants.length < 2 || combatants.some(c => c.initiative === 0 && c.initiative !== 0)}
              className="flex-1 rounded-lg bg-red-600/30 border border-red-500/40 px-6 py-2.5 text-sm text-red-200 hover:bg-red-600/40 disabled:opacity-30 transition font-semibold">
              Inizia Combattimento ({combatants.length} creature)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════ ENDED PHASE ══════════════════════════════
  if (phase === "ended") {
    const enemiesDefeated = combatants.filter(c => c.type !== "player" && c.type !== "ally" && c.is_dead).length;
    const totalEnemies = combatants.filter(c => c.type !== "player" && c.type !== "ally").length;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-veil-gold/25 bg-[#0a0806] p-8 shadow-2xl text-center">
          <span className="text-4xl block mb-3">⚔</span>
          <h2 className="text-2xl font-bold text-veil-gold mb-2">Combattimento Terminato</h2>
          <p className="text-sm text-white/40 mb-6">{combat.title}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.1em]">Round Totali</p>
              <p className="text-xl font-semibold text-white mt-1">{combat.round || 1}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.1em]">Nemici Sconfitti</p>
              <p className="text-xl font-semibold text-red-300 mt-1">{enemiesDefeated}/{totalEnemies}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPhase("setup"); if (onClose) onClose(); }}
              className="flex-1 rounded-lg border border-white/15 bg-black/30 px-6 py-2.5 text-sm text-white/50 hover:bg-black/50 transition font-medium">
              Chiudi
            </button>
            <button onClick={() => { if (onClose) onClose(); }}
              className="flex-1 rounded-lg bg-veil-gold/20 border border-veil-gold/30 px-6 py-2.5 text-sm text-veil-gold hover:bg-veil-gold/30 transition font-semibold">
              Torna alle Scene
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════ COMBAT PHASE ══════════════════════════════
  const turnTracker = sortedAlive;

  return (
    <div className="rounded-2xl border border-red-500/25 bg-black/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0">⚔</span>
          <span className="text-sm font-medium text-white truncate">{combat.title}</span>
          <button onClick={deleteCurrentCombat}
            className="shrink-0 rounded-lg border-2 border-red-400/50 bg-red-900/50 px-3 py-1 text-sm text-red-200 font-bold hover:bg-red-700/60 hover:border-red-300/70 transition ml-2"
            title="Elimina combattimento">
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowRules(!showRules)}
            className="rounded-lg border border-veil-gold/20 px-3 py-1.5 text-xs text-veil-gold/70 hover:bg-veil-gold/10">
            {showRules ? "Nascondi regole" : "Regole"}
          </button>
          <button onClick={nextTurn}
            className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-1.5 text-xs text-red-300 hover:bg-red-600/30">
            Prossimo turno →
          </button>
        </div>
      </div>

      <div className={`flex ${showRules ? "flex-col lg:flex-row" : ""}`}>
        {/* Turn Tracker */}
        <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] p-3 bg-black/15">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-3">Ordine di turno</p>
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {turnTracker.map((c, i) => {
              const isCurrent = i === combat.turn_index;
              return (
                <div key={c.id}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all shrink-0 ${
                    isCurrent
                      ? "border-2 border-veil-gold/60 bg-veil-gold/[0.08] shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                      : "border border-white/[0.06] bg-black/20"
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                    isCurrent ? "bg-veil-gold/20 text-veil-gold" : "bg-white/8 text-white/40"
                  }`}>
                    {isCurrent ? "▶" : i + 1}
                  </span>
                  <span className={`font-medium truncate ${isCurrent ? "text-veil-gold" : "text-white/60"}`}>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-white/30 ml-auto">{c.initiative}</span>
                </div>
              );
            })}
            {turnTracker.length === 0 && (
              <p className="text-xs text-white/20 px-2">Nessun combattente in vita</p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 p-4 space-y-4 min-w-0 ${showRules ? "lg:w-2/3" : "w-full"}`}>
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
            <div className="text-xs text-white/30 ml-auto">{sortedAlive.length} in vita · {dead.length} eliminati</div>
          </div>

          {/* Enemies */}
          {sortedAlive.filter(c => c.type !== "player" && c.type !== "ally").length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/60 mb-3">Nemici</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedAlive.filter(c => c.type !== "player" && c.type !== "ally").map(c => (
                  <EnemyCard key={c.id} c={c} isCurrent={currentTurn?.id === c.id}
                    update={updateCombatantState} />
                ))}
              </div>
            </div>
          )}

          {/* Players / Allies */}
          {sortedAlive.filter(c => c.type === "player" || c.type === "ally").length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-blue-400/60 mb-3">Giocatori</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedAlive.filter(c => c.type === "player" || c.type === "ally").map(c => (
                  <PlayerCard key={c.id} c={c} isCurrent={currentTurn?.id === c.id}
                    update={updateCombatantState} />
                ))}
              </div>
            </div>
          )}

          {/* KO'd creatures */}
          {dead.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/20 mb-2">KO</p>
              <div className="flex flex-wrap gap-2">
                {dead.map(c => (
                  <span key={c.id} className="rounded border border-red-900/40 bg-red-950/30 px-2.5 py-1 text-xs text-red-400/70 line-through">
                    {c.type === "boss" ? "⚔ " : c.type === "player" ? "🧑 " : "○ "}{c.name} ({c.hp_current}/{c.hp_max})
                    <button onClick={() => updateCombatantState(c.id, { is_dead: false })}
                      className="ml-2 text-emerald-400/50 hover:text-emerald-300">↻</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1">Note DM</p>
            <textarea className="w-full rounded-lg border border-white/[0.06] bg-black/30 p-2 text-sm text-white/60 resize-none focus:outline-none" rows={2}
              placeholder="Note per questo combattimento..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {/* Rules sidebar */}
        {showRules && (
          <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] p-4 lg:w-1/3 space-y-4 overflow-y-auto max-h-[500px]">
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

// ── Sub-components ──

function EnemyCard({ c, isCurrent, update }: {
  c: CombatantEntry;
  isCurrent: boolean;
  update: (id: string, fields: Partial<CombatantEntry>) => void;
}) {
  const isKo = c.hp_current <= 0;
  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all ${
      isCurrent
        ? "border-red-400/60 bg-red-900/20 shadow-[0_0_10px_rgba(220,80,80,0.12)]"
        : "border-red-500/20 bg-black/20"
    } ${isKo ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-red-300">{c.type === "boss" ? "⚔" : "○"}</span>
          <span className={`font-medium text-sm ${isKo ? "text-red-400/60 line-through" : "text-white"}`}>{c.name}</span>
        </div>
      </div>
      {!isKo ? (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/40">PF</span>
              <span className="text-emerald-400">{c.hp_current}/{c.hp_max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full transition-all bg-emerald-500"
                style={{ width: `${Math.max(0, (c.hp_current / Math.max(1, c.hp_max)) * 100)}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 10) })}>-10</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 5) })}>-5</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 1) })}>-1</HpButton>
            <span className="text-xs text-white/60 font-mono min-w-[48px] text-center">{c.hp_current}</span>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 1) })} heal>+1</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} heal>+5</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 10) })} heal>+10</HpButton>
            <button onClick={() => update(c.id, { is_dead: true })}
              className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white/50 hover:bg-red-800/40 hover:text-red-300">✕ KO</button>
          </div>
          <div className="mt-1 text-[10px] text-white/30">CA {c.armor_class}</div>
          {isCurrent && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-400 text-[10px] text-black font-bold">▶</span>}
        </>
      ) : (
        <p className="text-xs text-red-400/60 line-through">KO — {c.hp_current}/{c.hp_max}</p>
      )}
    </div>
  );
}

function PlayerCard({ c, isCurrent, update }: {
  c: CombatantEntry;
  isCurrent: boolean;
  update: (id: string, fields: Partial<CombatantEntry>) => void;
}) {
  const isKo = c.hp_current <= 0;
  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all ${
      isCurrent
        ? "border-blue-400/60 bg-blue-900/20 shadow-[0_0_10px_rgba(80,140,220,0.12)]"
        : "border-blue-500/20 bg-black/20"
    } ${isKo ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium text-sm ${isKo ? "text-blue-400/60 line-through" : "text-white"}`}>{c.name}</span>
      </div>
      {!isKo ? (
        <>
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
          <div className="flex items-center gap-1 flex-wrap">
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 10) })}>-10</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 5) })}>-5</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.max(0, c.hp_current - 1) })}>-1</HpButton>
            <span className="text-xs text-white/60 font-mono min-w-[48px] text-center">{c.hp_current}</span>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 1) })} heal>+1</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} heal>+5</HpButton>
            <HpButton onClick={() => update(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 10) })} heal>+10</HpButton>
            <button onClick={() => update(c.id, { is_dead: true })}
              className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white/50 hover:bg-red-800/40 hover:text-red-300">✕ KO</button>
          </div>
          <div className="mt-1 text-[10px] text-white/30">PF {c.hp_current}/{c.hp_max}</div>
          {isCurrent && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-400 text-[10px] text-black font-bold">▶</span>}
        </>
      ) : (
        <p className="text-xs text-blue-400/60 line-through">KO — {c.hp_current}/{c.hp_max}</p>
      )}
    </div>
  );
}

function HpButton({ children, onClick, heal }: { children: string; onClick: () => void; heal?: boolean }) {
  return (
    <button onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium transition ${
        heal
          ? "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
          : "bg-red-500/20 text-red-200 hover:bg-red-500/30"
      }`}>
      {children}
    </button>
  );
}
