"use client";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";
import { useState, useCallback, useEffect } from "react";
import { NpcPopup } from "@/components/dm/popups/NpcPopup";
import { LocationPopup } from "@/components/dm/popups/LocationPopup";
import { ItemPopup } from "@/components/dm/popups/ItemPopup";
import { CombatWorkspace } from "@/components/dm/CombatWorkspace";
import { FirstSessionGuide } from "@/components/dm/FirstSessionGuide";

type PopupType = "npc" | "location" | "item" | null;

const BLOCK_STYLES: Record<string, { border: string; bg: string; label: string; icon: string }> = {
  narration: { border: "border-amber-500/30", bg: "bg-amber-900/8", label: "Narrazione", icon: "📜" },
  dialogue: { border: "border-orange-400/30", bg: "bg-orange-900/8", label: "Dialogo", icon: "💬" },
  combat: { border: "border-red-500/30", bg: "bg-red-900/8", label: "Combattimento", icon: "⚔" },
  choice: { border: "border-violet-500/30", bg: "bg-violet-900/8", label: "Scelta", icon: "◈" },
  skill_check: { border: "border-amber-500/30", bg: "bg-amber-900/8", label: "Tiro abilità", icon: "🎲" },
  revelation: { border: "border-purple-500/30", bg: "bg-purple-900/8", label: "Rivelazione", icon: "✦" },
  travel: { border: "border-emerald-500/30", bg: "bg-emerald-900/8", label: "Viaggio", icon: "🚶" },
  rest: { border: "border-sky-500/30", bg: "bg-sky-900/8", label: "Riposo", icon: "🏕" },
  puzzle: { border: "border-violet-500/30", bg: "bg-violet-900/8", label: "Puzzle", icon: "🧩" },
  lore_drop: { border: "border-veil-gold/25", bg: "bg-veil-gold/[0.04]", label: "Lore", icon: "📖" },
  event: { border: "border-fuchsia-500/30", bg: "bg-fuchsia-900/8", label: "Evento", icon: "⚡" },
  transition: { border: "border-white/20", bg: "bg-white/[0.03]", label: "Transizione", icon: "▸" },
};

type SessionPack = {
  id: string;
  session_id: string;
  title: string;
  session_number: number;
  data: any;
  created_at: string;
};

type SessionWorkspaceProps = { sessionId?: string };

