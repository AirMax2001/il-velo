"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { itemCategory, buildAttackFromWeapon, isLightWeapon, isTwoHandedWeapon, findWeapon } from "@/lib/data/weapons";

const CAPACITY = 27;

/* Pesi (kg) e valori (mo) di rifornimento per gli oggetti comuni SRD/PHB:
   usati come default quando l'oggetto non ha peso/valore salvati. */
const ITEM_STATS: Record<string, { kg: number; mo: number }> = {
  "spada lunga": { kg: 1.4, mo: 15 },
  "spadone": { kg: 3, mo: 50 },
  "spada corta": { kg: 1, mo: 10 },
  "scimitarra": { kg: 1.4, mo: 25 },
  "stocco": { kg: 1, mo: 25 },
  "daga": { kg: 0.5, mo: 2 },
  "pugnale": { kg: 0.5, mo: 2 },
  "martello leggero": { kg: 1, mo: 2 },
  "martello da guerra": { kg: 2, mo: 15 },
  "mazza": { kg: 2, mo: 5 },
  "clava": { kg: 1, mo: 0.1 },
  "randello": { kg: 2, mo: 0.2 },
  "falce": { kg: 1, mo: 1 },
  "ascia bipenne": { kg: 3.2, mo: 30 },
  "ascia da battaglia": { kg: 2, mo: 10 },
  "ascia da lancio": { kg: 1, mo: 5 },
  "giavellotto": { kg: 0.5, mo: 0.5 },
  "lancia": { kg: 1.4, mo: 1 },
  "arco lungo": { kg: 1, mo: 50 },
  "arco corto": { kg: 1, mo: 25 },
  "balestra leggera": { kg: 2.5, mo: 25 },
  "balestra a mano": { kg: 1.4, mo: 75 },
  "fionda": { kg: 0.1, mo: 0.1 },
  "dardi": { kg: 0.8, mo: 1 },
  "frecce": { kg: 0.5, mo: 1 },
  "quadrelli": { kg: 0.8, mo: 1 },
  "scudo": { kg: 3, mo: 10 },
  "armatura a maglie": { kg: 22, mo: 75 },
  "armatura di scaglie": { kg: 22.7, mo: 50 },
  "armatura di cuoio": { kg: 5, mo: 10 },
  "cuoio borchiato": { kg: 6.4, mo: 45 },
  "gambeson": { kg: 4, mo: 5 },
  "armatura completa": { kg: 32.5, mo: 1500 },
  "simbolo sacro": { kg: 0.5, mo: 5 },
  "zaino da sacerdote": { kg: 2.3, mo: 5 },
  "zaino da esploratore": { kg: 4.5, mo: 10 },
  "zaino da scassinatore": { kg: 4.5, mo: 16 },
  "zaino da dungeon": { kg: 5.9, mo: 12 },
  "zaino da studioso": { kg: 4.5, mo: 12 },
  "zaino da viaggiatore": { kg: 5.4, mo: 12 },
  "fiaschetta d'acqua": { kg: 2, mo: 0.2 },
  "razioni da viaggio": { kg: 1, mo: 0.5 },
  "fune di canapa": { kg: 5, mo: 1 },
  "corda": { kg: 5, mo: 1 },
  "torcia": { kg: 0.5, mo: 0.01 },
  "candela": { kg: 0.1, mo: 0.01 },
  "pentola di ferro": { kg: 4.5, mo: 2 },
  "sacco a pelo": { kg: 3.5, mo: 1 },
  "boccetta d'inchiostro": { kg: 0.1, mo: 10 },
  "coltello da carta": { kg: 0.5, mo: 2 },
  "strumenti da artigiano": { kg: 3, mo: 5 },
  "strumento musicale": { kg: 1.5, mo: 5 },
  "strumenti da gioco": { kg: 0.5, mo: 1 },
  "kit da erborista": { kg: 1.5, mo: 5 },
  "piede di porco": { kg: 2.5, mo: 2 },
  "coperta": { kg: 1.5, mo: 0.5 },
  "catena": { kg: 5, mo: 5 },
  "borsa": { kg: 0.3, mo: 0.2 },
  "borraccia": { kg: 2.3, mo: 0.2 },
  "faretra": { kg: 0.5, mo: 1 },
  "lanterna": { kg: 0.5, mo: 5 },
  "olio": { kg: 0.5, mo: 0.1 },
  "pergamena": { kg: 0, mo: 0.1 },
  "bastone": { kg: 2, mo: 0.2 },
  "vestiti comuni": { kg: 1.5, mo: 0.5 },
  "vestiti da viaggio": { kg: 2, mo: 2 },
  "vestiti pregiati": { kg: 3, mo: 15 },
  "vestiti scuri comuni": { kg: 1.5, mo: 0.5 },
  "trappola da caccia": { kg: 12.5, mo: 5 },
  "canna da pesca": { kg: 2, mo: 1 },
  "specchietto": { kg: 0.1, mo: 5 },
  "uniforme": { kg: 2, mo: 1 },
  "emblema di grado": { kg: 0.1, mo: 5 },
  "carte della città": { kg: 0.1, mo: 0.1 },
  "cibo per topi": { kg: 0.5, mo: 0.1 },
  "costume": { kg: 2, mo: 5 },
  "profumo": { kg: 0.1, mo: 5 },
  "diario": { kg: 0.5, mo: 1 },
  "lettera di presentazione della gilda": { kg: 0.1, mo: 1 },
  "bastoncini d'incenso": { kg: 0.1, mo: 0.1 },
  "paramenti": { kg: 1, mo: 5 },
  "sigillo nobiliare": { kg: 0.1, mo: 5 },
  "documenti genealogici": { kg: 0.2, mo: 5 },
  "pala": { kg: 2.7, mo: 2 },
  "trofeo animale": { kg: 1, mo: 5 },
  "trofeo marino": { kg: 1, mo: 5 },
  "pettine": { kg: 0.1, mo: 0.1 },
};

