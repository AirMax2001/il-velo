export type DndClass = {
  name: string;
  hitDie: string;
  primaryAbility: string[];
  savingThrows: string[]; // exactly 2
  skillPicks: number;
  skillOptions: string[]; // skill keys from fieldGuides
};

export type DndBackground = {
  name: string;
  skillPicks: number;
  skillOptions: string[];
};

export const dndClasses: Record<string, DndClass> = {
  barbarian: {
    name: "Barbaro",
    hitDie: "d12",
    primaryAbility: ["strength"],
    savingThrows: ["stStrength", "stConstitution"],
    skillPicks: 2,
    skillOptions: ["skillAnimalHandling", "skillAthletics", "skillIntimidation", "skillNature", "skillPerception", "skillSurvival"],
  },
  bard: {
    name: "Bardo",
    hitDie: "d8",
    primaryAbility: ["charisma"],
    savingThrows: ["stDexterity", "stCharisma"],
    skillPicks: 3,
    skillOptions: ["skillAthletics", "skillAcrobatics", "skillSleightOfHand", "skillStealth", "skillArcana", "skillHistory", "skillInvestigation", "skillNature", "skillReligion", "skillAnimalHandling", "skillInsight", "skillMedicine", "skillPerception", "skillSurvival", "skillDeception", "skillIntimidation", "skillPerformance", "skillPersuasion"],
  },
  cleric: {
    name: "Chierico",
    hitDie: "d8",
    primaryAbility: ["wisdom"],
    savingThrows: ["stWisdom", "stCharisma"],
    skillPicks: 2,
    skillOptions: ["skillHistory", "skillInsight", "skillMedicine", "skillPersuasion", "skillReligion"],
  },
  druid: {
    name: "Druido",
    hitDie: "d8",
    primaryAbility: ["wisdom"],
    savingThrows: ["stIntelligence", "stWisdom"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillAnimalHandling", "skillInsight", "skillMedicine", "skillNature", "skillPerception", "skillReligion", "skillSurvival"],
  },
  fighter: {
    name: "Guerriero",
    hitDie: "d10",
    primaryAbility: ["strength", "dexterity"],
    savingThrows: ["stStrength", "stConstitution"],
    skillPicks: 2,
    skillOptions: ["skillAcrobatics", "skillAnimalHandling", "skillAthletics", "skillHistory", "skillInsight", "skillIntimidation", "skillPerception", "skillSurvival"],
  },
  monk: {
    name: "Monaco",
    hitDie: "d8",
    primaryAbility: ["dexterity", "wisdom"],
    savingThrows: ["stStrength", "stDexterity"],
    skillPicks: 2,
    skillOptions: ["skillAcrobatics", "skillAthletics", "skillHistory", "skillInsight", "skillReligion", "skillStealth"],
  },
  paladin: {
    name: "Paladino",
    hitDie: "d10",
    primaryAbility: ["strength", "charisma"],
    savingThrows: ["stWisdom", "stCharisma"],
    skillPicks: 2,
    skillOptions: ["skillAthletics", "skillInsight", "skillIntimidation", "skillMedicine", "skillPersuasion", "skillReligion"],
  },
  ranger: {
    name: "Ranger",
    hitDie: "d10",
    primaryAbility: ["dexterity", "wisdom"],
    savingThrows: ["stStrength", "stDexterity"],
    skillPicks: 3,
    skillOptions: ["skillAnimalHandling", "skillAthletics", "skillInsight", "skillInvestigation", "skillNature", "skillPerception", "skillStealth", "skillSurvival"],
  },
  rogue: {
    name: "Ladro",
    hitDie: "d8",
    primaryAbility: ["dexterity"],
    savingThrows: ["stDexterity", "stIntelligence"],
    skillPicks: 4,
    skillOptions: ["skillAcrobatics", "skillAthletics", "skillDeception", "skillInsight", "skillIntimidation", "skillInvestigation", "skillPerception", "skillPerformance", "skillPersuasion", "skillSleightOfHand", "skillStealth"],
  },
  sorcerer: {
    name: "Stregone",
    hitDie: "d6",
    primaryAbility: ["charisma"],
    savingThrows: ["stConstitution", "stCharisma"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillDeception", "skillInsight", "skillIntimidation", "skillPersuasion", "skillReligion"],
  },
  warlock: {
    name: "Warlock",
    hitDie: "d8",
    primaryAbility: ["charisma"],
    savingThrows: ["stWisdom", "stCharisma"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillDeception", "skillHistory", "skillIntimidation", "skillInvestigation", "skillNature", "skillReligion"],
  },
  wizard: {
    name: "Mago",
    hitDie: "d6",
    primaryAbility: ["intelligence"],
    savingThrows: ["stIntelligence", "stWisdom"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillHistory", "skillInsight", "skillInvestigation", "skillMedicine", "skillReligion"],
  },
  artificer: {
    name: "Artificiere",
    hitDie: "d8",
    primaryAbility: ["intelligence"],
    savingThrows: ["stConstitution", "stIntelligence"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillHistory", "skillInvestigation", "skillMedicine", "skillNature", "skillPerception", "skillSleightOfHand"],
  },
};

// Map class names (Italian) to keys
export const classKeyMap: Record<string, string> = Object.fromEntries(
  Object.entries(dndClasses).map(([k, v]) => [v.name.toLowerCase(), k])
);

export function findClassKey(name: string): string | undefined {
  const lower = name.toLowerCase();
  if (dndClasses[lower]) return lower;
  return classKeyMap[lower];
}

export function getClassSavingThrows(className: string): string[] {
  const cls = dndClasses[findClassKey(className) || ""];
  return cls?.savingThrows || [];
}

export function getClassSkillPicks(className: string): { picks: number; options: string[] } {
  const cls = dndClasses[findClassKey(className) || ""];
  return cls ? { picks: cls.skillPicks, options: cls.skillOptions } : { picks: 0, options: [] };
}

// ─── Razze ───────────────────────────────────────────────
export type DndRace = {
  name: string;
  abilityBonuses: Record<string, number>; // ability key → bonus
  speed: number;
  extraSkills?: number; // skill picks bonus
  traits: string[];
};

export const dndRaces: Record<string, DndRace> = {
  umano: {
    name: "Umano",
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    traits: ["Linguaggio extra", "Adattabilità"],
  },
  elfo: {
    name: "Elfo",
    abilityBonuses: { dexterity: 2 },
    speed: 30,
    extraSkills: 0,
    traits: ["Scurovisione 18m", "Ascendenza fatata (vantaggio su fascinazione)", "Trance (4h di riposo)"],
  },
  elfo_oscuro: {
    name: "Elfo Oscuro (Drow)",
    abilityBonuses: { dexterity: 2, charisma: 1 },
    speed: 30,
    extraSkills: 0,
    traits: ["Scurovisione superiore 36m", "Sensibilità alla luce solare (svantaggio in piena luce)", "Magia drow (Luci danzanti, Tenebre, Palla di fuoco)"],
  },
  nano: {
    name: "Nano",
    abilityBonuses: { constitution: 2 },
    speed: 25,
    traits: ["Scurovisione 18m", "Resistenza ai veleni", "Competenza con armature pesanti (sottorazza)"],
  },
  mezzelfo: {
    name: "Mezzelfo",
    abilityBonuses: { charisma: 2 },
    speed: 30,
    extraSkills: 2,
    traits: ["Scurovisione 18m", "Ascendenza fatata (vantaggio su fascinazione)", "Competenza in due abilità extra (qualsiasi)"],
  },
  mezzorco: {
    name: "Mezzorco",
    abilityBonuses: { strength: 2, constitution: 1 },
    speed: 30,
    traits: ["Scurovisione 18m", "Resistenza alla morte (1/riposo lungo)", "Colpi selvaggi (danno extra in critico)"],
  },
  halfling: {
    name: "Halfling",
    abilityBonuses: { dexterity: 2 },
    speed: 25,
    traits: ["Fortunato (ritira 1 naturale)", "Coraggioso (vantaggio su spaventato)", "Passo silenzioso (nascondersi dietro alleati più grandi)"],
  },
  gnomo: {
    name: "Gnomo",
    abilityBonuses: { intelligence: 2 },
    speed: 25,
    traits: ["Scurovisione 18m", "Astuzia gnomesca (vantaggio su INT/SAG/CAR contro magia)"],
  },
  tiefling: {
    name: "Tiefling",
    abilityBonuses: { charisma: 2, intelligence: 1 },
    speed: 30,
    traits: ["Scurovisione 18m", "Resistenza al fuoco", "Magia infernale (Taumaturgia, Mano rovente, Tenebre)"],
  },
  draconide: {
    name: "Draconide",
    abilityBonuses: { strength: 2, charisma: 1 },
    speed: 30,
    traits: ["Resistenza al danno (tipo drago)", "Arma sputata (danno area)", "Scurovisione 18m"],
  },
  fata: {
    name: "Fata",
    abilityBonuses: { charisma: 2, dexterity: 1 },
    speed: 30,
    traits: ["Scurovisione 18m", "Volo 9m", "Taglia Piccola", "Magia fatata (Fascinazione, Amicizia animale)"],
  },
  aasimar: {
    name: "Aasimar",
    abilityBonuses: { charisma: 2 },
    speed: 30,
    traits: ["Scurovisione 18m", "Resistenza ai danni necrotici e radiante", "Manifestazione celestiale"],
  },
};

export const raceKeyMap: Record<string, string> = Object.fromEntries(
  Object.entries(dndRaces).map(([k, v]) => [v.name.toLowerCase(), k])
);

export function findRaceKey(name: string): string | undefined {
  const lower = name.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
  if (dndRaces[lower]) return lower;
  for (const [k, v] of Object.entries(dndRaces)) {
    if (v.name.toLowerCase() === lower) return k;
  }
  for (const [k, v] of Object.entries(dndRaces)) {
    if (lower.includes(k.replace("_", ""))) return k;
  }
  return raceKeyMap[lower];
}

export function getRaceStats(raceName: string): DndRace | null {
  return dndRaces[findRaceKey(raceName) || ""] || null;
}

export const allSkillKeys = [
  "skillAthletics", "skillAcrobatics", "skillSleightOfHand", "skillStealth",
  "skillArcana", "skillHistory", "skillInvestigation", "skillNature", "skillReligion",
  "skillAnimalHandling", "skillInsight", "skillMedicine", "skillPerception", "skillSurvival",
  "skillDeception", "skillIntimidation", "skillPerformance", "skillPersuasion",
];
