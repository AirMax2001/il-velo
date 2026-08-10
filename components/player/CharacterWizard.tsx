"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import races from "@/lib/data/races";
import type { RaceData, SubRace } from "@/lib/data/races";
import classes from "@/lib/data/classes";
import { getClassData } from "@/lib/data/classes";
import backgrounds from "@/lib/data/backgrounds";
import { getBackgroundData } from "@/lib/data/backgrounds";
import {
  type AbilityName, type AbilityScores, type SkillKey,
  ALL_ABILITIES, ALL_SKILLS, ALL_SAVES,
  STANDARD_ARRAY, POINT_BUY_COST, POINT_BUY_MAX, POINT_BUY_RANGE,
  getProficiencyBonus, getModifier, calculateHP, calculateACFromLoadout,
  getSpellDC, getSpellAttack,
  applyRaceBonuses,
} from "@/lib/characterEngine";
import type { Player, CharacterData } from "@/lib/types";
import { itemCategory, buildAttackFromWeapon, buildUnarmedAttack } from "@/lib/data/weapons";
import { getSpellsForClass } from "@/lib/data/spells";
import {
  isWizardDone, markWizardDone, loadWizardData, saveWizardData,
  STEP_LABELS, DEFAULT_DATA, type WizardCtx, type WizardData,
} from "./wizard/types";
import { Step0Info } from "./wizard/Step0Info";
import { Step1Race } from "./wizard/Step1Race";
import { Step2Class } from "./wizard/Step2Class";
import { Step3Background } from "./wizard/Step3Background";
import { Step4Abilities } from "./wizard/Step4Abilities";
import { Step5Skills } from "./wizard/Step5Skills";
import { Step6Saves } from "./wizard/Step6Saves";
import { Step7Spells } from "./wizard/Step7Spells";
import { Step8Equipment } from "./wizard/Step8Equipment";
import { Step9Summary } from "./wizard/Step9Summary";

type Props = { player: Player; onComplete: (data: Player) => void; onClose: () => void };

export { isWizardDone, markWizardDone };