const RARITY: Record<string, { label: string; border: string; text: string; bg: string }> = {
  common:    { label: "Comune", border: "border-gray-500/30", text: "text-gray-300", bg: "bg-gray-900/30" },
  rare:      { label: "Raro", border: "border-emerald-500/40", text: "text-emerald-300", bg: "bg-emerald-900/30" },
  epic:      { label: "Epico", border: "border-violet-500/40", text: "text-violet-300", bg: "bg-violet-900/30" },
  legendary: { label: "Leggendario", border: "border-yellow-500/40", text: "text-yellow-300", bg: "bg-yellow-900/30" },
  artifact:  { label: "Manufatto", border: "border-red-500/40", text: "text-red-300", bg: "bg-red-900/30" },
  relic:     { label: "Reliquia", border: "border-blue-500/40", text: "text-blue-300", bg: "bg-blue-900/30" },
};

function itemStats(name: string) {
  const lower = name.toLowerCase();
  const key = Object.keys(ITEM_STATS).find(k => lower.includes(k));
  return key ? ITEM_STATS[key] : { kg: 1, mo: 0 };
}

function itemEmoji(it: any) {
  const n = (it.name || "").toLowerCase();
  if (it.item_type === "weapon" || it.category === "weapon") return "⚔️";
  if (it.item_type === "armor" || it.category === "armor" || it.category === "shield") return "🛡️";
  if (it.category === "potion" || n.includes("pozione") || n.includes("fiaschetta")) return "🧪";
  if (n.includes("razione") || n.includes("cibo")) return "🍖";
  if (it.item_type === "key" || n.includes("chiave")) return "🔑";
  if (it.item_type === "lore" || n.includes("pergamena") || n.includes("libro") || n.includes("lettera") || n.includes("diario")) return "📜";
  if (it.item_type === "tool" || n.includes("strumenti") || n.includes("kit") || n.includes("attrezzi")) return "⚒️";
  if (it.rarity === "relic") return "◈";
  return "📦";
}