export function SessionWorkspace({ sessionId: _sid }: SessionWorkspaceProps) {
  const { engine, state, resolver } = useGameEngine();
  const [popup, setPopup] = useState<{ type: PopupType; id: string } | null>(null);
  const [showCombat, setShowCombat] = useState(false);
  const [sessionPacks, setSessionPacks] = useState<SessionPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);

  useEffect(() => {
    if (!_sid) return;
    fetch(`/api/session-packs?sessionId=${_sid}`).then(r => r.json()).then(d => {
      const packs = (d.items || []).sort((a: any, b: any) => (a.session_number || 0) - (b.session_number || 0));
      setSessionPacks(packs);
      if (packs.length > 0 && !activePackId) {
        setActivePackId(packs[packs.length - 1].id);
        engine.loadSessionPack(packs[packs.length - 1].data);
      }
    });
  }, [_sid]);

  function selectPack(pack: SessionPack) {
    setActivePackId(pack.id);
    engine.loadSessionPack(pack.data);
  }

  async function deletePack(pack: SessionPack) {
    const confirm = window.confirm(`Eliminare "${pack.title || `Sessione ${pack.session_number}`}"?\nQuesta azione non può essere annullata.`);
    if (!confirm) return;
    const res = await fetch(`/api/session-packs?id=${pack.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setSessionPacks(prev => prev.filter(p => p.id !== pack.id));
    if (activePackId === pack.id) {
      const remaining = sessionPacks.filter(p => p.id !== pack.id);
      if (remaining.length > 0) {
        const next = remaining[Math.min(remaining.length - 1, 0)];
        setActivePackId(next.id);
        engine.loadSessionPack(next.data);
      }
    }
  }

  async function movePack(pack: SessionPack, fromIdx: number, dir: -1 | 1) {
    const target = sessionPacks[fromIdx + dir];
    if (!target) return;
    const oldNum = pack.session_number;
    const newNum = target.session_number;
    // Swap session_numbers in DB
    const r1 = fetch("/api/session-packs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pack.id, session_number: newNum }),
    });
    const r2 = fetch("/api/session-packs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: target.id, session_number: oldNum }),
    });
    await Promise.all([r1, r2]);
    // Update local state
    setSessionPacks(prev => {
      const updated = [...prev];
      updated[fromIdx] = { ...pack, session_number: newNum };
      updated[fromIdx + dir] = { ...target, session_number: oldNum };
      updated.sort((a, b) => (a.session_number || 0) - (b.session_number || 0));
      return updated;
    });
  }

  const scene = state.currentScene;
  const scenes = state.session?.scenes || [];
  const progress = engine.getSceneProgress();
  const style = BLOCK_STYLES[scene?.type || "narration"] || BLOCK_STYLES.narration;

  if (!_sid) {
    return <div className="flex h-full items-center justify-center"><p className="text-sm text-white/20">Nessuna campagna attiva.</p></div>;
  }

  if (sessionPacks.length === 0) {
    return <div className="flex h-full items-center justify-center"><p className="text-sm text-white/20">Nessuna sessione importata.</p></div>;
  }

  return (
    <div className="flex h-full gap-4">
      {/* Session sidebar */}
      <div className="w-56 shrink-0 rounded-2xl border border-white/[0.06] bg-black/20 p-2 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2 px-2">Sessioni</p>
        {sessionPacks.map((pack, idx) => (
          <div key={pack.id} className={`group relative rounded-xl px-3 py-2.5 text-sm transition mb-1 cursor-pointer ${
            activePackId === pack.id
              ? "bg-veil-gold/10 text-veil-gold border border-veil-gold/20"
              : "text-white/50 hover:bg-white/[0.04] hover:text-white border border-transparent"
          }`} onClick={() => selectPack(pack)}>
            <div className="flex items-center justify-between">
              <p className="font-medium truncate flex-1">{pack.title || `Sessione ${pack.session_number}`}</p>
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {/* Reorder arrows */}
                {idx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); movePack(pack, idx, -1); }}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-white/40 hover:text-white text-xs px-0.5">▲</button>
                )}
                {idx < sessionPacks.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); movePack(pack, idx, 1); }}
                    className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-white/40 hover:text-white text-xs px-0.5">▼</button>
                )}
                {/* Delete */}
                <button onClick={(e) => { e.stopPropagation(); deletePack(pack); }}
                  className="opacity-0 group-hover:opacity-40 hover:opacity-100 text-red-400 hover:text-red-300 text-xs px-0.5">✕</button>
              </div>
            </div>
            <p className="text-[10px] text-white/30">#{pack.session_number} · {new Date(pack.created_at).toLocaleDateString("it-IT")}</p>
          </div>
        ))}
      </div>

      {/* Scene view */}
      {!scene || !state.session ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/20">Nessuna scena in questa sessione.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[0.08em] text-white">{state.session.session.title}</h2>
              <p className="text-xs text-white/40">Sessione #{state.session.session.sessionNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">{state.visitedScenes.length}/{scenes.length} scene</span>
              <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-veil-gold/60 to-veil-gold transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button disabled={state.currentSceneIndex <= 0} onClick={() => engine.goToPreviousScene()} className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/40 hover:text-white disabled:opacity-20">← Precedente</button>
            <span className="text-xs text-white/20">{state.currentSceneIndex + 1} / {scenes.length}</span>
            <button disabled={state.currentSceneIndex >= scenes.length - 1} onClick={() => engine.goToNextScene()} className="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/40 hover:text-white disabled:opacity-20">Successiva →</button>
          </div>

          <div className={`rounded-2xl border ${style.border} ${style.bg}`}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <span className="text-lg">{style.icon}</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex-1">{style.label}</p>
              {scene.sceneOrder && <span className="text-xs text-white/20">Ordine {scene.sceneOrder}</span>}
            </div>

            <div className="p-5 space-y-4">
              {scene.title && <h3 className="text-2xl font-semibold tracking-[0.05em] text-white">{scene.title}</h3>}
              <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{scene.content}</p>

              {scene.narration && (
                <div className="rounded-xl border border-veil-gold/15 bg-veil-gold/[0.03] p-4">
                  <p className="text-xs text-veil-gold/80 uppercase tracking-[0.15em] mb-1">Narrazione</p>
                  <p className="text-sm text-veil-gold/70">{scene.narration}</p>
                </div>
              )}

              {scene.npc_ids?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">NPC in scena</p>
                  <div className="flex flex-wrap gap-2">
                    {scene.npc_ids.map(id => {
                      const npc = resolver.resolveNPC(id);
                      return (
                        <button key={id} onClick={() => setPopup({ type: "npc", id })} className="rounded-lg border border-stone-500/20 bg-stone-900/30 px-3 py-1.5 text-sm text-stone-300/70 hover:border-stone-400/40 transition">
                          {npc?.emoji || "○"} {npc?.name || id.slice(0, 8)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {scene.location_id && (() => {
                const locName = resolver.resolveLocation(scene.location_id)?.name || scene.location_id;
                const slug = locName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                const imgUrl = `/locations/${slug}.png`;
                return (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Location</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPopup({ type: "location", id: scene.location_id! })} className="rounded-lg border border-cyan-500/20 bg-cyan-900/20 px-3 py-1.5 text-sm text-cyan-200/70 hover:border-cyan-400/40 transition">
                      📍 {locName}
                    </button>
                    {locName && (
                      <button
                        onClick={() => {
                          try {
                            localStorage.setItem(`veil-table-display:${_sid}`,
                              JSON.stringify({ ...JSON.parse(localStorage.getItem(`veil-table-display:${_sid}`) || "{}"), sceneImageUrl: imgUrl })
                            );
                          } catch {}
                          // Also update current_location_id via API for name+description
                          fetch(`/api/locations?sessionId=${_sid}`)
                            .then(r => r.json())
                            .then(d => {
                              const dbLoc = (d.locations || []).find(
                                (l: any) => l.external_id === scene.location_id || l.name === locName
                              );
                              if (dbLoc?.id) {
                                fetch("/api/state", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ sessionId: _sid, locationId: dbLoc.id }),
                                });
                              }
                            })
                            .catch(() => {});
                        }}
                        className="rounded-lg border border-veil-gold/20 bg-veil-gold/8 px-3 py-1.5 text-sm text-veil-gold/70 hover:border-veil-gold/40 transition"
                      >
                        🖼 Mostra scena
                      </button>
                    )}
                  </div>
                </div>
                );
              })()}

              {scene.musicCue && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-900/6 px-4 py-2">
                  <p className="text-[10px] text-violet-300/60 uppercase tracking-[0.15em]">Musica</p>
                  <p className="text-sm text-violet-200/60">{scene.musicCue}</p>
                </div>
              )}

              {scene.ambientCue && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-900/6 px-4 py-2">
                  <p className="text-[10px] text-cyan-300/60 uppercase tracking-[0.15em]">Ambiente</p>
                  <p className="text-sm text-cyan-200/60">{scene.ambientCue}</p>
                </div>
              )}

              {scene.diceCheck && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-amber-300/60 mb-1">Tiro richiesto</p>
                  <p className="text-sm text-amber-200/80">🎲 {scene.diceCheck.count}d{scene.diceCheck.sides}{scene.diceCheck.modifier != null && (scene.diceCheck.modifier >= 0 ? "+" : "") + scene.diceCheck.modifier}</p>
                </div>
              )}

              {scene.reward && (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-900/8 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-300/60 mb-1">Ricompensa</p>
                  {scene.reward.xp && <p className="text-xs text-emerald-300/80">✦ {scene.reward.xp} XP</p>}
                  {scene.reward.items?.map((item: string, i: number) => (
                    <button key={i} onClick={() => setPopup({ type: "item", id: item })} className="text-xs text-sky-300/80 hover:text-sky-200 mr-2">📦 {resolver.resolveItem(item)?.name || item}</button>
                  ))}
                  {scene.reward.veilShift != null && <p className="text-xs text-violet-300/60">Veil {scene.reward.veilShift > 0 ? "+" : ""}{scene.reward.veilShift}</p>}
                </div>
              )}

              {scene.journalEntry && (
                <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.03] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50 mb-1">Diario</p>
                  <p className="text-sm text-veil-gold/70">{scene.journalEntry}</p>
                </div>
              )}

              {scene.choices?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Scelte</p>
                  <div className="flex flex-col gap-2">
                    {scene.choices.map((choice: any) => (
                      <button key={choice.id} onClick={() => { if (choice.targetBlockId) engine.goToScene(choice.targetBlockId); }} className="group flex items-center gap-3 rounded-xl border border-orange-400/15 bg-orange-900/15 px-4 py-3 text-left transition hover:border-orange-400/30 hover:bg-orange-900/25">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-orange-400/30 text-xs text-orange-300">◈</span>
                        <div className="min-w-0">
                          <p className="text-sm text-orange-200/90 group-hover:text-orange-200">{choice.text}</p>
                          {choice.targetBlockId && <p className="mt-0.5 text-xs text-orange-400/50">→ {choice.targetBlockId}</p>}
                          {choice.skillCheck && <p className="mt-0.5 text-xs text-amber-400/60">CD {choice.skillCheck.stat} {choice.skillCheck.dc}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scene.isCombat && scene.combat_id && (
                <>
                  <button onClick={() => setShowCombat(!showCombat)} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    showCombat ? "border-red-400/50 bg-red-900/20" : "border-red-500/30 bg-red-900/10 hover:border-red-400/50"
                  }`}>
                    <span className="text-xl">⚔</span>
                    <div className="flex-1"><p className="text-sm text-red-200 font-medium">Combattimento</p><p className="text-xs text-red-300/60">{showCombat ? "Nascondi" : "Apri gestione combattimento"}</p></div>
                    <span className={`text-xs text-red-300/50 transition ${showCombat ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {showCombat && (
                    <CombatWorkspace sessionId={_sid} combatId={scene.combat_id} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Guide per la prima sessione */}
          <FirstSessionGuide
            scene={scene}
            sessionNumber={state.session?.session?.sessionNumber}
          />

          {popup?.type === "npc" && <NpcPopup npcId={popup.id} onClose={() => setPopup(null)} />}
          {popup?.type === "location" && <LocationPopup locationId={popup.id} onClose={() => setPopup(null)} />}
          {popup?.type === "item" && <ItemPopup itemId={popup.id} onClose={() => setPopup(null)} />}

        </div>
      )}
    </div>
  );
}