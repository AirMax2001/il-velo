/* ───────────────────────────────────────────────
   MythOS Schema v1.0 — 3-Layer Architecture
   Campaign Pack (immutable) → Session Pack → Save File
   ─────────────────────────────────────────────── */

/* ─── Value Objects ─── */
export interface DiceRoll {
  count: number;
  sides: number;
  modifier?: number;
}

export interface StatBlock {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  hp: number;
  ac: number;
  speed?: number;
  proficiency?: number;
}

export interface Reward {
  xp?: number;
  items?: string[];
  unlocks?: string[];
  veilShift?: number;
}

export interface Coordinate {
  x: number;
  y: number;
  label?: string;
}

/* ── Campaign Pack (Layer 1 — static world) ─── */
export interface NpcCampaign {
  id: string;
  name: string;
  description?: string;
  titles?: string[];
  personality?: string[];
  relationship?: Record<string, any>;
  type: "pc" | "npc" | "villain" | "ally" | "neutral";
  avatar?: string;
  emoji?: string;
  statBlock?: StatBlock;
  location_id?: string;
  faction_id?: string;
  secrets?: string[];
  dialogues?: Record<string, string>;
  tags?: string[];
  dmNotes?: string;
  playerVisible?: boolean;
  voiceNotes?: string;
}

export interface LocationCampaign {
  id: string;
  name: string;
  parent_id?: string;
  location_type?: string;
  type: "city" | "dungeon" | "wilderness" | "tavern" | "shop" | "temple" | "stronghold" | "ruins" | "other";
  emoji?: string;
  description: string;
  coordinates?: Coordinate;
  npc_ids?: string[];
  connected_location_ids?: string[];
  ambient?: string;
  dmNotes?: string;
  playerVisible?: boolean;
  lootTable?: string[];
  hazards?: string[];
}

export interface ItemCampaign {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "key" | "lore" | "tool" | "other";
  rarity: "common" | "rare" | "epic" | "legendary" | "artifact" | "relic";
  description: string;
  effects?: string[];
  value?: number;
  weight?: number;
  requiresAttunement?: boolean;
  charges?: number;
  emoji?: string;
  image?: string;
}

export interface RelicCampaign {
  id: string;
  name: string;
  description: string;
  veilEffect: string;
  memoryUnlock?: string;
  charges: number;
  emoji?: string;
  dmNotes?: string;
}

export interface FactionCampaign {
  id: string;
  name: string;
  type: "order" | "cult" | "guild" | "kingdom" | "clan" | "other";
  description: string;
  leader_id?: string;
  member_ids?: string[];
  reputation?: number;
  ideology?: string;
  dmNotes?: string;
  emoji?: string;
}

export interface WorldStateCampaign {
  id: string;
  name: string;
  description: string;
  currentEra?: string;
  veilStrength: number;
  dominantFaction_id?: string;
  tags?: string[];
  dmNotes?: string;
}

export interface QuestCampaign {
  id: string;
  name: string;
  type: "main" | "side" | "personal" | "faction" | "hidden";
  description: string;
  objectives: { id: string; description: string; location_id?: string }[];
  rewards?: Reward;
  prerequisites?: string[];
  failConditions?: string[];
  emoji?: string;
  dmNotes?: string;
}

export interface CampaignPack {
  meta: {
    name: string;
    version: string;
    description?: string;
    author?: string;
    createdAt: string;
    expectedPlayers?: number;
    tags?: string[];
    campaignId: string;
  };
  npcs: NpcCampaign[];
  locations: LocationCampaign[];
  items: ItemCampaign[];
  relics: RelicCampaign[];
  factions: FactionCampaign[];
  world_state: WorldStateCampaign[];
  quests: QuestCampaign[];
}

/* ── Session Pack (Layer 2 — screenplay-only) ── */
export type BlockType =
  | "narration" | "dialogue" | "choice" | "combat"
  | "skill_check" | "revelation" | "travel" | "rest"
  | "shopping" | "puzzle" | "lore_drop" | "ambient"
  | "transition" | "dice_roll" | "reward" | "event"
  | "journal_update" | "scene";

export interface SessionBlock {
  id: string;
  type: BlockType;
  title?: string;
  content: string;
  narration?: string;
  /* reference IDs — these are NOT the data, only pointers */
  npc_ids?: string[];
  location_id?: string;
  combat_id?: string;
  item_id?: string;
  /* choices */
  choices?: {
    id: string;
    text: string;
    targetBlockId?: string;
    skillCheck?: { stat: string; dc: number };
    condition?: string;
  }[];
  /* metadata */
  diceCheck?: DiceRoll;
  reward?: Reward;
  journalEntry?: string;
  musicCue?: string;
  ambientCue?: string;
  sceneOrder?: number;
  isCombat?: boolean;
  isRevelation?: boolean;
}

export interface SessionPack {
  session: {
    title: string;
    campaignId: string;
    sessionNumber: number;
    date?: string;
    description?: string;
    tags?: string[];
  };
  scenes: SessionBlock[];
}

/* ── Save File (Layer 3 — runtime state) ───── */
export interface SaveFile {
  campaignId: string;
  sessionId: string;
  currentBlockId: string | null;
  visitedBlocks: string[];
  completedCombats: string[];
  npcRelationships: Record<string, string>;
  partyInventory: string[];
  questProgress: Record<string, QuestStatus>;
  playerChoices: Record<string, string>;
  notes: string[];
  unlockedLore: string[];
  worldVariables: Record<string, string | number | boolean>;
  veilIntegrity: number;
  memoryProgress: number;
  updatedAt: string;
}

export type QuestStatus = "todo" | "active" | "completed" | "failed";

/* ── Validation ── */
export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: { campaign?: string; session?: string };
}

/* ── Export ── */
export type ExportType = "campaign" | "session" | "players" | "combat_log" | "session_report";