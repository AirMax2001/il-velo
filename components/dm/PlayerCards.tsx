"use client";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { parseConditions, serializeConditions, CONDITIONS_LIST } from "@/lib/characterEngine";
import { AbilityReferenceTables } from "@/components/shared/AbilityReferenceTables";
import { SpellReferenceTables } from "@/components/shared/SpellReferenceTables";
import { CharacterSheet } from "@/components/player/CharacterSheet";
import { CollapseSection } from "@/components/player/sheet/ui";
import { getClassData } from "@/lib/data/classes";
import { CLASS_RESOURCES, CLASS_ABILITIES, ARCHETYPE_ABILITIES } from "@/lib/data/classAbilities";
import { subscribeToTable } from "@/lib/supabaseClient";

type PlayerCardsProps = { sessionId: string };
type PlayerDetailTab = "character" | "secrets";

export function PlayerCards({ sessionId }: PlayerCardsProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<PlayerDetailTab>("character");
  const [openRef, setOpenRef] = useState<"ability" | "skill" | "cantrips" | "spells" | "resources" | null>(null);
  const [sheetPlayer, setSheetPlayer] = useState<any>(null);

  async function load() {
    const d = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json());
    const list = d.players || [];
    setPlayers(list);
    setSelected(prev => prev ? list.find(p => p.id === prev.id) || prev : prev);
    setSheetPlayer(prev => prev ? list.find(p => p.id === prev.id) || prev : prev);
  }
  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  // Sync live via Supabase Realtime: aggiorna appena un giocatore salva.
  // Il polling resta solo come rete di sicurezza (30s) se il socket cade.
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToTable("players", sessionId, load);
    const t = setInterval(load, 30000);
    return () => { unsubscribe(); clearInterval(t); };
  }, [sessionId]);

  async function save(id: string, fields: any) {
    const body: any = { id };
    const cd: any = {};
    let hasCd = false;
    for (const [k, v] of Object.entries(fields)) {
      if (["character_name", "race", "class", "level", "xp", "hp_current", "hp_max", "temp_hp", "coins", "conditions", "age", "personality", "history", "goals", "fear", "important_person", "secret", "background", "dm_private_notes", "player_name"].includes(k)) {
        body[k] = v;
      } else {
        cd[k] = v;
        hasCd = true;
      }
    }
    if (hasCd) {
      cd._merge = true;
      body.character_data = cd;
    }
    await fetch("/api/players", { method: "PATCH", body: JSON.stringify(body) });
    await load();
    if (selected?.id === id) {
      setSelected((p: any) => {
        if (!p) return p;
        const { _merge, ...rest } = body.character_data || {};
        return { ...p, ...fields, ...(hasCd ? { character_data: { ...(p.character_data || {}), ...rest } } : {}) };
      });
    }
  }

  async function deletePlayer(id: string) {
    if (!window.confirm("Eliminare questo personaggio?")) return;
    await fetch(`/api/players?id=${id}&cascade=true`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    load();
  }

  const tabs: { id: PlayerDetailTab; label: string }[] = [
    { id: "character", label: "Personaggio" },
    { id: "secrets", label: "Segreti" },
  ];

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white mb-6">Giocatori</h2>

      {/* Riferimento regole: rettangoli cliccabili */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 mb-8">
        <button onClick={() => setOpenRef(openRef === "ability" ? null : "ability")}
          className={`rounded-2xl border p-5 text-left transition ${
            openRef === "ability" ? "border-veil-gold/30 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-veil-gold">Caratteristiche</h3>
            <span className="text-veil-gold/60 text-sm">{openRef === "ability" ? "−" : "+"}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Cosa rappresenta ogni caratteristica e dove si usa (Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma).</p>
        </button>
        <button onClick={() => setOpenRef(openRef === "skill" ? null : "skill")}
          className={`rounded-2xl border p-5 text-left transition ${
            openRef === "skill" ? "border-veil-gold/30 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-veil-gold">Abilità</h3>
            <span className="text-veil-gold/60 text-sm">{openRef === "skill" ? "−" : "+"}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Ogni abilità, la caratteristica associata e quando si usa.</p>
        </button>
        <button onClick={() => setOpenRef(openRef === "cantrips" ? null : "cantrips")}
          className={`rounded-2xl border p-5 text-left transition ${
            openRef === "cantrips" ? "border-veil-gold/30 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-veil-gold">Trucchetti</h3>
            <span className="text-veil-gold/60 text-sm">{openRef === "cantrips" ? "−" : "+"}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Trucchetti di livello 0 lanciabili a volontà.</p>
        </button>
        <button onClick={() => setOpenRef(openRef === "spells" ? null : "spells")}
          className={`rounded-2xl border p-5 text-left transition ${
            openRef === "spells" ? "border-veil-gold/30 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-veil-gold">Incantesimi</h3>
            <span className="text-veil-gold/60 text-sm">{openRef === "spells" ? "−" : "+"}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Tutti gli incantesimi 1°-9°, scuola e cosa fanno (già aperti).</p>
        </button>
        <button onClick={() => setOpenRef(openRef === "resources" ? null : "resources")}
          className={`rounded-2xl border p-5 text-left transition ${
            openRef === "resources" ? "border-veil-gold/30 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
          }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-veil-gold">Ki &amp; Risorse</h3>
            <span className="text-veil-gold/60 text-sm">{openRef === "resources" ? "−" : "+"}</span>
          </div>
          <p className="mt-1 text-xs text-white/40">Punti Ki, Ire, Incanalare Divinità e le capacità che spendono Ki.</p>
        </button>
      </div>

      {openRef && (
        <div className="mb-8">
          {openRef === "ability" && <AbilityReferenceTables only="ability" />}
          {openRef === "skill" && <AbilityReferenceTables only="skill" />}
          {openRef === "cantrips" && <SpellReferenceTables only="cantrips" />}
          {openRef === "spells" && <SpellReferenceTables only="spells" expandAll />}
          {openRef === "resources" && <ResourceReferenceTables />}
        </div>
      )}

      {players.length === 0 && (
        <p className="text-sm text-white/40">Nessun giocatore in questa campagna.</p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {players.map(p => (
          <div
            key={p.id}
            className={`group relative cursor-pointer rounded-2xl border p-5 transition ${
              selected?.id === p.id
                ? "border-veil-gold/30 bg-[linear-gradient(135deg,rgba(201,164,76,0.06),transparent)]"
                : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.02]"
            }`}
            onClick={() => setSelected(selected?.id === p.id ? null : p)}
          >
            <button
              onClick={e => { e.stopPropagation(); deletePlayer(p.id); }}
              className="absolute right-3 top-3 text-xs text-white/15 hover:text-red-300 transition z-10"
            >
              ×
            </button>

            <div className="flex items-start gap-4">
              <PlayerAvatar url={p.avatar_url} name={p.character_name} size="lg" />

              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{p.character_name}</p>
                <p className="mt-0.5 text-xs text-white/45">
                  {p.race || "—"} · {p.class || "—"} · {p.age || "—"} · Liv. {p.level || 1}
                </p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">HP</span>
                    <span className="text-veil-gold">{p.hp_current ?? 0}/{p.hp_max ?? 0}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                      style={{ width: `${Math.min(100, ((p.hp_current ?? 0) / Math.max(1, p.hp_max ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {(parseConditions(p.conditions)).slice(0, 2).map((c: string) => (
                    <span key={c} className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-200">{c}</span>
                  ))}
                  {p.coins > 0 && (
                    <span className="rounded bg-veil-gold/8 px-1.5 py-0.5 text-[10px] text-veil-gold">{p.coins} ◎</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400/70">Online</span>
              <button
                onClick={e => { e.stopPropagation(); const v = !p.character_data?.inspiration; save(p.id, { inspiration: v }); }}
                className={`rounded-lg border px-2 py-0.5 text-[10px] transition ${p.character_data?.inspiration ? "border-veil-gold/30 bg-veil-gold/15 text-veil-gold" : "border-white/10 bg-white/[0.03] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold/70"}`}
                title={p.character_data?.inspiration ? "Rimuovi ispirazione" : "Assegna ispirazione (il giocatore vedrà i bordi oro)"}>
                {p.character_data?.inspiration ? "★ Ispirato" : "☆ Assegna ispirazione"}
              </button>
              <span className="text-[10px] text-white/20 ml-auto">XP {p.xp ?? 0}</span>
              <button
                onClick={e => { e.stopPropagation(); setSheetPlayer(p); }}
                className="rounded-lg border border-veil-gold/20 bg-veil-gold/[0.06] px-2 py-0.5 text-[10px] text-veil-gold/80 hover:border-veil-gold/40 hover:text-veil-gold transition"
                title="Apri la scheda completa come vista giocatore">
                🧝 Entra nella scheda
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${selected ? "" : "hidden"} lg:sticky lg:top-6`}>
        {selected && (
          <div className="rounded-2xl border border-white/[0.06] bg-black/30 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5">
              <div className="flex items-center gap-4">
                <PlayerAvatar url={selected.avatar_url} name={selected.character_name} size="lg" />
                <div className="min-w-0">
                  <h3 className="text-lg text-veil-gold truncate">{selected.character_name}</h3>
                  <p className="mt-0.5 text-xs text-white/50">
                    {selected.race || "—"} · {selected.class || "—"} · Liv. {selected.level || 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-emerald-400/15 bg-emerald-900/10 px-3 py-1.5 text-center">
                  <p className="text-[9px] uppercase text-white/30">HP</p>
                  <p className="text-sm text-emerald-400">{selected.hp_current ?? 0}/{selected.hp_max ?? 0}</p>
                </div>
                <div className="flex-1 rounded-xl border border-veil-gold/20 bg-veil-gold/[0.06] px-3 py-1.5 text-center">
                  <p className="text-[9px] uppercase text-white/30">XP</p>
                  <p className="text-sm text-veil-gold">{selected.xp ?? 0}</p>
                </div>
                <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-center">
                  <p className="text-[9px] uppercase text-white/30">◎</p>
                  <p className="text-sm text-white/80">{selected.coins ?? 0}</p>
                </div>
              </div>
              <button
                onClick={() => setSheetPlayer(selected)}
                className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2 text-xs text-veil-gold hover:bg-veil-gold/20 transition"
                title="Apri la scheda del giocatore come la vede lui (modifiche in tempo reale)">
                🧝 Entra nella scheda del giocatore
              </button>
            </div>

            <div className="flex gap-1 border-b border-white/[0.06] px-6">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setDetailTab(t.id)}
                  className={`px-4 py-3 text-xs tracking-[0.05em] border-b-2 transition ${
                    detailTab === t.id ? "border-veil-gold/50 text-veil-gold" : "border-transparent text-white/30 hover:text-white/60"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {detailTab === "character" && selected && (
                <PlayerDetailSheet player={selected} onSave={(f: any) => save(selected.id, f)} />
              )}
              {detailTab === "secrets" && <PlayerSecrets sessionId={sessionId} playerId={selected.id} />}
            </div>
          </div>
        )}
      </div>

      {sheetPlayer && (
        <PlayerSheetOverlay player={sheetPlayer} sessionId={sessionId} onClose={() => setSheetPlayer(null)} />
      )}
      </div>
    </div>
  );
}

// ---------- Riferimento Ki & Risorse (per il DM) ----------
function ResourceReferenceTables() {
  const kiAbilities = [
    ...(CLASS_ABILITIES.monk || []),
    ...Object.values(ARCHETYPE_ABILITIES).flat(),
  ].filter(a => a.uses.toLowerCase().includes("ki"));

  const resourceTotal = (clsKey: string, r: any): string => {
    if (clsKey === "monk") return "pari al livello del Monaco";
    if (clsKey === "barbarian") return "2 + bonus di competenza";
    if (clsKey === "bard") return "mod. CAR (min 1)";
    if (clsKey === "cleric") return "1 (2 al 6°, 3 al 13°, 4 al 17°)";
    if (clsKey === "druid") return "2";
    if (clsKey === "fighter") return r.key === "secondo_soffio" ? "1" : "1 (2 al 17°)";
    if (clsKey === "paladin") return "1 + mod. CAR";
    if (clsKey === "sorcerer") return "pari al livello dello Stregone";
    if (clsKey === "wizard") return "1";
    return "—";
  };

  return (
    <div className="space-y-3">
      <CollapseSection
        title="☯ Risorse consumabili di classe"
        subtitle="Il totale è automatico per classe e livello"
        defaultOpen
        badge={<span className="rounded-full border border-veil-gold/20 px-2 py-0.5 text-[10px] text-veil-gold/60">Punti Ki = livello del Monaco</span>}
      >
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(CLASS_RESOURCES).flatMap(([clsKey, arr]) =>
            arr.map(r => {
              const cls = getClassData(clsKey);
              return (
                <div key={clsKey + r.key} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{r.icon}</span>
                    <p className="text-xs text-white/70 font-medium">{cls?.name || clsKey} · {r.name}</p>
                  </div>
                  <p className="text-[10px] text-white/35 mt-1">Totale: {resourceTotal(clsKey, r)}</p>
                  <p className="text-[10px] text-veil-gold/50">Ripristino: {r.restore}</p>
                </div>
              );
            })
          )}
        </div>
      </CollapseSection>

      <CollapseSection
        title="⚡ Capacità che spendono Ki"
        subtitle="Costo in punti Ki di ogni capacità del Monaco (e delle sue tradizioni)"
        defaultOpen
      >
        <div className="space-y-2">
          {kiAbilities.map(a => (
            <div key={a.key} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/70 font-medium">{a.name}</p>
                <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300/80">{a.uses}</span>
              </div>
              <p className="text-[10px] text-white/30 mt-0.5">{a.action} · lv. {a.level}</p>
              <p className="text-[11px] text-white/45 mt-1 leading-snug">{a.effect}</p>
            </div>
          ))}
        </div>
      </CollapseSection>
    </div>
  );
}

// ---------- Vista rapida DM: solo Comando Live (il resto si apre con "Entra nella scheda") ----------
function PlayerDetailSheet({ player, onSave }: { player: any; onSave: (f: any) => void }) {
  const cd = player.character_data || {};

  return (
    <div className="space-y-5">
      {/* Comando Live: DM aggiorna, il player vede in diretta */}
      <Section title="⚡ Comando Live (il giocatore vede in tempo reale)">
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <DMField label="PF Correnti" value={player.hp_current} type="number" onSave={v => onSave({ hp_current: v })} />
            <DMField label="PF Max" value={player.hp_max} type="number" onSave={v => onSave({ hp_max: v })} />
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Tiri Morte ✓</label>
              <div className="flex gap-1 mt-1.5">
                {[0,1,2].map(i => (
                  <button key={i} onClick={() => onSave({ deathSaveSuccesses: Math.min(cd.deathSaveSuccesses > i ? i : i + 1, 3) })}
                    className={`h-7 w-7 rounded-full border text-xs ${(cd.deathSaveSuccesses || 0) > i ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-200" : "border-white/10 text-white/30 hover:border-emerald-400/30"}`}>✓</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Tiri Morte ✕</label>
              <div className="flex gap-1 mt-1.5">
                {[0,1,2].map(i => (
                  <button key={i} onClick={() => onSave({ deathSaveFailures: Math.min(cd.deathSaveFailures > i ? i : i + 1, 3) })}
                    className={`h-7 w-7 rounded-full border text-xs ${(cd.deathSaveFailures || 0) > i ? "bg-red-500/30 border-red-400/50 text-red-200" : "border-white/10 text-white/30 hover:border-red-400/30"}`}>✕</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="🩸 Condizioni (solo DM — appaiono in rosso sopra in Combattimento)">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {parseConditions(player.conditions).map((c: string) => (
            <span key={c} className="rounded-full border border-red-500/40 bg-red-900/30 px-2.5 py-1 text-xs font-bold text-red-300 flex items-center gap-1">
              {c}
              <button onClick={() => onSave({ conditions: serializeConditions(parseConditions(player.conditions).filter((x: string) => x !== c)) })} className="text-red-300/60 hover:text-red-300">×</button>
            </span>
          ))}
          {parseConditions(player.conditions).length === 0 && <span className="text-xs text-white/25">Nessuna condizione attiva</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {CONDITIONS_LIST.filter(c => !parseConditions(player.conditions).includes(c)).map(c => (
            <button key={c} onClick={() => onSave({ conditions: serializeConditions([...parseConditions(player.conditions), c]) })} className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/35 hover:border-red-400/30 hover:text-red-300/70 transition">+ {c}</button>
          ))}
        </div>
        <p className="text-[9px] text-white/20 mt-2">Le condizioni appaiono in rosso sopra in Combattimento del giocatore.</p>
      </Section>

    </div>
  );
}

// ---------- Scheda giocatore in overlay (vista DM = vista player) ----------
function PlayerSheetOverlay({ player, sessionId, onClose }: { player: any; sessionId: string; onClose: () => void }) {
  const [live, setLive] = useState<any>(player);
  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json());
      const found = (r.players || []).find((p: any) => p.id === player.id);
      if (found) setLive(found);
    }, 5000);
    return () => clearInterval(t);
  }, [player.id, sessionId]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0e14]">
      <div className="sticky top-0 z-30 border-b border-veil-gold/15 bg-[#12161f]/95 px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:border-veil-gold/40 hover:text-veil-gold transition">
            ← Torna in DM
          </button>
          <p className="text-[11px] text-white/35 truncate">
            Vista giocatore: <span className="text-veil-gold/80">{live?.character_name || player.character_name}</span>
          </p>
        </div>
      </div>
      <div className="px-4 sm:px-8 pb-24 pt-1">
        <CharacterSheet
          player={live || player}
          onUpdate={setLive}
          sessionId={sessionId}
          onExit={onClose}
          dmMode
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <h4 className="text-sm text-veil-gold/80 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function DMField({ label, value, type, onSave, area }: { label: string; value: any; type?: string; onSave: (v: any) => void; area?: boolean }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const Comp = area ? "textarea" : "input";
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">{label}</label>
      <Comp
        className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none resize-none"
        type={area ? undefined : type || "text"}
        value={v}
        onChange={e => setV(type === "number" ? Number(e.target.value) : e.target.value)}
        onBlur={() => onSave(v)}
        rows={area ? 3 : undefined}
      />
    </div>
  );
}

// ---------- Inventory ----------
function PlayerSecrets({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [secrets, setSecrets] = useState<any[]>([]);
  useEffect(() => {
    if (!sessionId || !playerId) return;
    fetch(`/api/secrets?sessionId=${sessionId}&playerId=${playerId}`).then(r => r.json()).then(d => setSecrets(d.items || []));
  }, [sessionId, playerId]);

  if (secrets.length === 0) return <p className="text-sm text-white/40">Nessun segreto.</p>;

  return (
    <div className="space-y-3">
      {secrets.map((s: any) => (
        <div key={s.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
          <p className="text-sm text-white font-medium">{s.title || "Segreto"}</p>
          <p className="text-xs text-white/50 mt-1">{s.content}</p>
        </div>
      ))}
    </div>
  );
}

function safeArray(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

const skillKeys: { key: string; label: string; ability: string }[] = [
  { key: "skillAthletics", label: "Atletica", ability: "strength" },
  { key: "skillAcrobatics", label: "Acrobazia", ability: "dexterity" },
  { key: "skillSleightOfHand", label: "Rapidità di Mano", ability: "dexterity" },
  { key: "skillStealth", label: "Furtività", ability: "dexterity" },
  { key: "skillArcana", label: "Arcano", ability: "intelligence" },
  { key: "skillHistory", label: "Storia", ability: "intelligence" },
  { key: "skillInvestigation", label: "Indagare", ability: "intelligence" },
  { key: "skillNature", label: "Natura", ability: "intelligence" },
  { key: "skillReligion", label: "Religione", ability: "intelligence" },
  { key: "skillAnimalHandling", label: "Addestrare Animali", ability: "wisdom" },
  { key: "skillInsight", label: "Intuizione", ability: "wisdom" },
  { key: "skillMedicine", label: "Medicina", ability: "wisdom" },
  { key: "skillPerception", label: "Percezione", ability: "wisdom" },
  { key: "skillSurvival", label: "Sopravvivenza", ability: "wisdom" },
  { key: "skillDeception", label: "Inganno", ability: "charisma" },
  { key: "skillIntimidation", label: "Intimidire", ability: "charisma" },
  { key: "skillPerformance", label: "Intrattenere", ability: "charisma" },
  { key: "skillPersuasion", label: "Persuasione", ability: "charisma" },
];
