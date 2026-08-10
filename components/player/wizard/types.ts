import type { AbilityName, AbilityScores, SkillKey } from "@/lib/characterEngine";
import type { RaceData, SubRace } from "@/lib/data/races";
import type { ClassData } from "@/lib/data/classes";
import type { BackgroundData } from "@/lib/data/backgrounds";
import type { Dispatch, SetStateAction } from "react";

export const WIZARD_KEY = "veil-wizard-done";
export const wizardDoneKey = (playerId?: string) => (playerId ? `veil-wizard-done-${playerId}` : WIZARD_KEY);
export const wizardSaveKey = (playerId: string) => `veil-wizard-data-${playerId}`;

export function isWizardDone(playerId?: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(wizardDoneKey(playerId)) === "true";
}
export function markWizardDone(playerId?: string) {
  localStorage.setItem(wizardDoneKey(playerId), "true");
  if (playerId) localStorage.removeItem(wizardSaveKey(playerId));
  localStorage.removeItem("veil-wizard-data-v2");
  localStorage.removeItem("veil-wizard-data");
}
export function loadWizardData(playerId: string): any {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(wizardSaveKey(playerId)) || "null");
  } catch { return null; }
}
export function saveWizardData(playerId: string, data: any) {
  localStorage.setItem(wizardSaveKey(playerId), JSON.stringify(data));
}

export type WizardData = {
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
  assignedIndices: Partial<Record<AbilityName, number>>;
  baseScores: Partial<AbilityScores>;
  rolledScores: number[];
  rolledAssigned: Partial<Record<AbilityName, number>>;
  selectedSkills: SkillKey[];
  selectedSpells: string[];
  equipmentChoices: Record<number, number>;
};

export const STEP_LABELS = [
  "Info Base", "Razza", "Classe", "Background",
  "Caratteristiche", "Abilità", "Tiri Salvezza",
  "Incantesimi", "Equipaggiamento", "Riepilogo",
];

export const DEFAULT_DATA: WizardData = {
  name: "", raceKey: "", subRaceKey: "", classKey: "",
  backgroundKey: "", alignment: "Neutrale", age: "", sex: "", deity: "", appearance: "",
  abilityMethod: "standard_array",
  assignedIndices: {}, baseScores: {}, rolledScores: [], rolledAssigned: {},
  selectedSkills: [], selectedSpells: [], equipmentChoices: {},
};

export type WizardCtx = {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  setData: Dispatch<SetStateAction<WizardData>>;
  race?: RaceData;
  subRace?: SubRace;
  cls?: ClassData;
  bg?: BackgroundData;
  bgSkills: SkillKey[];
  raceSkills: SkillKey[];
  subRaceSkills: SkillKey[];
  finalScores?: Partial<AbilityScores>;
  pb: number;
  hp: number;
  calculatedAC: number;
  errors: string[];
  saving: boolean;
  finish: () => void;
};