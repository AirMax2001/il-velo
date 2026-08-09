"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import { getBackgroundData } from "@/lib/data/backgrounds";
import races from "@/lib/data/races";
import classes from "@/lib/data/classes";
import backgrounds from "@/lib/data/backgrounds";
import { getModifier, formatMod, getProficiencyBonus } from "@/lib/characterEngine";
import type { AbilityName, SkillKey, SaveKey } from "@/lib/characterEngine";
import { getSpellsForClass } from "@/lib/data/spells";
import {
  getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit, getFeaturesAtLevel, WARLOCK_SLOT_LEVEL,
} from "@/lib/data/leveling";
import { findWeapon, itemCategory } from "@/lib/data/weapons";
import { LevelUpPanel } from "@/components/player/LevelUpPanel";
import { AbilityReferenceTables } from "@/components/shared/AbilityReferenceTables";
import { SpellReferenceTables } from "@/components/shared/SpellReferenceTables";

type Props = { player: Player; onUpdate: (p: Player) => void };
type SheetTab = "core" | "combat" | "magic" | "gear" | "personality" | "extra" | "rules";

/* ── Costanti ── */
const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
const ABILITY_LABELS: Record<string, string> = {
  strength: "Forza", dexterity: "Destrezza", constitution: "Costituzione",
  intelligence: "Intelligenza", wisdom: "Saggezza", charisma: "Carisma",
};
const ABILITY_SHORT: Record<string, string> = {
  strength: "FOR", dexterity: "DES", constitution: "COS",
  intelligence: "INT", wisdom: "SAG", charisma: "CAR",
};

const SKILL_LIST: { key: SkillKey; label: string; ability: AbilityName }[] = [
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

const SAVE_LIST: { key: SaveKey; label: string; ability: AbilityName }[] = [
  { key: "stStrength", label: "Forza", ability: "strength" },
  { key: "stDexterity", label: "Destrezza", ability: "dexterity" },
  { key: "stConstitution", label: "Costituzione", ability: "constitution" },
  { key: "stIntelligence", label: "Intelligenza", ability: "intelligence" },
  { key: "stWisdom", label: "Saggezza", ability: "wisdom" },
  { key: "stCharisma", label: "Carisma", ability: "charisma" },
];

const COIN_TYPES = [
  { key: "pp", label: "PP", desc: "Platino", color: "text-blue-200" },
  { key: "gp", label: "GP", desc: "Oro", color: "text-veil-gold" },
  { key: "ep", label: "PE", desc: "Electrum", color: "text-emerald-300" },
  { key: "sp", label: "SA", desc: "Argento", color: "text-gray-300" },
  { key: "cp", label: "MC", desc: "Rame", color: "text-orange-300" },
];

const CONDITIONS_LIST = [
  "Accecato", "Affascinato", "Assordato", "Atterrito", "Avvelenato",
  "Esausto", "Grappling", "Incapacitato", "Inconscio", "Invisibile",
  "Paralizzato", "Pietrificato", "Prono", "Rallentato", "Spaventato",
  "Stordito", "Trattenuto",
];

/* ── Helpers ── */
function parseConditions(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") try { return JSON.parse(raw); } catch { return []; }
  return [];
}

function resizeImage(file: File, maxDim: number, quality: number, cb: (dataUrl: string) => void) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
    }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    cb(c.toDataURL("image/jpeg", quality));
  };
  img.src = URL.createObjectURL(file);
}

/* ── Inventario player: armi/oggetti con attacchi derivati ── */
function PlayerInventoryManager({ player, cd, level, pb, onAddAttack }: {
  player: Player;
  cd: CharacterData;
  level: number;
  pb: number;
  onAddAttack: (attack: { name: string; bonus: string; damage: string; type: string }) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!player.session_id || !player.id) return;
    const d = await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`).then(r => r.json());
    setItems(d.items || []);
    setLoading(false);
  }, [player.session_id, player.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function addItem() {
    const name = newItem.trim();
    if (!name) return;
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: player.session_id,
        player_id: player.id,
        name,
        category: itemCategory(name),
        item_type: "equipment",
      }),
    });
    if (res.ok) { setNewItem(""); loadItems(); }
  }

  async function removeItem(id: string) {
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    loadItems();
  }

  function weaponAttack(name: string) {
    const w = findWeapon(name);
    if (!w) return null;
    const strMod = getModifier(Number(cd.strength) || 10);
    const dexMod = getModifier(Number(cd.dexterity) || 10);
    const mod = w.info.ability === "dex" ? dexMod
      : w.info.ability === "finesse" ? Math.max(strMod, dexMod) : strMod;
    const bonus = mod + pb;
    const dmg = `${w.info.damage}${mod >= 0 ? "+" : ""}${mod}`;
    return {
      name: w.key.charAt(0).toUpperCase() + w.key.slice(1),
      bonus: `${bonus >= 0 ? "+" : ""}${bonus}`,
      damage: dmg,
      type: w.info.type,
    };
  }

  const catLabel: Record<string, string> = { weapon: "arma", armor: "armatura", shield: "scudo", gear: "oggetto" };

  /* Equipaggiamento iniziale: salvato nel wizard (cd.equipment) o di classe per i player pre-esistenti */
  const clsEq = (() => {
    const cls = player.class ? findClassKey(player.class) : null;
    const data = cls ? getClassData(cls) : null;
    if (!data) return null;
    return data.equipment.flatMap(eq =>
      (eq.options[0] || []).map(o => ({ name: o.name.toLowerCase(), quantity: 1 }))
    );
  })();
  const initialEquip = (cd.equipment && cd.equipment.length > 0) ? cd.equipment : (clsEq || []);

  return (
    <div className="veil-panel p-4">
      <h3 className="text-sm text-veil-gold/80 font-medium mb-2">🎒 Equipaggiamento Iniziale</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Gli oggetti scelti durante la creazione del personaggio (armi, zaino e contenuto). Sono usati anche per
        generare gli attacchi. Il DM può assegnare ulteriori oggetti qui sotto.
      </p>
      {initialEquip.length === 0 ? (
        <p className="text-xs text-white/30 mb-3">Nessun equipaggiamento iniziale registrato.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {initialEquip.map((e, i) => (
            <span key={`${e.name}-${i}`} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-white/60">
              {e.quantity > 1 ? `${e.quantity}× ` : ""}{e.name}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Inventario</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Le armi qui presenti possono generare gli attacchi nella tab Combattimento. Gli oggetti li assegna anche il DM.
      </p>

      <div className="flex gap-2 mb-3">
        <input type="text" className="veil-input flex-1 text-sm" placeholder="Nome oggetto/arma (es. spada lunga)"
          value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addItem(); }} />
        <button onClick={addItem} className="rounded-lg border border-veil-gold/20 px-3 text-xs text-veil-gold/70 hover:bg-veil-gold/10 transition">
          + Aggiungi
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-white/30">Caricamento inventario...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-white/30">Nessun oggetto. Aggiungi le armi e l'equipaggiamento qui sopra.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const atk = itemCategory(item.name) === "weapon" ? weaponAttack(item.name) : null;
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.name}</p>
                  <p className="text-[10px] text-white/25">{catLabel[item.category] || "oggetto"}</p>
                  {atk && (
                    <p className="text-[10px] text-emerald-300/60">
                      {atk.bonus} colpire · {atk.damage} · {atk.type}
                    </p>
                  )}
                </div>
                {atk && (
                  <button onClick={() => onAddAttack(atk)}
                    className="shrink-0 rounded-lg border border-emerald-400/20 px-2 py-1 text-[10px] text-emerald-300/70 hover:bg-emerald-400/10 transition">
                    ⚔️ Aggiungi attacco
                  </button>
                )}
                <button onClick={() => removeItem(item.id)}
                  className="shrink-0 text-red-300/40 hover:text-red-300 text-sm">×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-componenti ── */
function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const cfg = {
    idle: ["border-white/10 text-white/30", "pronta"],
    saving: ["border-veil-gold/40 text-veil-gold animate-pulse", "salvataggio..."],
    saved: ["border-emerald-400/35 text-emerald-300", "✓ salvata"],
    error: ["border-red-400/35 text-red-300", "errore"],
  }[state];
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cfg[0]}`}>{cfg[1]}</span>;
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  );
}

