import type { CampaignPack, SessionPack, ValidationResult, ValidationError } from "./schema";
import { REQUIRED_CAMPAIGN_FIELDS, REQUIRED_SESSION_FIELDS } from "./schema";

function getPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && !Array.isArray(acc)) return acc[part];
    if (Array.isArray(acc)) {
      const idx = parseInt(part, 10);
      return isNaN(idx) ? undefined : acc[idx];
    }
    return undefined;
  }, obj);
}

export class ValidationEngine {
  validateCampaignPack(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    for (const field of REQUIRED_CAMPAIGN_FIELDS) {
      const val = getPath(data, field.path);
      if (val === undefined || val === null || val === "") {
        errors.push({ path: field.path, message: `Campo obbligatorio mancante: ${field.label}`, severity: "error" });
      }
    }

    this.checkDuplicateIds(data, errors, "campaign");

    const summary: Record<string, number> = {};
    if (data.locations) summary.locations = data.locations.length;

    return { valid: errors.length === 0, errors, warnings, summary };
  }

  validateSessionPack(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const hasSessionWrapper = data.session && typeof data.session === "object";
    const sessionTitle = hasSessionWrapper ? data.session.title : data.title;
    const campaignId = hasSessionWrapper ? data.session.campaignId : data.campaignId;
    const scenes = data.scenes || [];

    if (!sessionTitle) {
      errors.push({ path: "session.title", message: "Campo obbligatorio mancante: Titolo sessione", severity: "error" });
    }
    if (!campaignId) {
      errors.push({ path: "session.campaignId", message: "Campo obbligatorio mancante: Campaign ID", severity: "error" });
    }
    if (!scenes.length) {
      errors.push({ path: "scenes", message: "Campo obbligatorio mancante: Scene array", severity: "error" });
    }

    if (Array.isArray(scenes)) {
      scenes.forEach((scene: any, i: number) => {
        if (!scene.title) errors.push({ path: `scenes[${i}].title`, message: `Scena #${i + 1}: titolo mancante`, severity: "error" });
        if (!scene.content) errors.push({ path: `scenes[${i}].content`, message: `Scena #${i + 1}: contenuto mancante`, severity: "error" });
      });
    }

    this.checkDuplicateIds(data, errors, "session");

    const summary: Record<string, number> = {};
    if (scenes) summary.scenes = scenes.length;
    if (data.npcs) summary.npcs = data.npcs.length;
    if (data.items) summary.items = data.items.length;
    if (data.relics) summary.relics = data.relics.length;
    if (data.factions) summary.factions = data.factions.length;
    if (data.quests) summary.quests = data.quests.length;
    if (data.combat) summary.combat = data.combat.length;
    const locationRefs = new Set(scenes.filter((s: any) => s.location_id).map((s: any) => s.location_id));
    summary.locations = locationRefs.size;

    return { valid: errors.length === 0, errors, warnings, summary };
  }

  private checkDuplicateIds(data: any, errors: ValidationError[], mode: "campaign" | "session") {
    const collectIds = (arr: any[] | undefined, label: string) => {
      if (!arr) return;
      const seen = new Map<string, number>();
      arr.forEach((item, i) => {
        if (item.id) {
          if (seen.has(item.id)) {
            errors.push({ path: `${label}[${i}].id`, message: `ID duplicato: "${item.id}" (già visto in posizione ${seen.get(item.id)})`, severity: "error" });
          } else {
            seen.set(item.id, i);
          }
        }
      });
    };

    collectIds(data.locations, "locations");

    if (mode === "session") {
      collectIds(data.npcs, "npcs");
      collectIds(data.factions, "factions");
      collectIds(data.relics, "relics");
      collectIds(data.quests, "quests");
      collectIds(data.items, "items");
    }
  }
}