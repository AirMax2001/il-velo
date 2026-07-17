"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { subscribeToTable } from "@/lib/supabaseClient";

type SceneNode = {
  id: string; title: string; content: string; parent_id: string | null;
  node_type: string; choices: any[]; npc_ids: string[]; environment: string;
  music_url: string; tablet_scene: string; dm_suggestions: string;
  rule_reminder: string; is_active: boolean;
};

type CombatEncounter = {
  id: string; title: string; round: number; turn_index: number; is_active: boolean;
};

type Combatant = {
  id: string; combat_id: string; name: string; type: string;
  initiative: number; hp_current: number; hp_max: number;
  armor_class: number; attack_bonus: number; damage: string;
  conditions: string[]; is_dead: boolean;
};

export default function SessionPage() {
  return (
    <Suspense>
      <SessionMode />
    </Suspense>
  );
}

function SessionMode() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || "";

  const [sceneTree, setSceneTree] = useState<SceneNode[]>([]);
  const [activeScene, setActiveScene] = useState<SceneNode | null>(null);
  const [combats, setCombats] = useState<CombatEncounter[]>([]);
  const [activeCombat, setActiveCombat] = useState<CombatEncounter | null>(null);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTableControls, setShowTableControls] = useState(false);
  const [showPlayerControls, setShowPlayerControls] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [players, setPlayers] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [state, setState] = useState<any>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [newCombatant, setNewCombatant] = useState({ name: "", type: "enemy", hp_max: 20, armor_class: 12, attack_bonus: 3, damage: "1d6", initiative: 10 });

  const loadAll = useCallback(async () => {
    if (!sessionId) return;
    const [scenesRes, combatsRes, rulesRes, tutRes, npcsRes, locsRes, playersRes, stateRes] = await Promise.all([
      fetch(`/api/scenes?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/combat?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/rules`).then(r => r.json()),
      fetch(`/api/tutorial`).then(r => r.json()),
      fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/state?sessionId=${sessionId}`).then(r => r.json())
    ]);
    setSceneTree(scenesRes.items || []);
    setCombats(combatsRes.items || []);
    setRules(rulesRes.items || []);
    setTutorials(tutRes.items || []);
    setNpcs(npcsRes.items || []);
    setLocations(locsRes.locations || []);
    setPlayers(playersRes.players || []);
    setState(stateRes);

    const active = (scenesRes.items || []).find((s: SceneNode) => s.is_active);
    if (active) setActiveScene(active);

    const activeC = (combatsRes.items || []).find((c: CombatEncounter) => c.is_active);
    if (activeC) {
      setActiveCombat(activeC);
      const ctRes = await fetch(`/api/combatants?combatId=${activeC.id}`).then(r => r.json());
      setCombatants(ctRes.items || []);
    }
  }, [sessionId]);

  useEffect(() => { if (sessionId) loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeToTable("scene_tree", sessionId, loadAll);
  }, [sessionId, loadAll]);

  async function activateScene(scene: SceneNode) {
    await fetch("/api/scenes", { method: "PATCH", body: JSON.stringify({ id: scene.id, is_active: true }) });
    await Promise.all(sceneTree.filter(s => s.id !== scene.id).map(s =>
      fetch("/api/scenes", { method: "PATCH", body: JSON.stringify({ id: s.id, is_active: false }) })
    ));
    setActiveScene(scene);
    if (scene.rule_reminder) setShowTutorial(true);
  }

  function getChildScenes(parentId: string | null) {
    return sceneTree.filter(s => s.parent_id === parentId);
  }

  function renderTree(nodeId: string | null, depth = 0) {
    const children = getChildScenes(nodeId);
    if (children.length === 0) return null;

    return (
      <div className={`ml-${depth > 0 ? 6 : 0} space-y-1`}>
        {children.map(child => (
          <div key={child.id}>
            <button
              onClick={() => activateScene(child)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                activeScene?.id === child.id
                  ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold"
                  : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-white/40">
                  {child.node_type === "start" ? "★" : child.node_type === "choice" ? "◈" : child.node_type === "combat" ? "⚔" : child.node_type === "ending" ? "■" : "●"}
                </span>
                <span className="flex-1 truncate">{child.title}</span>
                {child.is_active && <span className="text-[10px] text-emerald-400">ATTIVA</span>}
              </div>
            </button>
            {renderTree(child.id, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  async function createCombat() {
    const res = await fetch("/api/combat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, title: `Combattimento ${combats.length + 1}` })
    });
    const data = await res.json();
    if (data.item) {
      setCombats(prev => [data.item, ...prev]);
      setActiveCombat(data.item);
      setShowCombat(true);
    }
  }

  async function addCombatant() {
    if (!activeCombat) return;
    const res = await fetch("/api/combatants", {
      method: "POST",
      body: JSON.stringify({ ...newCombatant, combat_id: activeCombat.id, hp_current: newCombatant.hp_max })
    });
    const data = await res.json();
    if (data.item) {
      setCombatants(prev => [...prev, data.item]);
      setNewCombatant({ name: "", type: "enemy", hp_max: 20, armor_class: 12, attack_bonus: 3, damage: "1d6", initiative: 10 });
    }
  }

  async function updateCombatant(id: string, fields: any) {
    await fetch("/api/combatants", { method: "PATCH", body: JSON.stringify({ id, ...fields }) });
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  }

  async function removeCombatant(id: string) {
    await fetch(`/api/combatants?id=${id}`, { method: "DELETE" });
    setCombatants(prev => prev.filter(c => c.id !== id));
  }

  async function nextTurn() {
    if (!activeCombat) return;
    const sorted = combatants.filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);
    const nextIndex = (activeCombat.turn_index + 1) % sorted.length;
    const isNewRound = nextIndex === 0;
    await fetch("/api/combat", {
      method: "PATCH",
      body: JSON.stringify({
        id: activeCombat.id,
        turn_index: nextIndex,
        round: isNewRound ? activeCombat.round + 1 : activeCombat.round
      })
    });
    setActiveCombat(prev => prev ? {
      ...prev,
      turn_index: nextIndex,
      round: isNewRound ? prev.round + 1 : prev.round
    } : null);
  }

  async function damageCombatant(id: string, amount: number) {
    const c = combatants.find(c => c.id === id);
    if (!c) return;
    const newHp = Math.max(0, c.hp_current - amount);
    await updateCombatant(id, { hp_current: newHp, is_dead: newHp <= 0 });
  }

  async function healCombatant(id: string, amount: number) {
    const c = combatants.find(c => c.id === id);
    if (!c) return;
    const newHp = Math.min(c.hp_max, c.hp_current + amount);
    await updateCombatant(id, { hp_current: newHp, is_dead: false });
  }

  const sortedCombatants = [...combatants].filter(c => !c.is_dead).sort((a, b) => b.initiative - a.initiative);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: Scene Tree */}
      <aside className="w-72 shrink-0 border-r border-white/10 bg-black/30 p-4 overflow-y-auto max-h-screen">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Scene Tree</p>
          <button className="veil-btn mt-2 w-full text-xs" onClick={() => setShowCombat(v => !v)}>
            {showCombat ? "Nascondi combattimento" : "Gestisci combattimento"}
          </button>
        </div>
        {renderTree(null)}
        {sceneTree.length === 0 && (
          <p className="text-sm text-white/40 mt-4">Nessuna scena. Importa un Session Pack per iniziare.</p>
        )}

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">NPC presenti</p>
          <div className="mt-2 space-y-1">
            {npcs.filter(n => activeScene?.npc_ids?.includes(n.id)).map(n => (
              <p key={n.id} className="text-sm text-white/70">◆ {n.name}</p>
            ))}
            {(!activeScene?.npc_ids || activeScene.npc_ids.length === 0) && (
              <p className="text-xs text-white/40">Nessun NPC in questa scena</p>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Ambiente</p>
          <p className="mt-1 text-sm text-white/60">{activeScene?.environment || state?.location?.name || "—"}</p>
        </div>

        <div className="mt-6 space-y-1">
          <button className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/60 hover:border-white/20" onClick={() => setShowNotes(v => !v)}>
            {showNotes ? "Nascondi note" : "Note DM flottanti"}
          </button>
          <button className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/60 hover:border-white/20" onClick={() => setShowRules(v => !v)}>
            {showRules ? "Nascondi regole" : "Regole rapide"}
          </button>
          <button className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/60 hover:border-white/20" onClick={() => setShowTutorial(v => !v)}>
            {showTutorial ? "Nascondi tutorial" : "Suggerimenti DM"}
          </button>
        </div>

        {/* Tablet Controls */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Tavolo</p>
          <div className="mt-2 space-y-1">
            <button className="w-full rounded-lg border border-veil-gold/20 bg-veil-gold/8 px-3 py-2 text-left text-xs text-veil-gold/80 hover:bg-veil-gold/15" onClick={() => {
              const config = { backgroundImageUrl: activeScene?.environment || "", sceneImageUrl: "", soundUrl: activeScene?.music_url || "", mapType: "classic", mapMarkers: "" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
              window.open(`/table?sessionId=${sessionId}`, "_blank");
            }}>
              Invia scena al tavolo
            </button>
            <button className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/60 hover:border-white/20" onClick={() => setShowTableControls(v => !v)}>
              {showTableControls ? "Nascondi" : "Controlli tavolo"}
            </button>
          </div>
        </div>

        {/* Player Controls */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Giocatori</p>
          <div className="mt-2 space-y-1">
            <button className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-white/60 hover:border-white/20" onClick={() => setShowPlayerControls(v => !v)}>
              {showPlayerControls ? "Nascondi" : "Invia notifica"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto max-h-screen">
        {activeScene ? (
          <div className="max-w-4xl mx-auto">
            <div className="veil-premium-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase text-white/40">{activeScene.node_type}</span>
                <span className="text-veil-gold">·</span>
                <span className="text-sm text-veil-gold">{activeScene.title}</span>
              </div>

              <div className="mt-4 prose prose-invert max-w-none text-white/80 leading-relaxed whitespace-pre-wrap">
                {activeScene.content}
              </div>

              {activeScene.dm_suggestions && (
                <div className="mt-6 rounded-lg border border-veil-gold/20 bg-veil-gold/5 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold/60">Suggerimento DM</p>
                  <p className="mt-1 text-sm text-white/70">{activeScene.dm_suggestions}</p>
                </div>
              )}

              {activeScene.rule_reminder && (
                <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-900/20 p-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-sky-300">Regola</p>
                  <p className="mt-1 text-sm text-sky-200">{activeScene.rule_reminder}</p>
                </div>
              )}

              {activeScene.choices && activeScene.choices.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40 mb-3">Scelte possibili</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {activeScene.choices.map((choice: any, i: number) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-sm text-white">{choice.text}</p>
                        {choice.leads_to && (
                          <p className="mt-1 text-xs text-white/40">→ {choice.leads_to}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl text-white/30">Nessuna scena attiva</p>
              <p className="mt-2 text-sm text-white/20">Seleziona una scena dall'albero a sinistra</p>
            </div>
          </div>
        )}
      </main>

      {/* Right Panel: Floating Notes */}
      {showNotes && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Note DM</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowNotes(false)}>×</button>
          </div>
          <textarea
            className="veil-input w-full min-h-64 text-sm"
            placeholder="Scrivi cosa succede in sessione... Queste note verranno usate per generare il prossimo Session Pack."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
          />
          <p className="mt-2 text-[10px] text-white/30">Autosalvataggio attivo. Esporta a fine sessione.</p>
        </aside>
      )}

      {/* Combat Panel */}
      {showCombat && (
        <aside className="w-96 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Combattimento</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowCombat(false)}>×</button>
          </div>

          {!activeCombat ? (
            <button className="veil-btn w-full text-sm" onClick={createCombat}>Inizia combattimento</button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{activeCombat.title}</p>
                  <p className="text-xs text-white/50">Round {activeCombat.round}</p>
                </div>
                <button className="veil-btn text-xs" onClick={nextTurn}>Prossimo turno</button>
              </div>

              {/* Initiative Order */}
              <div className="space-y-1">
                {sortedCombatants.map((c, i) => (
                  <div key={c.id} className={`rounded-lg border p-3 ${
                    i === activeCombat.turn_index % sortedCombatants.length
                      ? "border-veil-gold/40 bg-veil-gold/10"
                      : "border-white/10 bg-black/20"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-veil-gold">{c.initiative}</span>
                        <span className={`text-sm font-medium ${c.type === 'player' ? 'text-emerald-300' : c.type === 'boss' ? 'text-red-300' : 'text-white'}`}>
                          {c.name}
                        </span>
                        <span className="text-[10px] text-white/40">{c.type}</span>
                      </div>
                      <span className={`text-sm ${c.hp_current <= 0 ? 'text-red-400 line-through' : 'text-white/70'}`}>
                        HP {c.hp_current}/{c.hp_max}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-white/40">CA {c.armor_class}</span>
                      <span className="text-xs text-white/40">Att +{c.attack_bonus}</span>
                      <span className="text-xs text-white/40">{c.damage}</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <button className="rounded bg-red-800/40 px-2 py-1 text-xs text-red-200 hover:bg-red-700/40" onClick={() => damageCombatant(c.id, 1)}>-1</button>
                      <button className="rounded bg-red-800/40 px-2 py-1 text-xs text-red-200 hover:bg-red-700/40" onClick={() => damageCombatant(c.id, 5)}>-5</button>
                      <button className="rounded bg-emerald-800/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-700/40" onClick={() => healCombatant(c.id, 5)}>+5</button>
                      <button className="rounded bg-emerald-800/40 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-700/40" onClick={() => healCombatant(c.id, 10)}>+10</button>
                      <button className="ml-auto rounded bg-red-900/30 px-2 py-1 text-xs text-red-300/50 hover:text-red-300" onClick={() => removeCombatant(c.id)}>×</button>
                    </div>
                    {c.conditions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.conditions.map((cond: string) => (
                          <span key={cond} className="rounded bg-amber-900/30 px-1.5 py-0.5 text-[10px] text-amber-200">{cond}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Combatant */}
              <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-white/40 mb-2">Aggiungi combattente</p>
                <div className="grid grid-cols-2 gap-2">
                  <input className="veil-input text-sm" placeholder="Nome" value={newCombatant.name} onChange={e => setNewCombatant({ ...newCombatant, name: e.target.value })} />
                  <select className="veil-input text-sm" value={newCombatant.type} onChange={e => setNewCombatant({ ...newCombatant, type: e.target.value })}>
                    <option value="enemy">Nemico</option>
                    <option value="boss">Boss</option>
                    <option value="ally">Alleato</option>
                    <option value="player">Giocatore</option>
                  </select>
                  <input className="veil-input text-sm" type="number" placeholder="HP" value={newCombatant.hp_max} onChange={e => setNewCombatant({ ...newCombatant, hp_max: Number(e.target.value) })} />
                  <input className="veil-input text-sm" type="number" placeholder="CA" value={newCombatant.armor_class} onChange={e => setNewCombatant({ ...newCombatant, armor_class: Number(e.target.value) })} />
                  <input className="veil-input text-sm" type="number" placeholder="Att bonus" value={newCombatant.attack_bonus} onChange={e => setNewCombatant({ ...newCombatant, attack_bonus: Number(e.target.value) })} />
                  <input className="veil-input text-sm" placeholder="Danno" value={newCombatant.damage} onChange={e => setNewCombatant({ ...newCombatant, damage: e.target.value })} />
                  <input className="veil-input text-sm" type="number" placeholder="Iniziativa" value={newCombatant.initiative} onChange={e => setNewCombatant({ ...newCombatant, initiative: Number(e.target.value) })} />
                </div>
                <button className="veil-btn mt-2 w-full text-sm" onClick={addCombatant}>Aggiungi</button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Tablet Controls Panel */}
      {showTableControls && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Controlli Tavolo</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowTableControls(false)}>×</button>
          </div>
          <p className="text-xs text-white/50 mb-4">Invia comandi al display tavolo in tempo reale.</p>
          <div className="space-y-3">
            <button className="veil-btn w-full text-xs" onClick={() => {
              const config = { backgroundImageUrl: activeScene?.environment || "", sceneImageUrl: "", soundUrl: activeScene?.music_url || "", mapType: "classic", mapMarkers: "" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
            }}>Sincronizza scena</button>
            <button className="veil-btn w-full text-xs" onClick={() => {
              const config = { ...JSON.parse(localStorage.getItem(`veil-table-display:${sessionId}`) || "{}"), effect: "fog" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
            }}>Attiva nebbia</button>
            <button className="veil-btn w-full text-xs" onClick={() => {
              const config = { ...JSON.parse(localStorage.getItem(`veil-table-display:${sessionId}`) || "{}"), effect: "rain" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
            }}>Attiva pioggia</button>
            <button className="veil-btn w-full text-xs" onClick={() => {
              const config = { ...JSON.parse(localStorage.getItem(`veil-table-display:${sessionId}`) || "{}"), effect: "storm" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
            }}>Attiva tempesta</button>
            <button className="veil-btn w-full text-xs" onClick={() => {
              const config = { ...JSON.parse(localStorage.getItem(`veil-table-display:${sessionId}`) || "{}"), effect: "glitch" };
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
            }}>Attiva glitch</button>
            <button className="veil-btn w-full text-xs" onClick={() => {
              localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify({}));
            }}>Ripristina tavolo</button>
          </div>
        </aside>
      )}

      {/* Player Controls Panel */}
      {showPlayerControls && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Invia notifica</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowPlayerControls(false)}>×</button>
          </div>
          <PlayerNotificationForm sessionId={sessionId} players={players} onSent={() => {}} />
        </aside>
      )}

      {/* Rules Panel */}
      {showRules && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Regole rapide</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowRules(false)}>×</button>
          </div>
          <select className="veil-input w-full mb-3 text-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">Tutte le categorie</option>
            {[...new Set(rules.map((r: any) => r.category))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="space-y-3">
            {(selectedCategory ? rules.filter((r: any) => r.category === selectedCategory) : rules).map((rule: any) => (
              <div key={rule.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-semibold text-veil-gold">{rule.title}</p>
                <p className="mt-1 text-sm text-white/70">{rule.content}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Tutorial Panel */}
      {showTutorial && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-black/40 p-4 overflow-y-auto max-h-screen">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-veil-gold">Suggerimenti DM</p>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setShowTutorial(false)}>×</button>
          </div>
          <div className="space-y-3">
            {tutorials.filter(t => activeScene?.rule_reminder ? t.trigger_event === 'combat_start' || t.trigger_event === 'first_session' : true).map((t: any) => (
              <div key={t.id} className="rounded-lg border border-veil-gold/20 bg-veil-gold/5 p-3">
                <p className="text-[10px] uppercase text-veil-gold/60">{t.category}</p>
                <p className="mt-1 text-sm text-white/70">{t.suggestion}</p>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

// ---------- PLAYER NOTIFICATION FORM ----------
function PlayerNotificationForm({ sessionId, players, onSent }: { sessionId: string; players: any[]; onSent: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState("message");
  const [shouldVibrate, setShouldVibrate] = useState(false);
  const [status, setStatus] = useState("");

  async function send() {
    if (!title || !content) return;
    setStatus("Invio in corso...");
    await fetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        title,
        content,
        type,
        player_id: playerId || null,
        should_vibrate: shouldVibrate,
        target_type: playerId ? "player" : "party"
      })
    });
    setTitle("");
    setContent("");
    setStatus("Inviato!");
    setTimeout(() => setStatus(""), 2000);
    onSent();
  }

  return (
    <div className="space-y-3">
      <select className="veil-input w-full text-sm" value={type} onChange={e => setType(e.target.value)}>
        <option value="message">Messaggio</option>
        <option value="whisper">Sussurro</option>
        <option value="vision">Visione</option>
        <option value="memory">Memoria</option>
        <option value="combat">Combattimento</option>
        <option value="quest">Quest</option>
        <option value="system">Sistema</option>
      </select>
      <input className="veil-input w-full text-sm" placeholder="Titolo" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="veil-input w-full text-sm" rows={4} placeholder="Contenuto della notifica" value={content} onChange={e => setContent(e.target.value)} />
      <select className="veil-input w-full text-sm" value={playerId} onChange={e => setPlayerId(e.target.value)}>
        <option value="">Tutto il party</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.character_name}</option>)}
      </select>
      <label className="flex items-center gap-2 text-xs text-white/60">
        <input type="checkbox" checked={shouldVibrate} onChange={e => setShouldVibrate(e.target.checked)} />
        Vibrazione
      </label>
      <button className="veil-btn w-full text-sm" onClick={send}>Invia notifica</button>
      {status && <p className="text-xs text-emerald-300">{status}</p>}
    </div>
  );
}
