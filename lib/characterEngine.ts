import races, { type RaceData, type SubRace, getRaceData, getSubRaceData } from "@/lib/data/races";
import classes, { type ClassData, getClassData, findClassKey } from "@/lib/data/classes";
import backgrounds, { type BackgroundData, getBackgroundData } from "@/lib/data/backgrounds";
import { type Spell, getSpellsForClass, getSpellByName } from "@/lib/data/spells";

export type AbilityName = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
export const ALL_ABILITIES: AbilityName[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

export const ABILITY_LABELS: Record<AbilityName, string> = {
  strength: "Forza", dexterity: "Destrezza", constitution: "Costituzione",
  intelligence: "Intelligenza", wisdom: "Saggezza", charisma: "Carisma",
};
export const ABILITY_SHORT: Record<AbilityName, string> = {
  strength: "FOR", dexterity: "DES", constitution: "COS",
  intelligence: "INT", wisdom: "SAG", charisma: "CAR",
};

export type AbilityScores = Record<AbilityName, number>;

export type AbilityMethod = "standard_array" | "point_buy" | "roll_4d6";

// ─── Modifier ──────────────────────────────────────────────
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(score: number): string {
  const m = getModifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ─── Proficiency Bonus ─────────────────────────────────────
export function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

// ─── Standard Array ────────────────────────────────────────
export const STANDARD_ARRAY: number[] = [15, 14, 13, 12, 10, 8];

// ─── Point Buy ─────────────────────────────────────────────
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
export const POINT_BUY_MAX = 27;
export const POINT_BUY_RANGE = { min: 8, max: 15 };

export function calculatePointBuyCost(scores: Partial<AbilityScores>): number {
  return Object.values(scores).reduce((sum, v) => sum + (POINT_BUY_COST[v] || 0), 0);
}

export function getPointBuyRemaining(scores: Partial<AbilityScores>): number {
  return POINT_BUY_MAX - calculatePointBuyCost(scores);
}

export function isValidPointBuyValue(v: number): boolean {
  return v >= POINT_BUY_RANGE.min && v <= POINT_BUY_RANGE.max;
}

// ─── Roll 4d6 drop lowest ──────────────────────────────────
export function roll4d6DropLowest(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls[0] + rolls[1] + rolls[2];
}

export function rollAbilityScores(): number[] {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

// ─── Race Application ──────────────────────────────────────
export function getRaceAbilityBonus(raceKey: string, subRaceKey?: string): Partial<AbilityScores> {
  const race = getRaceData(raceKey);
  if (!race) return {};
  const bonuses: Partial<AbilityScores> = { ...race.abilityBonuses };
  if (subRaceKey && race.subRaces) {
    const sub = race.subRaces.find(sr => sr.key === subRaceKey);
    if (sub) {
      for (const [k, v] of Object.entries(sub.abilityBonuses)) {
        bonuses[k as AbilityName] = (bonuses[k as AbilityName] || 0) + v;
      }
    }
  }
  return bonuses;
}

export function applyRaceBonuses(base: Partial<AbilityScores>, raceKey: string, subRaceKey?: string): AbilityScores {
  const full: AbilityScores = { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 };
  for (const a of ALL_ABILITIES) {
    full[a] = base[a] ?? 8;
  }
  const bonuses = getRaceAbilityBonus(raceKey, subRaceKey);
  for (const [k, v] of Object.entries(bonuses)) {
    full[k as AbilityName] += v as number;
  }
  return full;
}

// ─── Skill Data ────────────────────────────────────────────
export type SkillKey =
  | "skillAthletics" | "skillAcrobatics" | "skillSleightOfHand" | "skillStealth"
  | "skillArcana" | "skillHistory" | "skillInvestigation" | "skillNature" | "skillReligion"
  | "skillAnimalHandling" | "skillInsight" | "skillMedicine" | "skillPerception" | "skillSurvival"
  | "skillDeception" | "skillIntimidation" | "skillPerformance" | "skillPersuasion";

export const ALL_SKILLS: SkillKey[] = [
  "skillAthletics", "skillAcrobatics", "skillSleightOfHand", "skillStealth",
  "skillArcana", "skillHistory", "skillInvestigation", "skillNature", "skillReligion",
  "skillAnimalHandling", "skillInsight", "skillMedicine", "skillPerception", "skillSurvival",
  "skillDeception", "skillIntimidation", "skillPerformance", "skillPersuasion",
];

export const SKILL_LABELS: Record<SkillKey, string> = {
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

export const SKILL_ABILITY: Record<SkillKey, AbilityName> = {
  skillAthletics: "strength",
  skillAcrobatics: "dexterity",
  skillSleightOfHand: "dexterity",
  skillStealth: "dexterity",
  skillArcana: "intelligence",
  skillHistory: "intelligence",
  skillInvestigation: "intelligence",
  skillNature: "intelligence",
  skillReligion: "intelligence",
  skillAnimalHandling: "wisdom",
  skillInsight: "wisdom",
  skillMedicine: "wisdom",
  skillPerception: "wisdom",
  skillSurvival: "wisdom",
  skillDeception: "charisma",
  skillIntimidation: "charisma",
  skillPerformance: "charisma",
  skillPersuasion: "charisma",
};

// ─── Saving Throws ─────────────────────────────────────────
export const ALL_SAVES = ["stStrength", "stDexterity", "stConstitution", "stIntelligence", "stWisdom", "stCharisma"] as const;
export type SaveKey = typeof ALL_SAVES[number];

export const SAVE_LABELS: Record<SaveKey, string> = {
  stStrength: "Forza", stDexterity: "Destrezza", stConstitution: "Costituzione",
  stIntelligence: "Intelligenza", stWisdom: "Saggezza", stCharisma: "Carisma",
};

export const SAVE_ABILITY: Record<SaveKey, AbilityName> = {
  stStrength: "strength",
  stDexterity: "dexterity",
  stConstitution: "constitution",
  stIntelligence: "intelligence",
  stWisdom: "wisdom",
  stCharisma: "charisma",
};

// ─── Derived Stats ─────────────────────────────────────────
export function calculateACFromLoadout(classKey: string, scores: AbilityScores, chosenItems: string[]): number {
  const dexMod = getModifier(scores.dexterity);
  const hasShield = chosenItems.some(item => item.includes("scudo"));

  let ac: number;
  if (classKey === "barbarian") {
    ac = 10 + dexMod + getModifier(scores.constitution);
  } else if (classKey === "monk") {
    ac = 10 + dexMod + getModifier(scores.wisdom);
  } else if (chosenItems.some(item => item.includes("maglie") || item.includes("pesante"))) {
    ac = 16;
  } else if (chosenItems.some(item => item.includes("scaglie") || item.includes("media"))) {
    ac = 14 + Math.min(dexMod, 2);
  } else if (chosenItems.some(item => item.includes("cuoio borchiato"))) {
    ac = 12 + dexMod;
  } else if (chosenItems.some(item => item.includes("cuoio") || item.includes("leggera"))) {
    ac = 11 + dexMod;
  } else {
    ac = 10 + dexMod;
  }
  if (hasShield) ac += 2;
  return ac;
}

export function calculateHP(classData: ClassData, conScore: number, level: number): number {
  const conMod = getModifier(conScore);
  const hitDieAvg = Math.ceil(classData.hitDie / 2) + 1;
  const lv1 = classData.hitDie + conMod;
  if (level <= 1) return lv1;
  return lv1 + (level - 1) * (hitDieAvg + conMod);
}

export function calculateInitiative(dexScore: number): number {
  return getModifier(dexScore);
}

// ─── Spell DC / Attack Bonus ───────────────────────────────
export function getSpellDC(spellAbility: AbilityName, scores: AbilityScores, pb: number): number {
  return 8 + pb + getModifier(scores[spellAbility]);
}

export function getSpellAttack(spellAbility: AbilityName, scores: AbilityScores, pb: number): number {
  return pb + getModifier(scores[spellAbility]);
}

// ─── Regole condivise ──────────────────────────────────────
export const ALIGNMENTS = [
  "Legale Buono", "Neutrale Buono", "Caotico Buono",
  "Legale Neutrale", "Neutrale", "Caotico Neutrale",
  "Legale Malvagio", "Neutrale Malvagio", "Caotico Malvagio",
];

export const CONDITIONS_LIST = [
  "Accecato", "Affascinato", "Assordato", "Atterrito", "Avvelenato",
  "Esausto", "Grappling", "Incapacitato", "Inconscio", "Invisibile",
  "Paralizzato", "Pietrificato", "Prono", "Rallentato", "Spaventato",
  "Stordito", "Trattenuto",
];

export const CONDITION_DETAILS: Record<string, string> = {
  Accecato: "Non vedi. Fallisci le prove che richiedono vista. Tiri per colpire con svantaggio, i nemici hanno vantaggio contro di te.",
  Affascinato: "Non puoi attaccare chi ti ha affascinato e lui ha vantaggio alle prove sociali contro di te.",
  Assordato: "Non senti. Fallisci automaticamente le prove che richiedono udito.",
  Atterrito: "Svantaggio a prove e tiri per colpire mentre vedi la fonte della paura. Non puoi avvicinarti volontariamente.",
  Avvelenato: "Svantaggio ai tiri per colpire e alle prove di caratteristica.",
  Esausto: "Livelli di esaurimento (1-6): svantaggio, velocità dimezzata, poi svantaggio a tiri salvezza, PF dimezzati, velocità 0, morte.",
  Grappling: "Velocità 0. Finisce se il grappler è incapacitato o ti allontana.",
  Incapacitato: "Non puoi compiere azioni o reazioni.",
  Inconscio: "Incapacitato, non ti muovi, fallisci TS su FOR e DES, i tiri per colpire contro di te hanno vantaggio, ogni colpo entro 1,5m è critico.",
  Invisibile: "Non puoi essere visto senza magia/sensi speciali. Tiri per colpire contro di te con svantaggio, i tuoi con vantaggio.",
  Paralizzato: "Incapacitato, non ti muovi, fallisci TS FOR/DES, i tiri contro di te hanno vantaggio, ogni colpo entro 1,5m è critico.",
  Pietrificato: "Trasformato in pietra, incapacitato, non invecchi, peso x10, fallisci TS, resistenza a tutti i danni, immune al veleno/malattia.",
  Prono: "Puoi solo strisciare. Hai svantaggio ai tiri per colpire, i nemici entro 1,5m hanno vantaggio, gli altri svantaggio.",
  Rallentato: "Velocità dimezzata, -2 alla CA, svantaggio a TS su DES, non puoi fare reazioni, un'azione o bonus a turno.",
  Spaventato: "Come Atterrito (paura).",
  Stordito: "Incapacitato, non ti muovi, fallisci TS FOR/DES, i tiri contro di te hanno vantaggio.",
  Trattenuto: "Velocità 0, svantaggio ai tiri per colpire e ai TS su DES, i tiri contro di te hanno vantaggio.",
};

export function parseConditions(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    if (raw.trim().startsWith("[")) {
      try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch { /* fallthrough */ }
    }
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
}
export function serializeConditions(list: string[]): string[] {
  return list as unknown as string[];
}

// Incantesimi preparati (PHB): paladino metà livello, gli altri livello + mod.
export function preparedSpellLimit(clsKey: string | null | undefined, level: number, spellAbilityMod: number): number {
  if (clsKey === "paladin") return spellAbilityMod + Math.floor(level / 2);
  return spellAbilityMod + level;
}

// ─── Validation ────────────────────────────────────────────
export type ValidationError = {
  step: string;
  field: string;
  message: string;
};

export function validateCharacter(data: {
  name?: string;
  raceKey?: string;
  subRaceKey?: string;
  classKey?: string;
  backgroundKey?: string;
  level?: number;
  abilityScores?: AbilityScores;
  baseAbilityScores?: Partial<AbilityScores>;
  abilityMethod?: AbilityMethod;
  selectedSkills?: SkillKey[];
  equipmentChoices?: { label: string; selected: number }[];
  selectedSpells?: string[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) errors.push({ step: "info", field: "name", message: "Nome del personaggio obbligatorio." });
  if (!data.raceKey) errors.push({ step: "race", field: "race", message: "Scegli una razza." });
  if (!data.classKey) errors.push({ step: "class", field: "class", message: "Scegli una classe." });
  if (!data.backgroundKey) errors.push({ step: "background", field: "background", message: "Scegli un background." });
  if (!data.level || data.level < 1) errors.push({ step: "class", field: "level", message: "Il livello deve essere almeno 1." });

  const cls = data.classKey ? getClassData(data.classKey) : undefined;
  if (data.abilityScores) {
    for (const a of ALL_ABILITIES) {
      const v = data.abilityScores[a];
      if (v == null || v < 1 || v > 30) {
        errors.push({ step: "abilities", field: a, message: `${a} deve essere tra 1 e 30. Valore attuale: ${v}` });
      }
    }
  }

  if (data.abilityMethod === "point_buy" && data.baseAbilityScores) {
    const cost = calculatePointBuyCost(data.baseAbilityScores);
    if (cost > POINT_BUY_MAX) {
      errors.push({ step: "abilities", field: "point_buy", message: `Punti spesi: ${cost}/${POINT_BUY_MAX}. Hai superato il limite.` });
    }
    for (const a of ALL_ABILITIES) {
      const v = data.baseAbilityScores[a];
      if (v != null && !isValidPointBuyValue(v)) {
        errors.push({ step: "abilities", field: a, message: `${a} deve essere tra 8 e 15 con Point Buy.` });
      }
    }
  }

  if (cls && data.selectedSkills) {
    const classSkillCount = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
    if (classSkillCount > cls.skillPicks) {
      errors.push({ step: "skills", field: "skills", message: `Puoi scegliere al massimo ${cls.skillPicks} abilità dalla classe. Ne hai scelte ${classSkillCount}.` });
    }
    for (const s of data.selectedSkills) {
      if (!ALL_SKILLS.includes(s)) {
        errors.push({ step: "skills", field: s, message: `Abilità non valida: ${s}` });
      }
    }
  }

  const race = data.raceKey ? getRaceData(data.raceKey) : undefined;
  if (cls && cls.spellcasting && data.selectedSpells) {
    const available = getSpellsForClass(data.classKey, 1).map(s => s.name);
    for (const s of data.selectedSpells) {
      if (!available.includes(s)) {
        errors.push({ step: "spells", field: s, message: `Incantesimo non disponibile per ${cls.name}: ${s}` });
      }
    }
    if (data.selectedSpells.length > (cls.spellcasting.spellsKnown || 999)) {
      errors.push({ step: "spells", field: "spells", message: `Puoi conoscere al massimo ${cls.spellcasting.spellsKnown} incantesimi di 1° livello.` });
    }
  }

  return errors;
}

// ─── Character State Builder ──────────────────────────────
export type CharacterState = {
  name: string;
  raceKey: string;
  raceName: string;
  subRaceKey?: string;
  subRaceName?: string;
  classKey: string;
  className: string;
  backgroundKey: string;
  backgroundName: string;
  level: number;
  abilityScores: AbilityScores;
  abilityMethod: AbilityMethod;
  skills: SkillKey[];
  savingThrows: SaveKey[];
  hitDie: number;
  hp: number;
  ac: number;
  initiative: number;
  proficiencyBonus: number;
  speed: number;
  size: string;
  languages: string[];
  darkvision: number | null;
  resistances: string[];
  raceTraits: { name: string; description: string }[];
  classFeatures: { name: string; description: string }[];
  spellcastingAbility: AbilityName | null;
  cantrips: string[];
  spells: string[];
  spellDC: number;
  spellAttack: number;
  equipment: { name: string; quantity: number }[];
  alignment: string;
  background: BackgroundData | null;
};

export function buildCharacterState(params: {
  name: string;
  raceKey: string;
  subRaceKey?: string;
  classKey: string;
  backgroundKey: string;
  level: number;
  baseScores: Partial<AbilityScores>;
  abilityMethod: AbilityMethod;
  selectedSkills: SkillKey[];
  selectedSpells?: string[];
  alignment?: string;
}): CharacterState {
  const race = getRaceData(params.raceKey)!;
  const cls = getClassData(params.classKey)!;
  const bg = getBackgroundData(params.backgroundKey)!;
  const subRace = params.subRaceKey ? getSubRaceData(params.raceKey, params.subRaceKey) : undefined;
  const pb = getProficiencyBonus(params.level);

  const abilityScores = applyRaceBonuses(params.baseScores, params.raceKey, params.subRaceKey);

  const saves: SaveKey[] = cls.savingThrows as SaveKey[];

  const hp = calculateHP(cls, abilityScores.constitution, params.level);

  const ac = 10 + getModifier(abilityScores.dexterity);

  const init = getModifier(abilityScores.dexterity);

  const classSkills = params.selectedSkills.filter(s => cls.skillOptions.includes(s));
  const raceSkills: SkillKey[] = [];
  if (race.proficiencies?.skills) {
    for (const s of race.proficiencies.skills) {
      if (ALL_SKILLS.includes(s as SkillKey)) raceSkills.push(s as SkillKey);
    }
  }
  const allSkills = [...new Set([...classSkills, ...raceSkills, ...params.selectedSkills])];

  const speed = race.speed;

  const languages = [...race.languages];
  if (bg) {
    for (let i = 0; i < bg.languages; i++) languages.push("Linguaggio extra a scelta");
  }

  const raceTraits = [...race.traits];
  if (subRace?.traits) raceTraits.push(...subRace.traits);

  let spellAbility: AbilityName | null = null;
  let cantrips: string[] = [];
  let spells: string[] = [];
  let spellDC = 0;
  let spellAttack = 0;

  if (cls.spellcasting) {
    spellAbility = cls.spellcasting.spellcastingAbility as AbilityName;
    spellDC = getSpellDC(spellAbility, abilityScores, pb);
    spellAttack = getSpellAttack(spellAbility, abilityScores, pb);
    cantrips = (params.selectedSpells || []).filter(s => {
      const spell = getSpellByName(s);
      return spell?.level === 0;
    });
    spells = (params.selectedSpells || []).filter(s => {
      const spell = getSpellByName(s);
      return spell?.level === 1;
    });
  }

  return {
    name: params.name,
    raceKey: params.raceKey,
    raceName: race.name,
    subRaceKey: params.subRaceKey,
    subRaceName: subRace?.name,
    classKey: params.classKey,
    className: cls.name,
    backgroundKey: params.backgroundKey,
    backgroundName: bg.name,
    level: params.level,
    abilityScores,
    abilityMethod: params.abilityMethod,
    skills: allSkills,
    savingThrows: saves,
    hitDie: cls.hitDie,
    hp,
    ac,
    initiative: init,
    proficiencyBonus: pb,
    speed,
    size: race.size,
    languages,
    darkvision: race.darkvision || null,
    resistances: race.resistances || [],
    raceTraits,
    classFeatures: cls.features,
    spellcastingAbility: spellAbility,
    cantrips,
    spells,
    spellDC,
    spellAttack,
    equipment: [],
    alignment: params.alignment || "Neutrale",
    background: bg,
  };
}
