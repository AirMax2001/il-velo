import type { CampaignPack, SessionPack, SessionBlock, SaveFile, QuestStatus } from "./schema";

export interface GameState {
  campaign: CampaignPack | null;
  session: SessionPack | null;
  save: SaveFile;

  /* Runtime derived */
  currentScene: SessionBlock | null;
  currentSceneIndex: number;
  visitedScenes: string[];
  visitedLocations: string[];
  activeCombatId: string | null;
  activeCombatRound: number;
  activeCombatTurn: number;
  activeMusic: string | null;
  tabletScene: string | null;
  isLoading: boolean;
  error: string | null;

  /* Resolved caches */
  resolvedNpcs: Record<string, any>;
  resolvedLocations: Record<string, any>;
  resolvedItems: Record<string, any>;
  resolvedCombats: Record<string, any>;
}

export function createInitialSave(sessionId: string): SaveFile {
  return {
    campaignId: "",
    sessionId,
    currentBlockId: null,
    visitedBlocks: [],
    completedCombats: [],
    npcRelationships: {},
    partyInventory: [],
    questProgress: {},
    playerChoices: {},
    notes: [],
    unlockedLore: [],
    worldVariables: {
      memory_progress: 0,
      veil_integrity: 100,
      book_progress: 0,
      custodian_alert: 0,
      truth_fragments: 0,
      world_time: "day",
      weather: "clear",
      chapter: 1,
      session: 1,
    },
    veilIntegrity: 100,
    memoryProgress: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function createInitialState(): GameState {
  return {
    campaign: null,
    session: null,
    save: createInitialSave(""),
    currentScene: null,
    currentSceneIndex: -1,
    visitedScenes: [],
    visitedLocations: [],
    activeCombatId: null,
    activeCombatRound: 1,
    activeCombatTurn: 0,
    activeMusic: null,
    tabletScene: null,
    isLoading: false,
    error: null,
    resolvedNpcs: {},
    resolvedLocations: {},
    resolvedItems: {},
    resolvedCombats: {},
  };
}

export function getWorldVariable(state: GameState, key: string): any {
  return state.save.worldVariables[key] ?? null;
}

export function setWorldVariable(
  state: GameState,
  key: string,
  value: string | number | boolean
): GameState {
  return {
    ...state,
    save: {
      ...state.save,
      worldVariables: { ...state.save.worldVariables, [key]: value },
      updatedAt: new Date().toISOString(),
    },
  };
}

export function getQuestStatus(state: GameState, questId: string): QuestStatus {
  return state.save.questProgress[questId] || "todo";
}

export function getRelationship(state: GameState, npcId: string): string {
  return state.save.npcRelationships[npcId] || "neutral";
}
