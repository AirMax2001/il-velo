"use client";
import { useEffect, useState } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";

type CombatWorkspaceProps = { sessionId?: string; combatId: string };

export function CombatWorkspace({ sessionId, combatId }: CombatWorkspaceProps) {
  const { engine } = useGameEngine();
  const [combat, setCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<"initiative" | "combat">("initiative");
  const [note, setNote] = useState("");
  const [showRules, setShowRules] = useState(false);
  const noteKey = combat ? `veil-combat-note-${combat.id}` : "";

  async function loadCombat() {
    if (!sessionId) return;
    let dbCombatId: string | null = null;
    let matched: any = null;
    const all = await fetch(`/api/combat?sessionId=${sessionId}`).then(r => r.json());
    const items: any[] = all.items || [];
    matched = items.find((c: any) => c.id === combatId);
    if (matched) {
      dbCombatId = matched.id;
      setCombat(matched);
    } else {
      const slugToName = combatId.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
      matched = items.find((c: any) =>
        c.title?.toLowerCase() === slugToName.toLowerCase() ||
        c.title?.toLowerCase().replace(/\s+/g, "-") === combatId.toLowerCase()
      );
      if (matched) {
        dbCombatId = matched.id;
        setCombat(matched);
      } else {
        setCombat(null);
        setCombatants([]);
        return;
      }
    }
    const d = await fetch(`/api/combatants?combatId=${dbCombatId}`).then(r => r.json());
    setCombatants(d.items || []);
    if (matched?.turn_index != null && matched?.round != null) setPhase("combat");
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

  async function startCombat() {
    if (!combat?.id) return;
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    await fetch("/api/combat", {
      method: "PATCH",
      body: JSON.stringify({ id: combat.id, turn_index: 0, round: 1, is_active: true })
    });
    setCombat({ ...combat, turn_index: 0, round: 1, is_active: true });
    engine.startCombat(combat.id);
    setPhase("combat");
    syncToTable(sorted);
  }

  function syncToTable(ordered: any[]) {
    if (!sessionId) return;
    try {
      const current = ordered[0];
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat?.title || "Combattimento",
        currentTurn: current?.name || "",
        round: 1,
      }));
    } catch {}
  }

  async function nextTurn() {
    if (!combat?.id) return;
    const alive = combatants.filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
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
      const aliveNow = [...combatants].filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
      const next = aliveNow[nextIndex];
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({
        combatActive: true,
        combatTitle: combat?.title,
        currentTurn: next?.name || "",
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

  const alive = [...combatants].filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
  const dead = combatants.filter(c => c.is_dead);
  const currentTurn = phase === "combat" && combat ? alive[combat.turn_index] : null;

  return (
    <div className="rounded-2xl border border-red-500/25 bg-black/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚔</span>
          <span className="text-sm font-medium text-white">{combat?.title || "Combattimento"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(!showRules)}
            className="rounded-lg border border-veil-gold/20 px-3 py-1.5 text-xs text-veil-gold/70 hover:bg-veil-gold/10"
          >
            {showRules ? "Nascondi regole" : "Regole"}
          </button>
          {phase === "combat" && (
            <button onClick={nextTurn} className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-1.5 text-xs text-red-300 hover:bg-red-600/30">
              Prossimo turno →
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex ${showRules ? "flex-col md:flex-row" : ""}`}>
        {/* Main combat area */}
        <div className={`flex-1 p-4 space-y-4 ${showRules ? "md:w-2/3" : "w-full"}`}>
          {/* Status bar */}
          {phase === "combat" && combat && (
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
          )}

          {/* Initiative phase */}
          {phase === "initiative" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/15 bg-amber-900/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-amber-400/70 mb-2">Fase di Iniziativa</p>
                <p className="text-sm text-amber-200/70 mb-3">
                  Prima che il combattimento inizi, ogni partecipante tira Iniziativa (d20 + Destrezza).
                  Inserisci i valori tirati da giocatori e nemici qui sotto.
                </p>
              </div>

              <div className="grid gap-2">
                {[...combatants].sort((a, b) => b.sort_order - a.sort_order).map(c => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/30 p-3">
                    <span className={`text-sm ${c.type === "player" ? "text-blue-300" : c.type === "boss" ? "text-red-300" : "text-red-200/70"}`}>
                      {c.type === "player" ? "🧑" : c.type === "boss" ? "⚔" : "○"} {c.name}
                    </span>
                    <span className="text-[10px] text-white/20 w-12">{c.type === "player" ? "PG" : c.type === "boss" ? "BOSS" : "Nemico"}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-white/40">Iniziativa:</span>
                      <input
                        type="number"
                        value={c.initiative ?? ""}
                        onChange={e => updateCombatant(c.id, { initiative: parseInt(e.target.value) || 0 })}
                        className="w-16 rounded-lg border border-white/[0.08] bg-black/40 px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-veil-gold/40"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <details className="text-xs">
                  <summary className="cursor-pointer text-white/30 hover:text-white/60">+ Aggiungi giocatore</summary>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {players.filter(p => !combatants.some((c: any) => c.name === p.character_name && c.type === "player")).map(p => (
                      <button key={p.id} onClick={() => addPlayerToCombat(p)} className="rounded border border-white/[0.06] bg-black/30 px-2 py-1 text-xs text-white/50 hover:border-white/[0.12]">
                        + {p.character_name}
                      </button>
                    ))}
                  </div>
                </details>
                <button
                  onClick={startCombat}
                  disabled={combatants.length === 0}
                  className="rounded-lg bg-red-600/30 border border-red-500/40 px-6 py-2 text-sm text-red-200 hover:bg-red-600/40 disabled:opacity-30 transition"
                >
                  Inizia combattimento!
                </button>
              </div>
            </div>
          )}

          {/* Combat phase */}
          {phase === "combat" && (
            <>
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
                        <button onClick={() => updateCombatant(c.id, { initiative: 0 })} className="text-xs text-white/20 hover:text-red-300">×</button>
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
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-5</button>
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200 hover:bg-red-500/30">-10</button>
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/30">+5</button>
                        <button onClick={() => updateCombatant(c.id, { is_dead: !c.is_dead })} className="ml-auto rounded bg-white/10 px-2 py-1 text-xs text-white/50 hover:bg-white/20">{c.is_dead ? "Ripristina" : "Uccidi"}</button>
                      </div>
                      <div className="mt-1 text-[10px] text-white/30">INIT {c.initiative} · CA {c.armor_class}</div>
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
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 5) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+5</button>
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.min(c.hp_max, c.hp_current + 10) })} className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">+10</button>
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 5) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200">-5</button>
                        <button onClick={() => updateCombatant(c.id, { hp_current: Math.max(0, c.hp_current - 10) })} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-200">-10</button>
                      </div>
                      <div className="mt-1 text-[10px] text-white/30">INIT {c.initiative}</div>
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
            </>
          )}
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
              <p className="text-xs text-white/50">Azione + Azione Bonus + Movimento (9m) + Reazione (1/round). Puoi dividere il movimento come vuoi.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">⚔ Attaccare</p>
              <p className="text-xs text-white/50">d20 + modificatore (FOR/DES) + bonus competenza. Colpisci se ≥ CA del bersaglio.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">💥 Danni</p>
              <p className="text-xs text-white/50">Tira il dado danno dell'arma + modificatore. Critico (20 naturale): tira i dadi danno due volte.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">🛡 Classe Armatura (CA)</p>
              <p className="text-xs text-white/50">CA = difficoltà per essere colpiti. Senza armatura: 10 + DES. Con scudo: +2.</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-black/20 p-3 space-y-1">
              <p className="text-xs text-veil-gold/80">❤️ Punti Ferita (PF)</p>
              <p className="text-xs text-white/50">A 0 PF: tiri salvezza morte (d20, CD 10). Tre successi = stabile. Tre fallimenti = morte.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
