import type { CampaignPack, SessionPack } from "./schema";
import { ValidationEngine } from "./validation";

type ImportProgressCallback = (progress: number, message: string) => void;

export interface ImportSummary {
  success: boolean;
  sessionId?: string;
  code?: string;
  report: {
    entitiesCreated: Record<string, number>;
    errors: string[];
    warnings: string[];
  };
}

async function postJSON(url: string, body: any): Promise<{ ok: boolean; error?: string; item?: any }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return { ok: false, error: data.error };
    return { ok: true, item: data.item || data.location || data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function importCampaignPack(
  data: CampaignPack,
  dmPassword: string,
  onProgress?: ImportProgressCallback
): Promise<ImportSummary> {
  const engine = new ValidationEngine();
  const validation = engine.validateCampaignPack(data);
  const report = { entitiesCreated: {} as Record<string, number>, errors: validation.errors.map(e => e.message), warnings: validation.warnings };
  let sessionId: string | undefined;
  let code: string | undefined;

  if (!validation.valid) {
    return { success: false, report };
  }

  onProgress?.(10, "Creazione campagna...");

  const createRes = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create_session", name: data.meta.name, dmPassword }),
  });
  const createData = await createRes.json();
  if (createData.error) {
    report.errors.push(createData.error);
    return { success: false, report };
  }

  sessionId = createData.session.id;
  code = createData.session.code;
  onProgress?.(20, `Campagna creata: ${data.meta.name} (${code})`);

  await saveCampaignPack(sessionId, data);
  report.entitiesCreated.campaign = 1;
  onProgress?.(30, "Importazione location...");

  let importedLocs = 0;
  const locIdMap = new Map<string, string>();
  if (data.locations.length) {
    for (let i = 0; i < data.locations.length; i++) {
      const loc = data.locations[i];
      const resolvedParentId = loc.parent_id ? locIdMap.get(loc.parent_id) || null : null;
      const result = await postJSON("/api/locations", {
        session_id: sessionId,
        name: loc.name,
        parent_id: resolvedParentId,
        location_type: loc.location_type || loc.type || "location",
        ambient_description: loc.description || loc.ambient || "",
        external_id: loc.id,
      });
      if (!result.ok) report.errors.push(`Location "${loc.name}": ${result.error}`);
      else {
        importedLocs++;
        if (result.item?.id) locIdMap.set(loc.id, result.item.id);
      }
      onProgress?.(30 + Math.round((i / data.locations.length) * 10), `Location: ${loc.name}`);
    }
    report.entitiesCreated.locations = importedLocs;
  }

  onProgress?.(80, "Salvataggio mappa location...");
  await fetch("/api/campaign-packs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      data: { ...data, _locationIdMap: Object.fromEntries(locIdMap) },
    }),
  });

  onProgress?.(90, "Salvataggio definitivo...");

  const sessionObj = { id: sessionId, name: data.meta.name, code };
  localStorage.setItem("veil_session", JSON.stringify(sessionObj));

  const totalErrors = report.errors.length;
  onProgress?.(100, totalErrors > 0 ? `Campagna importata con ${totalErrors} errore${totalErrors > 1 ? "i" : ""}` : "Campagna importata con successo!");

  return { success: totalErrors === 0, sessionId, code, report };
}

