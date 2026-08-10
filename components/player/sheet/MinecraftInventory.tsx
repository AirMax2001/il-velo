"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { itemCategory, buildAttackFromWeapon } from "@/lib/data/weapons";

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

export function MinecraftInventory({ player, cd, level, pb, onAddAttack, save }: {
  player: Player;
  cd: CharacterData;
  level: number;
  pb: number;
  onAddAttack: (attack: { name: string; bonus: string; damage: string; type: string }) => void;
  save: (fields: Record<string, any>) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: "", weight: "", quantity: "1", rarity: "common", value: "" });
  const [error, setError] = useState("");
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
          const source = (cd.equipment && cd.equipment.length > 0)
            ? cd.equipment
            : (() => {
                const clsKey = findClassKey(player.class || "");
                const data = clsKey ? getClassData(clsKey) : null;
                if (!data) return [] as { name: string; quantity: number }[];
                return data.equipment.flatMap(eq =>
                  (eq.options[0] || []).map(o => ({ name: o.name.toLowerCase(), quantity: o.quantity ?? 1 })));
              })();
          for (const e of source) {
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
      if (!cancelled) loadItems();
    });
    return () => { cancelled = true; };
  }, [cd.inventorySeeded, player.session_id, player.id, cd.equipment, player.class, save, loadItems]);

  async function addItem() {
    setError("");
    const name = form.name.trim();
    const weight = Number(form.weight);
    if (!name) { setError("Inserisci il nome dell'oggetto."); return; }
    if (!form.weight || isNaN(weight) || weight <= 0) { setError("Inserisci il peso dell'oggetto (kg)."); return; }
    if (full) { setError("Zaino pieno! Scarta qualcosa per fare spazio."); return; }
    const cat = itemCategory(name);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: player.session_id,
        player_id: player.id,
        name,
        quantity: Math.max(1, Number(form.quantity) || 1),
        weight,
        value: form.value ? Number(form.value) : 0,
        rarity: form.rarity,
        category: cat === "gear" ? "general" : cat,
        item_type: cat === "weapon" ? "weapon" : cat === "armor" || cat === "shield" ? "armor" : "other",
      }),
    });
    if (!res.ok) { setError("Errore di salvataggio."); return; }
    setForm({ name: "", weight: "", quantity: "1", rarity: "common", value: "" });
    loadItems();
  }

  async function removeItem(id: string) {
    if (!window.confirm("Scartare questo oggetto? Verrà rimosso dall'inventario.")) return;
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    setSelected(null);
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
                    ? `${r.border} ${r.bg} cursor-pointer hover:scale-105 hover:border-veil-gold/50`
                    : "border-white/[0.05] bg-white/[0.02] text-white/10"}`}>
                {it ? itemEmoji(it) : "·"}
                {it && (Number(it.quantity) > 1) && (
                  <span className="absolute bottom-0 right-0.5 text-[8px] font-bold text-white/70">{it.quantity}</span>
                )}
              </button>
            );
          })}
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

      {/* Aggiungi oggetto */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">➕ Nuovo oggetto trovato</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Nome *</label>
            <input className="veil-input mt-1 w-full text-sm" placeholder="Es. anello d'oro"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Peso (kg) *</label>
            <input type="number" step="0.1" min="0.1" className="veil-input mt-1 w-full text-sm"
              placeholder="0.5" value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Quantità</label>
            <input type="number" min="1" className="veil-input mt-1 w-full text-sm"
              value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Rarità</label>
            <select className="veil-input mt-1 w-full text-sm" value={form.rarity}
              onChange={e => setForm({ ...form, rarity: e.target.value })}>
              {Object.entries(RARITY).filter(([k]) => k !== "relic").map(([k, r]) => (
                <option key={k} value={k}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Valore (mo, opz.)</label>
            <input type="number" min="0" step="0.1" className="veil-input mt-1 w-full text-sm"
              placeholder="0" value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })} />
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        {full && !error && (
          <p className="mt-2 text-xs text-red-300">Borsa piena ({items.length}/{CAPACITY}): non puoi aggiungere altri oggetti.</p>
        )}
        <button onClick={addItem} disabled={full}
          className="mt-3 rounded-lg border border-veil-gold/20 px-3 py-2 text-xs text-veil-gold/70 hover:bg-veil-gold/10 transition disabled:opacity-40">
          + Aggiungi allo zaino
        </button>
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
              if (!atk) return null;
              return (
                <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-900/10 p-3">
                  <p className="text-xs text-emerald-300/70">{atk.bonus} colpire · {atk.damage} · {atk.type}</p>
                  <button onClick={() => onAddAttack(atk)}
                    className="mt-2 rounded-lg border border-emerald-400/20 px-3 py-1.5 text-xs text-emerald-300/80 hover:bg-emerald-400/10 transition">
                    ⚔️ Aggiungi come attacco
                  </button>
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