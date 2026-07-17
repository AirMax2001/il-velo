import type { GameState } from "./gameState";

export interface SessionReport {
  generatedAt: string;
  campaignName: string;
  sessionTitle: string;
  visitedScenes: number;
  totalScenes: number;
  visitedLocations: string[];
  npcsMet: string[];
  itemsObtained: string[];
  combatSummary: {
    total: number;
    completed: number;
  };
  playerSummary: { total: number };
  playerChoices: Record<string, string>;
  questChanges: Record<string, string>;
  relationshipChanges: Record<string, string>;
  worldVariableChanges: Record<string, string | number | boolean>;
  notes: string[];
  unlockedLore: string[];
  pendingHooks: string[];
  progress: number;
}

export function generateReport(state: GameState): SessionReport {
  const npcsMet = new Set<string>();
  if (state.session?.npcs) {
    state.visitedScenes.forEach(sceneId => {
      const scene = state.session?.scenes.find(s => s.id === sceneId);
      scene?.npc_ids?.forEach(id => {
        const npc = state.session?.npcs.find(n => n.id === id);
        if (npc) npcsMet.add(npc.name);
      });
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    campaignName: state.campaign?.meta.name || "",
    sessionTitle: state.session?.session.title || "",
    visitedScenes: state.visitedScenes.length,
    totalScenes: state.session?.scenes.length || 0,
    visitedLocations: state.visitedLocations.map(id => {
      const loc = state.campaign?.locations.find(l => l.id === id);
      return loc?.name || id;
    }),
    npcsMet: Array.from(npcsMet),
    itemsObtained: state.save.partyInventory,
    playerSummary: {
      total: 0,
    },
    playerChoices: state.save.playerChoices,
    questChanges: Object.fromEntries(
      Object.entries(state.save.questProgress).map(([id, status]) => {
        const quest = state.session?.quests.find(q => q.id === id);
        return [quest?.name || id, status];
      })
    ),
    relationshipChanges: Object.fromEntries(
      Object.entries(state.save.npcRelationships).map(([id, rel]) => {
        const npc = state.session?.npcs.find(n => n.id === id);
        return [npc?.name || id, rel];
      })
    ),
    worldVariableChanges: { ...state.save.worldVariables },
    notes: state.save.notes,
    unlockedLore: state.save.unlockedLore,
    pendingHooks: [],
    progress: state.session?.scenes.length
      ? Math.round((state.visitedScenes.length / state.session.scenes.length) * 100)
      : 0,
    combatSummary: {
      total: state.session?.scenes.filter(s => s.isCombat).length || 0,
      completed: state.save.completedCombats.length,
    },
  };
}

export function downloadReport(report: SessionReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-report-${report.campaignName.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}