export async function importSessionPack(
  sessionId: string,
  data: SessionPack,
  onProgress?: ImportProgressCallback
): Promise<ImportSummary> {
  const engine = new ValidationEngine();
  const validation = engine.validateSessionPack(data);
  const report = { entitiesCreated: {} as Record<string, number>, errors: validation.errors.map(e => e.message), warnings: validation.warnings };

  if (!validation.valid) {
    return { success: false, report };
  }

  onProgress?.(10, "Preparazione sessione...");

  const packsRes = await fetch(`/api/session-packs?sessionId=${sessionId}`);
  const packsData = await packsRes.json();
  const sessionNumber = (packsData.items || []).length + 1;

  await postJSON("/api/session-packs", {
    session_id: sessionId,
    title: data.session.title,
    session_number: sessionNumber,
    data: data,
  });

  // Leggi mappa location dal campaign pack
  const campRes = await fetch(`/api/campaign-packs?sessionId=${sessionId}`);
  const campData = await campRes.json();
  const locIdMap = new Map<string, string>(
    Object.entries(campData.pack?.data?._locationIdMap || {})
  );

  // ── Import Factions (prima degli NPC che le referenziano) ──
  onProgress?.(20, "Importazione fazioni...");
  const factionIdMap = new Map<string, string>();
  let importedFactions = 0;
  if (data.factions?.length) {
    for (const f of data.factions) {
      const result = await postJSON("/api/factions", {
        session_id: sessionId,
        name: f.name,
        description: f.description,
        ideology: f.ideology || "",
        external_id: f.id,
        dominant: false,
      });
      if (!result.ok) report.errors.push(`Fazione "${f.name}": ${result.error}`);
      else {
        importedFactions++;
        if (result.item?.id) factionIdMap.set(f.id, result.item.id);
      }
    }
    report.entitiesCreated.factions = importedFactions;
  }

  // ── Import NPCs ──
  onProgress?.(30, "Importazione NPC...");
  let importedNpcs = 0;
  if (data.npcs?.length) {
    for (const npc of data.npcs) {
      const result = await postJSON("/api/npcs", {
        session_id: sessionId,
        name: npc.name,
        role: (npc.titles || []).join(", ") || "",
        description: npc.description || "",
        personality: Array.isArray(npc.personality) ? npc.personality.join(", ") : (npc.personality || null),
        knows: npc.relationship ? JSON.stringify(npc.relationship) : null,
        faction_id: npc.faction_id || null,
        location_id: npc.location_id || null,
      });
      if (!result.ok) report.errors.push(`NPC "${npc.name}": ${result.error}`);
      else importedNpcs++;
    }
    report.entitiesCreated.npcs = importedNpcs;
  }

  // ── Import Items ──
  onProgress?.(40, "Importazione oggetti...");
  let importedItems = 0;
  if (data.items?.length) {
    for (const item of data.items) {
      const rarity = (item.rarity as string) === "uncommon" ? "rare" : (item.rarity || "common");
      const result = await postJSON("/api/inventory", {
        session_id: sessionId,
        name: item.name,
        description: item.description || "",
        rarity,
        item_type: item.type || "other",
      });
      if (!result.ok) report.errors.push(`Item "${item.name}": ${result.error}`);
      else importedItems++;
    }
    report.entitiesCreated.items = importedItems;
  }
  if (data.relics?.length) {
    for (const r of data.relics) {
      const result = await postJSON("/api/inventory", {
        session_id: sessionId,
        name: r.name,
        description: r.description || "",
        rarity: "relic",
        item_type: "other",
      });
      if (!result.ok) report.errors.push(`Reliquia "${r.name}": ${result.error}`);
      else importedItems++;
    }
    report.entitiesCreated.relics = data.relics.length;
  }

  // ── Import Quests ──
  onProgress?.(50, "Importazione quest...");
  let importedQuests = 0;
  if (data.quests?.length) {
    for (const q of data.quests) {
      const result = await postJSON("/api/quests", {
        session_id: sessionId,
        title: q.name,
        description: q.description,
        status: "todo",
        quest_type: q.type || "main",
      });
      if (!result.ok) report.errors.push(`Quest "${q.name}": ${result.error}`);
      else importedQuests++;
    }
    report.entitiesCreated.quests = importedQuests;
  }

  // ── Import Combat ──
  onProgress?.(60, "Importazione combattimenti...");
  const combatIdMap = new Map<string, string>();
  let importedCombats = 0;
  if (data.combat?.length) {
    for (const enc of data.combat) {
      const result = await postJSON("/api/combat", {
        session_id: sessionId,
        title: enc.title,
      });
      if (!result.ok) {
        report.errors.push(`Combattimento "${enc.title}": ${result.error}`);
      } else {
        importedCombats++;
        if (result.item?.id) combatIdMap.set(enc.id, result.item.id);
        if (enc.combatants?.length) {
          for (const c of enc.combatants) {
            await postJSON("/api/combatants", {
              combat_id: result.item?.id || null,
              name: c.name,
              type: c.type,
              hp_max: c.hp_max,
              hp_current: c.hp_current ?? c.hp_max,
              armor_class: c.armor_class,
              initiative: c.initiative,
              is_dead: c.is_dead ?? false,
              sort_order: c.sort_order ?? 0,
            });
          }
        }
      }
    }
    report.entitiesCreated.combat = importedCombats;
  }

  // ── Import Scenes ──
  onProgress?.(70, "Importazione scene...");
  const scenes = data.scenes || [];
  let importedScenes = 0;
  if (scenes.length) {
    for (let i = 0; i < scenes.length; i++) {
      const raw = scenes[i];
      const resolvedCombatId = raw.combat_id ? combatIdMap.get(raw.combat_id) || null : null;
      const resolvedLocationId = raw.location_id ? locIdMap.get(raw.location_id) || null : null;
      const sceneBody: Record<string, any> = {
        session_id: sessionId,
        title: raw.title || `Scena ${i + 1}`,
        content: raw.content || raw.narration || "",
        node_type: getNodeType(raw.type),
        sort_order: raw.sceneOrder ?? i + 1,
        parent_id: null,
        is_active: i === 0,
        environment: "",
        music_url: raw.musicCue || "",
        tablet_scene: "",
        dm_suggestions: raw.narration || "",
        rule_reminder: "",
        choices: raw.choices || [],
        external_id: raw.id,
      };
      if (resolvedCombatId) sceneBody.combat_id = resolvedCombatId;
      if (resolvedLocationId) sceneBody.location_id = resolvedLocationId;

      const result = await postJSON("/api/scenes", sceneBody);
      if (!result.ok) report.errors.push(`Scena "${raw.title}": ${result.error}`);
      else importedScenes++;
      onProgress?.(70 + Math.round((i / scenes.length) * 20), `Scena: ${raw.title}`);
    }
    report.entitiesCreated.scenes = importedScenes;
  }

  onProgress?.(90, "Salvataggio definitivo...");

  const totalErrors = report.errors.length;
  onProgress?.(100, totalErrors > 0 ? `Sessione importata con ${totalErrors} errore${totalErrors > 1 ? "i" : ""}` : "Sessione importata con successo!");

  return { success: totalErrors === 0, sessionId, code: undefined, report };
}

async function saveCampaignPack(sessionId: string, data: CampaignPack) {
  await fetch("/api/campaign-packs", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      name: data.meta.name,
      version: data.meta.version,
      data: data,
    }),
  });
}

function getNodeType(type: string): string {
  const map: Record<string, string> = {
    narration: "scene", dialogue: "scene", choice: "choice",
    combat: "combat", skill_check: "scene", revelation: "scene",
    travel: "scene", rest: "scene", shopping: "scene",
    puzzle: "puzzle", lore_drop: "scene", ambient: "scene",
    transition: "scene", dice_roll: "scene", reward: "scene",
    event: "scene", journal_update: "scene", scene: "scene",
  };
  return map[type] || "scene";
}

export { ValidationEngine };