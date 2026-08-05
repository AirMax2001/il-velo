/* ── Armi e armature di base (PHB, subset) ──────────────────────
   Usata dal wizard (generazione attacchi) e dalla scheda
   (attacchi derivati dall'inventario). */

export type WeaponAbility = "str" | "dex" | "finesse";

export type WeaponInfo = {
  damage: string;
  ability: WeaponAbility;
  type: string;
  weaponType: "melee" | "ranged";
};

export const WEAPON_DB: Record<string, WeaponInfo> = {
  "spadone": { damage: "2d6", ability: "str", type: "Tagliente", weaponType: "melee" },
  "ascia bipenne": { damage: "1d12", ability: "str", type: "Tagliente", weaponType: "melee" },
  "spada lunga": { damage: "1d8", ability: "str", type: "Tagliente", weaponType: "melee" },
  "ascia da battaglia": { damage: "1d8", ability: "str", type: "Tagliente", weaponType: "melee" },
  "ascia da lancio": { damage: "1d6", ability: "str", type: "Tagliente", weaponType: "ranged" },
  "stocco": { damage: "1d8", ability: "finesse", type: "Perforante", weaponType: "melee" },
  "spada corta": { damage: "1d6", ability: "finesse", type: "Perforante", weaponType: "melee" },
  "arco lungo": { damage: "1d8", ability: "dex", type: "Perforante", weaponType: "ranged" },
  "arco corto": { damage: "1d6", ability: "dex", type: "Perforante", weaponType: "ranged" },
  "balestra leggera": { damage: "1d8", ability: "dex", type: "Perforante", weaponType: "ranged" },
  "giavellotto": { damage: "1d6", ability: "str", type: "Perforante", weaponType: "ranged" },
  "daga": { damage: "1d4", ability: "finesse", type: "Perforante", weaponType: "melee" },
  "pugnale": { damage: "1d4", ability: "finesse", type: "Perforante", weaponType: "melee" },
  "mazza": { damage: "1d6", ability: "str", type: "Contundente", weaponType: "melee" },
  "martello leggero": { damage: "1d4", ability: "str", type: "Contundente", weaponType: "melee" },
  "clava": { damage: "1d4", ability: "str", type: "Contundente", weaponType: "melee" },
  "randello": { damage: "1d4", ability: "str", type: "Contundente", weaponType: "melee" },
  "scimitarra": { damage: "1d6", ability: "finesse", type: "Tagliente", weaponType: "melee" },
  "fionda": { damage: "1d4", ability: "dex", type: "Contundente", weaponType: "ranged" },
  "lancia": { damage: "1d6", ability: "str", type: "Perforante", weaponType: "melee" },
  "dardo": { damage: "1d4", ability: "finesse", type: "Perforante", weaponType: "ranged" },
  "falce": { damage: "1d4", ability: "str", type: "Tagliente", weaponType: "melee" },
};

export function findWeapon(name: string): { key: string; info: WeaponInfo } | null {
  const lower = name.toLowerCase();
  const matched = Object.keys(WEAPON_DB).find(key => lower.includes(key));
  if (matched) return { key: matched, info: WEAPON_DB[matched] };
  return null;
}

/* Categorizzazione per l'inventario */
export function itemCategory(name: string): "weapon" | "armor" | "shield" | "gear" {
  const lower = name.toLowerCase();
  if (findWeapon(name)) return "weapon";
  if (lower.includes("scudo")) return "shield";
  if (lower.includes("armatura") || lower.includes("maglie") || lower.includes("scaglie")
    || lower.includes("cuoio") || lower.includes("gambeson")) return "armor";
  return "gear";
}
