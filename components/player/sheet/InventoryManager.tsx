"use client";
import { useState, useEffect, useCallback } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { itemCategory, buildAttackFromWeapon } from "@/lib/data/weapons";

export function PlayerInventoryManager({ player, cd, level, pb, onAddAttack }: {
  player: Player;
  cd: CharacterData;
  level: number;
  pb: number;
  onAddAttack: (attack: { name: string; bonus: string; damage: string; type: string }) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    if (!player.session_id || !player.id) return;
    const d = await fetch(`/api/inventory?sessionId=${player.session_id}&playerId=${player.id}`).then(r => r.json());
    setItems(d.items || []);
    setLoading(false);
  }, [player.session_id, player.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function addItem() {
    const name = newItem.trim();
    if (!name) return;
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: player.session_id,
        player_id: player.id,
        name,
        category: itemCategory(name),
        item_type: "equipment",
      }),
    });
    if (res.ok) { setNewItem(""); loadItems(); }
  }

  async function removeItem(id: string) {
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    loadItems();
  }

  function weaponAttack(name: string) {
    return buildAttackFromWeapon(name, Number(cd.strength) || 10, Number(cd.dexterity) || 10, pb);
  }

  const catLabel: Record<string, string> = { weapon: "arma", armor: "armatura", shield: "scudo", gear: "oggetto" };

  /* Equipaggiamento iniziale: salvato nel wizard (cd.equipment) o di classe per i player pre-esistenti */
  const clsEq = (() => {
    const cls = player.class ? findClassKey(player.class) : null;
    const data = cls ? getClassData(cls) : null;
    if (!data) return null;
    return data.equipment.flatMap(eq =>
      (eq.options[0] || []).map(o => ({ name: o.name.toLowerCase(), quantity: 1 }))
    );
  })();
  const initialEquip = (cd.equipment && cd.equipment.length > 0) ? cd.equipment : (clsEq || []);

  return (
    <div className="veil-panel p-4">
      <h3 className="text-sm text-veil-gold/80 font-medium mb-2">🎒 Equipaggiamento Iniziale</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Gli oggetti scelti durante la creazione del personaggio (armi, zaino e contenuto). Sono usati anche per
        generare gli attacchi. Il DM può assegnare ulteriori oggetti qui sotto.
      </p>
      {initialEquip.length === 0 ? (
        <p className="text-xs text-white/30 mb-3">Nessun equipaggiamento iniziale registrato.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {initialEquip.map((e, i) => (
            <span key={`${e.name}-${i}`} className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-white/60">
              {e.quantity > 1 ? `${e.quantity}× ` : ""}{e.name}
            </span>
          ))}
        </div>
      )}

      <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Inventario</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Le armi qui presenti possono generare gli attacchi nella tab Combattimento. Gli oggetti li assegna anche il DM.
      </p>

      <div className="flex gap-2 mb-3">
        <input type="text" className="veil-input flex-1 text-sm" placeholder="Nome oggetto/arma (es. spada lunga)"
          value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addItem(); }} />
        <button onClick={addItem} className="rounded-lg border border-veil-gold/20 px-3 text-xs text-veil-gold/70 hover:bg-veil-gold/10 transition">
          + Aggiungi
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-white/30">Caricamento inventario...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-white/30">Nessun oggetto. Aggiungi le armi e l'equipaggiamento qui sopra.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const atk = itemCategory(item.name) === "weapon" ? weaponAttack(item.name) : null;
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.name}</p>
                  <p className="text-[10px] text-white/25">{catLabel[item.category] || "oggetto"}</p>
                  {atk && (
                    <p className="text-[10px] text-emerald-300/60">
                      {atk.bonus} colpire · {atk.damage} · {atk.type}
                    </p>
                  )}
                </div>
                {atk && (
                  <button onClick={() => onAddAttack(atk)}
                    className="shrink-0 rounded-lg border border-emerald-400/20 px-2 py-1 text-[10px] text-emerald-300/70 hover:bg-emerald-400/10 transition">
                    ⚔️ Aggiungi attacco
                  </button>
                )}
                <button onClick={() => removeItem(item.id)}
                  className="shrink-0 text-red-300/40 hover:text-red-300 text-sm">×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}