export function CharacterWizard({ player, onComplete, onClose }: Props) {
  const saved = loadWizardData(player.id);
  const [step, setStep] = useState<number>(saved?.step ?? 0);
  const [data, setData] = useState<WizardData>(saved?.data ?? { ...DEFAULT_DATA, name: player.character_name || "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => { saveWizardData(player.id, { step, data }); }, [step, data, player.id]);

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

  const calculatedAC = useMemo(() => {
    if (!cls || !finalScores) return 10;
    const chosenItems: string[] = [];
    cls.equipment.forEach((eq, i) => {
      const oi = data.equipmentChoices[i] ?? 0;
      const option = eq.options[oi] || eq.options[0];
      if (option) {
        option.forEach(item => {
          chosenItems.push(item.name.toLowerCase());
        });
      }
    });
    return calculateACFromLoadout(data.classKey, finalScores, chosenItems);
  }, [cls, finalScores, data.equipmentChoices, data.classKey]);

  const update = useCallback(<K extends keyof WizardData>(k: K, v: WizardData[K]) => {
    setData(prev => ({ ...prev, [k]: v }));
    setErrors([]);
  }, []);

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

  const ctx: WizardCtx = {
    data, update, setData,
    race, subRace, cls, bg,
    bgSkills, raceSkills, subRaceSkills,
    finalScores, pb, hp, calculatedAC,
    errors, saving,
    finish: () => finish(),
  };

  const stepComponents = [
    Step0Info, Step1Race, Step2Class, Step3Background, Step4Abilities,
    Step5Skills, Step6Saves, Step7Spells, Step8Equipment, Step9Summary,
  ];
  const Step = stepComponents[step];

  async function finish() {
    setSaving(true);
    try {
      // Raccogli gli oggetti dall'equipaggiamento scelto
      const chosenItems: string[] = [];
      if (cls) {
        cls.equipment.forEach((eq, i) => {
          const oi = data.equipmentChoices[i] ?? 0;
          const option = eq.options[oi] || eq.options[0];
          if (option) {
            option.forEach(item => {
              chosenItems.push(item.name.toLowerCase());
            });
          }
        });
      }

      // Costruisce il character_data completo (i punteggi salvati sono FINALI, bonus razziali inclusi)
      const pb1 = getProficiencyBonus(1);
      const cd: CharacterData = {
        strength: finalScores?.strength,
        dexterity: finalScores?.dexterity,
        constitution: finalScores?.constitution,
        intelligence: finalScores?.intelligence,
        wisdom: finalScores?.wisdom,
        charisma: finalScores?.charisma,
        subRaceKey: data.subRaceKey || undefined,
        sex: data.sex || undefined,
        deity: data.deity || undefined,
        appearance: data.appearance || undefined,
        alignment: data.alignment,
        proficiencyBonus: pb1,
        initiative: finalScores ? getModifier(finalScores.dexterity) : 0,
        speed: race?.speed || 30,
        armorClass: calculatedAC,
        hitDiceTotal: cls ? `1d${cls.hitDie}` : "1d8",
        personalityTraits: bg?.personalityTraits?.[0] || "",
        ideals: bg?.ideals?.[0] || "",
        bonds: bg?.bonds?.[0] || "",
        flaws: bg?.flaws?.[0] || "",
      };

      // Equipaggiamento scelto (con quantità raggruppate) salvato nella scheda
      const eqCounts: Record<string, number> = {};
      chosenItems.forEach(n => { eqCounts[n] = (eqCounts[n] || 0) + 1; });
      cd.equipment = Object.entries(eqCounts).map(([name, quantity]) => ({ name, quantity }));
      cd.equipmentChoices = data.equipmentChoices;

      const strScore = finalScores?.strength ?? 10;
      const dexScore = finalScores?.dexterity ?? 10;
      const attacksList: any[] = [];
      for (const itemName of chosenItems) {
        const atk = buildAttackFromWeapon(itemName, strScore, dexScore, pb1);
        if (atk && !attacksList.some(a => a.name.toLowerCase() === atk.name.toLowerCase())) {
          attacksList.push(atk);
        }
      }
      attacksList.push(buildUnarmedAttack(data.classKey, strScore, dexScore, pb1));
      cd.attacks = attacksList;

      // Incantesimi
      if (cls?.spellcasting) {
        cd.spellcastingAbility = cls.spellcasting.spellcastingAbility;
        cd.spellSaveDC = finalScores
          ? getSpellDC(cls.spellcasting.spellcastingAbility as AbilityName, finalScores as AbilityScores, pb1)
          : 10;
        cd.spellAttackBonus = finalScores
          ? getSpellAttack(cls.spellcasting.spellcastingAbility as AbilityName, finalScores as AbilityScores, pb1)
          : 2;
        cd.cantrips = data.selectedSpells.filter(s => {
          const sp = getSpellsForClass(data.classKey, 0).find(sp => sp.name === s);
          return !!sp;
        });
        cd.spells1 = data.selectedSpells.filter(s => {
          const sp = getSpellsForClass(data.classKey, 1).find(sp => sp.name === s);
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
        try {
          // Salva l'equipaggiamento cercando di non duplicare oggetti già presenti
          const existing = await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`)
            .then(r => r.json()).then(d2 => (d2.items || []).map((i: any) => i.name.toLowerCase()));
          const present = new Set(existing);
          await Promise.all(chosenItems
            .filter(name => !present.has(name.toLowerCase()))
            .map(name =>
              fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  session_id: player.session_id,
                  player_id: player.id,
                  name: name.charAt(0).toUpperCase() + name.slice(1),
                  category: itemCategory(name),
                  item_type: "equipment",
                }),
              })
            ));
        } catch { /* l'inventario non blocca il completamento */ }
        markWizardDone(player.id);
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
          {Step && <Step ctx={ctx} />}
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