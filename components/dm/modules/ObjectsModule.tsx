"use client";
import { useEffect, useState } from "react";

const RARITY_COLORS: Record<string, { border: string; bg: string; text: string; label: string }> = {
  common:    { border: "border-gray-500/30",  bg: "bg-gray-900/20",  text: "text-gray-300",  label: "Comune" },
  rare:      { border: "border-emerald-500/30", bg: "bg-emerald-900/20", text: "text-emerald-300", label: "Raro" },
  epic:      { border: "border-violet-500/30", bg: "bg-violet-900/20",  text: "text-violet-300", label: "Epico" },
  legendary: { border: "border-yellow-500/30", bg: "bg-yellow-900/20",  text: "text-yellow-300", label: "Leggendario" },
  artifact:  { border: "border-red-500/30",    bg: "bg-red-900/20",     text: "text-red-300",   label: "Manufatto" },
  relic:     { border: "border-blue-500/30",   bg: "bg-blue-900/20",    text: "text-blue-300",  label: "Reliquia" },
};

const ITEM_TYPES = ["weapon", "armor", "consumable", "key", "lore", "tool", "other"];

export function ObjectsModule({ sessionId }: { sessionId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const noteKey = selected ? `veil-object-note-${selected.id}` : "";
  const [createForm, setCreateForm] = useState({ name: "", description: "", rarity: "common", item_type: "other", category: "general" });

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      fetch(`/api/inventory?sessionId=${sessionId}&view=dm`).then(r => r.json()),
      fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()),
    ]).then(([invData, playersData]) => {
      setItems(invData.items || []);
      setPlayers(playersData.players || []);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!noteKey) return;
    const saved = localStorage.getItem(noteKey);
    if (saved) setNote(saved); else setNote("");
  }, [noteKey]);
  useEffect(() => { if (noteKey) localStorage.setItem(noteKey, note); }, [note, noteKey]);

  async function createItem() {
    if (!createForm.name.trim()) return;
    const res = await fetch("/api/inventory", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, ...createForm })
    });
    const data = await res.json();
    if (data.item) {
      setItems(prev => [data.item, ...prev]);
      setCreateForm({ name: "", description: "", rarity: "common", item_type: "other", category: "general" });
      setShowCreate(false);
    }
  }

  async function assignToPlayer(itemId: string, playerId: string | null) {
    const res = await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: itemId, player_id: playerId }) });
    const d = await res.json();
    if (!res.ok || d.error) return;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, player_id: playerId } : i));
    if (selected?.id === itemId) setSelected((prev: any) => ({ ...prev, player_id: playerId }));
    setAssignOpen(false);
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm("Eliminare questo oggetto?")) return;
    await fetch(`/api/inventory?id=${itemId}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== itemId));
    if (selected?.id === itemId) setSelected(null);
  }

  if (!sessionId) return <p className="text-white/40 text-sm">Nessuna campagna attiva</p>;

  const rarities = ["common", "rare", "epic", "legendary", "artifact", "relic"];
  const filtered = filter ? items.filter(i => i.rarity === filter) : items;

  function getOwnerName(playerId: string | null) {
    if (!playerId) return null;
    return players.find(p => p.id === playerId)?.character_name || null;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Oggetti</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-900/30 transition">
          {showCreate ? "Annulla" : "+ Crea oggetto"}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-black/30 p-5">
          <h3 className="text-sm font-semibold text-veil-gold mb-4">Nuovo oggetto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Nome *</label>
              <input className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="Es. Pergamena antica" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Rarità</label>
              <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none" value={createForm.rarity} onChange={e => setCreateForm({ ...createForm, rarity: e.target.value })}>
                {rarities.map(r => <option key={r} value={r}>{RARITY_COLORS[r].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Tipo</label>
              <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none" value={createForm.item_type} onChange={e => setCreateForm({ ...createForm, item_type: e.target.value })}>
                {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Categoria</label>
              <select className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 focus:border-veil-gold/30 focus:outline-none" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                <option value="general">Generale</option>
                <option value="weapon">Arma</option>
                <option value="armor">Armatura</option>
                <option value="potion">Pozione</option>
                <option value="tool">Attrezzo</option>
                <option value="quest">Missione</option>
                <option value="relic">Reliquia</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.1em] text-white/30">Descrizione</label>
              <textarea className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 resize-none focus:outline-none focus:border-veil-gold/30" rows={3} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Descrizione dell'oggetto..." />
            </div>
          </div>
          <button onClick={createItem} disabled={!createForm.name.trim()} className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-900/30 transition disabled:opacity-40">
            Salva oggetto
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter(null)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${!filter ? "border-white/20 bg-white/10 text-white" : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"}`}>Tutti ({items.length})</button>
        {rarities.map(r => {
          const count = items.filter(i => i.rarity === r).length;
          if (count === 0) return null;
          const c = RARITY_COLORS[r];
          return <button key={r} onClick={() => setFilter(filter === r ? null : r)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === r ? `${c.border} ${c.bg} ${c.text}` : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"}`}>{c.label} ({count})</button>;
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
        {filtered.length === 0 && <div className="col-span-full text-center py-8"><p className="text-sm text-white/30">Nessun oggetto.</p></div>}
        {filtered.map((item: any) => {
          const c = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
          const ownerName = getOwnerName(item.player_id);
          return (
            <div key={item.id} onClick={() => setSelected(selected?.id === item.id ? null : item)} className={`rounded-2xl border p-4 cursor-pointer transition ${selected?.id === item.id ? `${c.border} ${c.bg}` : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"}`}>
              <div className="flex items-start gap-3">
                <span className={`text-lg ${c.text}`}>{item.rarity === "legendary" ? "🌟" : item.rarity === "epic" ? "✦" : item.rarity === "rare" ? "◆" : item.rarity === "artifact" ? "⚔" : item.rarity === "relic" ? "◈" : "◇"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">{item.name}</p>
                  <p className={`text-[10px] uppercase tracking-wider ${c.text}`}>{c.label}</p>
                  {item.description && <p className="mt-2 text-xs text-white/40 line-clamp-2">{item.description}</p>}
                  {ownerName && <p className="mt-1 text-xs text-sky-400/70">⊘ {ownerName}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-6">
          <div className="flex items-start gap-4 mb-6">
            <span className={`text-3xl ${RARITY_COLORS[selected.rarity]?.text || "text-white"}`}>{selected.rarity === "legendary" ? "🌟" : selected.rarity === "epic" ? "✦" : selected.rarity === "rare" ? "◆" : selected.rarity === "artifact" ? "⚔" : selected.rarity === "relic" ? "◈" : "◇"}</span>
            <div className="flex-1">
              <h3 className="text-xl text-veil-gold">{selected.name}</h3>
              <p className={`text-xs uppercase tracking-wider ${RARITY_COLORS[selected.rarity]?.text || "text-white/50"}`}>{RARITY_COLORS[selected.rarity]?.label || selected.rarity || "—"}</p>
            </div>
            <button onClick={() => deleteItem(selected.id)} className="text-xs text-white/30 hover:text-red-300 transition">Elimina</button>
          </div>
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div className="space-y-3">
              {selected.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Descrizione</p>
                  <p className="text-sm text-white/60">{selected.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                {selected.item_type && <span className="rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1 text-xs text-white/40">{selected.item_type}</span>}
                <button onClick={async () => {
                  const newVal = !selected.hidden;
                  await fetch("/api/inventory", { method: "PATCH", body: JSON.stringify({ id: selected.id, hidden: newVal }) });
                  setItems(prev => prev.map(i => i.id === selected.id ? { ...i, hidden: newVal } : i));
                  setSelected((prev: any) => ({ ...prev, hidden: newVal }));
                }} className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${selected.hidden ? "border-white/10 bg-black/30 text-white/30" : "border-emerald-500/20 bg-emerald-900/20 text-emerald-300"}`}>
                  {selected.hidden ? "🙈" : "👁"}
                </button>
                <div className="relative">
                  <button onClick={() => setAssignOpen(!assignOpen)} className="rounded-lg border border-sky-500/20 bg-sky-900/20 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-900/30 transition">
                    {selected.player_id ? "Cambia" : "Assegna"}
                  </button>
                  {assignOpen && (
                    <div className="absolute top-full left-0 mt-1 z-20 w-48 rounded-xl border border-white/[0.06] bg-[#0f1015] shadow-2xl p-1 max-h-48 overflow-y-auto">
                      <button onClick={() => assignToPlayer(selected.id, null)} className="w-full text-left rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/[0.04]">Nessuno</button>
                      {players.map(p => (
                        <button key={p.id} onClick={() => assignToPlayer(selected.id, p.id)} className="w-full text-left rounded-lg px-3 py-2 text-xs text-white/70 hover:bg-white/[0.04]">{p.character_name}</button>
                      ))}
                    </div>
                  )}
                </div>
                {selected.player_id && (
                  <span className="text-xs text-sky-400/60">⊘ {getOwnerName(selected.player_id)}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Note DM</p>
              <textarea className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/60 resize-none focus:outline-none" rows={6} placeholder="Note per questo oggetto..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
