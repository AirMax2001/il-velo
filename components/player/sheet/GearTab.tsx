"use client";
import { useState, useEffect } from "react";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { MinecraftInventory } from "./MinecraftInventory";
import { itemCategory } from "@/lib/data/weapons";
import type { CharacterData } from "@/lib/types";
import type { SheetCtx } from "./types";

const COIN_TYPES = [
  { key: "pp", label: "PP", desc: "Platino", color: "text-blue-200" },
  { key: "gp", label: "GP", desc: "Oro", color: "text-veil-gold" },
  { key: "ep", label: "PE", desc: "Electrum", color: "text-emerald-300" },
  { key: "sp", label: "SA", desc: "Argento", color: "text-gray-300" },
  { key: "cp", label: "MC", desc: "Rame", color: "text-orange-300" },
];

const CAPACITY = 27;
const RARITY: Record<string, { label: string }> = {
  common:    { label: "Comune" },
  rare:      { label: "Raro" },
  epic:      { label: "Epico" },
  legendary: { label: "Leggendario" },
};

export function GearTab({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, level, pb, updCd, save, onAddAttack } = ctx;
  const [showAdd, setShowAdd] = useState(false);
  const [itemForm, setItemForm] = useState({ name: "", weight: "", quantity: "1", rarity: "common", value: "" });
  const [error, setError] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const full = items.length >= CAPACITY;

  useEffect(() => {
    if (!form?.session_id || !form?.id) return;
    fetch(`/api/inventory?sessionId=${form.session_id}&playerId=${form.id}`)
      .then(r => r.json())
      .then((d: any) => setItems((d.items || []).filter((i: any) => !i.hidden)));
  }, [form?.session_id, form?.id]);

  async function addItem() {
    setError("");
    const name = itemForm.name.trim();
    const weight = Number(itemForm.weight);
    if (!name) { setError("Inserisci il nome dell'oggetto."); return; }
    if (!itemForm.weight || isNaN(weight) || weight <= 0) { setError("Inserisci il peso dell'oggetto (kg)."); return; }
    if (full) { setError("Zaino pieno! Scarta qualcosa per fare spazio."); return; }
    const cat = itemCategory(name);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: form?.session_id,
        player_id: form?.id,
        name,
        quantity: Math.max(1, Number(itemForm.quantity) || 1),
        weight,
        value: itemForm.value ? Number(itemForm.value) : 0,
        rarity: itemForm.rarity,
        category: cat === "gear" ? "general" : cat,
        item_type: cat === "weapon" ? "weapon" : cat === "armor" || cat === "shield" ? "armor" : "other",
      }),
    });
    if (!res.ok) { setError("Errore di salvataggio."); return; }
    setItemForm({ name: "", weight: "", quantity: "1", rarity: "common", value: "" });
    if (form?.session_id && form?.id) {
      fetch(`/api/inventory?sessionId=${form.session_id}&playerId=${form.id}`)
        .then(r => r.json())
        .then((d: any) => setItems((d.items || []).filter((i: any) => !i.hidden)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Inventario a griglia */}
      <MinecraftInventory player={form || ({} as any)} cd={cd} level={level} pb={pb} onAddAttack={onAddAttack} save={save} updCd={updCd} />

      {/* Monete */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Monete</h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {COIN_TYPES.map(c => (
            <div key={c.key}>
              <p className={`text-[10px] uppercase font-bold mb-1 ${c.color}`}>{c.label}</p>
              <p className="text-[9px] text-white/20 mb-1">{c.desc}</p>
              <input type="number" className="veil-input w-full text-center text-sm font-medium p-1.5" min={0}
                value={(cd as any)[c.key] ?? 0}
                onChange={e => updCd(c.key, Number(e.target.value))}
                onBlur={() => save({ [c.key]: ctx.formRef.current?.character_data?.[c.key as keyof CharacterData] })} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/20 mt-3 text-center">
          1 PP = 10 GP = 50 SA = 100 MC
        </p>
      </div>

      {/* Oggetto trovato — cliccabile con freccia */}
      <div className="veil-panel p-4">
        <button type="button" onClick={() => setShowAdd(o => !o)} className="w-full flex items-center justify-between gap-3 text-left">
          <div className="min-w-0">
            <h3 className="text-sm text-veil-gold/80 font-medium">➕ Nuovo oggetto trovato</h3>
          </div>
          <span className={`text-veil-gold/50 text-xs transition-transform duration-200 ${showAdd ? "rotate-180" : ""}`}>▼</span>
        </button>
        {showAdd && (
          <div className="mt-3 border-t border-white/[0.05] pt-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Nome *</label>
                <input className="veil-input mt-1 w-full text-sm" placeholder="Es. anello d'oro"
                  value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Peso (kg) *</label>
                <input type="number" step="0.1" min="0.1" className="veil-input mt-1 w-full text-sm"
                  placeholder="0.5" value={itemForm.weight}
                  onChange={e => setItemForm({ ...itemForm, weight: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Quantità</label>
                <input type="number" min="1" className="veil-input mt-1 w-full text-sm"
                  value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Rarità</label>
                <select className="veil-input mt-1 w-full text-sm" value={itemForm.rarity}
                  onChange={e => setItemForm({ ...itemForm, rarity: e.target.value })}>
                  {Object.entries(RARITY).map(([k, r]) => (
                    <option key={k} value={k}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.15em] text-white/30">Valore (mo, opz.)</label>
                <input type="number" min="0" step="0.1" className="veil-input mt-1 w-full text-sm"
                  placeholder="0" value={itemForm.value}
                  onChange={e => setItemForm({ ...itemForm, value: e.target.value })} />
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
        )}
      </div>
    </div>
  );
}