function NumberBubbles({
  label, count, filled, onToggle, color = "emerald",
}: { label: string; count: number; filled: number; onToggle: (idx: number) => void; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/30 border-emerald-400/50 text-emerald-200",
    red: "bg-red-500/30 border-red-400/50 text-red-200",
  };
  const filledCls = colorMap[color] || colorMap.emerald;
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <div className="flex gap-1.5">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => onToggle(i)}
            className={`h-7 w-7 rounded-full border text-xs transition ${i < filled ? filledCls : "border-white/10 text-white/20 hover:border-white/30"}`}>
            {i < filled ? (color === "emerald" ? "✓" : "✕") : "○"}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Campo con suggerimenti dai background (tratti/ideali/legami/difetti) ── */
function SuggestField({ label, fieldKey, value, suggestions, isTop, onChange, onPick, onBlur }: {
  label: string; fieldKey: string; value: string; suggestions: string[];
  isTop?: boolean; onChange: (v: string) => void; onPick: (v: string) => void; onBlur: () => void;
}) {
  const [showSug, setShowSug] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <LabelWithGuide fieldKey={fieldKey} label={label} />
        {suggestions.length > 0 && (
          <button onClick={() => setShowSug(s => !s)}
            className="text-[10px] text-veil-gold/40 hover:text-veil-gold transition">
            {showSug ? "▲ nascondi" : "💡 suggerimenti"}
          </button>
        )}
      </div>
      {showSug && suggestions.length > 0 && (
        <div className={`absolute ${isTop ? "bottom-full mb-1" : "top-full mt-1"} left-0 right-0 z-10 rounded-xl border border-veil-gold/20 bg-[#0d0a06] p-2 space-y-1`}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => { onChange(s); setShowSug(false); onPick(s); }}
              className="w-full text-left text-[10px] text-white/50 hover:text-white/80 rounded px-2 py-1 hover:bg-white/[0.04] transition">
              {s}
            </button>
          ))}
        </div>
      )}
      <textarea className="veil-input mt-1 w-full min-h-[60px] text-sm"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur} />
    </div>
  );
}

