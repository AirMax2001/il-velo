"use client";
import { useState, useEffect, useMemo } from "react";
import races, { type RaceData, type SubRace } from "@/lib/data/races";
import classes, { type ClassData, getClassData } from "@/lib/data/classes";
import backgrounds, { type BackgroundData, getBackgroundData } from "@/lib/data/backgrounds";
import { getSpellsForClass } from "@/lib/data/spells";
import {
  type AbilityName, type AbilityScores, type SkillKey, type SaveKey,
  ALL_ABILITIES, ALL_SKILLS, SKILL_ABILITY, ALL_SAVES, SAVE_ABILITY,
  STANDARD_ARRAY, POINT_BUY_COST, POINT_BUY_MAX, POINT_BUY_RANGE,
  getModifier, formatMod, getProficiencyBonus, calculateHP,
  getSpellDC, getSpellAttack, validateCharacter,
  applyRaceBonuses, rollAbilityScores,
} from "@/lib/characterEngine";
import type { Player, CharacterData } from "@/lib/types";

type Props = { player: Player; onComplete: (data: Player) => void; onClose: () => void };
const WIZARD_KEY = "veil-wizard-done";
const WIZARD_SAVE_KEY = "veil-wizard-data";

export function isWizardDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WIZARD_KEY) === "true";
}
export function markWizardDone() {
  localStorage.setItem(WIZARD_KEY, "true");
  localStorage.removeItem(WIZARD_SAVE_KEY);
}
function loadWizardData(): any {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(WIZARD_SAVE_KEY) || "null"); } catch { return null; }
}
function saveWizardData(data: any) {
  localStorage.setItem(WIZARD_SAVE_KEY, JSON.stringify(data));
}

type WizardData = {
  name: string; raceKey: string; subRaceKey: string; classKey: string;
  backgroundKey: string; alignment: string; age: string; sex: string; deity: string; appearance: string;
  abilityMethod: "standard_array" | "point_buy" | "roll_4d6";
  baseScores: Partial<AbilityScores>; assignedScores: Partial<Record<AbilityName, number>>;
  selectedSkills: SkillKey[]; selectedSpells: string[];
  equipmentChoices: Record<number, number>;
};

const ALIGNMENTS = ["Legale Buono", "Neutrale Buono", "Caotico Buono", "Legale Neutrale", "Neutrale", "Caotico Neutrale", "Legale Malvagio", "Neutrale Malvagio", "Caotico Malvagio"];
const STEP_IDS = ["info", "race", "class", "abilities", "skills", "saves", "spells", "equipment", "review"];