function fmtNum(n: any, suffix = "") {
  const v = Number(n);
  if (isNaN(v)) return "—";
  const s = Number.isInteger(v) ? String(v) : v < 10 ? v.toFixed(1) : v.toFixed(1).replace(/\.0$/, "");
  return `${s}${suffix}`;
}

const CAT_LABEL: Record<string, string> = {
  weapon: "arma", armor: "armatura", shield: "scudo", gear: "oggetto",
  general: "oggetto", potion: "pozione", tool: "attrezzo", quest: "missione",
  consumable: "consumabile", key: "chiave", lore: "documento", other: "oggetto",
};

export function MinecraftInventory({ player, cd, level, pb, onAddAttack, save, updCd }: {
  player: Player;
  cd: CharacterData;
  level: number;
  pb: number;
  onAddAttack: (attack: { name: string; bonus: string; damage: string; type: string }) => void;
  save: (fields: Record<string, any>) => void;
  updCd: (key: string, value: any) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const seedingRef = useRef(false);

  const totalWeight = items.reduce((s, i) => s + (Number(i.weight) || 0) * (Number(i.quantity) || 1), 0);
  const maxWeight = (Number(cd.strength) || 10) * 7.5;
  const full = items.length >= CAPACITY;
  const weightPct = maxWeight > 0 ? totalWeight / maxWeight : 0;

  const loadItems = useCallback(async () => {
    if (!player.session_id || !player.id) return;
    const d = await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`).then(r => r.json());
    setItems((d.items || []).filter((i: any) => !i.hidden));
    setLoading(false);
  }, [player.session_id, player.id]);

  /* Seeding una-tantum: porta l'equipaggiamento iniziale (wizard o default di classe)
     dentro la griglia come oggetti reali. */
  useEffect(() => {
    let cancelled = false;
    loadItems().then(async () => {
      if (cancelled || cd.inventorySeeded || seedingRef.current) return;
      seedingRef.current = true;
      try {
        let fresh = (await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`).then(r => r.json())).items || [];
        fresh = fresh.filter((i: any) => !i.hidden);
        if (fresh.length === 0) {
          const source = (() => {
            if (cd.equipmentChoices && Object.keys(cd.equipmentChoices).length > 0) {
              const clsKey = findClassKey(player.class || "");
              const data = clsKey ? getClassData(clsKey) : null;
              if (data) {
                return data.equipment.flatMap((eq, i) => {
                  const oi = cd.equipmentChoices?.[i] ?? 0;
                  return (eq.options[oi] || eq.options[0] || []).map(o => ({ name: o.name.toLowerCase(), quantity: o.quantity ?? 1 }));
                });
              }
            }
            if (cd.equipment && cd.equipment.length > 0) return cd.equipment;
            const clsKey = findClassKey(player.class || "");
            const data = clsKey ? getClassData(clsKey) : null;
            if (!data) return [] as { name: string; quantity: number }[];
            return data.equipment.flatMap(eq =>
              (eq.options[0] || []).map(o => ({ name: o.name.toLowerCase(), quantity: o.quantity ?? 1 })));
          })();
          const existing = new Set(fresh.map((i: any) => i.name.toLowerCase()));
          for (const e of source) {
            if (existing.has(e.name.toLowerCase())) continue;
            existing.add(e.name.toLowerCase());
            const cat = itemCategory(e.name);
            const stats = itemStats(e.name);
            await fetch("/api/inventory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: player.session_id,
                player_id: player.id,
                name: e.name,
                quantity: e.quantity || 1,
                weight: stats.kg,
                value: stats.mo,
                rarity: "common",
                category: cat,
                item_type: cat === "weapon" ? "weapon" : cat === "armor" || cat === "shield" ? "armor" : "other",
              }),
            });
          }
        }
        save({ inventorySeeded: true });
      } finally {
        seedingRef.current = false;
      }
      // Pulizia una-tantum: rimuove gli attacchi duplicati rimasti salvati (vecchi wizard/bottoni)
      const seen = new Set<string>();
      const na = (cd.attacks || []).filter(a => {
        const k = ((a.name || "").trim().toLowerCase());
        if (!k) return true;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (na.length !== (cd.attacks || []).length) {
        updCd("attacks", na);
        save({ attacks: na });
      }
      if (!cancelled) loadItems();
    });
    return () => { cancelled = true; };
  }, [cd.inventorySeeded, player.session_id, player.id, cd.equipment, player.class, save, loadItems]);

  async function removeItem(id: string) {
    if (!window.confirm("Scartare questo oggetto? Verrà rimosso dall'inventario.")) return;
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    setSelected(null);
    loadItems();
  }

  const isWeaponItem = (it: any) => itemCategory(it.name) === "weapon";

  /* Mani occupate: due armi leggere (una per mano) o un'arma qualsiasi
     (le armi a due mani occupano entrambe le mani). */
  const equippedWeapons = items.filter(i => isWeaponItem(i) && i.equipped);
  const handsLabel = (() => {
    if (equippedWeapons.length === 0) return "Mani libere";
    if (equippedWeapons.length === 2 && equippedWeapons.every(w => isLightWeapon(w.name))) {
      return `Combo a due mani: ${equippedWeapons.map(w => w.name).join(" + ")} (attacco bonus off-hand)`;
    }
    return `In mano: ${equippedWeapons.map(w => w.name).join(", ")}${equippedWeapons.some(w => isTwoHandedWeapon(w.name)) ? " (a due mani)" : ""}`;
  })();

  /* Ricostruisce gli attacchi derivati dalle armi equipaggiate:
     - 1 arma → 1 attacco (mod caratteristica + PB)
     - 2 armi leggere → attacco principale + attacco off-hand come azione bonus
       (il danno dell'off-hand NON aggiunge il modificatore di caratteristica) */
  async function syncEquippedAttacks() {
    const d = await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`).then(r => r.json());
    const fresh = (d.items || []).filter((i: any) => !i.hidden);
    const equips = fresh.filter((i: any) => isWeaponItem(i) && i.equipped);
    const str = Number(cd.strength) || 10;
    const dex = Number(cd.dexterity) || 10;

    const desired: { name: string; bonus: string; damage: string; type: string }[] = [];
    if (equips.length === 2 && equips.every((w: any) => isLightWeapon(w.name))) {
      const main = buildAttackFromWeapon(equips[0].name, str, dex, pb);
      const off = buildAttackFromWeapon(equips[1].name, str, dex, pb);
      if (main) desired.push(main);
      if (off) {
        const m = off.damage.match(/^(\d+d\d+)([+-]\d+)$/);
        desired.push({
          ...off,
          name: `${off.name} (Off-Hand)`,
          damage: m && Number(m[2]) >= 0 ? m[1] : off.damage,
        });
      }
    } else if (equips.length === 1) {
      const atk = buildAttackFromWeapon(equips[0].name, str, dex, pb);
      if (atk) desired.push(atk);
    }

    /* Gli attacchi derivati da armi sono rimpiazzati (nome arma o Off-Hand);
       quelli manuali (es. Colpo Senz'Armi) restano. */
    const isWeaponDerived = (a: any) => {
      const base = (a.name || "").replace(/ \(Off-Hand\)$/, "").trim().toLowerCase();
      return !!findWeapon(base);
    };
    const kept = (cd.attacks || []).filter(a => !isWeaponDerived(a));
    const merged = [...kept];
    for (const atk of desired) {
      const lower = atk.name.toLowerCase();
      const idx = merged.findIndex(a => a.name.toLowerCase() === lower);
      if (idx >= 0) merged[idx] = atk; else merged.push(atk);
    }
    updCd("attacks", merged);
    save({ attacks: merged });
  }

  /* Equipaggia/rimuovi arma con le regole PHB:
     - arma a due mani: occupa entrambe le mani → toglie ogni altra arma
     - arma leggera: max 2, una per mano (combat a due armi)
     - arma a una mano: una alla volta */
  async function toggleEquip(it: any) {
    const equipped = !it.equipped;
    const itTwoHanded = isWeaponItem(it) && isTwoHandedWeapon(it.name);
    const itLight = isWeaponItem(it) && isLightWeapon(it.name);
    const others = items.filter(o => o.id !== it.id && isWeaponItem(o) && o.equipped);

    if (equipped) {
      if (itTwoHanded) {
        for (const other of others) {
          await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: other.id, equipped: false }) });
        }
      } else if (itLight) {
        const lightEquipped = others.filter(o => isLightWeapon(o.name));
        if (lightEquipped.length >= 2) {
          return;
        }
        for (const other of others) {
          if (!isLightWeapon(other.name)) {
            await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: other.id, equipped: false }) });
          }
        }
      } else {
        for (const other of others) {
          await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: other.id, equipped: false }) });
        }
      }
      await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: it.id, equipped: true }) });
    } else {
      await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: it.id, equipped: false }) });
    }
    await syncEquippedAttacks();
    setSelected((prev: any) => prev ? { ...prev, equipped } : prev);
    loadItems();
  }

  const weightCls = weightPct > 0.9 ? "bg-red-500" : weightPct > 0.5 ? "bg-yellow-500" : "bg-emerald-500";

  return (
    <div className="space-y-4">
      {/* Griglia inventario */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-veil-gold/80 font-medium">🎒 Zaino</h3>
          <span className={`text-[11px] ${full ? "text-red-300" : "text-white/40"}`}>
            {items.length}/{CAPACITY} {full && "— PIENO!"}
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1.5">
          {Array.from({ length: CAPACITY }, (_, i) => {
            const it = items[i];
            const r = RARITY[it?.rarity] || RARITY.common;
            return (
              <button key={i} onClick={() => it && setSelected(it)}
                title={it?.name}
                className={`relative flex aspect-square items-center justify-center rounded-lg border text-lg transition select-none
                  ${it
                    ? `${r.border} ${r.bg} cursor-pointer hover:scale-105 hover:border-veil-gold/50 ${it.equipped ? "ring-2 ring-veil-gold/70" : ""}`
                    : "border-white/[0.05] bg-white/[0.02] text-white/10"}`}>
                {it ? itemEmoji(it) : "·"}
                {it && it.equipped && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-veil-gold text-[9px] text-black shadow-md w-4 h-4">⚔</span>
                )}
                {it && (Number(it.quantity) > 1) && (
                  <span className="absolute bottom-0 right-0.5 text-[8px] font-bold text-white/70">{it.quantity}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mani occupate */}
        <div className="mt-2 flex items-center gap-2 text-[10px]">
          <span className="text-white/35">✊</span>
          <span className={equippedWeapons.length > 0 ? "text-veil-gold/70" : "text-white/25"}>{handsLabel}</span>
        </div>

        {/* Carico */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-white/35 mb-1">
            <span>Carico</span>
            <span>
              <strong className={weightPct > 0.9 ? "text-red-300" : weightPct > 0.5 ? "text-yellow-300" : "text-emerald-300"}>
                {fmtNum(totalWeight, " kg")}
              </strong>
              <span className="text-white/25"> / {fmtNum(maxWeight, " kg")}</span>
              {weightPct > 0.9 && <span className="ml-1 text-red-300">— sovraccarico!</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${weightCls}`}
              style={{ width: `${Math.min(100, weightPct * 100)}%` }} />
          </div>
          <p className="text-[9px] text-white/20 mt-1">Capienza da Forza × 7,5 kg · Il DM può assegnarti oggetti dalla sua sezione Oggetti</p>
        </div>
      </div>

      {/* Scheda oggetto (sopra la schermata, si chiude cliccando fuori) */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm p-4 pt-14" onClick={() => setSelected(null)}>
          <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-[#10141b] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <span className={`text-3xl ${RARITY[selected.rarity]?.text || "text-white/70"}`}>{itemEmoji(selected)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-lg text-white font-medium truncate">{selected.name}</p>
                <p className={`text-[10px] uppercase tracking-wider ${RARITY[selected.rarity]?.text || "text-white/40"}`}>
                  {RARITY[selected.rarity]?.label || "Oggetto"} · {CAT_LABEL[selected.category] || CAT_LABEL[selected.item_type] || "oggetto"}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-lg leading-none">×</button>
            </div>

            {selected.description && (
              <p className="mt-3 text-sm text-white/50">{selected.description}</p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-white/30">Peso</p>
                <p className="mt-0.5 text-sm text-white/80">{fmtNum(selected.weight, " kg")}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-white/30">Valore</p>
                <p className="mt-0.5 text-sm text-veil-gold/80">{Number(selected.value) > 0 ? fmtNum(selected.value, " mo") : "—"}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/[0.05] p-2">
                <p className="text-[9px] uppercase tracking-[0.15em] text-white/30">Quantità</p>
                <p className="mt-0.5 text-sm text-white/80">× {selected.quantity ?? 1}</p>
              </div>
            </div>

            {itemCategory(selected.name) === "weapon" && (() => {
              const atk = buildAttackFromWeapon(selected.name, Number(cd.strength) || 10, Number(cd.dexterity) || 10, pb);
              const light = isLightWeapon(selected.name);
              const twoHanded = isTwoHandedWeapon(selected.name);
              return (
                <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-900/10 p-3">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {twoHanded && <span className="rounded-full bg-veil-gold/15 px-2 py-0.5 text-[10px] text-veil-gold/80">🙌 A due mani</span>}
                    {light && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">🪶 Leggera (1 mano)</span>}
                    {!twoHanded && !light && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/50">✊ A una mano</span>}
                  </div>
                  <p className="text-xs text-emerald-300/70">
                    {selected.equipped ? "✓ Arma equipaggiata" : "Non è l'arma in mano"}
                    {atk && <span className="text-white/40"> · {atk.bonus} colpire · {atk.damage} · {atk.type}</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => toggleEquip(selected)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${selected.equipped
                        ? "border-white/15 text-white/50 hover:border-red-300/30 hover:text-red-300"
                        : "border-veil-gold/30 bg-veil-gold/10 text-veil-gold hover:bg-veil-gold/20"}`}>
                      {selected.equipped ? "🔓 Togli dall'equipaggiamento" : "⚔️ Equipaggia"}
                    </button>
                    {atk && !selected.equipped && (
                      <button onClick={() => onAddAttack(atk)}
                        className="rounded-lg border border-emerald-400/20 px-3 py-1.5 text-xs text-emerald-300/80 hover:bg-emerald-400/10 transition">
                        ⚡ Usa come attacco
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-white/25">
                    {twoHanded
                      ? "Occupa entrambe le mani: equipaggiandola togli ogni altra arma. Dadi danni più alti."
                      : light
                        ? "Leggera: puoi equipaggiarne una per mano. Con due armi leggere ottieni l'attacco bonus off-hand (senza modificatore al danno)."
                        : "A una mano: una alla volta. L'arma equipaggiata compare nel tab Spell come attacco pronto."}
                  </p>
                </div>
              );
            })()}

            <div className="mt-4 flex gap-2">
              <button onClick={() => removeItem(selected.id)}
                className="rounded-lg border border-red-400/25 px-3 py-2 text-xs text-red-300/70 hover:bg-red-900/20 transition">
                🗑 Scarta
              </button>
              <button onClick={() => setSelected(null)}
                className="ml-auto rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white transition">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}