/* ── Componente principale ── */
export function CharacterSheet({ player, onUpdate }: Props) {
  const [form, setForm] = useState(player);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<SheetTab>("core");
  const playerRef = useRef(player);
  const formRef = useRef(form);
  formRef.current = form;
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const pendingRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (player && player !== playerRef.current) {
      if (!dirtyRef.current) setForm(player);
      playerRef.current = player;
    }
  }, [player]);

  /* ── State updaters ── */
  const upd = useCallback((key: string, value: any) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }, []);
  const updCd = useCallback((key: string, value: any) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), [key]: value } }));
  }, []);
  const updCdAll = useCallback((obj: Record<string, any>) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), ...obj } }));
  }, []);
  const updAll = useCallback((obj: Record<string, any>) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, ...obj }));
  }, []);

  /* ── Save ── */
  const save = useCallback(async (fields: Record<string, any>) => {
    if (savingRef.current) {
      pendingRef.current = { ...(pendingRef.current || {}), ...fields };
      return;
    }
    savingRef.current = true;
    setSaveState("saving");
    try {
      const body: any = { id: player.id };
      const cdFields: Record<string, any> = {};
      const topLevelFields = new Set([
        "character_name", "race", "class", "level", "xp", "hp_current", "hp_max",
        "temp_hp", "coins", "conditions", "age", "personality", "history", "goals",
        "fear", "important_person", "secret", "background", "dm_private_notes",
        "player_name", "avatar_url",
      ]);
      for (const [k, v] of Object.entries(fields)) {
        if (topLevelFields.has(k)) body[k] = v;
        else { cdFields[k] = v; }
      }
      if (Object.keys(cdFields).length > 0) {
        const curCd = formRef.current?.character_data || {};
        body.character_data = { ...curCd, ...cdFields };
      }
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Salvataggio fallito");
      const merged = { ...(formRef.current || {}), ...body };
      setForm(merged);
      onUpdate(merged);
      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    } finally {
      savingRef.current = false;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) save(pending);
    }
  }, [player.id, onUpdate]);

  /* ── Level-up applicato dal pannello ── */
  function handleLevelUp(updates: Record<string, any>) {
    updAll(updates);
    save(updates);
  }

  function handleAddAttack(atk: any) {
    const na = [...attacks, atk];
    updCd("attacks", na);
    save({ attacks: na });
  }

  /* ── Dati derivati ── */
  const cd = form?.character_data || {} as CharacterData;
  const attacks = Array.isArray(cd.attacks) ? cd.attacks : [];
  const spellSlots = (cd.spellSlots || {}) as Record<number, { total?: number; expended?: number }>;
  const conditions = parseConditions(form?.conditions);

  const clsKey = findClassKey(formRef.current?.class || "");
  const clsData = clsKey ? getClassData(clsKey) : null;
  const raceKey = findRaceKey(formRef.current?.race || "");
  const raceData = raceKey ? getRaceData(raceKey) : null;
  const bgData = form?.background ? getBackgroundData(
    Object.keys(backgrounds).find(k => (backgrounds as any)[k].name === form.background) || form.background
  ) : null;

  const level = Number(formRef.current?.level) || 1;
  const pb = getProficiencyBonus(level);

  // Caratteristiche con bonus razziali
  function getAbilityScore(ability: string): number {
    return Number(cd[ability as keyof CharacterData]) || 10;
  }
  function getRaceBonus(ability: string): number {
    const bonus = raceData?.abilityBonuses?.[ability] || 0;
    return bonus;
  }
  function getTotalScore(ability: string): number {
    return getAbilityScore(ability) + getRaceBonus(ability);
  }

  // Auto-calcoli dalla classe/razza
  const hitDie = clsData?.hitDie;
  const conMod = getModifier(getTotalScore("constitution"));
  const dexMod = getModifier(getTotalScore("dexterity"));
  const raceSpeed = raceData?.speed;
  const expectedHP = hitDie ? hitDie + conMod + (level - 1) * (Math.ceil(hitDie / 2) + 1 + conMod) : null;

  // Incantesimi: caratteristica auto da classe
  const spellAbility = clsData?.spellcasting?.spellcastingAbility;
  const spellAbilityScore = spellAbility ? getTotalScore(spellAbility) : 10;
  const spellAbilityMod = getModifier(spellAbilityScore);
  const spellDC = 8 + spellAbilityMod + pb;
  const spellAtk = spellAbilityMod + pb;

  // Slot/Trucchetti/Incantesimi automatici dal leveling PHB
  const autoSlotTotals = clsKey ? getSpellSlotsAtLevel(clsKey, level) : {};
  const cantripLimit = clsKey ? getCantripsKnown(clsKey, level) : 0;
  const preparedLimit = spellAbilityMod + (clsKey === "paladin" ? Math.floor(level / 2) : level);
  const spellLimit = (clsKey ? getSpellsKnownLimit(clsKey, level) : 0) || preparedLimit || 999;
  const totalKnown = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, lvl) =>
    acc + ((((cd as any)[`spells${lvl}`]) || []) as string[]).length, 0);

  // Abilità/Saving Throws: classe garantisce competenze, background aggiunge le sue
  const classSkillSet = new Set(clsData?.savingThrows || []);
  const bgSkillSet = new Set<string>((bgData?.skillProficiencies || []).filter(Boolean));
  const raceSkillSet = new Set<string>((raceData?.proficiencies?.skills || []).filter(Boolean));

  /* ── TABS ── */
  const TABS: { id: SheetTab; label: string; icon: string }[] = [
    { id: "core", label: "Nucleo", icon: "⚡" },
    { id: "combat", label: "Combattimento", icon: "⚔️" },
    { id: "magic", label: "Magia", icon: "✨" },
    { id: "gear", label: "Equipaggiamento", icon: "🎒" },
    { id: "personality", label: "Personalità", icon: "📖" },
    { id: "extra", label: "Extra", icon: "🔧" },
    { id: "rules", label: "Regole", icon: "📜" },
  ];

  /* ── Render Tabs ── */
  function renderCore() {
    return (
      <div className="space-y-4">
        {/* Avatar + Info principale */}
        <div className="veil-panel p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2">
              <PlayerAvatar url={form?.avatar_url} name={form?.character_name} size="xl" />
              <label className="cursor-pointer rounded-lg border border-veil-gold/20 px-2 py-1 text-[10px] text-veil-gold/50 hover:bg-veil-gold/10 hover:text-veil-gold transition text-center">
                Immagine
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  resizeImage(file, 200, 0.6, dataUrl => {
                    upd("avatar_url", dataUrl);
                    save({ avatar_url: dataUrl });
                  });
                }} />
              </label>
              {form?.avatar_url && (
                <button onClick={() => { upd("avatar_url", ""); save({ avatar_url: "" }); }}
                  className="text-[10px] text-red-300/40 hover:text-red-300">Rimuovi</button>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Nome */}
              <div className="col-span-full sm:col-span-2">
                <LabelWithGuide fieldKey="character_name" label="Nome Personaggio" />
                <input type="text" className="veil-input mt-1 w-full"
                  value={form?.character_name || ""}
                  onChange={e => upd("character_name", e.target.value)}
                  onBlur={() => save({ character_name: formRef.current?.character_name })} />
              </div>
              {/* Livello */}
              <div>
                <LabelWithGuide fieldKey="level" label="Livello" />
                <input type="number" className="veil-input mt-1 w-full" min={1} max={20}
                  value={form?.level || 1}
                  onChange={e => upd("level", Number(e.target.value))}
                  onBlur={() => save({ level: formRef.current?.level })} />
              </div>
              {/* Razza */}
              <div>
                <LabelWithGuide fieldKey="race" label="Razza" />
                <select className="veil-input mt-1 w-full"
                  value={findRaceKey(form?.race || "") || form?.race || ""}
                  onChange={e => {
                    const rk = e.target.value;
                    const rd = getRaceData(rk);
                    const name = rd?.name || rk;
                    upd("race", name);
                    // Auto-aggiorna velocità
                    if (rd?.speed) updCd("speed", rd.speed);
                  }}
                  onBlur={() => {
                    const cur = formRef.current;
                    const rk = findRaceKey(cur?.race || "");
                    const rd = rk ? getRaceData(rk) : null;
                    save({ race: cur?.race, ...(rd?.speed ? { speed: rd.speed } : {}) });
                  }}>
                  <option value="">— Seleziona razza —</option>
                  {Object.values(races).map(r => (
                    <option key={r.key} value={r.key}>{r.name}</option>
                  ))}
                </select>
              </div>
              {/* Classe */}
              <div>
                <LabelWithGuide fieldKey="class_label" label="Classe" />
                <select className="veil-input mt-1 w-full"
                  value={findClassKey(form?.class || "") || ""}
                  onChange={e => {
                    const ck = e.target.value;
                    const clsd = getClassData(ck);
                    upd("class", clsd?.name || ck);
                  }}
                  onBlur={() => {
                    const cur = formRef.current;
                    const ck = findClassKey(cur?.class || "");
                    const clsd = ck ? getClassData(ck) : null;
                    if (!clsd) return;
                    // Auto-imposta tiri salvezza di classe
                    const saveFields: Record<string, boolean> = {};
                    for (const sv of ["stStrength", "stDexterity", "stConstitution", "stIntelligence", "stWisdom", "stCharisma"]) {
                      saveFields[sv] = clsd.savingThrows.includes(sv);
                    }
                    save({ class: clsd.name, ...saveFields });
                  }}>
                  <option value="">— Seleziona classe —</option>
                  {Object.values(classes).map(c => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Background */}
              <div>
                <LabelWithGuide fieldKey="background" label="Background" />
                <select className="veil-input mt-1 w-full"
                  value={Object.keys(backgrounds).find(k => (backgrounds as any)[k].name === form?.background) || form?.background || ""}
                  onChange={e => {
                    const bk = e.target.value;
                    const bd = getBackgroundData(bk);
                    upd("background", bd?.name || bk);
                    // Auto-seleziona abilità background
                    if (bd?.skillProficiencies) {
                      const skillUpdates: Record<string, boolean> = {};
                      bd.skillProficiencies.forEach(s => { skillUpdates[s] = true; });
                      updCdAll(skillUpdates);
                    }
                  }}
                  onBlur={() => save({ background: formRef.current?.background })}>
                  <option value="">— Seleziona background —</option>
                  {Object.values(backgrounds).map(b => (
                    <option key={b.key} value={b.key}>{b.name}</option>
                  ))}
                </select>
              </div>
              {/* Allineamento */}
              <div>
                <LabelWithGuide fieldKey="alignment" label="Allineamento" />
                <select className="veil-input mt-1 w-full"
                  value={cd.alignment || ""}
                  onChange={e => updCd("alignment", e.target.value)}
                  onBlur={() => save({ alignment: formRef.current?.character_data?.alignment })}>
                  <option value="">— Seleziona —</option>
                  {["Legale Buono", "Neutrale Buono", "Caotico Buono", "Legale Neutrale", "Neutrale", "Caotico Neutrale", "Legale Malvagio", "Neutrale Malvagio", "Caotico Malvagio"].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              {/* XP */}
              <div>
                <LabelWithGuide fieldKey="xp" label="XP" />
                <input type="number" className="veil-input mt-1 w-full" min={0}
                  value={form?.xp || 0}
                  onChange={e => upd("xp", Number(e.target.value))}
                  onBlur={() => save({ xp: formRef.current?.xp })} />
              </div>
            </div>
          </div>
        </div>

        {/* Info razza */}
        {raceData && (
          <div className="veil-panel p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-veil-gold/80 font-medium">{raceData.name}</span>
              <span className="text-[10px] text-white/30">{raceData.speed}m · {raceData.size}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(raceData.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">
                  {ABILITY_SHORT[k] || k}+{v}
                </span>
              ))}
              {raceData.traits.slice(0, 4).map(t => (
                <span key={t.name} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40" title={t.description}>{t.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Caratteristiche */}
        <div className="veil-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-veil-gold/80 font-medium">Caratteristiche</h3>
            {clsData && (
              <span className="text-[10px] text-white/30">
                Bonus Competenza: <strong className="text-veil-gold/60">+{pb}</strong>
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ABILITY_KEYS.map(k => {
              const base = getAbilityScore(k);
              const bonus = getRaceBonus(k);
              const total = getTotalScore(k);
              const mod = getModifier(total);
              return (
                <div key={k} className="text-center">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/35 mb-1">{ABILITY_SHORT[k]}</p>
                  <input type="number" className="veil-input w-full text-center text-lg font-bold px-1"
                    value={base}
                    min={1} max={20}
                    onChange={e => updCd(k, Number(e.target.value))}
                    onBlur={() => save({ [k]: formRef.current?.character_data?.[k as keyof CharacterData] })} />
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
        </div>

        {/* PF + Stats di combattimento rapide */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Punti Ferita</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <LabelWithGuide fieldKey="hp_max" label="PF Max" />
              <input type="number" className="veil-input mt-1 w-full text-center" min={0}
                value={form?.hp_max || ""}
                onChange={e => upd("hp_max", Number(e.target.value))}
                onBlur={() => save({ hp_max: formRef.current?.hp_max })} />
              {expectedHP && <p className="text-[9px] text-white/20 mt-0.5 text-center">attesi: ~{expectedHP}</p>}
            </div>
            <div>
              <LabelWithGuide fieldKey="hp_current" label="PF Correnti" />
              <input type="number" className="veil-input mt-1 w-full text-center" min={0}
                value={form?.hp_current ?? ""}
                onChange={e => upd("hp_current", Number(e.target.value))}
                onBlur={() => save({ hp_current: formRef.current?.hp_current })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="temp_hp" label="PF Temporanei" />
              <input type="number" className="veil-input mt-1 w-full text-center" min={0}
                value={form?.temp_hp ?? ""}
                onChange={e => upd("temp_hp", Number(e.target.value))}
                onBlur={() => save({ temp_hp: formRef.current?.temp_hp })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="hitDiceTotal" label="Dadi Vita" />
              <div className="veil-input mt-1 w-full text-center pointer-events-none opacity-60">
                {hitDie ? `${level}d${hitDie}` : "—"}
              </div>
              {hitDie && <p className="text-[9px] text-white/20 mt-0.5 text-center">COS mod: {conMod >= 0 ? `+${conMod}` : conMod}</p>}
            </div>
          </div>
          {/* HP bar */}
          {form?.hp_max && form?.hp_max > 0 && (
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${((form?.hp_current || 0) / form.hp_max) > 0.5 ? "bg-emerald-500" : ((form?.hp_current || 0) / form.hp_max) > 0.25 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, ((form?.hp_current || 0) / form.hp_max) * 100))}%` }} />
            </div>
          )}
        </div>

        {/* Level-up guidato da XP */}
        <LevelUpPanel player={form} onApply={handleLevelUp} />

        {/* Stats veloci: CA / Iniziativa / Velocità / PB */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="veil-panel p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">CA</p>
            <input type="number" className="bg-transparent text-xl font-bold text-white w-full text-center border-none outline-none"
              value={cd.armorClass || ""}
              onChange={e => updCd("armorClass", Number(e.target.value))}
              onBlur={() => save({ armorClass: formRef.current?.character_data?.armorClass })} />
            <p className="text-[9px] text-white/20 mt-0.5">Classe Armatura</p>
          </div>
          <StatBox label="Iniziativa" value={dexMod >= 0 ? `+${dexMod}` : `${dexMod}`} sub="DES mod" />
          <div className="veil-panel p-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">Velocità</p>
            <input type="number" className="bg-transparent text-xl font-bold text-white w-full text-center border-none outline-none"
              value={cd.speed || raceSpeed || ""}
              onChange={e => updCd("speed", Number(e.target.value))}
              onBlur={() => save({ speed: formRef.current?.character_data?.speed })} />
            <p className="text-[9px] text-white/20 mt-0.5">{raceSpeed ? `razza: ${raceSpeed}m` : "metri"}</p>
          </div>
          <StatBox label="Bon. Competenza" value={`+${pb}`} sub={`liv. ${level}`} />
        </div>

        {/* Tiri Salvezza */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Tiri Salvezza</h3>
          {clsData && (
            <p className="text-[10px] text-white/30 mb-2">
              Competenze dalla classe: {clsData.savingThrows.map(s => {
                const found = SAVE_LIST.find(sl => sl.key === s);
                return found?.label || s;
              }).join(", ")} · non modificabili
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SAVE_LIST.map(sv => {
              const isClassSave = classSkillSet.has(sv.key);
              const monkAllSaves = clsKey === "monk" && level >= 14; // Anima di Diamante
              const isChecked = isClassSave || monkAllSaves;
              const score = getTotalScore(sv.ability);
              const mod = getModifier(score);
              const total = isChecked ? mod + pb : mod;
              return (
                <div key={sv.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${isChecked ? "border-veil-gold/20 bg-veil-gold/[0.04]" : "border-white/[0.04] bg-black/20"}`}>
                  <input type="checkbox" className="accent-veil-gold w-4 h-4"
                    checked={isChecked}
                    disabled
                    title="I tiri salvezza derivano solo dalla classe"
                  />
                  <span className={`text-xs flex-1 ${isChecked ? "text-white/80" : "text-white/40"}`}>{sv.label}</span>
                  <span className={`text-xs font-medium ${isChecked ? "text-veil-gold" : "text-white/30"}`}>
                    {total >= 0 ? `+${total}` : `${total}`}
                  </span>
                  {isChecked && <span className="text-[9px] text-veil-gold/30">{monkAllSaves ? "monaco" : "classe"}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Abilità */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Abilità</h3>
          {clsData && (
            <p className="text-[10px] text-white/30 mb-2">
              {clsData.skillPicks} abilità dalla classe ·
              {bgData && ` ${bgData.skillProficiencies.length} dal background`}
              {raceSkillSet.size > 0 && ` · ${raceSkillSet.size} dalla razza`}
            </p>
          )}
          <p className="text-[10px] text-white/20 mb-2">
            Puoi selezionare solo abilità della lista della classe. Le abilità di background e razza sono automatiche.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SKILL_LIST.map(sk => {
              const isChecked = (cd as any)[sk.key] ?? false;
              const isClassOption = clsData?.skillOptions.includes(sk.key) || false;
              const isBgSkill = bgSkillSet.has(sk.key);
              const isRaceSkill = raceSkillSet.has(sk.key);
              const isLocked = isBgSkill || isRaceSkill;
              const classCheckedCount = SKILL_LIST.filter(s =>
                (cd as any)[s.key] && clsData?.skillOptions.includes(s.key)
                && !bgSkillSet.has(s.key) && !raceSkillSet.has(s.key)
              ).length;
              const atClassLimit = classCheckedCount >= (clsData?.skillPicks || 0);
              const score = getTotalScore(sk.ability);
              const mod = getModifier(score);
              const total = isChecked ? mod + pb : mod;
              return (
                <label key={sk.key} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition text-sm
                  ${isChecked ? isLocked ? "border-emerald-500/20 bg-emerald-900/[0.06]" : "border-veil-gold/20 bg-veil-gold/[0.04]" : isClassOption ? "border-white/[0.06] bg-black/20 hover:border-white/[0.10] cursor-pointer" : "border-white/[0.03] bg-black/10 opacity-40"}`}>
                  <input type="checkbox" className="accent-veil-gold w-4 h-4 flex-shrink-0"
                    checked={isChecked}
                    disabled={!isClassOption && !isLocked}
                    onChange={e => {
                      if (isLocked) return;
                      if (e.target.checked && atClassLimit) return;
                      updCd(sk.key, e.target.checked);
                      save({ [sk.key]: e.target.checked });
                    }} />
                  <span className={`flex-1 text-xs ${isChecked ? "text-white/80" : "text-white/40"}`}>
                    {sk.label}
                  </span>
                  <span className="text-[10px] text-white/25">{ABILITY_SHORT[sk.ability]}</span>
                  <span className={`text-xs font-medium w-8 text-right ${isChecked ? "text-veil-gold" : "text-white/25"}`}>
                    {total >= 0 ? `+${total}` : `${total}`}
                  </span>
                  {isBgSkill && <span className="text-[9px] text-emerald-400/40">BG</span>}
                  {isRaceSkill && !isBgSkill && <span className="text-[9px] text-emerald-400/40">razza</span>}
                  {isClassOption && !isLocked && <span className="text-[9px] text-veil-gold/30">cls</span>}
                </label>
              );
            })}
          </div>
        </div>

        {/* Ispirazione */}
        <div className="veil-panel p-3 flex items-center gap-3">
          <input type="checkbox" id="inspiration" className="accent-veil-gold w-5 h-5"
            checked={cd.inspiration ?? false}
            onChange={e => { updCd("inspiration", e.target.checked); save({ inspiration: e.target.checked }); }} />
          <label htmlFor="inspiration" className="text-sm text-white/70 cursor-pointer flex-1">
            <span className="text-veil-gold/80">Ispirazione</span>
            <span className="text-white/30 text-xs ml-2">assegnata dal DM</span>
          </label>
        </div>
      </div>
    );
  }

  function renderCombat() {
    return (
      <div className="space-y-4">
        {/* Attacchi */}
        <div className="veil-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-veil-gold/80 font-medium">Attacchi</h3>
            <button onClick={() => updCdAll({ attacks: [...attacks, { name: "", bonus: "", damage: "", type: "" }] })}
              className="text-xs text-veil-gold/60 hover:text-veil-gold border border-veil-gold/20 rounded-lg px-2 py-1 transition">
              + Aggiungi
            </button>
          </div>
          {attacks.length === 0 && (
            <p className="text-xs text-white/30 text-center py-3">Nessun attacco. Clicca "+ Aggiungi" per inserirne uno.</p>
          )}
          <div className="space-y-2">
            {attacks.map((a: any, i: number) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
                <input className="veil-input text-xs" placeholder="Nome arma (es. Spada Lunga)"
                  value={a.name}
                  onChange={e => {
                    const na = attacks.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x);
                    updCdAll({ attacks: na });
                  }}
                  onBlur={() => save({ attacks: formRef.current?.character_data?.attacks })} />
                <input className="veil-input w-16 text-xs text-center" placeholder="+5"
                  value={a.bonus}
                  onChange={e => {
                    const na = attacks.map((x: any, j: number) => j === i ? { ...x, bonus: e.target.value } : x);
                    updCdAll({ attacks: na });
                  }}
                  onBlur={() => save({ attacks: formRef.current?.character_data?.attacks })} />
                <input className="veil-input w-20 text-xs text-center" placeholder="1d8+3"
                  value={a.damage}
                  onChange={e => {
                    const na = attacks.map((x: any, j: number) => j === i ? { ...x, damage: e.target.value } : x);
                    updCdAll({ attacks: na });
                  }}
                  onBlur={() => save({ attacks: formRef.current?.character_data?.attacks })} />
                <input className="veil-input w-20 text-xs text-center" placeholder="Tipo"
                  value={a.type || ""}
                  onChange={e => {
                    const na = attacks.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x);
                    updCdAll({ attacks: na });
                  }}
                  onBlur={() => save({ attacks: formRef.current?.character_data?.attacks })} />
                <button onClick={() => {
                  const na = attacks.filter((_: any, j: number) => j !== i);
                  updCd("attacks", na);
                  save({ attacks: na });
                }} className="text-red-300/40 hover:text-red-300 text-sm">×</button>
              </div>
            ))}
          </div>
          {attacks.length > 0 && (
            <p className="text-[10px] text-white/20 mt-2">Bonus · Danno · Tipo (es. tagliante, fuoco...)</p>
          )}
        </div>

        {/* Dadi vita tracciamento */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Dadi Vita Rimanenti</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <LabelWithGuide fieldKey="hitDiceTotal" label="Totale Dadi Vita" />
              <div className="veil-input mt-1 w-full pointer-events-none opacity-50">
                {hitDie ? `${level}d${hitDie}` : "—"}
              </div>
            </div>
            <div>
              <LabelWithGuide fieldKey="hitDiceRemaining" label="Rimanenti" />
              <input type="text" className="veil-input mt-1 w-full"
                value={cd.hitDiceRemaining || ""}
                placeholder={hitDie ? `${level}d${hitDie}` : ""}
                onChange={e => updCd("hitDiceRemaining", e.target.value)}
                onBlur={() => save({ hitDiceRemaining: formRef.current?.character_data?.hitDiceRemaining })} />
            </div>
          </div>
        </div>

        {/* Tiri per la morte */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Tiri per la Morte</h3>
          <p className="text-[10px] text-white/30 mb-3">3 successi = stabilizzato, 3 fallimenti = morte. Si azzera dopo ogni riposo breve o lungo.</p>
          <div className="grid grid-cols-2 gap-4">
            <NumberBubbles
              label="Successi"
              count={3}
              filled={cd.deathSaveSuccesses || 0}
              onToggle={i => {
                const cur = cd.deathSaveSuccesses || 0;
                const newVal = cur > i ? i : i + 1;
                updCd("deathSaveSuccesses", newVal);
                save({ deathSaveSuccesses: newVal });
              }}
              color="emerald"
            />
            <NumberBubbles
              label="Fallimenti"
              count={3}
              filled={cd.deathSaveFailures || 0}
              onToggle={i => {
                const cur = cd.deathSaveFailures || 0;
                const newVal = cur > i ? i : i + 1;
                updCd("deathSaveFailures", newVal);
                save({ deathSaveFailures: newVal });
              }}
              color="red"
            />
          </div>
        </div>

        {/* Condizioni */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Condizioni</h3>
          <p className="text-[10px] text-white/30 mb-3">Le condizioni vengono assegnate dal DM. Qui puoi anche aggiungerle manualmente.</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {conditions.map(c => (
              <span key={c} className="rounded-full border border-red-500/30 bg-red-900/20 px-2.5 py-1 text-xs text-red-300/80 flex items-center gap-1">
                {c}
                <button onClick={() => {
                  const nc = conditions.filter(x => x !== c);
                  upd("conditions", JSON.stringify(nc));
                  save({ conditions: JSON.stringify(nc) });
                }} className="text-red-300/40 hover:text-red-300 ml-0.5">×</button>
              </span>
            ))}
            {conditions.length === 0 && <span className="text-xs text-white/25">Nessuna condizione attiva</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {CONDITIONS_LIST.filter(c => !conditions.includes(c)).map(c => (
              <button key={c} onClick={() => {
                const nc = [...conditions, c];
                upd("conditions", JSON.stringify(nc));
                save({ conditions: JSON.stringify(nc) });
              }} className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/35 hover:border-white/25 hover:text-white/60 transition">
                + {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderMagic() {
    const hasSpellcasting = !!clsData?.spellcasting || !!spellAbility;
    const spellAbilityLabel = spellAbility ? ABILITY_LABELS[spellAbility] || spellAbility : null;

    return (
      <div className="space-y-4">
        {!hasSpellcasting && (
          <div className="veil-panel p-6 text-center">
            <p className="text-3xl mb-3">⚔️</p>
            <p className="text-white/40">{clsData?.name || "Questa classe"} non usa la magia.</p>
            <p className="text-[11px] text-white/25 mt-1">Se hai oggetti magici o capacità speciali, usa la sezione Attacchi.</p>
          </div>
        )}

        {hasSpellcasting && (
          <>
            {/* Stats incantatore */}
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Statistiche Incantatore</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                  <p className="text-[10px] text-blue-300/50 mb-1">Caratteristica</p>
                  <p className="text-sm text-blue-200 font-medium">{spellAbilityLabel || "—"}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{ABILITY_SHORT[spellAbility || ""] || ""}</p>
                </div>
                <div className="text-center rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                  <p className="text-[10px] text-blue-300/50 mb-1">CD Inc.</p>
                  <p className="text-xl font-bold text-blue-200">{spellDC}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">8+{spellAbilityMod >= 0 ? "+" : ""}{spellAbilityMod}+{pb}</p>
                </div>
                <div className="text-center rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                  <p className="text-[10px] text-blue-300/50 mb-1">Attacco</p>
                  <p className="text-xl font-bold text-blue-200">{spellAtk >= 0 ? `+${spellAtk}` : `${spellAtk}`}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{spellAbilityMod >= 0 ? "+" : ""}{spellAbilityMod}+{pb}</p>
                </div>
              </div>
            </div>

            {/* Trucchetti */}
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Trucchetti</h3>
              <p className="text-[10px] text-white/30 mb-2">
                I trucchetti sono a volontà, non consumano slot. Selezionali dalla lista PHB
                {cantripLimit > 0 && <> (max <strong className="text-veil-gold/70">{cantripLimit}</strong>)</>}.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1 mb-2">
                {getSpellsForClass(clsKey, 0).map(sp => {
                  const isSel = (cd.cantrips || []).includes(sp.name);
                  const atLimit = (cd.cantrips || []).length >= cantripLimit;
                  return (
                    <label key={sp.name} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                      <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                        checked={isSel}
                        disabled={!isSel && atLimit}
                        onChange={e => {
                          const cur = cd.cantrips || [];
                          if (e.target.checked && cur.length >= cantripLimit) return;
                          const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                          updCd("cantrips", next);
                          save({ cantrips: next });
                        }} />
                      <span className="flex-1 text-white/70">{sp.name}</span>
                      <span className="text-[9px] text-white/25">{sp.school}</span>
                    </label>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1">
                {(cd.cantrips || []).map((c: string) => (
                  <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
                ))}
                {cantripLimit > 0 && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/30">{(cd.cantrips || []).length}/{cantripLimit}</span>}
              </div>
            </div>

            {/* Slot incantesimi */}
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Slot Incantesimi</h3>
              <p className="text-[10px] text-white/30 mb-3">
                Gli slot totali sono automatici per livello di classe. Usati = slot spesi, si recuperano dopo un riposo lungo.
                {clsKey === "warlock" && <> I tuoi slot sono sempre di livello {WARLOCK_SLOT_LEVEL[level] ?? 1}.</>}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                  const total = autoSlotTotals[lv] ?? 0;
                  const used = spellSlots[lv]?.expended ?? 0;
                  const available = Math.max(0, total - used);
                  return (
                    <div key={lv} className="text-center">
                      <p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="veil-input w-10 text-center text-xs p-1 opacity-70" title="Totale automatico">{total || "—"}</div>
                        <span className="text-[10px] text-white/20">/</span>
                        <input type="number" className="veil-input w-10 text-center text-xs p-1" placeholder="0" min={0} max={Math.max(total, 0)}
                          value={used || ""}
                          disabled={total === 0}
                          onChange={e => updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Number(e.target.value) } } })}
                          onBlur={() => save({ spellSlots: formRef.current?.character_data?.spellSlots })} />
                      </div>
                      {/* Palline disponibili */}
                      <div className="flex justify-center gap-0.5 flex-wrap">
                        {Array.from({ length: Math.min(total, 9) }, (_, i) => (
                          <button key={i} onClick={() => {
                            const newUsed = i < used ? i : i + 1;
                            updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                            save({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                          }}
                            className={`w-4 h-4 rounded-full border transition ${i < (total - used) ? "bg-blue-500/40 border-blue-400/50" : "bg-white/[0.04] border-white/10"}`}
                            title={i < (total - used) ? "Slot disponibile (clicca per usare)" : "Slot usato"}
                          />
                        ))}
                      </div>
                      {total > 0 && <p className="text-[9px] text-white/20 mt-0.5">{available} disponibili</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista incantesimi */}
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Incantesimi Noti/Preparati</h3>
              <p className="text-[10px] text-white/30 mb-2">
                Scegli i tuoi incantesimi dalla lista PHB per ogni livello di slot. I livelli superiori si sbloccano
                salendo di livello.
                {spellLimit >= 999 ? "" : <> Il totale è limitato a <strong className="text-veil-gold/70">{spellLimit}</strong>
                  {clsKey === "paladin" ? " (metà livello + mod CAR)" : clsData?.spellcasting?.spellsKnown ? " incantesimi conosciuti" : " preparati (livello + mod)"}.</>}
              </p>

              {/* 1° livello: ingera guidata PHB */}
              <div className="mb-3">
                <label className="text-xs text-white/40 mb-1 block">1° Livello</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1 mb-2">
                  {getSpellsForClass(clsKey, 1).map(sp => {
                    const cur = (cd.spells1 || []) as string[];
                    const isSel = cur.includes(sp.name);
                    const atGlobalLimit = totalKnown >= spellLimit;
                    return (
                      <label key={sp.name} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                        <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                          checked={isSel}
                          disabled={!isSel && atGlobalLimit}
                          onChange={e => {
                            if (e.target.checked && atGlobalLimit) return;
                            const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                            updCd("spells1", next);
                            save({ spells1: next });
                          }} />
                        <span className="flex-1 text-white/70">{sp.name}</span>
                        <span className="text-[9px] text-white/25">{sp.school}</span>
                      </label>
                    );
                  })}
                </div>
                {(cd.spells1 || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(cd.spells1 || []).map((c: string) => (
                      <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Livelli 2-9: selezione guidata PHB, si sblocchi con lo slot */}
              {[2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                const unlocked = (autoSlotTotals[lv] ?? 0) > 0 || (clsKey === "warlock" && WARLOCK_SLOT_LEVEL[level] >= lv);
                const list = getSpellsForClass(clsKey, lv);
                const cur = ((cd as any)[`spells${lv}`] || []) as string[];
                return (
                  <div key={lv} className="mb-3">
                    <label className={`text-xs mb-1 block ${unlocked ? "text-white/40" : "text-white/20"}`}>
                      {lv}° Livello {unlocked && <span className="ml-1 text-[9px] text-emerald-300/50">sbloccato</span>}
                    </label>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-52 overflow-y-auto pr-1 mb-2 ${unlocked ? "" : "opacity-40 pointer-events-none"}`}>
                      {list.map(sp => {
                        const isSel = cur.includes(sp.name);
                        const atGlobalLimit = totalKnown >= spellLimit;
                        return (
                          <label key={sp.name} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${isSel ? "border-blue-500/25 bg-blue-900/[0.08]" : "border-white/[0.05] bg-black/20 hover:border-white/[0.10]"}`}>
                            <input type="checkbox" className="accent-blue-400 w-4 h-4 flex-shrink-0"
                              checked={isSel}
                              disabled={!isSel && atGlobalLimit}
                              onChange={e => {
                                if (e.target.checked && atGlobalLimit) return;
                                const next = e.target.checked ? [...cur, sp.name] : cur.filter(n => n !== sp.name);
                                updCd(`spells${lv}` as any, next);
                                save({ [`spells${lv}`]: next });
                              }} />
                            <span className="flex-1 text-white/70">{sp.name}</span>
                            <span className="text-[9px] text-white/25">{sp.school}</span>
                          </label>
                        );
                      })}
                      {list.length === 0 && (
                        <p className="text-[10px] text-white/25 col-span-2">
                          {unlocked ? "Nessun incantesimo PHB registrato per questo livello nella tua classe." : "Si sblocca quando avrai slot di questo livello."}
                        </p>
                      )}
                    </div>
                    {cur.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {cur.map((c: string) => (
                          <span key={c} className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Contatore globale noti/preparati */}
              {spellLimit < 999 && (
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/[0.06]">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500/40 transition-all" style={{ width: `${Math.min(100, (totalKnown / Math.max(1, spellLimit)) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-white/40 flex-shrink-0">
                    {totalKnown}/{spellLimit} incantesimi
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function renderGear() {
    return (
      <div className="space-y-4">
        {/* Inventario player */}
        <PlayerInventoryManager player={form} cd={cd} level={level} pb={pb} onAddAttack={handleAddAttack} />

        {/* Monete */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Monete</h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            {COIN_TYPES.map(c => (
              <div key={c.key}>
                <p className={`text-[10px] uppercase font-bold mb-1 ${c.color}`}>{c.label}</p>
                <p className="text-[9px] text-white/20 mb-1">{c.desc}</p>
                <input type="number" className="veil-input w-full text-center text-sm font-medium p-1.5" min={0}
                  value={(cd as any)[c.key] ?? 0}
                  onChange={e => updCd(c.key, Number(e.target.value))}
                  onBlur={() => save({ [c.key]: formRef.current?.character_data?.[c.key as keyof CharacterData] })} />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/20 mt-3 text-center">
            1 PP = 10 GP = 50 SA = 100 MC
          </p>
        </div>

        {/* Tesoro / oggetti speciali */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Tesoro e Oggetti Speciali</h3>
          <textarea className="veil-input w-full min-h-[80px] text-sm"
            placeholder="Anello del nuotatore, Pietra del teletrasporto, Mappa del dungeon..."
            value={cd.treasure || ""}
            onChange={e => updCd("treasure", e.target.value)}
            onBlur={() => save({ treasure: formRef.current?.character_data?.treasure })} />
        </div>

        {/* Alleati e Organizzazioni */}
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Alleati e Organizzazioni</h3>
          <textarea className="veil-input w-full min-h-[60px] text-sm"
            placeholder="Ordine dei Cavalieri d'Oro, Gilda dei Ladri di Waterdeep..."
            value={cd.allies || ""}
            onChange={e => updCd("allies", e.target.value)}
            onBlur={() => save({ allies: formRef.current?.character_data?.allies })} />
        </div>
      </div>
    );
  }

  function renderPersonality() {
    // Suggerimenti dal background
    const bgTraits = bgData?.personalityTraits || [];
    const bgIdeals = bgData?.ideals || [];
    const bgBonds = bgData?.bonds || [];
    const bgFlaws = bgData?.flaws || [];

    return (
      <div className="space-y-4">
        <div className="veil-panel p-4 space-y-4">
          <h3 className="text-sm text-veil-gold/80 font-medium">
            Tratti {bgData && <span className="text-[10px] text-white/30 font-normal ml-1">Background: {bgData.name}</span>}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SuggestField label="Tratti di Personalità" fieldKey="personalityTraits" value={cd.personalityTraits || ""} suggestions={bgTraits}
              onChange={v => updCd("personalityTraits", v)} onPick={v => save({ personalityTraits: v })}
              onBlur={() => save({ personalityTraits: formRef.current?.character_data?.personalityTraits })} />
            <SuggestField label="Ideali" fieldKey="ideals" value={cd.ideals || ""} suggestions={bgIdeals}
              onChange={v => updCd("ideals", v)} onPick={v => save({ ideals: v })}
              onBlur={() => save({ ideals: formRef.current?.character_data?.ideals })} />
            <SuggestField label="Legami" fieldKey="bonds" value={cd.bonds || ""} suggestions={bgBonds} isTop
              onChange={v => updCd("bonds", v)} onPick={v => save({ bonds: v })}
              onBlur={() => save({ bonds: formRef.current?.character_data?.bonds })} />
            <SuggestField label="Difetti" fieldKey="flaws" value={cd.flaws || ""} suggestions={bgFlaws} isTop
              onChange={v => updCd("flaws", v)} onPick={v => save({ flaws: v })}
              onBlur={() => save({ flaws: formRef.current?.character_data?.flaws })} />
          </div>
        </div>

        <div className="veil-panel p-4 space-y-4">
          <h3 className="text-sm text-veil-gold/80 font-medium">Storia e Motivazioni</h3>
          <div>
            <LabelWithGuide fieldKey="history" label="Storia del Personaggio" />
            <textarea className="veil-input mt-1 w-full min-h-[80px] text-sm"
              value={form?.history || ""}
              onChange={e => upd("history", e.target.value)}
              onBlur={() => save({ history: formRef.current?.history })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <LabelWithGuide fieldKey="goals" label="Obiettivo" />
              <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
                value={form?.goals || ""}
                onChange={e => upd("goals", e.target.value)}
                onBlur={() => save({ goals: formRef.current?.goals })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="fear" label="Paura" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={form?.fear || ""}
                onChange={e => upd("fear", e.target.value)}
                onBlur={() => save({ fear: formRef.current?.fear })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="important_person" label="Persona Importante" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={form?.important_person || ""}
                onChange={e => upd("important_person", e.target.value)}
                onBlur={() => save({ important_person: formRef.current?.important_person })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="secret" label="Segreto" />
              <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
                value={form?.secret || ""}
                onChange={e => upd("secret", e.target.value)}
                onBlur={() => save({ secret: formRef.current?.secret })} />
            </div>
          </div>
        </div>

        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Aspetto Fisico</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <LabelWithGuide fieldKey="age" label="Età" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={form?.age || ""}
                onChange={e => upd("age", e.target.value)}
                onBlur={() => save({ age: formRef.current?.age })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="height" label="Altezza" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={cd.height || ""} placeholder="180cm"
                onChange={e => updCd("height", e.target.value)}
                onBlur={() => save({ height: formRef.current?.character_data?.height })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="weight" label="Peso" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={cd.weight || ""} placeholder="80kg"
                onChange={e => updCd("weight", e.target.value)}
                onBlur={() => save({ weight: formRef.current?.character_data?.weight })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="eyes" label="Occhi" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={cd.eyes || ""} placeholder="Azzurri"
                onChange={e => updCd("eyes", e.target.value)}
                onBlur={() => save({ eyes: formRef.current?.character_data?.eyes })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="skin" label="Carnagione" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={cd.skin || ""} placeholder="Olivastra"
                onChange={e => updCd("skin", e.target.value)}
                onBlur={() => save({ skin: formRef.current?.character_data?.skin })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="hair" label="Capelli" />
              <input type="text" className="veil-input mt-1 w-full text-sm"
                value={cd.hair || ""} placeholder="Corvino, lungo"
                onChange={e => updCd("hair", e.target.value)}
                onBlur={() => save({ hair: formRef.current?.character_data?.hair })} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderExtra() {
    return (
      <div className="space-y-4">
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Linguaggi</h3>
          <p className="text-[10px] text-white/30 mb-1">
            {raceData ? `Lingua/e dalla razza: ${raceData.languages.join(", ")}` : ""}
            {bgData?.languages ? ` · ${bgData.languages} extra dal background` : ""}
          </p>
          <textarea className="veil-input w-full min-h-[60px] text-sm"
            placeholder="Comune, Nanico, Elfico..."
            value={cd.languages || raceData?.languages.join(", ") || ""}
            onChange={e => updCd("languages", e.target.value)}
            onBlur={() => save({ languages: formRef.current?.character_data?.languages })} />
        </div>

        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Competenze</h3>
          <p className="text-[10px] text-white/30 mb-1">Armature, armi, strumenti dalla classe e background.</p>
          {clsData && (
            <div className="rounded-lg bg-black/20 p-2 mb-2 text-[10px] text-white/35 space-y-0.5">
              {clsData.armorProficiencies.length > 0 && <p>🛡️ Armature: {clsData.armorProficiencies.join(", ")}</p>}
              <p>⚔️ Armi: {clsData.weaponProficiencies.join(", ")}</p>
              {clsData.toolProficiencies.length > 0 && <p>🔧 Strumenti: {clsData.toolProficiencies.join(", ")}</p>}
            </div>
          )}
          <textarea className="veil-input w-full min-h-[60px] text-sm"
            placeholder="Armi semplici, Armature leggere, Strumenti da musicista..."
            value={cd.otherProficiencies || ""}
            onChange={e => updCd("otherProficiencies", e.target.value)}
            onBlur={() => save({ otherProficiencies: formRef.current?.character_data?.otherProficiencies })} />
        </div>

        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Caratteristiche di Classe</h3>
          {Array.from({ length: level }, (_, i) => i + 1).map(lv => {
            const feats = getFeaturesAtLevel(clsKey || "", lv);
            if (feats.length === 0) return null;
            return (
              <div key={lv} className="mb-3">
                <p className="text-xs text-white/30 mb-1">Livello {lv}</p>
                {feats.map(f => (
                  <div key={f.name} className="mb-2">
                    <p className="text-xs text-veil-gold/70 font-medium">✦ {f.name}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">{f.description}</p>
                  </div>
                ))}
              </div>
            );
          })}
          {raceData?.traits.map(t => (
            <div key={t.name} className="mb-3">
              <p className="text-xs text-emerald-400/70 font-medium">{t.name} <span className="text-[9px] text-white/20">(razza)</span></p>
              <p className="text-[11px] text-white/40 mt-0.5">{t.description}</p>
            </div>
          ))}
          {bgData && (
            <div className="mb-3">
              <p className="text-xs text-blue-400/70 font-medium">{bgData.feature.name} <span className="text-[9px] text-white/20">(background)</span></p>
              <p className="text-[11px] text-white/40 mt-0.5">{bgData.feature.description}</p>
            </div>
          )}
        </div>

        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Note Aggiuntive</h3>
          <textarea className="veil-input w-full min-h-[80px] text-sm"
            placeholder="Note varie, ricompense, missioni, ecc..."
            value={(cd as any).notes || ""}
            onChange={e => updCd("notes", e.target.value)}
            onBlur={() => save({ notes: (formRef.current?.character_data as any)?.notes })} />
        </div>
      </div>
    );
  }

  function renderRules() {
    return (
      <div className="space-y-4">
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Caratteristiche</h3>
          <p className="text-[10px] text-white/30 mb-3">Riepilogo di cosa rappresenta e dove si usa ogni caratteristica.</p>
          <AbilityReferenceTables />
        </div>
        <div className="veil-panel p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Trucchetti e Incantesimi</h3>
          <p className="text-[10px] text-white/30 mb-3">Riepilogo dei trucchetti e degli incantesimi di riferimento del gioco.</p>
          <SpellReferenceTables />
        </div>
        <p className="text-[10px] text-white/20 text-center">Tabella riassuntiva delle regole base.</p>
      </div>
    );
  }

  const tabRenderers: Record<SheetTab, () => JSX.Element> = {
    core: renderCore,
    combat: renderCombat,
    magic: renderMagic,
    gear: renderGear,
    personality: renderPersonality,
    extra: renderExtra,
    rules: renderRules,
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header scheda */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-veil-gold font-medium">Scheda Personaggio</h2>
        <SaveBadge state={saveState} />
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs transition flex items-center gap-1.5 ${activeTab === t.id ? "bg-veil-gold/15 border border-veil-gold/30 text-veil-gold" : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/[0.10]"}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tabRenderers[activeTab]?.()}
      </div>
    </div>
  );
}
