import type { GameState } from "./gameState";

export type ResolvedEntity = Record<string, any> | null;

export class Resolver {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  updateState(state: GameState) {
    this.state = state;
  }

  resolveNPC(idOrName: string): ResolvedEntity {
    if (this.state.resolvedNpcs[idOrName]) return this.state.resolvedNpcs[idOrName];
    const npc = this.state.session?.npcs?.find(
      n => n.id === idOrName || n.name === idOrName
    );
    if (npc) return npc;
    return null;
  }

  resolveLocation(idOrName: string): ResolvedEntity {
    if (this.state.resolvedLocations[idOrName]) return this.state.resolvedLocations[idOrName];
    const loc = this.state.campaign?.locations?.find(
      l => l.id === idOrName || l.name === idOrName
    );
    if (loc) return loc;
    return null;
  }

  resolveItem(idOrName: string): ResolvedEntity {
    if (this.state.resolvedItems[idOrName]) return this.state.resolvedItems[idOrName];
    const item = this.state.session?.items?.find(
      i => i.id === idOrName || i.name === idOrName
    );
    if (item) return item;
    return null;
  }

  resolveRelic(idOrName: string): ResolvedEntity {
    const relic = this.state.session?.relics?.find(
      r => r.id === idOrName || r.name === idOrName
    );
    return relic || null;
  }

  resolveCombat(idOrName: string): ResolvedEntity {
    if (this.state.resolvedCombats[idOrName]) return this.state.resolvedCombats[idOrName];
    const combat = this.state.session?.combat?.find(
      c => c.id === idOrName || c.title === idOrName
    );
    if (combat) return combat;
    return null;
  }

  resolveQuest(idOrName: string): ResolvedEntity {
    const quest = this.state.session?.quests?.find(
      q => q.id === idOrName || q.name === idOrName
    );
    return quest || null;
  }

  resolveAllNpcs(): any[] {
    return this.state.session?.npcs || [];
  }

  resolveAllLocations(): any[] {
    return this.state.campaign?.locations || [];
  }

  resolveNpcsAtLocation(locationId: string): any[] {
    const location = this.resolveLocation(locationId);
    if (!location?.npc_ids) return [];
    return location.npc_ids
      .map((id: string) => this.resolveNPC(id))
      .filter(Boolean);
  }

  resolveConnectedLocations(locationId: string): any[] {
    const location = this.resolveLocation(locationId);
    if (!location?.connected_location_ids) return [];
    return location.connected_location_ids
      .map((id: string) => this.resolveLocation(id))
      .filter(Boolean);
  }

  resolveFaction(idOrName: string): ResolvedEntity {
    const faction = this.state.session?.factions?.find(
      f => f.id === idOrName || f.name === idOrName
    );
    return faction || null;
  }
}