export function CharacterWizard({ player, onComplete, onClose }: Props) {
  const saved = loadWizardData();
  const [step, setStep] = useState(saved?.step || 0);
  const [data, setData] = useState<WizardData>(saved?.data || {
    name: player.character_name || "", raceKey: "", subRaceKey: "", classKey: "",
    backgroundKey: "", alignment: "Neutrale", age: "", sex: "", deity: "", appearance: "",
    abilityMethod: "standard_array", baseScores: {}, assignedScores: {},
    selectedSkills: [], selectedSpells: [], equipmentChoices: {},
  });
  const [rolledScores, setRolledScores] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [rolled, setRolled] = useState(false);

  useEffect(() => { saveWizardData({ step, data }); }, [step, data]);

  const race = data.raceKey ? (races as Record<string, RaceData>)[data.raceKey] : undefined;
  const subRace = data.subRaceKey && race?.subRaces ? race.subRaces.find(sr => sr.key === data.subRaceKey) : undefined;
  const cls = data.classKey ? getClassData(data.classKey) : undefined;
  const bg = data.backgroundKey ? getBackgroundData(data.backgroundKey) : undefined;

  const finalScores = useMemo(() => {
    if (!race) return undefined;
    return applyRaceBonuses(data.baseScores, data.raceKey, data.subRaceKey || undefined);
  }, [data.baseScores, data.raceKey, data.subRaceKey]);

  const pb = getProficiencyBonus(1);
  const hp = cls && finalScores ? calculateHP(cls, finalScores.constitution, 1) : 0;

  function update<K extends keyof WizardData>(k: K, v: WizardData[K]) {
    setData(prev => ({ ...prev, [k]: v }));
    setErrors([]);
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return data.name.trim().length > 0 && !!data.backgroundKey;
      case 1: return !!data.raceKey;
      case 2: return !!data.classKey;
      case 3: {
        if (!finalScores) return false;
        if (data.abilityMethod === "standard_array") {
          const assigned = Object.values(data.assignedScores).filter(v => v != null);
          return assigned.length === 6;
        }
        if (data.abilityMethod === "point_buy") {
          const assigned = Object.values(data.assignedScores).filter(v => v != null);
          if (assigned.length < 6) return false;
          const total = Object.values(data.assignedScores).reduce((s, v) => s + (POINT_BUY_COST[v || 0] || 0), 0);
          return total <= POINT_BUY_MAX;
        }
        return data.abilityMethod === "roll_4d6";
      }
      case 4: {
        if (!cls) return false;
        const raceBonusSkills = race?.proficiencies?.skills?.length || 0;
        const extraSkills = (race?.extraSkillCount || 0) + (subRace?.extraSkillCount || 0);
        const classPicks = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
        const totalPicks = classPicks;
        return totalPicks >= cls.skillPicks && totalPicks <= cls.skillPicks + extraSkills;
      }
      case 5: return true;
      case 6: return true;
      case 7: return true;
      case 8: return errors.length === 0;
      default: return false;
    }
  }

  async function finish() {
    const errs = validateCharacter({
      name: data.name, raceKey: data.raceKey, classKey: data.classKey,
      backgroundKey: data.backgroundKey, level: 1,
      abilityScores: finalScores, baseAbilityScores: data.baseScores,
      abilityMethod: data.abilityMethod, selectedSkills: data.selectedSkills,
      selectedSpells: data.selectedSpells,
    });
    if (errs.length > 0) { setErrors(errs.map(e => e.message)); return; }
    setSaving(true);
    try {
      const cd: CharacterData = {
        strength: finalScores?.strength, dexterity: finalScores?.dexterity,
        constitution: finalScores?.constitution, intelligence: finalScores?.intelligence,
        wisdom: finalScores?.wisdom, charisma: finalScores?.charisma,
        proficiencyBonus: 2, initiative: finalScores ? getModifier(finalScores.dexterity) : 0,
        speed: race?.speed || 30, hitDiceTotal: cls ? `1d${cls.hitDie}` : "1d8",
        armorClass: 10 + (finalScores ? getModifier(finalScores.dexterity) : 0),
      };
      if (cls?.spellcasting) {
        cd.spellcastingAbility = cls.spellcasting.spellcastingAbility;
        cd.spellSaveDC = finalScores ? getSpellDC(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2) : 10;
        cd.spellAttackBonus = finalScores ? getSpellAttack(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2) : 2;
        cd.cantrips = data.selectedSpells.filter(s => { const sp = getSpellsForClass(data.classKey, 0).find(sp => sp.name === s); return !!sp; });
        cd.spellSlots = { 1: { total: cls.spellcasting.spellSlots[1] || 0, expended: 0 } };
      }
      for (const save of ALL_SAVES) {
        (cd as any)[save] = cls?.savingThrows.includes(save) || false;
      }
      for (const skill of ALL_SKILLS) {
        (cd as any)[skill] = data.selectedSkills.includes(skill) || false;
      }

      const body: any = { id: player.id, character_name: data.name };
      body.race = race?.name || data.raceKey;
      body.class = cls?.name || data.classKey;
      body.background = bg?.name || data.backgroundKey;
      body.level = 1; body.hp_max = hp; body.hp_current = hp;
      body.age = data.age; body.character_data = cd;

      const res = await fetch("/api/players", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (d.player) { markWizardDone(); onComplete(d.player); }
    } finally { setSaving(false); }
  }

  function renderAbilities(scores: Partial<AbilityScores>, onChange: (a: AbilityName, v: number) => void) {
    return ALL_ABILITIES.map(a => {
      const val = scores[a] ?? 0;
      const mod = getModifier(val);
      return (
        <div key={a} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
          <span className="w-24 text-sm text-white/60 capitalize">{a === "strength" ? "Forza" : a === "dexterity" ? "Destrezza" : a === "constitution" ? "Costituzione" : a === "intelligence" ? "Intelligenza" : a === "wisdom" ? "Saggezza" : "Carisma"}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { const v = val - 1; if (v >= POINT_BUY_RANGE.min) onChange(a, v); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20">−</button>
            <span className="w-8 text-center text-lg font-bold text-white">{val}</span>
            <button onClick={() => { const v = val + 1; if (v <= POINT_BUY_RANGE.max) onChange(a, v); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20">+</button>
          </div>
          <span className="text-xs text-veil-gold">({formatMod(val)})</span>
          {data.abilityMethod === "point_buy" && <span className="text-[10px] text-white/30">costo {POINT_BUY_COST[val] || 0}</span>}
        </div>
      );
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-veil-gold/20 bg-[#0a0806] p-6 shadow-[0_0_80px_rgba(140,92,30,0.15)]">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {STEP_IDS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-veil-gold/60" : "bg-white/10"}`} />
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-veil-gold/50 mb-1">Passo {step + 1} di {STEP_IDS.length}</p>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Informazioni Base</h2>
            <p className="text-sm text-white/50">Iniziamo con le informazioni fondamentali. Background e allineamento definiscono la storia e la morale del personaggio.</p>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Nome del Personaggio *</label>
              <input className="veil-input w-full" value={data.name} onChange={e => update("name", e.target.value)} placeholder="Eldrin" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Background *</label>
              <select className="veil-input w-full" value={data.backgroundKey} onChange={e => { const bg = getBackgroundData(e.target.value); update("backgroundKey", e.target.value); }}>
                <option value="">— Seleziona —</option>
                {Object.values(backgrounds).map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
              </select>
              {bg && <p className="text-[11px] text-white/30 mt-1">{bg.description}</p>}
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Allineamento</label>
              <select className="veil-input w-full" value={data.alignment} onChange={e => update("alignment", e.target.value)}>
                {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Età</label>
                <input className="veil-input w-full" value={data.age} onChange={e => update("age", e.target.value)} placeholder="25" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Sesso</label>
                <input className="veil-input w-full" value={data.sex} onChange={e => update("sex", e.target.value)} placeholder="Maschio / Femmina" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Divinità (se applicabile)</label>
              <input className="veil-input w-full" value={data.deity} onChange={e => update("deity", e.target.value)} placeholder="Es. Torm, Mystra, nessuna" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Aspetto</label>
              <textarea className="veil-input w-full min-h-[60px]" value={data.appearance} onChange={e => update("appearance", e.target.value)} placeholder="Alto, capelli scuri, cicatrice sulla guancia..." />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Razza</h2>
            <p className="text-sm text-white/50">La razza influenza caratteristiche, velocità, linguaggi e abilità speciali. Scegli con cura: ogni razza offre bonus unici.</p>
            <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
              {Object.values(races).map(r => (
                <button key={r.key} onClick={() => { update("raceKey", r.key); update("subRaceKey", ""); }}
                  className={`text-left rounded-xl border p-4 transition ${data.raceKey === r.key ? "border-veil-gold/40 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}>
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-[11px] text-white/40 mt-1">{r.description.slice(0, 120)}...</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(r.abilityBonuses).map(([k, v]) => (
                      <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/80">
                        {k === "strength" ? "FOR" : k === "dexterity" ? "DES" : k === "constitution" ? "COS" : k === "intelligence" ? "INT" : k === "wisdom" ? "SAG" : "CAR"}+{v}
                      </span>
                    ))}
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">{r.speed}m</span>
                  </div>
                </button>
              ))}
            </div>
            {race?.subRaces && race.subRaces.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2">Sottorazza</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {race.subRaces.map(sr => (
                    <button key={sr.key} onClick={() => update("subRaceKey", sr.key)}
                      className={`text-left rounded-xl border p-3 transition ${data.subRaceKey === sr.key ? "border-veil-gold/40 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}>
                      <p className="text-sm font-medium text-white">{sr.name}</p>
                      <p className="text-[10px] text-white/40">{sr.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {race && (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-2">
                <p className="text-xs text-veil-gold/80 font-semibold">Tratti Razziali</p>
                {race.traits.map(t => <div key={t.name}><p className="text-xs text-white/60 font-medium">{t.name}</p><p className="text-[11px] text-white/30">{t.description}</p></div>)}
                {subRace?.traits.map(t => <div key={t.name}><p className="text-xs text-white/60 font-medium">{t.name}</p><p className="text-[11px] text-white/30">{t.description}</p></div>)}
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-white/30">
                  <span>Velocità: {race.speed}m</span>
                  <span>Taglia: {race.size}</span>
                  <span>Linguaggi: {race.languages.join(", ")}</span>
                  {race.darkvision && <span>Scurovisione: {race.darkvision}m</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Classe</h2>
            <p className="text-sm text-white/50">La classe determina il tuo ruolo in gruppo: combattente, incantatore, abile o supporto. Ogni classe ha caratteristiche uniche.</p>
            <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
              {Object.values(classes).map(c => (
                <button key={c.key} onClick={() => update("classKey", c.key)}
                  className={`text-left rounded-xl border p-4 transition ${data.classKey === c.key ? "border-veil-gold/40 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{c.name}</p>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40">d{c.hitDie}</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">{c.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/80">{c.skillPicks} abilità</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">TS: {c.savingThrows.map(s => s.replace("st", "")).join("/")}</span>
                    {c.spellcasting && <span className="rounded bg-blue-900/30 px-1.5 py-0.5 text-[10px] text-blue-300">Incanta</span>}
                  </div>
                </button>
              ))}
            </div>
            {cls && (
              <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-2">
                <p className="text-xs text-veil-gold/80 font-semibold">Caratteristiche di Classe (Livello 1)</p>
                {cls.features.map(f => <div key={f.name}><p className="text-xs text-white/60 font-medium">{f.name}</p><p className="text-[11px] text-white/30">{f.description}</p></div>)}
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-white/30">
                  <span>Dado Vita: d{cls.hitDie}</span>
                  <span>Armature: {cls.armorProficiencies.join(", ") || "nessuna"}</span>
                  <span>Armi: {cls.weaponProficiencies.join(", ")}</span>
                  <span>Tiri Salvezza: {cls.savingThrows.map(s => s.replace("st", "")).join(", ")}</span>
                </div>
                {cls.spellcasting && (
                  <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-900/10 p-3">
                    <p className="text-xs text-blue-300 font-medium">Incantatore</p>
                    <p className="text-[11px] text-blue-200/50">Caratteristica: {cls.spellcasting.spellcastingAbility} · Trucchetti: {cls.spellcasting.cantripsKnown} · Slot 1°: {cls.spellcasting.spellSlots[1]}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Caratteristiche</h2>
            <p className="text-sm text-white/50">I sei punteggi che definiscono le capacità fondamentali del personaggio. Scegli il metodo di generazione.</p>
            <div className="flex gap-2 mb-4">
              {(["standard_array", "point_buy", "roll_4d6"] as const).map(m => (
                <button key={m} onClick={() => { update("abilityMethod", m); if (m === "standard_array") update("assignedScores", {}); if (m === "roll_4d6") setRolled(false); }}
                  className={`rounded-xl border px-4 py-2 text-xs transition ${data.abilityMethod === m ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/30 text-white/50 hover:border-white/[0.12]"}`}>
                  {m === "standard_array" ? "Standard Array" : m === "point_buy" ? "Point Buy" : "4d6"}
                </button>
              ))}
            </div>

            {data.abilityMethod === "standard_array" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Assegna i valori [{STANDARD_ARRAY.join(", ")}] alle caratteristiche. Clicca + e − per assegnare.</p>
                <div className="grid gap-2">
                  {ALL_ABILITIES.map(a => {
                    const val = data.assignedScores[a];
                    const available = STANDARD_ARRAY.filter(v => !Object.values(data.assignedScores).includes(v) || v === val);
                    return (
                      <div key={a} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
                        <span className="w-24 text-sm text-white/60 capitalize">{a === "strength" ? "Forza" : a === "dexterity" ? "Destrezza" : a === "constitution" ? "Costituzione" : a === "intelligence" ? "Intelligenza" : a === "wisdom" ? "Saggezza" : "Carisma"}</span>
                        <div className="flex gap-1 flex-wrap">
                          {STANDARD_ARRAY.map(v => (
                            <button key={v} onClick={() => setData(prev => {
                              const current = Object.entries(prev.assignedScores).find(([, val]) => val === v);
                              const newScores = { ...prev.assignedScores };
                              if (current) delete newScores[current[0] as AbilityName];
                              return { ...prev, assignedScores: { ...newScores, [a]: v } };
                            })}
                              className={`rounded-lg px-3 py-1.5 text-xs transition ${data.assignedScores[a] === v ? "bg-veil-gold/20 border border-veil-gold/40 text-veil-gold" : available.includes(v) ? "bg-white/10 text-white/60 hover:bg-white/20" : "bg-white/5 text-white/20 cursor-not-allowed"}`}
                              disabled={!available.includes(v)}>
                              {v}
                            </button>
                          ))}
                        </div>
                        {val != null && <span className="text-xs text-veil-gold">({formatMod(val)})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.abilityMethod === "point_buy" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Hai {POINT_BUY_MAX} punti da spendere. Valori da {POINT_BUY_RANGE.min} a {POINT_BUY_RANGE.max}.</p>
                {renderAbilities(data.assignedScores, (a, v) => setData(prev => ({ ...prev, assignedScores: { ...prev.assignedScores, [a]: v } })))}
                {(() => {
                  const used = Object.values(data.assignedScores).reduce((s, v) => s + (POINT_BUY_COST[v || 0] || 0), 0);
                  return <p className={`text-xs ${used <= POINT_BUY_MAX ? "text-emerald-400" : "text-red-400"}`}>Punti usati: {used}/{POINT_BUY_MAX}</p>;
                })()}
              </div>
            )}

            {data.abilityMethod === "roll_4d6" && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">Tira 4d6 e scarta il dado più basso per ogni caratteristica. Clicca "Tira" per generare 6 valori.</p>
                {rolledScores.length > 0 && (
                  <div className="grid gap-2">
                    {ALL_ABILITIES.map((a, i) => (
                      <div key={a} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
                        <span className="w-24 text-sm text-white/60 capitalize">{a === "strength" ? "Forza" : a === "dexterity" ? "Destrezza" : a === "constitution" ? "Costituzione" : a === "intelligence" ? "Intelligenza" : a === "wisdom" ? "Saggezza" : "Carisma"}</span>
                        <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" value={data.assignedScores[a] || ""} onChange={e => setData(prev => ({ ...prev, assignedScores: { ...prev.assignedScores, [a]: Number(e.target.value) } }))}>
                          <option value="">—</option>
                          {rolledScores.filter(v => !Object.values(data.assignedScores).includes(v) || data.assignedScores[a] === v).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        {data.assignedScores[a] != null && <span className="text-xs text-veil-gold">({formatMod(data.assignedScores[a]!)})</span>}
                        <span className="text-[10px] text-white/30">disponibile: {rolledScores.filter(v => !Object.values(data.assignedScores).includes(v) || data.assignedScores[a] === v).join(", ")}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => { const r = rollAbilityScores(); setRolledScores(r.sort((a, b) => b - a)); setRolled(true); setData(prev => ({ ...prev, assignedScores: {} })); }}
                  className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2 text-xs text-veil-gold hover:bg-veil-gold/20">
                  {rolled ? "Ritira" : "Tira i dadi"}
                </button>
              </div>
            )}

            {finalScores && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
                <p className="text-xs text-emerald-300 font-semibold mb-2">Punteggi Finali (con bonus razziali)</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {ALL_ABILITIES.map(a => (
                    <div key={a} className="text-center">
                      <p className="text-white/40">{a === "strength" ? "FOR" : a === "dexterity" ? "DES" : a === "constitution" ? "COS" : a === "intelligence" ? "INT" : a === "wisdom" ? "SAG" : "CAR"}</p>
                      <p className="text-lg font-bold text-white">{finalScores[a]} <span className="text-sm text-veil-gold">{formatMod(finalScores[a])}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Abilità</h2>
            {cls && <p className="text-sm text-white/50">La tua classe ti permette di scegliere {cls.skillPicks} abilità tra quelle disponibili. Le competenze razziali vengono aggiunte automaticamente.</p>}
            {cls && (
              <div className="grid gap-2 max-h-80 overflow-y-auto pr-2">
                {ALL_SKILLS.map(skill => {
                  const name = skill.replace("skill", "");
                  const label = name === "Athletics" ? "Atletica" : name === "Acrobatics" ? "Acrobazia" : name === "SleightOfHand" ? "Rapidità di Mano" : name === "Stealth" ? "Furtività" : name === "Arcana" ? "Arcano" : name === "History" ? "Storia" : name === "Investigation" ? "Indagare" : name === "Nature" ? "Natura" : name === "Religion" ? "Religione" : name === "AnimalHandling" ? "Addestrare Animali" : name === "Insight" ? "Intuizione" : name === "Medicine" ? "Medicina" : name === "Perception" ? "Percezione" : name === "Survival" ? "Sopravvivenza" : name === "Deception" ? "Inganno" : name === "Intimidation" ? "Intimidire" : name === "Performance" ? "Intrattenere" : "Persuasione";
                  const ability = SKILL_ABILITY[skill];
                  const isClassSkill = cls.skillOptions.includes(skill);
                  const isRaceSkill = race?.proficiencies?.skills?.includes(skill);
                  const isSelected = data.selectedSkills.includes(skill);
                  const classPicks = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
                  const canPick = !isSelected && (isClassSkill ? classPicks < cls.skillPicks : true);
                  return (
                    <button key={skill} onClick={() => {
                      if (isSelected) setData(prev => ({ ...prev, selectedSkills: prev.selectedSkills.filter(s => s !== skill) }));
                      else if (canPick) setData(prev => ({ ...prev, selectedSkills: [...prev.selectedSkills, skill] }));
                    }}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition ${isSelected ? "border-veil-gold/40 bg-veil-gold/[0.06]" : isRaceSkill ? "border-emerald-500/20 bg-emerald-900/10" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}
                      disabled={!isSelected && !isRaceSkill && !isClassSkill}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] ${isSelected ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>{isSelected ? "✓" : ""}</div>
                      <div className="flex-1">
                        <span className={`text-sm ${isSelected ? "text-white" : isRaceSkill ? "text-emerald-300" : "text-white/60"}`}>{label}</span>
                        <span className="text-[10px] text-white/30 ml-2">({ability === "strength" ? "FOR" : ability === "dexterity" ? "DES" : ability === "constitution" ? "COS" : ability === "intelligence" ? "INT" : ability === "wisdom" ? "SAG" : "CAR"})</span>
                      </div>
                      {isRaceSkill && <span className="text-[10px] text-emerald-400/60">razziale</span>}
                      {!isClassSkill && !isRaceSkill && <span className="text-[10px] text-white/20">non disponibile</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-white/30">Selezionate: {data.selectedSkills.filter(s => cls?.skillOptions.includes(s)).length}/{cls?.skillPicks || 0} dalla classe · {data.selectedSkills.length} totali</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Tiri Salvezza</h2>
            <p className="text-sm text-white/50">I tiri salvezza derivano automaticamente dalla classe scelta e non sono modificabili manualmente.</p>
            <div className="grid gap-2">
              {ALL_SAVES.map(save => {
                const name = save.replace("st", "");
                const isProficient = cls?.savingThrows.includes(save) || false;
                const ability = SAVE_ABILITY[save];
                const mod = finalScores ? formatMod(getModifier(finalScores[ability])) : "+0";
                return (
                  <div key={save} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
                    <div className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] ${isProficient ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20 text-white/20"}`}>
                      {isProficient ? "✓" : ""}
                    </div>
                    <span className="text-sm text-white/60 w-20">{name === "Strength" ? "Forza" : name === "Dexterity" ? "Destrezza" : name === "Constitution" ? "Costituzione" : name === "Intelligence" ? "Intelligenza" : name === "Wisdom" ? "Saggezza" : "Carisma"}</span>
                    <span className="text-xs text-white/30">Mod: {mod}</span>
                    {isProficient && <span className="text-[10px] text-veil-gold/60">+ PB ({formatMod(2)})</span>}
                    {!isProficient && <span className="text-[10px] text-white/20">non competente</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Incantesimi</h2>
            {cls?.spellcasting ? (
              <>
                <p className="text-sm text-white/50">Come {cls.name}, conosci {cls.spellcasting.cantripsKnown} trucchetti e {cls.spellcasting.spellsKnown > 0 ? `${cls.spellcasting.spellsKnown} incantesimi di 1° livello` : "prepari incantesimi dalla lista della classe"}. Usi {cls.spellcasting.spellcastingAbility} come caratteristica da incantatore.</p>
                {cls.spellcasting.cantripsKnown > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Trucchetti (a volontà)</p>
                    <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                      {getSpellsForClass(data.classKey, 0).map(spell => (
                        <button key={spell.name} onClick={() => setData(prev => ({
                          ...prev, selectedSpells: prev.selectedSpells.includes(spell.name) ? prev.selectedSpells.filter(s => s !== spell.name) : prev.selectedSpells.length < cls!.spellcasting!.cantripsKnown + (cls!.spellcasting!.spellsKnown || 0) ? [...prev.selectedSpells, spell.name] : prev.selectedSpells
                        }))}
                          className={`text-left rounded-xl border p-3 transition ${data.selectedSpells.includes(spell.name) ? "border-veil-gold/40 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}>
                          <p className="text-sm text-white font-medium">{spell.name}</p>
                          <p className="text-[10px] text-white/30">{spell.school} · {spell.castingTime} · {spell.range} · {spell.duration}</p>
                          <p className="text-[10px] text-white/40 mt-1">{spell.description.slice(0, 100)}...</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {cls.spellcasting.spellsKnown > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-2">Incantesimi di 1° Livello</p>
                    <div className="grid gap-2 max-h-48 overflow-y-auto pr-2">
                      {getSpellsForClass(data.classKey, 1).map(spell => (
                        <button key={spell.name} onClick={() => setData(prev => ({
                          ...prev, selectedSpells: prev.selectedSpells.includes(spell.name) ? prev.selectedSpells.filter(s => s !== spell.name) : prev.selectedSpells.length < cls!.spellcasting!.cantripsKnown + (cls!.spellcasting!.spellsKnown || 0) ? [...prev.selectedSpells, spell.name] : prev.selectedSpells
                        }))}
                          className={`text-left rounded-xl border p-3 transition ${data.selectedSpells.includes(spell.name) ? "border-veil-gold/40 bg-veil-gold/[0.06]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.12]"}`}>
                          <p className="text-sm text-white font-medium">{spell.name}</p>
                          <p className="text-[10px] text-white/30">{spell.school} · 1° livello · {spell.castingTime} · {spell.range} · {spell.duration}</p>
                          <p className="text-[10px] text-white/40 mt-1">{spell.description.slice(0, 100)}...</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-white/30">Selezionati: {data.selectedSpells.length} / {cls.spellcasting.cantripsKnown + cls.spellcasting.spellsKnown}</p>
                {finalScores && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3 text-xs text-blue-200/70">
                    CD Tiro Salvezza: {getSpellDC(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2)}
                    · Bonus Attacco: +{getSpellAttack(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2)}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-6 text-center">
                <p className="text-sm text-white/40">{cls?.name || "La classe selezionata"} non lancia incantesimi. Puoi procedere.</p>
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Equipaggiamento Iniziale</h2>
            <p className="text-sm text-white/50">Scegli l'equipaggiamento iniziale previsto dalla tua classe.</p>
            {cls?.equipment.map((eq, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="text-xs text-white/40 mb-2">{eq.label}</p>
                {eq.options.length === 1 ? (
                  <div className="text-xs text-white/60">{eq.options[0].map((item, j) => <span key={j} className="mr-2">{item.quantity > 1 ? `${item.quantity}x ` : ""}{item.name}{j < eq.options[0].length - 1 ? "," : ""}</span>)}</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {eq.options.map((option, oi) => (
                      <button key={oi} onClick={() => setData(prev => ({ ...prev, equipmentChoices: { ...prev.equipmentChoices, [i]: oi } }))}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${data.equipmentChoices[i] === oi ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/30 text-white/50 hover:border-white/[0.12]"}`}>
                        {option.map((item, j) => <span key={j} className="block">{item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl text-veil-gold">Riepilogo e Validazione</h2>
            <p className="text-sm text-white/50">Controlla tutti i dati prima di completare la creazione. Eventuali errori verranno mostrati.</p>
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-4">
                <p className="text-xs text-red-300 font-semibold mb-2">Errori da correggere:</p>
                {errors.map((err, i) => <p key={i} className="text-xs text-red-200/70">• {err}</p>)}
              </div>
            )}
            <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.04] p-4 text-xs text-white/60 space-y-1">
              <p><span className="text-veil-gold/80">Nome:</span> {data.name}</p>
              <p><span className="text-veil-gold/80">Razza:</span> {race?.name}{subRace ? ` (${subRace.name})` : ""}</p>
              <p><span className="text-veil-gold/80">Classe:</span> {cls?.name} · Livello 1</p>
              <p><span className="text-veil-gold/80">Background:</span> {bg?.name}</p>
              <p><span className="text-veil-gold/80">Allineamento:</span> {data.alignment}</p>
              <p><span className="text-veil-gold/80">PF:</span> {hp} ({cls ? `d${cls.hitDie}` : "?"} + {finalScores ? getModifier(finalScores.constitution) : 0})</p>
              <p><span className="text-veil-gold/80">CA:</span> {10 + (finalScores ? getModifier(finalScores.dexterity) : 0)}</p>
              <p><span className="text-veil-gold/80">Caratteristiche:</span> {finalScores ? ALL_ABILITIES.map(a => `${a.slice(0, 3).toUpperCase()} ${finalScores[a]}(${formatMod(finalScores[a])})`).join(" · ") : "—"}</p>
              <p><span className="text-veil-gold/80">Abilità:</span> {data.selectedSkills.length > 0 ? data.selectedSkills.map(s => s.replace("skill", "")).join(", ") : "nessuna"}</p>
              {data.selectedSpells.length > 0 && <p><span className="text-veil-gold/80">Incantesimi:</span> {data.selectedSpells.join(", ")}</p>}
            </div>
            <div className="flex justify-center">
              <button onClick={async () => {
                const errs = validateCharacter({
                  name: data.name, raceKey: data.raceKey, classKey: data.classKey,
                  backgroundKey: data.backgroundKey, level: 1,
                  abilityScores: finalScores, baseAbilityScores: data.baseScores,
                  abilityMethod: data.abilityMethod, selectedSkills: data.selectedSkills,
                  selectedSpells: data.selectedSpells,
                });
                if (errs.length > 0) { setErrors(errs.map(e => e.message)); return; }
                setErrors([]);
                await finish();
              }}
                disabled={saving}
                className="rounded-xl bg-veil-gold/20 border border-veil-gold/40 px-6 py-3 text-sm font-semibold text-veil-gold hover:bg-veil-gold/30 disabled:opacity-50">
                {saving ? "Salvataggio..." : "Completa Creazione"}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-6">
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white/60">Chiudi</button>
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:border-white/20">
                Indietro
              </button>
            )}
            {step < STEP_IDS.length - 1 ? (
              <button onClick={() => { setErrors([]); step === 3 && data.abilityMethod === "roll_4d6" && !rolled ? null : canProceed() ? setStep(s => s + 1) : null; }}
                className={`rounded-xl px-5 py-2 text-xs font-semibold transition ${canProceed() ? "bg-veil-gold/20 border border-veil-gold/40 text-veil-gold hover:bg-veil-gold/30" : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"}`}
                disabled={!canProceed()}>
                Prossimo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
