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
  getSpellDC, getSpellAttack,
  applyRaceBonuses, rollAbilityScores,
} from "@/lib/characterEngine";
import type { Player, CharacterData } from "@/lib/types";

type Props = { player: Player; onComplete: (data: Player) => void; onClose: () => void };
const WIZARD_KEY = "veil-wizard-done";
const WIZARD_SAVE_KEY = "veil-wizard-data-v2";

export function isWizardDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WIZARD_KEY) === "true";
}
export function markWizardDone() {
  localStorage.setItem(WIZARD_KEY, "true");
  localStorage.removeItem(WIZARD_SAVE_KEY);
  localStorage.removeItem("veil-wizard-data"); // cleanup vecchio formato
}
function loadWizardData(): any {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(WIZARD_SAVE_KEY) || "null"); } catch { return null; }
}
function saveWizardData(data: any) {
  localStorage.setItem(WIZARD_SAVE_KEY, JSON.stringify(data));
}

type WizardData = {
  name: string;
  raceKey: string;
  subRaceKey: string;
  classKey: string;
  backgroundKey: string;
  alignment: string;
  age: string;
  sex: string;
  deity: string;
  appearance: string;
  abilityMethod: "standard_array" | "point_buy" | "roll_4d6";
  // Standard Array: assignedScores[abilityName] = index into STANDARD_ARRAY (0-5)
  assignedIndices: Partial<Record<AbilityName, number>>;
  // Point buy / roll: direct values
  baseScores: Partial<AbilityScores>;
  // Roll 4d6: rolled values (sorted desc)
  rolledScores: number[];
  // Roll 4d6: which rolled index is assigned to which ability
  rolledAssigned: Partial<Record<AbilityName, number>>;
  selectedSkills: SkillKey[];
  selectedSpells: string[];
  equipmentChoices: Record<number, number>;
};

const ALIGNMENTS = [
  "Legale Buono", "Neutrale Buono", "Caotico Buono",
  "Legale Neutrale", "Neutrale", "Caotico Neutrale",
  "Legale Malvagio", "Neutrale Malvagio", "Caotico Malvagio",
];

const STEP_LABELS = [
  "Info Base", "Razza", "Classe", "Background",
  "Caratteristiche", "Abilità", "Tiri Salvezza",
  "Incantesimi", "Equipaggiamento", "Riepilogo",
];

const ABILITY_LABELS: Record<AbilityName, string> = {
  strength: "Forza", dexterity: "Destrezza", constitution: "Costituzione",
  intelligence: "Intelligenza", wisdom: "Saggezza", charisma: "Carisma",
};
const ABILITY_SHORT: Record<AbilityName, string> = {
  strength: "FOR", dexterity: "DES", constitution: "COS",
  intelligence: "INT", wisdom: "SAG", charisma: "CAR",
};
const SKILL_LABELS: Record<SkillKey, string> = {
  skillAthletics: "Atletica", skillAcrobatics: "Acrobazia",
  skillSleightOfHand: "Rapidità di Mano", skillStealth: "Furtività",
  skillArcana: "Arcano", skillHistory: "Storia",
  skillInvestigation: "Indagare", skillNature: "Natura",
  skillReligion: "Religione", skillAnimalHandling: "Addestrare Animali",
  skillInsight: "Intuizione", skillMedicine: "Medicina",
  skillPerception: "Percezione", skillSurvival: "Sopravvivenza",
  skillDeception: "Inganno", skillIntimidation: "Intimidire",
  skillPerformance: "Intrattenere", skillPersuasion: "Persuasione",
};
const SAVE_LABELS: Record<SaveKey, string> = {
  stStrength: "Forza", stDexterity: "Destrezza", stConstitution: "Costituzione",
  stIntelligence: "Intelligenza", stWisdom: "Saggezza", stCharisma: "Carisma",
};

const DEFAULT_DATA: WizardData = {
  name: "", raceKey: "", subRaceKey: "", classKey: "",
  backgroundKey: "", alignment: "Neutrale", age: "", sex: "", deity: "", appearance: "",
  abilityMethod: "standard_array",
  assignedIndices: {}, baseScores: {}, rolledScores: [], rolledAssigned: {},
  selectedSkills: [], selectedSpells: [], equipmentChoices: {},
};

