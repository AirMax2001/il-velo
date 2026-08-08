"use client";
import { useEffect, useState } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import backgrounds, { getBackgroundData } from "@/lib/data/backgrounds";
import { getModifier, formatMod, getProficiencyBonus } from "@/lib/characterEngine";
import { AbilityReferenceTables } from "@/components/shared/AbilityReferenceTables";
import {
  getFeaturesUpTo, getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit, WARLOCK_SLOT_LEVEL,
} from "@/lib/data/leveling";

type PlayerCardsProps = { sessionId: string };
type PlayerDetailTab = "character" | "inventory" | "secrets";

export function PlayerCards({ sessionId }: PlayerCardsProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<PlayerDetailTab>("character");
  const [echoText, setEchoText] = useState("");
  const [echoAllText, setEchoAllText] = useState("");
  const [echoSent, setEchoSent] = useState(false);
  const [openRef, setOpenRef] = useState<"ability" | "skill" | null>(null);

  async function load() {
    const d = await fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json());
    const list = d.players || [];
    setPlayers(list);
    setSelected(prev => prev ? list.find(p => p.id === prev.id) || prev : prev);
  }
  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  // Sync live: mentre la pagina è aperta, ricarica i giocatori ogni 5s
  // così le modifiche del player arrivano in automatico nella vista DM.
  useEffect(() => {
    if (!sessionId) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
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

  async function sendEcho(playerId?: string) {
    if (playerId) {
      if (!echoText.trim()) return;
      await fetch("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, player_id: playerId, type: "message", title: "Echo", content: echoText })
      });
      setEchoText("");
    } else {
      if (!echoAllText.trim()) return;
      await Promise.all(players.map(p =>
        fetch("/api/notifications", {
          method: "POST",
          body: JSON.stringify({ session_id: sessionId, player_id: p.id, type: "message", title: "Echo a tutti", content: echoAllText })
        })
      ));
      setEchoAllText("");
    }
    setEchoSent(true);
    setTimeout(() => setEchoSent(false), 2000);
  }

  const tabs: { id: PlayerDetailTab; label: string }[] = [
    { id: "character", label: "Personaggio" },
    { id: "inventory", label: "Inventario" },
    { id: "secrets", label: "Segreti" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white mb-6">Giocatori</h2>

      {/* Riferimento regole: due rettangoli cliccabili */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
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
      </div>

      {openRef && (
        <div className="mb-8">
          <AbilityReferenceTables only={openRef} />
        </div>
      )}

      {players.length === 0 && (
        <p className="text-sm text-white/40">Nessun giocatore in questa campagna.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                  {(Array.isArray(p.conditions) ? p.conditions : []).slice(0, 2).map((c: string) => (
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
              <span className="text-[10px] text-white/20 ml-auto">XP {p.xp ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-white/[0.06] bg-black/30">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6">
              <div className="flex items-center gap-4">
                <PlayerAvatar url={selected.avatar_url} name={selected.character_name} size="xl" />
                <div>
                  <h3 className="text-xl text-veil-gold">{selected.character_name}</h3>
                  <p className="mt-1 text-sm text-white/50">
                    {selected.race || "—"} · {selected.class || "—"} · Liv. {selected.level || 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-[10px] uppercase text-white/30">HP</p>
                  <p className="text-lg text-emerald-400">{selected.hp_current ?? 0}/{selected.hp_max ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-white/30">XP</p>
                  <p className="text-lg text-veil-gold">{selected.xp ?? 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase text-white/30">◎</p>
                  <p className="text-lg text-veil-gold">{selected.coins ?? 0}</p>
                </div>
              </div>
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
              {detailTab === "inventory" && <PlayerInventory sessionId={sessionId} playerId={selected.id} />}
              {detailTab === "secrets" && <PlayerSecrets sessionId={sessionId} playerId={selected.id} />}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-5 h-fit sticky top-6">
            <h3 className="text-sm font-semibold text-veil-gold mb-1">Notifica Echo</h3>
            <p className="text-xs text-white/40 mb-4">Invia una notifica a {selected.character_name}</p>
            <textarea className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 resize-none focus:outline-none focus:border-veil-gold/30"
              rows={5} placeholder="Scrivi il messaggio echo..." value={echoText}
              onChange={e => setEchoText(e.target.value)} />
            <button className="mt-3 w-full rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2.5 text-sm text-veil-gold hover:bg-veil-gold/20 transition disabled:opacity-40"
              disabled={!echoText.trim()} onClick={() => sendEcho(selected.id)}>
              {echoSent ? "Inviato!" : "Invia Echo"}
            </button>
          </div>
        </div>
      )}

      {!selected && players.length > 0 && (
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-black/30 p-5 max-w-md">
          <h3 className="text-sm font-semibold text-veil-gold mb-1">Notifica Echo a tutti</h3>
          <p className="text-xs text-white/40 mb-4">Invia una notifica a tutti i giocatori</p>
          <textarea className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 resize-none focus:outline-none focus:border-veil-gold/30"
            rows={5} placeholder="Scrivi il messaggio echo per tutti..." value={echoAllText}
            onChange={e => setEchoAllText(e.target.value)} />
          <button className="mt-3 w-full rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2.5 text-sm text-veil-gold hover:bg-veil-gold/20 transition disabled:opacity-40"
            disabled={!echoAllText.trim()} onClick={() => sendEcho()}>
            {echoSent ? "Inviato a tutti!" : "Invia Echo a tutti"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Full character sheet for DM ----------
function PlayerDetailSheet({ player, onSave }: { player: any; onSave: (f: any) => void }) {
  const cd = player.character_data || {};

  const abilityLabels: Record<string, string> = { strength: "FOR", dexterity: "DES", constitution: "COS", intelligence: "INT", wisdom: "SAG", charisma: "CAR" };

  // Bonus razziali come nella scheda del player (CharacterSheet usa getTotalScore)
  const raceKey = findRaceKey(player.race || "");
  const raceData = raceKey ? getRaceData(raceKey) : null;
  function abilityTotal(k: string): number {
    return (Number(cd[k]) || 10) + (raceData?.abilityBonuses?.[k] || 0);
  }

  return (
    <div className="space-y-5">
      {/* Info Base */}
      <Section title="Info Base">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <DMField label="Nome" value={player.character_name} onSave={v => onSave({ character_name: v })} />
          {/* Razza dropdown */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Razza</label>
            <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none"
              value={player.race || ""}
              onChange={e => onSave({ race: e.target.value })}>
              <option value="" disabled>Seleziona razza</option>
              <option value="Dragonide">Dragonide</option>
              <option value="Elfo">Elfo</option><option value="Elfo dei Boschi">Elfo dei Boschi</option><option value="Elfo Oscuro">Elfo Oscuro</option>
              <option value="Halfling">Halfling</option><option value="Mezzelfo">Mezzelfo</option><option value="Mezzorco">Mezzorco</option>
              <option value="Nano">Nano</option><option value="Nano delle Colline">Nano delle Colline</option><option value="Nano delle Montagne">Nano delle Montagne</option>
              <option value="Tiefling">Tiefling</option><option value="Umano">Umano</option>
              <option value="Fata">Fata</option>
              <option value="Gnomo">Gnomo</option><option value="Gnomo delle Foreste">Gnomo delle Foreste</option><option value="Gnomo delle Rocce">Gnomo delle Rocce</option>
              <option value="Halfling Piedelesto">Halfling Piedelesto</option><option value="Halfling Robusto">Halfling Robusto</option>
            </select>
          </div>
          {/* Classe dropdown */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Classe</label>
            <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none"
              value={findClassKey(player.class || "")}
              onChange={e => {
                const clsKey = e.target.value;
                const clsData = getClassData(clsKey);
                const clsName = clsData?.name || clsKey;
                if (!clsData) { onSave({ class: clsName }); return; }
                const autoSt: Record<string, boolean> = {};
                (["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const).forEach(k => {
                  const stKey = "st" + k.charAt(0).toUpperCase() + k.slice(1);
                  autoSt[stKey] = clsData.savingThrows.includes(stKey);
                });
                onSave({ class: clsName, ...autoSt });
              }}>
              <option value="" disabled>Seleziona classe</option>
              <option value="barbarian">Barbaro</option><option value="bard">Bardo</option><option value="cleric">Chierico</option>
              <option value="druid">Druido</option><option value="fighter">Guerriero</option><option value="monk">Monaco</option>
              <option value="paladin">Paladino</option><option value="ranger">Ranger</option><option value="rogue">Ladro</option>
              <option value="sorcerer">Stregone</option><option value="warlock">Warlock</option><option value="wizard">Mago</option>
            </select>
          </div>
          <DMField label="Livello" value={player.level} type="number" onSave={v => onSave({ level: v })} />
          {/* Background dropdown */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Background</label>
            <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none"
              value={player.background || ""}
              onChange={e => onSave({ background: e.target.value })}>
              <option value="" disabled>Seleziona background</option>
              <option value="Accolito">Accolito</option><option value="Artigiano della Gilda">Artigiano della Gilda</option>
              <option value="Artista">Artista</option><option value="Criminale">Criminale</option><option value="Eremita">Eremita</option>
              <option value="Eroe del Popolo">Eroe del Popolo</option><option value="Forestiero">Forestiero</option>
              <option value="Marinaio">Marinaio</option><option value="Nobile">Nobile</option><option value="Saggio">Saggio</option>
              <option value="Soldato">Soldato</option><option value="Svergognato">Svergognato</option>
            </select>
          </div>
          <DMField label="Allineamento" value={cd.alignment} onSave={v => onSave({ alignment: v })} />
          <DMField label="XP" value={player.xp} type="number" onSave={v => onSave({ xp: v })} />
          <DMField label="Età" value={player.age} onSave={v => onSave({ age: v })} />
          <DMField label="Monete" value={player.coins} type="number" onSave={v => onSave({ coins: v })} />
        </div>
      </Section>

      {/* Caratteristiche — identico alla scheda del player (stessi valori) */}
      <Section title="Caratteristiche">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
          {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map(k => {
            const base = Number(cd[k]) || 10;
            const bonus = raceData?.abilityBonuses?.[k] || 0;
            const total = base + bonus;
            const mod = getModifier(total);
            return (
              <div key={k}>
                <LabelWithGuide fieldKey={k} label={abilityLabels[k]} className="text-xs text-white/40 mb-1" />
                <input type="number" min={1} max={20} className="veil-input w-full text-center text-lg font-bold px-1"
                  value={base}
                  onChange={e => onSave({ [k]: Number(e.target.value) })} />
                <p className="text-base text-veil-gold font-bold mt-1">{mod >= 0 ? `+${mod}` : `${mod}`}</p>
                {bonus > 0 ? (
                  <p className="text-[9px] text-emerald-400/60 mt-0.5">base+{bonus}={total}</p>
                ) : (
                  <p className="text-[9px] text-white/20 mt-0.5">base</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Tiri Salvezza */}
      <Section title="Tiri Salvezza">
        {(() => {
          const clsKey = findClassKey(player.class || "");
          const clsData = clsKey ? getClassData(clsKey) : null;
          const classSt = clsData?.savingThrows || [];
          const pb = getProficiencyBonus(Number(player.level) || 1);
          return (
            <>
              {classSt.length > 0 && <p className="text-[10px] text-veil-gold/50 mb-3">Competenze automatiche: {classSt.map((k: string) => abilityLabels[k.replace("st","").toLowerCase()] || k).join(", ")}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const).map(k => {
                  const stKey = "st" + k.charAt(0).toUpperCase() + k.slice(1);
                  const isClassSt = classSt.includes(stKey);
                  const score = abilityTotal(k);
                  const modVal = getModifier(score);
                  const total = isClassSt ? modVal + pb : modVal;
                  return (
                    <div key={stKey} className={`flex items-center gap-2 ${isClassSt ? "opacity-100" : "opacity-40"}`}>
                      <div className={`h-4 w-4 rounded border ${isClassSt ? "bg-veil-gold/20 border-veil-gold/50" : "border-white/10"}`} />
                      <LabelWithGuide fieldKey={stKey} label={abilityLabels[k]} className={`text-xs ${isClassSt ? "text-white/80" : "text-white/40"}`} />
                      <span className="text-xs text-veil-gold/50 ml-auto">{formatMod(total)}</span>
                      {isClassSt && <span className="text-[9px] text-veil-gold/40">✓ classe</span>}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Section>

      {/* Abilità */}
      <Section title="Abilità">
        {(() => {
          const clsKey = findClassKey(player.class || "");
          const clsData = clsKey ? getClassData(clsKey) : null;
          const clsPicks = clsData?.skillPicks ?? 0;
          const clsOptions = clsData?.skillOptions ?? [];
          const raceKey = findRaceKey(player.race || "");
          const raceData = raceKey ? getRaceData(raceKey) : null;
          const bgKey = Object.keys(backgrounds).find(k => (backgrounds as any)[k].name === player.background);
          const bgSkills = new Set<string>((getBackgroundData(bgKey || player.background || "")?.skillProficiencies || []).filter(Boolean));
          const raceSkills = new Set<string>((raceData?.proficiencies?.skills || []).filter(Boolean));
          // Solo le abilità dell'elenco della classe contano per i pick (background/razza sono automatiche)
          const classPicked = skillKeys.filter(sk => cd[sk.key] && clsOptions.includes(sk.key) && !bgSkills.has(sk.key) && !raceSkills.has(sk.key)).length;
          const over = classPicked > clsPicks;
          const pb = getProficiencyBonus(Number(player.level) || 1);
          return (
            <>
              {clsPicks > 0 && (
                <p className={`text-[10px] mb-3 ${over ? "text-red-400" : "text-veil-gold/50"}`}>
                  Competenze di classe: {classPicked}/{clsPicks}
                  {over ? " (superato! deseleziona quelle in più)" : ` (ancora ${clsPicks - classPicked})`}
                  {bgSkills.size > 0 && <> · background: {bgSkills.size}</>}
                  {raceSkills.size > 0 && <> · razza: {raceSkills.size}</>}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {skillKeys.map(sk => {
                  const inClass = clsOptions.includes(sk.key);
                  const isBg = bgSkills.has(sk.key);
                  const isRace = raceSkills.has(sk.key);
                  const locked = isBg || isRace;
                  const enabled = inClass || locked;
                  const score = abilityTotal(sk.ability);
                  const modVal = getModifier(score);
                  const total = cd[sk.key] ? modVal + pb : modVal;
                  return (
                    <label key={sk.key} className={`flex items-center gap-2 text-xs ${enabled ? "text-white/60" : "text-white/30"} ${locked ? "" : "cursor-pointer"}`}>
                      <input type="checkbox" className="accent-veil-gold" checked={cd[sk.key] ?? false}
                        disabled={locked}
                        onChange={e => onSave({ [sk.key]: e.target.checked })} />
                      <LabelWithGuide fieldKey={sk.key} label={sk.label + " (" + abilityLabels[sk.ability] + ")"} className={`text-xs ${enabled ? "text-white/60" : "text-white/30"}`} />
                      <span className="text-[10px] text-veil-gold/40 ml-auto">{formatMod(total)}</span>
                      {isBg && <span className="text-[9px] text-emerald-400/40">BG</span>}
                      {isRace && !isBg && <span className="text-[9px] text-emerald-400/40">razza</span>}
                      {inClass && !locked && <span className="text-[9px] text-veil-gold/40">classe</span>}
                    </label>
                  );
                })}
              </div>
            </>
          );
        })()}
      </Section>

      {/* Combattimento */}
      <Section title="Combattimento">
        {(() => {
          const dex = abilityTotal("dexterity");
          const lv = Number(player.level) || 1;
          const pb = getProficiencyBonus(lv);
          const initMod = getModifier(dex);
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DMField label="CA" value={cd.armorClass} type="number" onSave={v => onSave({ armorClass: v })} />
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Iniziativa</label>
                <div className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">{formatMod(initMod)}</span>
                  <span className="text-[9px] text-white/20">DES</span>
                </div>
              </div>
              <DMField label="Velocità" value={cd.speed} type="number" onSave={v => onSave({ speed: v })} />
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Bonus Competenza</label>
                <div className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">+{pb}</span>
                  <span className="text-[9px] text-white/20">liv.{lv}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer col-span-full">
                <input type="checkbox" className="accent-veil-gold" checked={cd.inspiration ?? false}
                  onChange={e => onSave({ inspiration: e.target.checked })} />
                <LabelWithGuide fieldKey="inspiration" label="Ispirazione" />
              </label>
            </div>
          );
        })()}
      </Section>

      {/* HP e Dadi Vita */}
      <Section title="Punti Ferita">
        {(() => {
          const clsKey = findClassKey(player.class || "");
          const clsData = clsKey ? getClassData(clsKey) : null;
          const hitDie = clsData?.hitDie;
          const con = abilityTotal("constitution");
          const conMod = getModifier(con);
          const lv = Number(player.level) || 1;
          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DMField label="PF Max" value={player.hp_max} type="number" onSave={v => onSave({ hp_max: v })} />
                <DMField label="PF Correnti" value={player.hp_current} type="number" onSave={v => onSave({ hp_current: v })} />
                <DMField label="PF Temp" value={player.temp_hp} type="number" onSave={v => onSave({ temp_hp: v })} />
                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Dadi Vita</label>
                  <div className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/40">
                    {hitDie ? `${lv}d${hitDie}${conMod >= 0 ? "+" : ""}${conMod * lv}` : "—"}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-6">
                <div>
                  <LabelWithGuide fieldKey="deathSaveSuccesses" label="Tiri Morte ✓" />
                  <div className="flex gap-1 mt-1">
                    {[0,1,2].map(i => (
                      <button key={i} onClick={() => onSave({ deathSaveSuccesses: Math.min(i === (cd.deathSaveSuccesses || 0) ? i - 1 : i, 3) })}
                        className={`h-5 w-5 rounded-full border text-[10px] ${(cd.deathSaveSuccesses || 0) > i ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-200" : "border-white/10 text-white/30"}`}>✓</button>
                    ))}
                  </div>
                </div>
                <div>
                  <LabelWithGuide fieldKey="deathSaveFailures" label="Tiri Morte ✕" />
                  <div className="flex gap-1 mt-1">
                    {[0,1,2].map(i => (
                      <button key={i} onClick={() => onSave({ deathSaveFailures: Math.min(i === (cd.deathSaveFailures || 0) ? i - 1 : i, 3) })}
                        className={`h-5 w-5 rounded-full border text-[10px] ${(cd.deathSaveFailures || 0) > i ? "bg-red-500/30 border-red-400/50 text-red-200" : "border-white/10 text-white/30"}`}>✕</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <DMField label="Condizioni (separate da virgola)" value={Array.isArray(player.conditions) ? player.conditions.join(", ") : ""}
                  onSave={v => onSave({ conditions: v.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
              </div>
            </>
          );
        })()}
      </Section>

      {/* Attacchi */}
      <Section title="Attacchi">
        {safeArray(cd.attacks).length === 0 && <p className="text-xs text-white/30">Nessun attacco registrato.</p>}
        {safeArray(cd.attacks).map((a: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input className="veil-input flex-1 text-xs" value={a.name} placeholder="Arma"
              onChange={e => { const na = safeArray(cd.attacks); na[i] = { ...na[i], name: e.target.value }; onSave({ attacks: na }); }} />
            <input className="veil-input w-16 text-xs" value={a.bonus} placeholder="Bonus"
              onChange={e => { const na = safeArray(cd.attacks); na[i] = { ...na[i], bonus: e.target.value }; onSave({ attacks: na }); }} />
            <input className="veil-input w-24 text-xs" value={a.damage} placeholder="Danno"
              onChange={e => { const na = safeArray(cd.attacks); na[i] = { ...na[i], damage: e.target.value }; onSave({ attacks: na }); }} />
            <button onClick={() => onSave({ attacks: safeArray(cd.attacks).filter((_: any, j: number) => j !== i) })}
              className="text-xs text-red-300/50 hover:text-red-300">×</button>
          </div>
        ))}
        <button onClick={() => onSave({ attacks: [...safeArray(cd.attacks), { name: "", bonus: "", damage: "" }] })}
          className="text-xs text-veil-gold/60 hover:text-veil-gold">+ Aggiungi attacco</button>
      </Section>

      {/* Incantesimi */}
      <Section title="Incantesimi">
        {(() => {
          const sca = cd.spellcastingAbility || "";
          const scaScore = sca ? abilityTotal(sca.toLowerCase()) : 10;
          const scaMod = getModifier(scaScore);
          const pb = getProficiencyBonus(Number(player.level) || 1);
          const autoDC = 8 + scaMod + pb;
          const autoAtk = scaMod + pb;
          return (
            <div className="grid grid-cols-3 gap-3">
              <DMField label="Caratteristica" value={sca} onSave={v => onSave({ spellcastingAbility: v })} />
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">CD</label>
                <div className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">{autoDC}</span>
                  <span className="text-[9px] text-white/20">8+{formatMod(scaMod)}+{pb}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Bonus Attacco</label>
                <div className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-white/70">+{autoAtk}</span>
                  <span className="text-[9px] text-white/20">{formatMod(scaMod)}+{pb}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* Slot e incantesimi automatici */}
      <Section title="Incantesimi (slot automatici)">
        {(() => {
          const clsKey = findClassKey(player.class || "");
          const clsData = clsKey ? getClassData(clsKey) : null;
          const lv = Number(player.level) || 1;
          if (!clsData?.spellcasting) return <p className="text-xs text-white/30">Questa classe non usa la magia.</p>;
          const slots = getSpellSlotsAtLevel(clsKey, lv);
          const cantLimit = getCantripsKnown(clsKey, lv);
          const sca = clsData.spellcasting.spellcastingAbility;
          const scaMod = getModifier(abilityTotal(sca));
          const knownLimit = getSpellsKnownLimit(clsKey, lv)
            || (scaMod + (clsKey === "paladin" ? Math.floor(lv / 2) : lv));
          const slotLevels = Object.keys(slots).map(Number).filter(n => (slots[n] ?? 0) > 0);
          return (
            <div className="space-y-3">
              {slotLevels.length === 0 ? (
                <p className="text-xs text-white/30">Nessuno slot incantesimo a questo livello.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {slotLevels.map(slv => {
                    const spent = (cd.spellSlots as any)?.[slv]?.expended || 0;
                    return (
                      <div key={slv} className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-center">
                        <p className="text-[10px] text-white/30">{slv}° liv.</p>
                        <p className="text-lg font-bold text-blue-200">{slots[slv] - spent}/{slots[slv]}</p>
                        {spent > 0 && <p className="text-[9px] text-blue-300/40">usati {spent}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-white/30">
                Trucchetti: {(cd.cantrips || []).length}/{cantLimit || "—"}
                {" · "}Incantesimi 1°: {(cd.spells1 || []).length}/{knownLimit || "—"}
                {clsKey === "warlock" && <> · slot di livello {WARLOCK_SLOT_LEVEL[lv] ?? 1}</>}
              </p>
              {(cd.cantrips || []).length > 0 && (
                <p className="text-[10px] text-white/50">
                  Trucchetti: {" "}
                  {safeArray(cd.cantrips).join(", ")}
                </p>
              )}
              {(cd.spells1 || []).length > 0 && (
                <p className="text-[10px] text-white/50">
                  Incantesimi 1°: {safeArray(cd.spells1).join(", ")}
                </p>
              )}
            </div>
          );
        })()}
      </Section>

      {/* Caratteristiche di classe per livello */}
      <Section title="Caratteristiche di Classe (per livello)">
        {(() => {
          const clsKey = findClassKey(player.class || "");
          const lv = Number(player.level) || 1;
          if (!clsKey) return <p className="text-xs text-white/30">Nessuna classe selezionata.</p>;
          const feats = getFeaturesUpTo(clsKey, lv);
          if (feats.length === 0) return <p className="text-xs text-white/30">Nessuna capacità registrata.</p>;
          return (
            <div className="space-y-2">
              {feats.map(f => (
                <div key={f.level + f.name} className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-xs text-veil-gold/80"><span className="text-[10px] text-white/30 mr-1.5">Lv {f.level}</span>{f.name}</p>
                  <p className="text-[11px] text-white/45 mt-0.5">{f.description}</p>
                </div>
              ))}
            </div>
          );
        })()}
      </Section>

      {/* Personalità */}
      <Section title="Personalità">
        <div className="grid grid-cols-2 gap-3">
          <DMField label="Tratti" value={cd.personalityTraits} area onSave={v => onSave({ personalityTraits: v })} />
          <DMField label="Ideali" value={cd.ideals} area onSave={v => onSave({ ideals: v })} />
          <DMField label="Legami" value={cd.bonds} area onSave={v => onSave({ bonds: v })} />
          <DMField label="Difetti" value={cd.flaws} area onSave={v => onSave({ flaws: v })} />
        </div>
        <div className="mt-3">
          <DMField label="Storia" value={player.history} area onSave={v => onSave({ history: v })} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <DMField label="Obiettivo" value={player.goals} area onSave={v => onSave({ goals: v })} />
          <DMField label="Paura" value={player.fear} onSave={v => onSave({ fear: v })} />
          <DMField label="Persona importante" value={player.important_person} onSave={v => onSave({ important_person: v })} />
          <DMField label="Segreto" value={player.secret} area onSave={v => onSave({ secret: v })} />
        </div>
      </Section>

      {/* Aspetto */}
      <Section title="Aspetto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <DMField label="Età" value={player.age} onSave={v => onSave({ age: v })} />
          <DMField label="Altezza" value={cd.height} onSave={v => onSave({ height: v })} />
          <DMField label="Peso" value={cd.weight} onSave={v => onSave({ weight: v })} />
          <DMField label="Occhi" value={cd.eyes} onSave={v => onSave({ eyes: v })} />
          <DMField label="Pelle" value={cd.skin} onSave={v => onSave({ skin: v })} />
          <DMField label="Capelli" value={cd.hair} onSave={v => onSave({ hair: v })} />
        </div>
      </Section>

      {/* Extra */}
      <Section title="Extra">
        <div className="grid grid-cols-2 gap-3">
          <DMField label="Linguaggi" value={cd.languages} area onSave={v => onSave({ languages: v })} />
          <DMField label="Altre Competenze" value={cd.otherProficiencies} area onSave={v => onSave({ otherProficiencies: v })} />
          <DMField label="Alleati" value={cd.allies} area onSave={v => onSave({ allies: v })} />
          <DMField label="Tesoro" value={cd.treasure} area onSave={v => onSave({ treasure: v })} />
        </div>
      </Section>

      {/* Note private DM */}
      <Section title="Note Private DM">
        <DMField label="Note DM" value={player.dm_private_notes} area onSave={v => onSave({ dm_private_notes: v })} />
      </Section>
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
function PlayerInventory({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!sessionId || !playerId) return;
    fetch(`/api/inventory?sessionId=${sessionId}&playerId=${playerId}&view=dm`).then(r => r.json()).then(d => setItems(d.items || []));
  }, [sessionId, playerId]);

  async function toggleHidden(itemId: string, current: boolean) {
    await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: itemId, hidden: !current }) });
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, hidden: !current } : i));
  }

  if (items.length === 0) return <p className="text-sm text-white/40">Nessun oggetto assegnato.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(item => (
        <div key={item.id} className={`rounded-xl border p-3 flex items-start gap-3 ${item.hidden ? "border-white/[0.04] bg-black/10 opacity-50" : "border-white/[0.06] bg-black/20"}`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{item.name}</p>
            {item.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{item.description}</p>}
          </div>
          <button onClick={() => toggleHidden(item.id, item.hidden)} className="shrink-0 text-sm" title={item.hidden ? "Mostra al player" : "Nascondi al player"}>
            {item.hidden ? "🙈" : "👁"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------- Secrets ----------
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
