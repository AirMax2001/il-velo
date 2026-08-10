export type TableEffect = "" | "fog" | "rain" | "storm" | "glitch";

export type TableDisplayConfig = {
  backgroundImageUrl: string;
  sceneImageUrl: string;
  soundUrl: string;
  mapUrl: string;
  combatActive: boolean;
  combatTitle: string;
  currentTurn: string;
  round: number;
  effect: TableEffect;
  intensity: number;
  countdown: number | null;
  title: string;
  subtitle: string;
};

export const DEFAULT_TABLE_DISPLAY: TableDisplayConfig = {
  backgroundImageUrl: "",
  sceneImageUrl: "",
  soundUrl: "",
  mapUrl: "",
  combatActive: false,
  combatTitle: "",
  currentTurn: "",
  round: 1,
  effect: "",
  intensity: 0.5,
  countdown: null,
  title: "",
  subtitle: "",
};

const displayKey = (sessionId: string) => `veil-table-display:${sessionId}`;
const legacyEffectsKey = (sessionId: string) => `veil-table-effects:${sessionId}`;

type LegacyEffects = {
  showFog?: boolean; fogOpacity?: number;
  showRain?: boolean; rainIntensity?: number;
  showStorm?: boolean; stormIntensity?: number;
  glitchIntensity?: number;
  title?: string; subtitle?: string; countdown?: number | null;
};

function parse(raw: string | null): LegacyEffects | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return typeof o === "object" && o ? o : null;
  } catch {
    return null;
  }
}

/* Singleton fonte di verità per la configurazione del tavolo.
   Migra al volo il vecchio formato `veil-table-effects` (showFog/showRain/...) nell'unico schema. */
export function readTableDisplay(sessionId: string): TableDisplayConfig {
  const cfg: TableDisplayConfig = {
    ...DEFAULT_TABLE_DISPLAY,
    ...(parse(localStorage.getItem(displayKey(sessionId))) || {}),
  };
  const legacy = parse(localStorage.getItem(legacyEffectsKey(sessionId)));
  if (legacy && typeof window !== "undefined") {
    const active: [boolean | undefined, TableEffect][] = [
      [legacy.showFog, "fog"],
      [legacy.showRain, "rain"],
      [legacy.showStorm, "storm"],
      [(legacy.glitchIntensity || 0) > 0, "glitch"],
    ];
    const on = active.find(([v]) => v);
    if (on) cfg.effect = on[1];
    const intensities = [legacy.fogOpacity || 0, legacy.rainIntensity || 0, legacy.stormIntensity || 0, legacy.glitchIntensity || 0];
    const maxIntensity = Math.max(...intensities);
    if (maxIntensity > 0) cfg.intensity = Math.min(1, maxIntensity);
    if (legacy.title !== undefined) cfg.title = legacy.title;
    if (legacy.subtitle !== undefined) cfg.subtitle = legacy.subtitle;
    if (legacy.countdown !== undefined && legacy.countdown !== null) cfg.countdown = legacy.countdown;
    localStorage.removeItem(legacyEffectsKey(sessionId));
  }
  return cfg;
}

export function writeTableDisplay(sessionId: string, partial: Partial<TableDisplayConfig>): TableDisplayConfig {
  const merged = { ...readTableDisplay(sessionId), ...partial };
  localStorage.setItem(displayKey(sessionId), JSON.stringify(merged));
  return merged;
}

export function setTableEffect(sessionId: string, effect: TableEffect) {
  writeTableDisplay(sessionId, { effect });
}

export function clearTableDisplay(sessionId: string) {
  localStorage.removeItem(displayKey(sessionId));
  localStorage.removeItem(legacyEffectsKey(sessionId));
}