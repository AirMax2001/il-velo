import type { GameState } from "./gameState";
import { createInitialState, createInitialSave } from "./gameState";
import { Resolver } from "./resolver";

export type GameEvent =
  | "QuestCompleted"
  | "QuestStarted"
  | "CombatStarted"
  | "CombatEnded"
  | "NPCMet"
  | "LocationVisited"
  | "ItemCollected"
  | "SceneCompleted"
  | "SceneChanged"
  | "SaveCreated";

type EventCallback = (event: GameEvent, data?: any) => void;

export class GameEngine {
  state: GameState;
  resolver: Resolver;
  private eventListeners: EventCallback[] = [];
  private saveKey = "mythos-save";
  private saveTimestampKey = "mythos-save-timestamp";

  constructor() {
    this.state = createInitialState();
    this.resolver = new Resolver(this.state);
  }

  onEvent(cb: EventCallback) {
    this.eventListeners.push(cb);
  }

  private emit(event: GameEvent, data?: any) {
    this.eventListeners.forEach(cb => cb(event, data));
  }

  /* ─── Campaign / Session Loading ─── */

  async loadCampaignPack(pack: any): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    try {
      const campaign = pack as import("./schema").CampaignPack;
      this.state = {
        ...this.state,
        campaign,
        save: {
          ...this.state.save,
          campaignId: campaign.meta.campaignId,
          worldVariables: {
            ...this.state.save.worldVariables,
            session: 1,
            chapter: 1,
          },
        },
        isLoading: false,
      };
      this.resolver.updateState(this.state);
      this.emit("SaveCreated", { type: "campaign" });
    } catch (err: any) {
      this.state = { ...this.state, error: err.message, isLoading: false };
    }
  }

  async loadSessionPack(pack: any): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    try {
      const session = pack as import("./schema").SessionPack;
      this.state = {
        ...this.state,
        session,
        save: {
          ...this.state.save,
          sessionId: session.session.campaignId,
        },
        currentScene: session.scenes[0] || null,
        currentSceneIndex: 0,
        visitedScenes: session.scenes.length > 0 ? [session.scenes[0].id] : [],
        isLoading: false,
      };
      if (this.state.currentScene?.location_id) {
        this.state.visitedLocations = [this.state.currentScene.location_id];
      }
      this.resolver.updateState(this.state);
      this.autoSave();
      this.emit("SceneChanged", { scene: this.state.currentScene });
    } catch (err: any) {
      this.state = { ...this.state, error: err.message, isLoading: false };
    }
  }

  async loadSaveFile(save: any): Promise<void> {
    this.state = { ...this.state, save: { ...this.state.save, ...save }, isLoading: false };
    this.resolver.updateState(this.state);
  }

  /* ─── Scene Navigation ─── */

  goToScene(sceneId: string): void {
    if (!this.state.session) return;
    const scene = this.state.session.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const index = this.state.session.scenes.indexOf(scene);
    this.state = {
      ...this.state,
      currentScene: scene,
      currentSceneIndex: index,
      visitedScenes: [...new Set([...this.state.visitedScenes, sceneId])],
      save: {
        ...this.state.save,
        currentBlockId: sceneId,
        visitedBlocks: [...new Set([...this.state.save.visitedBlocks, sceneId])],
        updatedAt: new Date().toISOString(),
      },
    };

    if (scene.location_id) {
      this.state.visitedLocations = [
        ...new Set([...this.state.visitedLocations, scene.location_id]),
      ];
    }

    if (scene.musicCue) {
      this.state.activeMusic = scene.musicCue;
    }

    this.resolver.updateState(this.state);
    this.applySceneEffects(scene);
    this.emit("SceneChanged", { scene, index });
    this.autoSave();
  }

  goToNextScene(): void {
    if (!this.state.session) return;
    const nextIndex = this.state.currentSceneIndex + 1;
    if (nextIndex >= this.state.session.scenes.length) return;
    const next = this.state.session.scenes[nextIndex];
    if (next) this.goToScene(next.id);
  }

  goToPreviousScene(): void {
    if (!this.state.session) return;
    const prevIndex = this.state.currentSceneIndex - 1;
    if (prevIndex < 0) return;
    const prev = this.state.session.scenes[prevIndex];
    if (prev) this.goToScene(prev.id);
  }

  /* ─── Scene Effects (State Modifiers) ─── */

  private applySceneEffects(scene: import("./schema").SessionBlock): void {
    if (!scene.reward) return;
    const reward = scene.reward;

    if (reward.xp) {
      this.state.save.worldVariables.memory_progress =
        (this.state.save.worldVariables.memory_progress as number) + reward.xp;
    }

    if (reward.items) {
      this.state.save.partyInventory = [
        ...new Set([...this.state.save.partyInventory, ...reward.items]),
      ];
      this.emit("ItemCollected", { items: reward.items });
    }

    if (reward.unlocks) {
      reward.unlocks.forEach(questId => {
        this.state.save.questProgress[questId] = "active";
      });
      this.emit("QuestStarted", { quests: reward.unlocks });
    }

    if (reward.veilShift != null) {
      this.state.save.veilIntegrity = Math.max(
        0,
        Math.min(100, this.state.save.veilIntegrity + reward.veilShift)
      );
    }

    if (scene.journalEntry) {
      this.state.save.unlockedLore = [
        ...new Set([...this.state.save.unlockedLore, scene.journalEntry]),
      ];
    }

    this.state.save.updatedAt = new Date().toISOString();
  }

  modifyState(updates: Partial<typeof this.state.save>): void {
    this.state = {
      ...this.state,
      save: { ...this.state.save, ...updates, updatedAt: new Date().toISOString() },
    };
    this.resolver.updateState(this.state);
    this.autoSave();
  }

  /* ─── Combat ─── */

  startCombat(combatId: string): void {
    this.state = {
      ...this.state,
      activeCombatId: combatId,
      activeCombatRound: 1,
      activeCombatTurn: 0,
    };
    this.emit("CombatStarted", { combatId });
    this.autoSave();
  }

  endCombat(): void {
    const combatId = this.state.activeCombatId;
    this.state = {
      ...this.state,
      activeCombatId: null,
      activeCombatRound: 1,
      activeCombatTurn: 0,
      save: {
        ...this.state.save,
        completedCombats: [
          ...new Set([...this.state.save.completedCombats, combatId || ""].filter(Boolean)),
        ],
        updatedAt: new Date().toISOString(),
      },
    };
    this.emit("CombatEnded", { combatId });
    this.autoSave();
  }

  nextTurn(): void {
    this.state = {
      ...this.state,
      activeCombatTurn: this.state.activeCombatTurn + 1,
    };
  }

  nextRound(): void {
    this.state = {
      ...this.state,
      activeCombatRound: this.state.activeCombatRound + 1,
      activeCombatTurn: 0,
    };
  }

  /* ─── Persistent State ─── */

  getSceneProgress(): number {
    if (!this.state.session?.scenes.length) return 0;
    return Math.round(
      (this.state.visitedScenes.length / this.state.session.scenes.length) * 100
    );
  }

  addNote(text: string): void {
    this.state = {
      ...this.state,
      save: {
        ...this.state.save,
        notes: [...this.state.save.notes, text],
        updatedAt: new Date().toISOString(),
      },
    };
    this.autoSave();
  }

  /* ─── Auto Save ─── */

  autoSave(): void {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.state.save));
      localStorage.setItem(this.saveTimestampKey, new Date().toISOString());
    } catch {}
    this.emit("SaveCreated", { timestamp: new Date().toISOString() });
  }

  loadAutoSave(): boolean {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (raw) {
        const save = JSON.parse(raw);
        this.state.save = { ...this.state.save, ...save };
        this.resolver.updateState(this.state);
        return true;
      }
    } catch {}
    return false;
  }

  clearAutoSave(): void {
    localStorage.removeItem(this.saveKey);
    localStorage.removeItem(this.saveTimestampKey);
  }

  get stateSnapshot(): GameState {
    return this.state;
  }
}

