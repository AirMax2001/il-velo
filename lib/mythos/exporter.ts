export interface ExportResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class ExportSystem {
  static async exportCampaign(sessionId: string): Promise<ExportResult> {
    try {
      const [campaignRes, locationsRes, npcsRes, factionsRes, relicsRes, questsRes, playersRes, stateRes] =
        await Promise.all([
          fetch(`/api/session?id=${sessionId}`),
          fetch(`/api/locations?sessionId=${sessionId}`),
          fetch(`/api/npcs?sessionId=${sessionId}`),
          fetch(`/api/factions?sessionId=${sessionId}`),
          fetch(`/api/relics?sessionId=${sessionId}`),
          fetch(`/api/quests?sessionId=${sessionId}`),
          fetch(`/api/players?sessionId=${sessionId}`),
          fetch(`/api/state?sessionId=${sessionId}`),
        ]);

      const campaign = await campaignRes.json();
      const locations = await locationsRes.json();
      const npcs = await npcsRes.json();
      const factions = await factionsRes.json();
      const relics = await relicsRes.json();
      const quests = await questsRes.json();
      const players = await playersRes.json();
      const state = await stateRes.json();

      const exportData = {
        exported_at: new Date().toISOString(),
        campaign: campaign.session || {},
        locations: locations.locations || [],
        npcs: npcs.items || [],
        factions: factions.items || [],
        relics: relics.items || [],
        quests: quests.items || [],
        players: players.players || [],
        state: state.state || {},
        metrics: {
          totalLocations: (locations.locations || []).length,
          totalNpcs: (npcs.items || []).length,
          totalFactions: (factions.items || []).length,
          totalRelics: (relics.items || []).length,
          totalQuests: (quests.items || []).length,
          totalPlayers: (players.players || []).length,
        },
      };

      return { success: true, data: exportData };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async exportSession(sessionId: string): Promise<ExportResult> {
    try {
      const [scenesRes, combatRes, rulesRes] = await Promise.all([
        fetch(`/api/scenes?sessionId=${sessionId}`),
        fetch(`/api/combat?sessionId=${sessionId}`),
        fetch(`/api/quests?sessionId=${sessionId}`),
      ]);

      const scenes = await scenesRes.json();
      const combat = await combatRes.json();
      const rules = await rulesRes.json();

      return {
        success: true,
        data: {
          exported_at: new Date().toISOString(),
          session_id: sessionId,
          scenes: scenes.items || [],
          combat: combat.items || [],
          quests: rules.items || [],
          metrics: {
            totalScenes: (scenes.items || []).length,
            totalCombat: (combat.items || []).length,
            totalQuests: (rules.items || []).length,
          },
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async exportPlayerStates(sessionId: string): Promise<ExportResult> {
    try {
      const res = await fetch(`/api/players?sessionId=${sessionId}`);
      const data = await res.json();
      const players = (data.players || []).map((p: any) => ({
        id: p.id,
        character_name: p.character_name,
        race: p.race,
        class: p.class,
        level: p.level,
        hp_current: p.hp_current,
        hp_max: p.hp_max,
        xp: p.xp,
        coins: p.coins,
        conditions: p.conditions || [],
        inventory: p.inventory || [],
      }));

      return { success: true, data: { exported_at: new Date().toISOString(), players } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static async exportCombatLog(sessionId: string): Promise<ExportResult> {
    try {
      const res = await fetch(`/api/combat?sessionId=${sessionId}`);
      const data = await res.json();

      const combatLogs = await Promise.all(
        (data.items || []).map(async (c: any) => {
          const combatantsRes = await fetch(`/api/combatants?combatId=${c.id}`);
          const combatants = await combatantsRes.json();
          return {
            id: c.id,
            title: c.title,
            round: c.round,
            turn_index: c.turn_index,
            is_active: c.is_active,
            combatants: combatants.items || [],
          };
        })
      );

      return { success: true, data: { exported_at: new Date().toISOString(), combats: combatLogs } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static downloadJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export async function generateSessionReport(
  sessionId: string,
  dmNotes: string
): Promise<ExportResult> {
  try {
    const [playersRes, scenesRes, combatRes, stateRes] = await Promise.all([
      fetch(`/api/players?sessionId=${sessionId}`),
      fetch(`/api/scenes?sessionId=${sessionId}`),
      fetch(`/api/combat?sessionId=${sessionId}`),
      fetch(`/api/state?sessionId=${sessionId}`),
    ]);

    const players = await playersRes.json();
    const scenes = await scenesRes.json();
    const combat = await combatRes.json();
    const state = await stateRes.json();

    const activeScene = (scenes.items || []).find((s: any) => s.is_active);

    const report = {
      report_generated_at: new Date().toISOString(),
      players: (players.players || []).map((p: any) => ({
        character_name: p.character_name,
        hp_current: p.hp_current,
        hp_max: p.hp_max,
        xp: p.xp,
        coins: p.coins,
        level: p.level,
        conditions: p.conditions || [],
      })),
      current_scene: activeScene
        ? { title: activeScene.title, node_type: activeScene.node_type, choices: activeScene.choices || [] }
        : null,
      combats: (combat.items || []).map((c: any) => ({
        title: c.title,
        round: c.round,
        is_active: c.is_active,
      })),
      state: state.state || {},
      dm_notes: dmNotes || "",
      metrics: {
        total_players: (players.players || []).length,
        total_scenes: (scenes.items || []).length,
        total_combats: (combat.items || []).length,
      },
    };

    return { success: true, data: report };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}