export function CharacterWizard({ player, onComplete, onClose }: Props) {
  const saved = loadWizardData();
  const [step, setStep] = useState<number>(saved?.step ?? 0);
  const [data, setData] = useState<WizardData>(saved?.data ?? { ...DEFAULT_DATA, name: player.character_name || "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => { saveWizardData({ step, data }); }, [step, data]);

  const race = data.raceKey ? (races as Record<string, RaceData>)[data.raceKey] : undefined;
  const subRace = data.subRaceKey && race?.subRaces ? race.subRaces.find(sr => sr.key === data.subRaceKey) : undefined;
  const cls = data.classKey ? getClassData(data.classKey) : undefined;
  const bg = data.backgroundKey ? getBackgroundData(data.backgroundKey) : undefined;

  // Abilità garantite dal background (auto-selezionate, non rimovibili)
  const bgSkills: SkillKey[] = useMemo(
    () => (bg?.skillProficiencies || []).filter(s => ALL_SKILLS.includes(s as SkillKey)) as SkillKey[],
    [bg]
  );
  // Abilità garantite dalla razza
  const raceSkills: SkillKey[] = useMemo(
    () => (race?.proficiencies?.skills || []).filter(s => ALL_SKILLS.includes(s as SkillKey)) as SkillKey[],
    [race]
  );
  // Abilità garantite dalla sottorazza
  const subRaceSkills: SkillKey[] = useMemo(
    () => (subRace?.proficiencies?.skills || []).filter(s => ALL_SKILLS.includes(s as SkillKey)) as SkillKey[],
    [subRace]
  );

  // Punteggi finali (base + bonus razziali)
  const finalScores = useMemo(() => {
    if (!race) return undefined;
    let base: Partial<AbilityScores> = {};
    if (data.abilityMethod === "standard_array") {
      for (const a of ALL_ABILITIES) {
        const idx = data.assignedIndices[a];
        if (idx !== undefined) base[a] = STANDARD_ARRAY[idx];
      }
    } else if (data.abilityMethod === "point_buy") {
      base = { ...data.baseScores };
    } else {
      for (const a of ALL_ABILITIES) {
        const idx = data.rolledAssigned[a];
        if (idx !== undefined) base[a] = data.rolledScores[idx];
      }
    }
    return applyRaceBonuses(base, data.raceKey, data.subRaceKey || undefined);
  }, [data.abilityMethod, data.assignedIndices, data.baseScores, data.rolledScores, data.rolledAssigned, data.raceKey, data.subRaceKey, race]);

  const pb = getProficiencyBonus(1);
  const hp = cls && finalScores ? calculateHP(cls, finalScores.constitution, 1) : 0;

  function update<K extends keyof WizardData>(k: K, v: WizardData[K]) {
    setData(prev => ({ ...prev, [k]: v }));
    setErrors([]);
  }

  // Verifica se si può procedere allo step successivo
  function canProceed(): boolean {
    switch (step) {
      case 0: return data.name.trim().length > 0;
      case 1: return !!data.raceKey && (!race?.hasSubRace || race.subRaces?.length === 0 || !!data.subRaceKey);
      case 2: return !!data.classKey;
      case 3: return !!data.backgroundKey;
      case 4: {
        if (data.abilityMethod === "standard_array") {
          return Object.keys(data.assignedIndices).length === 6;
        }
        if (data.abilityMethod === "point_buy") {
          const allSet = ALL_ABILITIES.every(a => data.baseScores[a] !== undefined);
          if (!allSet) return false;
          const cost = Object.values(data.baseScores).reduce((s, v) => s + (POINT_BUY_COST[v ?? 0] || 0), 0);
          return cost <= POINT_BUY_MAX;
        }
        if (data.abilityMethod === "roll_4d6") {
          return data.rolledScores.length === 6 && Object.keys(data.rolledAssigned).length === 6;
        }
        return false;
      }
      case 5: {
        if (!cls) return false;
        const classPicksMade = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
        return classPicksMade === cls.skillPicks;
      }
      case 6: return true;
      case 7: return true;
      case 8: return true;
      case 9: return errors.length === 0;
      default: return false;
    }
  }

  async function finish() {
    setSaving(true);
    try {
      // Costruisce il character_data completo
      const cd: CharacterData = {
        strength: finalScores?.strength,
        dexterity: finalScores?.dexterity,
        constitution: finalScores?.constitution,
        intelligence: finalScores?.intelligence,
        wisdom: finalScores?.wisdom,
        charisma: finalScores?.charisma,
        proficiencyBonus: 2,
        initiative: finalScores ? getModifier(finalScores.dexterity) : 0,
        speed: race?.speed || 30,
        armorClass: finalScores ? 10 + getModifier(finalScores.dexterity) : 10,
        hitDiceTotal: cls ? `1d${cls.hitDie}` : "1d8",
        personalityTraits: bg?.personalityTraits?.[0] || "",
        ideals: bg?.ideals?.[0] || "",
        bonds: bg?.bonds?.[0] || "",
        flaws: bg?.flaws?.[0] || "",
      };

      // Incantesimi
      if (cls?.spellcasting) {
        cd.spellcastingAbility = cls.spellcasting.spellcastingAbility;
        cd.spellSaveDC = finalScores
          ? getSpellDC(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2)
          : 10;
        cd.spellAttackBonus = finalScores
          ? getSpellAttack(cls.spellcasting.spellcastingAbility as AbilityName, finalScores, 2)
          : 2;
        cd.cantrips = data.selectedSpells.filter(s => {
          const sp = getSpellsForClass(data.classKey, 0).find(sp => sp.name === s);
          return !!sp;
        });
        cd.spellSlots = { 1: { total: cls.spellcasting.spellSlots[1] || 0, expended: 0 } };
      }

      // Tiri salvezza dalla classe
      for (const save of ALL_SAVES) {
        (cd as any)[save] = cls?.savingThrows.includes(save) || false;
      }

      // Abilità: classe + background + razza + sottorazza (tutte le fonti)
      const autoSkills = new Set<SkillKey>([...bgSkills, ...raceSkills, ...subRaceSkills]);
      for (const skill of ALL_SKILLS) {
        (cd as any)[skill] = data.selectedSkills.includes(skill) || autoSkills.has(skill);
      }

      // Linguaggi da razza + background
      const languages: string[] = [...(race?.languages || [])];
      if (bg) {
        for (let i = 0; i < bg.languages; i++) languages.push("Linguaggio extra a scelta");
      }
      cd.languages = languages.join(", ");

      // Competenze da razza e classe
      const proficiencies: string[] = [
        ...(cls?.armorProficiencies || []),
        ...(cls?.weaponProficiencies || []),
        ...(cls?.toolProficiencies || []),
        ...(race?.proficiencies?.armors || []),
        ...(race?.proficiencies?.weapons || []),
        ...(race?.proficiencies?.tools || []),
        ...(bg?.toolProficiencies || []),
      ].filter(Boolean);
      cd.otherProficiencies = [...new Set(proficiencies)].join(", ");

      // Equipaggiamento background
      const bgEquipment = bg?.equipment || [];
      if (bgEquipment.length > 0) {
        cd.treasure = bgEquipment.join(", ");
      }

      const body: any = {
        id: player.id,
        character_name: data.name,
        race: race?.name || data.raceKey,
        class: cls?.name || data.classKey,
        background: bg?.name || data.backgroundKey,
        level: 1,
        hp_max: hp,
        hp_current: hp,
        age: data.age,
        character_data: cd,
      };

      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.player) {
        markWizardDone();
        onComplete(d.player);
      } else {
        setErrors(["Errore nel salvataggio. Riprova."]);
      }
    } catch (e) {
      setErrors(["Errore di rete. Controlla la connessione."]);
    } finally {
      setSaving(false);
    }
  }

  // ── RENDER STEP 0: Info Base ──────────────────────────────────
  function renderStep0() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Informazioni Base</h2>
          <p className="text-sm text-white/50 mt-1">Il nome e l'aspetto del tuo personaggio. Puoi modificarli anche dopo nella scheda.</p>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Nome del Personaggio *</label>
          <input className="veil-input w-full" value={data.name}
            onChange={e => update("name", e.target.value)} placeholder="Es. Eldrin, Thorin, Lyra..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Allineamento</label>
            <select className="veil-input w-full" value={data.alignment} onChange={e => update("alignment", e.target.value)}>
              {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <p className="text-[10px] text-white/25 mt-1">L'allineamento descrive la morale e la personalità del personaggio.</p>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Sesso</label>
            <input className="veil-input w-full" value={data.sex}
              onChange={e => update("sex", e.target.value)} placeholder="Maschio / Femmina / Altro" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Età</label>
            <input className="veil-input w-full" value={data.age}
              onChange={e => update("age", e.target.value)} placeholder="Es. 25" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Divinità (opzionale)</label>
            <input className="veil-input w-full" value={data.deity}
              onChange={e => update("deity", e.target.value)} placeholder="Es. Torm, Mystra, nessuna" />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block">Descrizione Fisica</label>
          <textarea className="veil-input w-full min-h-[60px]" value={data.appearance}
            onChange={e => update("appearance", e.target.value)}
            placeholder="Alto, capelli scuri, cicatrice sulla guancia, occhi verdi..." />
        </div>
      </div>
    );
  }

  // ── RENDER STEP 1: Razza ─────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Razza</h2>
          <p className="text-sm text-white/50 mt-1">La razza influenza le statistiche, la velocità, i linguaggi e le abilità speciali del personaggio.</p>
        </div>
        <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
          {Object.values(races as Record<string, RaceData>).map(r => (
            <button key={r.key} onClick={() => { update("raceKey", r.key); update("subRaceKey", ""); }}
              className={`text-left rounded-xl border p-3 transition ${data.raceKey === r.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-white text-sm">{r.name}</p>
                <span className="text-[10px] text-white/30">{r.speed}m · {r.size}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {Object.entries(r.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/80">
                    {ABILITY_SHORT[k as AbilityName]}+{v}
                  </span>
                ))}
                {r.darkvision && <span className="rounded bg-indigo-900/30 px-1.5 py-0.5 text-[10px] text-indigo-300/70">Scurovisione {r.darkvision}m</span>}
              </div>
            </button>
          ))}
        </div>

        {race?.hasSubRace && race.subRaces && race.subRaces.length > 0 && (
          <div>
            <p className="text-xs text-veil-gold/60 mb-2 font-medium">Sottorazza *</p>
            <div className="grid gap-2 md:grid-cols-2">
              {race.subRaces.map(sr => (
                <button key={sr.key} onClick={() => update("subRaceKey", sr.key)}
                  className={`text-left rounded-xl border p-3 transition ${data.subRaceKey === sr.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
                  <p className="text-sm font-medium text-white">{sr.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(sr.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
                      <span key={k} className="rounded bg-emerald-900/20 px-1.5 py-0.5 text-[10px] text-emerald-300/70">
                        {ABILITY_SHORT[k as AbilityName]}+{v}
                      </span>
                    ))}
                  </div>
                  {sr.description && <p className="text-[10px] text-white/35 mt-1">{sr.description}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {race && (
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
            <p className="text-xs text-veil-gold/70 font-semibold">Tratti Razziali</p>
            <div className="space-y-1">
              {[...race.traits, ...(subRace?.traits || [])].map(t => (
                <div key={t.name}>
                  <p className="text-xs text-white/60 font-medium">{t.name}</p>
                  <p className="text-[10px] text-white/30">{t.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/30 border-t border-white/[0.05] pt-2">
              <span>🏃 Velocità: {race.speed}m</span>
              <span>📏 Taglia: {race.size}</span>
              <span>🗣️ {race.languages.join(", ")}</span>
              {race.darkvision && <span>👁️ Scurovisione: {race.darkvision}m</span>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 2: Classe ─────────────────────────────────────
  function renderStep2() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Classe</h2>
          <p className="text-sm text-white/50 mt-1">La classe determina il ruolo del personaggio: guerriero, incantatore, abile o supporto.</p>
        </div>
        <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
          {Object.values(classes as Record<string, ClassData>).map(c => (
            <button key={c.key} onClick={() => update("classKey", c.key)}
              className={`text-left rounded-xl border p-3 transition ${data.classKey === c.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-white text-sm">{c.name}</p>
                <div className="flex gap-1">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/40">d{c.hitDie}</span>
                  {c.spellcasting && <span className="rounded bg-blue-900/30 px-2 py-0.5 text-[10px] text-blue-300">Incantatore</span>}
                </div>
              </div>
              <p className="text-[11px] text-white/40 mt-1">{c.description}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">{c.skillPicks} abilità</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/35">
                  TS: {c.savingThrows.map(s => SAVE_LABELS[s as SaveKey].slice(0, 3)).join("/")}
                </span>
              </div>
            </button>
          ))}
        </div>

        {cls && (
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
            <p className="text-xs text-veil-gold/70 font-semibold">Caratteristiche di Classe (Livello 1)</p>
            <div className="space-y-1">
              {cls.features.map(f => (
                <div key={f.name}>
                  <p className="text-xs text-white/60 font-medium">{f.name}</p>
                  <p className="text-[10px] text-white/30">{f.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-white/30 border-t border-white/[0.05] pt-2">
              <span>⚔️ {cls.weaponProficiencies.join(", ") || "nessuna"}</span>
              {cls.armorProficiencies.length > 0 && <span>🛡️ {cls.armorProficiencies.join(", ")}</span>}
            </div>
            {cls.spellcasting && (
              <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-900/10 p-2">
                <p className="text-xs text-blue-300 font-medium">Incantatore</p>
                <p className="text-[10px] text-blue-200/50">
                  Caratteristica: {ABILITY_LABELS[cls.spellcasting.spellcastingAbility as AbilityName]} ·
                  Trucchetti: {cls.spellcasting.cantripsKnown} ·
                  {cls.spellcasting.spellsKnown > 0 ? ` Incantesimi conosciuti: ${cls.spellcasting.spellsKnown}` : " Prepara incantesimi"} ·
                  Slot 1°: {cls.spellcasting.spellSlots[1]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 3: Background ─────────────────────────────────
  function renderStep3() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Background</h2>
          <p className="text-sm text-white/50 mt-1">Il background racconta cosa faceva il tuo personaggio prima di diventare un avventuriero. Garantisce abilità e competenze automaticamente.</p>
        </div>
        <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
          {Object.values(backgrounds as Record<string, BackgroundData>).map(b => (
            <button key={b.key} onClick={() => {
              update("backgroundKey", b.key);
              // Auto-rimuovi le skill del vecchio background dalla selezione
              setData(prev => {
                const oldBg = prev.backgroundKey ? getBackgroundData(prev.backgroundKey) : null;
                const oldBgSkills = (oldBg?.skillProficiencies || []) as SkillKey[];
                const filtered = prev.selectedSkills.filter(s => !oldBgSkills.includes(s));
                return { ...prev, backgroundKey: b.key, selectedSkills: filtered };
              });
            }}
              className={`text-left rounded-xl border p-3 transition ${data.backgroundKey === b.key ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.06] bg-black/30 hover:border-white/[0.14]"}`}>
              <p className="font-medium text-white text-sm">{b.name}</p>
              <p className="text-[11px] text-white/40 mt-1">{b.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {b.skillProficiencies.map(s => (
                  <span key={s} className="rounded bg-emerald-900/20 px-1.5 py-0.5 text-[10px] text-emerald-300/70">
                    {SKILL_LABELS[s as SkillKey] || s}
                  </span>
                ))}
                {b.languages > 0 && (
                  <span className="rounded bg-blue-900/20 px-1.5 py-0.5 text-[10px] text-blue-300/70">
                    +{b.languages} lingua{b.languages > 1 ? "e" : ""}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {bg && (
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3 space-y-2">
            <p className="text-xs text-veil-gold/70 font-semibold">Caratteristica: {bg.feature.name}</p>
            <p className="text-[11px] text-white/35">{bg.feature.description}</p>
            {bg.equipment.length > 0 && (
              <div className="mt-2 border-t border-white/[0.05] pt-2">
                <p className="text-[10px] text-white/30">Equipaggiamento iniziale: {bg.equipment.join(", ")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 4: Caratteristiche ────────────────────────────
  function renderStep4() {
    const METHOD_LABELS = { standard_array: "Standard Array", point_buy: "Point Buy", roll_4d6: "Tira 4d6" };

    // Standard Array: get score for ability
    function getStdScore(a: AbilityName): number | undefined {
      const idx = data.assignedIndices[a];
      return idx !== undefined ? STANDARD_ARRAY[idx] : undefined;
    }

    // Standard Array: assign index to ability, swap if already used
    function assignStdIndex(a: AbilityName, idx: number) {
      setData(prev => {
        const newIndices = { ...prev.assignedIndices };
        // Trova se questo indice è già assegnato a un'altra abilità → swap
        const existing = Object.entries(newIndices).find(([, i]) => i === idx);
        if (existing) delete newIndices[existing[0] as AbilityName];
        newIndices[a] = idx;
        return { ...prev, assignedIndices: newIndices };
      });
    }

    // Point buy: set score
    function setPointBuyScore(a: AbilityName, v: number) {
      if (v < POINT_BUY_RANGE.min || v > POINT_BUY_RANGE.max) return;
      setData(prev => ({ ...prev, baseScores: { ...prev.baseScores, [a]: v } }));
    }

    const pointBuyUsed = ALL_ABILITIES.reduce((s, a) => s + (POINT_BUY_COST[data.baseScores[a] ?? 0] || 0), 0);
    const pointBuyLeft = POINT_BUY_MAX - pointBuyUsed;

    // Roll 4d6
    function doRoll() {
      const rolled = rollAbilityScores().sort((a, b) => b - a);
      setData(prev => ({ ...prev, rolledScores: rolled, rolledAssigned: {} }));
    }
    function assignRolledIndex(a: AbilityName, idx: number) {
      setData(prev => {
        const newAssign = { ...prev.rolledAssigned };
        // Swap se già usato
        const existing = Object.entries(newAssign).find(([, i]) => i === idx);
        if (existing) delete newAssign[existing[0] as AbilityName];
        newAssign[a] = idx;
        return { ...prev, rolledAssigned: newAssign };
      });
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Caratteristiche</h2>
          <p className="text-sm text-white/50 mt-1">I sei punteggi fondamentali del personaggio. Scegli il metodo di generazione.</p>
        </div>

        {/* Method selector */}
        <div className="flex gap-2">
          {(["standard_array", "point_buy", "roll_4d6"] as const).map(m => (
            <button key={m} onClick={() => {
              update("abilityMethod", m);
              setData(prev => ({ ...prev, assignedIndices: {}, baseScores: {}, rolledScores: [], rolledAssigned: {} }));
            }}
              className={`rounded-xl border px-3 py-2 text-xs transition flex-1 ${data.abilityMethod === m ? "border-veil-gold/50 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/30 text-white/50 hover:border-white/[0.12]"}`}>
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Standard Array */}
        {data.abilityMethod === "standard_array" && (
          <div className="space-y-2">
            <p className="text-[11px] text-white/35">Assegna ciascuno dei valori [{STANDARD_ARRAY.join(", ")}] a una caratteristica.</p>
            <div className="grid gap-2">
              {ALL_ABILITIES.map(a => {
                const assignedIdx = data.assignedIndices[a];
                return (
                  <div key={a} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                    <span className="w-28 text-sm text-white/60 flex-shrink-0">{ABILITY_LABELS[a]}</span>
                    <div className="flex gap-1 flex-wrap flex-1">
                      {STANDARD_ARRAY.map((v, idx) => {
                        const usedByOther = Object.entries(data.assignedIndices).some(([k, i]) => i === idx && k !== a);
                        const isSelected = assignedIdx === idx;
                        return (
                          <button key={idx} onClick={() => assignStdIndex(a, idx)}
                            className={`rounded-lg px-2.5 py-1 text-xs transition min-w-[32px] ${isSelected ? "bg-veil-gold/20 border border-veil-gold/50 text-veil-gold font-bold" : usedByOther ? "bg-white/[0.03] text-white/20 border border-white/[0.04] cursor-not-allowed line-through" : "bg-white/10 text-white/60 hover:bg-white/20 border border-transparent"}`}
                            disabled={usedByOther}>
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    {assignedIdx !== undefined && (
                      <span className="text-sm text-veil-gold font-bold w-8 text-right">{formatMod(STANDARD_ARRAY[assignedIdx])}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Point Buy */}
        {data.abilityMethod === "point_buy" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/35">Valori da {POINT_BUY_RANGE.min} a {POINT_BUY_RANGE.max}.</p>
              <span className={`text-xs font-medium ${pointBuyLeft < 0 ? "text-red-400" : pointBuyLeft === 0 ? "text-emerald-400" : "text-veil-gold"}`}>
                Punti: {pointBuyUsed}/{POINT_BUY_MAX} ({pointBuyLeft >= 0 ? `${pointBuyLeft} rimasti` : `${Math.abs(pointBuyLeft)} superato!`})
              </span>
            </div>
            <div className="grid gap-2">
              {ALL_ABILITIES.map(a => {
                const v = data.baseScores[a] ?? POINT_BUY_RANGE.min;
                const cost = POINT_BUY_COST[v] || 0;
                return (
                  <div key={a} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                    <span className="w-28 text-sm text-white/60 flex-shrink-0">{ABILITY_LABELS[a]}</span>
                    <button onClick={() => setPointBuyScore(a, v - 1)} disabled={v <= POINT_BUY_RANGE.min}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20 disabled:opacity-30">−</button>
                    <span className="w-8 text-center text-lg font-bold text-white">{v}</span>
                    <button onClick={() => setPointBuyScore(a, v + 1)} disabled={v >= POINT_BUY_RANGE.max || pointBuyLeft <= (POINT_BUY_COST[v + 1] || 0) - cost}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs text-white/60 hover:bg-white/20 disabled:opacity-30">+</button>
                    <span className="text-xs text-veil-gold">{formatMod(v)}</span>
                    <span className="text-[10px] text-white/25 ml-auto">costo {cost}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Roll 4d6 */}
        {data.abilityMethod === "roll_4d6" && (
          <div className="space-y-3">
            <p className="text-[11px] text-white/35">Tira 4d6 per ogni caratteristica, scarta il dado più basso. Poi assegna i valori.</p>
            <button onClick={doRoll}
              className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-2 text-xs text-veil-gold hover:bg-veil-gold/20 w-full">
              {data.rolledScores.length > 0 ? `🎲 Ritira — Valori attuali: [${data.rolledScores.join(", ")}]` : "🎲 Tira i dadi"}
            </button>
            {data.rolledScores.length > 0 && (
              <div className="grid gap-2">
                {ALL_ABILITIES.map(a => {
                  const assignedIdx = data.rolledAssigned[a];
                  return (
                    <div key={a} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2">
                      <span className="w-28 text-sm text-white/60 flex-shrink-0">{ABILITY_LABELS[a]}</span>
                      <div className="flex gap-1 flex-wrap flex-1">
                        {data.rolledScores.map((v, idx) => {
                          const usedByOther = Object.entries(data.rolledAssigned).some(([k, i]) => i === idx && k !== a);
                          const isSelected = assignedIdx === idx;
                          return (
                            <button key={idx} onClick={() => assignRolledIndex(a, idx)}
                              className={`rounded-lg px-2.5 py-1 text-xs transition min-w-[32px] ${isSelected ? "bg-veil-gold/20 border border-veil-gold/50 text-veil-gold font-bold" : usedByOther ? "bg-white/[0.03] text-white/20 border border-white/[0.04] cursor-not-allowed" : "bg-white/10 text-white/60 hover:bg-white/20 border border-transparent"}`}
                              disabled={usedByOther}>
                              {v}
                            </button>
                          );
                        })}
                      </div>
                      {assignedIdx !== undefined && (
                        <span className="text-sm text-veil-gold font-bold w-8 text-right">{formatMod(data.rolledScores[assignedIdx])}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Preview con bonus razziali */}
        {finalScores && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
            <p className="text-xs text-emerald-300/80 font-semibold mb-2">Punteggi Finali (con bonus razziali)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {ALL_ABILITIES.map(a => (
                <div key={a} className="text-center rounded-lg bg-black/20 p-2">
                  <p className="text-white/35 text-[10px]">{ABILITY_SHORT[a]}</p>
                  <p className="text-lg font-bold text-white">{finalScores[a]}</p>
                  <p className="text-veil-gold text-xs">{formatMod(finalScores[a])}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-500/10 grid grid-cols-2 gap-2 text-[10px] text-white/40">
              <span>PF iniziali: <strong className="text-white/60">{hp}</strong></span>
              <span>Iniziativa: <strong className="text-white/60">{formatMod(finalScores.dexterity)}</strong></span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 5: Abilità ────────────────────────────────────
  function renderStep5() {
    if (!cls) return null;
    const autoSkillsSet = new Set<SkillKey>([...bgSkills, ...raceSkills, ...subRaceSkills]);
    const classPicks = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
    const picksLeft = cls.skillPicks - classPicks;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Abilità</h2>
          <p className="text-sm text-white/50 mt-1">
            Il tuo {cls.name} può scegliere <strong className="text-white/70">{cls.skillPicks} abilità</strong> dalla lista della classe.
            Le abilità da background e razza sono aggiunte automaticamente.
          </p>
        </div>

        <div className={`rounded-xl border px-3 py-2 text-xs ${picksLeft < 0 ? "border-red-500/30 bg-red-900/10 text-red-300" : picksLeft === 0 ? "border-emerald-500/30 bg-emerald-900/10 text-emerald-300" : "border-veil-gold/20 bg-veil-gold/5 text-veil-gold/70"}`}>
          {picksLeft > 0 ? `Scegli ancora ${picksLeft} abilità dalla classe` : picksLeft === 0 ? "✓ Abilità di classe complete!" : `⚠ Hai selezionato troppo (${Math.abs(picksLeft)} di troppo)`}
        </div>

        <div className="grid gap-1.5 max-h-72 overflow-y-auto pr-1">
          {ALL_SKILLS.map(skill => {
            const isAutomatic = autoSkillsSet.has(skill);
            const isClassSkill = cls.skillOptions.includes(skill);
            const isSelected = data.selectedSkills.includes(skill) || isAutomatic;
            const canPick = !isSelected && isClassSkill && classPicks < cls.skillPicks;
            const canRemove = isSelected && !isAutomatic;
            const ability = SKILL_ABILITY[skill];
            const mod = finalScores ? getModifier(finalScores[ability]) + (isSelected ? pb : 0) : 0;

            // Sorgente dell'abilità
            const source = isAutomatic
              ? bgSkills.includes(skill) ? "background" : raceSkills.includes(skill) || subRaceSkills.includes(skill) ? "razza" : "auto"
              : isClassSkill ? "classe" : null;

            if (!isAutomatic && !isClassSkill) return null; // non mostrare abilità non disponibili

            return (
              <button key={skill} onClick={() => {
                if (isAutomatic) return; // non modificabile
                if (isSelected) {
                  setData(prev => ({ ...prev, selectedSkills: prev.selectedSkills.filter(s => s !== skill) }));
                } else if (canPick) {
                  setData(prev => ({ ...prev, selectedSkills: [...prev.selectedSkills, skill] }));
                }
              }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition
                  ${isAutomatic ? "border-emerald-500/20 bg-emerald-900/10 cursor-default" :
                  isSelected ? "border-veil-gold/40 bg-veil-gold/[0.06]" :
                  canPick ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" :
                  "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${isSelected ? isAutomatic ? "bg-emerald-600/30 border-emerald-400 text-emerald-300" : "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                  {isSelected ? "✓" : ""}
                </div>
                <div className="flex-1">
                  <span className={`text-sm ${isSelected ? "text-white" : "text-white/60"}`}>{SKILL_LABELS[skill]}</span>
                  <span className="text-[10px] text-white/30 ml-1.5">({ABILITY_SHORT[ability]})</span>
                </div>
                <div className="flex items-center gap-2">
                  {isSelected && <span className="text-xs text-veil-gold/60">{finalScores ? (mod >= 0 ? `+${mod}` : `${mod}`) : ""}</span>}
                  {source && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${source === "background" ? "bg-emerald-900/30 text-emerald-300/60" : source === "razza" ? "bg-indigo-900/30 text-indigo-300/60" : "bg-veil-gold/10 text-veil-gold/50"}`}>
                      {source}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── RENDER STEP 6: Tiri Salvezza ──────────────────────────────
  function renderStep6() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Tiri Salvezza</h2>
          <p className="text-sm text-white/50 mt-1">I tiri salvezza derivano automaticamente dalla classe. Non si possono scegliere al livello 1.</p>
        </div>
        <div className="grid gap-2">
          {ALL_SAVES.map(save => {
            const isProficient = cls?.savingThrows.includes(save) || false;
            const ability = SAVE_ABILITY[save];
            const abilityScore = finalScores?.[ability] ?? 10;
            const modVal = getModifier(abilityScore);
            const total = isProficient ? modVal + pb : modVal;
            return (
              <div key={save} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${isProficient ? "border-veil-gold/20 bg-veil-gold/[0.04]" : "border-white/[0.04] bg-black/20 opacity-50"}`}>
                <div className={`w-6 h-6 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${isProficient ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                  {isProficient ? "✓" : ""}
                </div>
                <span className={`text-sm flex-1 ${isProficient ? "text-white/80" : "text-white/40"}`}>{SAVE_LABELS[save]}</span>
                <span className={`text-sm font-bold ${isProficient ? "text-veil-gold" : "text-white/30"}`}>
                  {total >= 0 ? `+${total}` : `${total}`}
                </span>
                {isProficient && <span className="text-[10px] text-veil-gold/40">mod+PB({pb})</span>}
              </div>
            );
          })}
        </div>
        {cls && (
          <p className="text-[11px] text-white/30 text-center">
            I {cls.name} sono competenti in {cls.savingThrows.map(s => SAVE_LABELS[s as SaveKey]).join(" e ")}.
            Puoi aggiungere competenze extra dalla scheda personaggio dopo la creazione.
          </p>
        )}
      </div>
    );
  }

  // ── RENDER STEP 7: Incantesimi ────────────────────────────────
  function renderStep7() {
    if (!cls?.spellcasting) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl text-veil-gold">Incantesimi</h2>
            <p className="text-sm text-white/50 mt-1">La classe selezionata non usa la magia. Puoi procedere.</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-8 text-center">
            <p className="text-4xl mb-3">⚔️</p>
            <p className="text-white/40">{cls?.name || "Questa classe"} non lancia incantesimi al livello 1.</p>
            <p className="text-[11px] text-white/25 mt-1">Premi "Prossimo" per continuare.</p>
          </div>
        </div>
      );
    }

    const sc = cls.spellcasting;
    const spellAbility = sc.spellcastingAbility as AbilityName;
    const scMod = finalScores ? getModifier(finalScores[spellAbility]) : 0;
    const spellDC = 8 + pb + scMod;
    const spellAtk = pb + scMod;
    const cantripsSelected = data.selectedSpells.filter(s => getSpellsForClass(data.classKey, 0).some(sp => sp.name === s)).length;
    const spellsSelected = data.selectedSpells.filter(s => getSpellsForClass(data.classKey, 1).some(sp => sp.name === s)).length;

    function toggleSpell(name: string, level: 0 | 1) {
      const maxCantrips = sc.cantripsKnown;
      const maxSpells = sc.spellsKnown;
      setData(prev => {
        const sel = prev.selectedSpells;
        if (sel.includes(name)) return { ...prev, selectedSpells: sel.filter(s => s !== name) };
        if (level === 0 && cantripsSelected >= maxCantrips) return prev;
        if (level === 1 && spellsSelected >= maxSpells) return prev;
        return { ...prev, selectedSpells: [...sel, name] };
      });
    }

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Incantesimi</h2>
          <p className="text-sm text-white/50 mt-1">
            Come {cls.name}, usi <strong className="text-white/70">{ABILITY_LABELS[spellAbility]}</strong> per lanciare incantesimi.
            CD: <strong className="text-white/70">{spellDC}</strong> · Bonus attacco: <strong className="text-white/70">+{spellAtk}</strong>
          </p>
        </div>

        {sc.cantripsKnown > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-medium">Trucchetti (a volontà)</p>
              <span className={`text-xs ${cantripsSelected >= sc.cantripsKnown ? "text-emerald-400" : "text-veil-gold/60"}`}>
                {cantripsSelected}/{sc.cantripsKnown}
              </span>
            </div>
            <div className="grid gap-1.5 max-h-44 overflow-y-auto pr-1">
              {getSpellsForClass(data.classKey, 0).map(spell => {
                const isSelected = data.selectedSpells.includes(spell.name);
                const canAdd = cantripsSelected < sc.cantripsKnown;
                return (
                  <button key={spell.name} onClick={() => toggleSpell(spell.name, 0)}
                    className={`text-left rounded-xl border p-2.5 transition ${isSelected ? "border-veil-gold/40 bg-veil-gold/[0.06]" : canAdd ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" : "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${isSelected ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <p className="text-sm text-white font-medium">{spell.name}</p>
                      <span className="text-[10px] text-white/30 ml-auto">{spell.school}</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 ml-6">{spell.castingTime} · {spell.range} · {spell.duration}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 ml-6 line-clamp-1">{spell.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sc.spellsKnown > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-medium">Incantesimi 1° Livello</p>
              <span className={`text-xs ${spellsSelected >= sc.spellsKnown ? "text-emerald-400" : "text-veil-gold/60"}`}>
                {spellsSelected}/{sc.spellsKnown}
              </span>
            </div>
            <div className="grid gap-1.5 max-h-44 overflow-y-auto pr-1">
              {getSpellsForClass(data.classKey, 1).map(spell => {
                const isSelected = data.selectedSpells.includes(spell.name);
                const canAdd = spellsSelected < sc.spellsKnown;
                return (
                  <button key={spell.name} onClick={() => toggleSpell(spell.name, 1)}
                    className={`text-left rounded-xl border p-2.5 transition ${isSelected ? "border-blue-500/40 bg-blue-900/[0.08]" : canAdd ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" : "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${isSelected ? "bg-blue-500/30 border-blue-400 text-blue-300" : "border-white/20"}`}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <p className="text-sm text-white font-medium">{spell.name}</p>
                      <span className="text-[10px] text-blue-300/40 ml-auto">1°</span>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 ml-6">{spell.castingTime} · {spell.range} · {spell.duration}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 ml-6 line-clamp-1">{spell.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sc.spellsKnown === 0 && sc.cantripsKnown > 0 && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
            <p className="text-xs text-blue-300/70">
              Il {cls.name} prepara gli incantesimi invece di conoscerli a memoria. Scegli solo i trucchetti ora —
              gli incantesimi preparabili dipendono dal tuo livello di {ABILITY_LABELS[spellAbility]}.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 8: Equipaggiamento ────────────────────────────
  function renderStep8() {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Equipaggiamento Iniziale</h2>
          <p className="text-sm text-white/50 mt-1">Scegli l'equipaggiamento previsto dalla tua classe. Il tuo background fornisce ulteriori oggetti.</p>
        </div>
        {cls?.equipment.map((eq, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <p className="text-xs text-white/50 mb-2">{eq.label}</p>
            {eq.options.length === 1 ? (
              <p className="text-xs text-white/60">{eq.options[0].map(item => `${item.quantity > 1 ? `${item.quantity}× ` : ""}${item.name}`).join(", ")}</p>
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
        {bg && bg.equipment.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
            <p className="text-xs text-emerald-300/70 font-medium mb-1">Equipaggiamento dal Background: {bg.name}</p>
            <p className="text-xs text-white/50">{bg.equipment.join(", ")}</p>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER STEP 9: Riepilogo ──────────────────────────────────
  function renderStep9() {
    const autoSkills = new Set<SkillKey>([...bgSkills, ...raceSkills, ...subRaceSkills]);
    const allSelectedSkills = [...new Set([...data.selectedSkills, ...autoSkills])];

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Riepilogo</h2>
          <p className="text-sm text-white/50 mt-1">Controlla il tuo personaggio prima di completare la creazione.</p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-3">
            <p className="text-xs text-red-300 font-semibold mb-1">Errori da correggere:</p>
            {errors.map((err, i) => <p key={i} className="text-xs text-red-200/70">• {err}</p>)}
          </div>
        )}

        <div className="rounded-xl border border-veil-gold/10 bg-veil-gold/[0.03] p-4 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-veil-gold/60">Nome</span><p className="text-white/80 font-medium mt-0.5">{data.name}</p></div>
            <div><span className="text-veil-gold/60">Allineamento</span><p className="text-white/80 mt-0.5">{data.alignment}</p></div>
            <div><span className="text-veil-gold/60">Razza</span><p className="text-white/80 mt-0.5">{race?.name}{subRace ? ` (${subRace.name})` : ""}</p></div>
            <div><span className="text-veil-gold/60">Classe</span><p className="text-white/80 mt-0.5">{cls?.name} · Livello 1</p></div>
            <div><span className="text-veil-gold/60">Background</span><p className="text-white/80 mt-0.5">{bg?.name}</p></div>
            <div><span className="text-veil-gold/60">Età</span><p className="text-white/80 mt-0.5">{data.age || "—"}</p></div>
          </div>
          <div className="border-t border-white/[0.06] pt-2">
            <span className="text-veil-gold/60">Caratteristiche</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {ALL_ABILITIES.map(a => finalScores && (
                <span key={a} className="text-white/60">
                  {ABILITY_SHORT[a]}: <strong className="text-white">{finalScores[a]}</strong> <span className="text-veil-gold/60">({formatMod(finalScores[a])})</span>
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-2 grid grid-cols-3 gap-2">
            <div><span className="text-veil-gold/60">PF</span><p className="text-white/80 font-bold">{hp}</p></div>
            <div><span className="text-veil-gold/60">CA</span><p className="text-white/80 font-bold">{10 + (finalScores ? getModifier(finalScores.dexterity) : 0)}</p></div>
            <div><span className="text-veil-gold/60">Velocità</span><p className="text-white/80 font-bold">{race?.speed || 30}m</p></div>
          </div>
          {allSelectedSkills.length > 0 && (
            <div className="border-t border-white/[0.06] pt-2">
              <span className="text-veil-gold/60">Abilità competenti</span>
              <p className="text-white/60 mt-0.5">{allSelectedSkills.map(s => SKILL_LABELS[s]).join(", ")}</p>
            </div>
          )}
          {data.selectedSpells.length > 0 && (
            <div className="border-t border-white/[0.06] pt-2">
              <span className="text-veil-gold/60">Incantesimi/Trucchetti</span>
              <p className="text-white/60 mt-0.5">{data.selectedSpells.join(", ")}</p>
            </div>
          )}
        </div>

        <button onClick={finish} disabled={saving}
          className="w-full rounded-xl bg-veil-gold/20 border border-veil-gold/40 px-6 py-3 text-sm font-semibold text-veil-gold hover:bg-veil-gold/30 disabled:opacity-50 transition">
          {saving ? "⏳ Salvataggio in corso..." : "✨ Completa Creazione"}
        </button>
      </div>
    );
  }

  const stepRenderers = [
    renderStep0, renderStep1, renderStep2, renderStep3, renderStep4,
    renderStep5, renderStep6, renderStep7, renderStep8, renderStep9,
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-veil-gold/20 bg-[#0a0806] shadow-[0_0_80px_rgba(140,92,30,0.15)]">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-6 pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-veil-gold/50">
              Passo {step + 1} di {STEP_LABELS.length} · {STEP_LABELS[step]}
            </p>
            <button onClick={onClose} className="text-xs text-white/30 hover:text-white/60 transition">✕</button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-veil-gold/60" : i === step ? "bg-veil-gold" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {stepRenderers[step]?.()}
        </div>

        {/* Navigation */}
        <div className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 hover:border-white/20 transition ${step === 0 ? "opacity-0 pointer-events-none" : ""}`}>
            ← Indietro
          </button>

          <div className="flex items-center gap-2 text-[10px] text-white/20">
            {data.name && <span className="text-white/30">{data.name}</span>}
            {race && <span>· {race.name}</span>}
            {cls && <span>· {cls.name}</span>}
          </div>

          {step < STEP_LABELS.length - 1 && (
            <button onClick={() => { if (canProceed()) { setErrors([]); setStep(s => s + 1); } else { setErrors(["Completa tutti i campi obbligatori per procedere."]); } }}
              className={`rounded-xl px-5 py-2 text-xs font-semibold transition ${canProceed() ? "bg-veil-gold/20 border border-veil-gold/40 text-veil-gold hover:bg-veil-gold/30" : "bg-white/5 border border-white/10 text-white/30"}`}>
              Prossimo →
            </button>
          )}
          {step === STEP_LABELS.length - 1 && <div />}
        </div>

        {/* Error inline */}
        {errors.length > 0 && step < STEP_LABELS.length - 1 && (
          <div className="px-6 pb-3">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-400">⚠ {e}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
