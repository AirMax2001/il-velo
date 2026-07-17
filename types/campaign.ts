export type DmSection =
  | "home"
  | "scenes"
  | "npcs"
  | "locations"
  | "items"
  | "combat"
  | "players"
  | "table"
  | "journal"
  | "campaign"
  | "session"
  | "assets"
  | "settings";

export type PlayerTab = "inventory" | "home" | "sheet" | "diary" | "rules" | "notifications";

export type QuestStatus = "todo" | "active" | "completed" | "failed";

export interface SaveFile {
  campaignId: string;
  currentSceneId: string | null;
  visitedScenes: string[];
  completedCombats: string[];
  npcRelationships: Record<string, string>;
  partyInventory: string[];
  questProgress: Record<string, QuestStatus>;
  playerChoices: string[];
  notes: string[];
  unlockedLore: string[];
  worldVariables: Record<string, string | number | boolean>;
  veilIntegrity: number;
  memoryProgress: number;
  updatedAt: string;
}