"use client";
import { useEffect, useState } from "react";

export function NpcModule({ sessionId }: { sessionId: string }) {
  const [npcs, setNpcs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "alive" | "dead">("all");
  const noteKey = selected ? `veil-npc-note-${selected.id}` : "";

  useEffect(() => { if (sessionId) load(); }, [sessionId]);
  async function load() {
    const d = await fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json());
    setNpcs(d.items || []);
  }

  useEffect(() => {
    if (!noteKey) return;
    const saved = localStorage.getItem(noteKey);
    if (saved) setNote(saved); else setNote("");
  }, [noteKey]);
  useEffect(() => { if (noteKey) localStorage.setItem(noteKey, note); }, [note, noteKey]);

  async function toggleDead(npc: any) {
    await fetch("/api/npcs", { method: "PATCH", body: JSON.stringify({ id: npc.id, is_dead: !npc.is_dead }) });
    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, is_dead: !n.is_dead } : n));
    if (selected?.id === npc.id) setSelected((prev: any) => prev ? { ...prev, is_dead: !prev.is_dead } : null);
  }

  async function deleteNpc(npc: any, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Eliminare definitivamente ${npc.name}?`)) return;
    await fetch(`/api/npcs?id=${npc.id}`, { method: "DELETE" });
    setNpcs(prev => prev.filter(n => n.id !== npc.id));
    if (selected?.id === npc.id) setSelected(null);
  }

  if (!sessionId) return <p className="text-white/40 text-sm">Nessuna campagna attiva</p>;

  const filtered = filter === "all" ? npcs : npcs.filter(n => filter === "dead" ? n.is_dead : !n.is_dead);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">NPC</h2>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "all" ? "border-white/20 bg-white/10 text-white" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Tutti ({npcs.length})</button>
          <button onClick={() => setFilter("alive")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "alive" ? "border-emerald-500/30 bg-emerald-900/20 text-emerald-300" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Vivi ({npcs.filter(n => !n.is_dead).length})</button>
          <button onClick={() => setFilter("dead")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "dead" ? "border-red-500/30 bg-red-900/20 text-red-300" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Morti ({npcs.filter(n => n.is_dead).length})</button>
        </div>
      </div>

      {filtered.length === 0 && <p className="text-sm text-white/30">Nessun NPC.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-8">
        {filtered.map(npc => (
          <div
            key={npc.id}
            onClick={() => setSelected(selected?.id === npc.id ? null : npc)}
            className={`relative rounded-2xl border p-5 cursor-pointer transition ${
              npc.is_dead
                ? "border-red-500/10 bg-red-900/5"
                : selected?.id === npc.id
                ? "border-veil-gold/30 bg-[linear-gradient(135deg,rgba(201,164,76,0.06),transparent)]"
                : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
            }`}
          >
            <button onClick={(e) => deleteNpc(npc, e)}
              className="absolute -top-2.5 -right-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-red-400/40 bg-red-900/60 text-[11px] text-red-200 hover:bg-red-600/70 hover:text-white transition"
              title="Elimina NPC">
              &times;
            </button>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg ${npc.is_dead ? "bg-red-900/30 text-red-400" : "bg-stone-800/50 text-stone-400"}`}>
                {npc.is_dead ? "✝" : (npc.name?.[0]?.toUpperCase() || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium truncate ${npc.is_dead ? "text-red-300/60 line-through" : "text-white"}`}>{npc.name}</p>
                <p className="mt-0.5 text-xs text-white/50">{npc.role || "—"}</p>
                {npc.faction_id && <p className="text-xs text-white/30">{npc.faction_id}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleDead(npc); }}
                className={`shrink-0 rounded-lg px-2 py-1 text-[10px] transition ${npc.is_dead ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-300 hover:bg-red-500/30"}`}
              >
                {npc.is_dead ? "Ripristina" : "Muore"}
              </button>
            </div>
            {npc.description && (
              <p className={`mt-3 text-xs line-clamp-2 ${npc.is_dead ? "text-red-300/30" : "text-white/40"}`}>{npc.description}</p>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div className="rounded-2xl border border-white/[0.06] bg-black/30">
          <div className="border-b border-white/[0.06] p-6">
            <div className="flex items-start gap-5">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-semibold ${selected.is_dead ? "bg-red-900/30 text-red-400" : "bg-stone-800/50 text-stone-400"}`}>
                {selected.is_dead ? "✝" : (selected.name?.[0]?.toUpperCase() || "?")}
              </div>
              <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-xl ${selected.is_dead ? "text-red-400/60 line-through" : "text-veil-gold"}`}>{selected.name}</h3>
                    {selected.is_dead && <span className="rounded-lg border border-red-500/30 bg-red-900/20 px-2 py-0.5 text-xs text-red-300">Morto</span>}
                    <button onClick={(e) => { e.stopPropagation(); deleteNpc(selected, e); }} className="ml-auto text-xs text-white/30 hover:text-red-300 transition">Elimina</button>
                  </div>
                <p className="mt-1 text-sm text-white/50">{selected.role || "Nessun ruolo"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.description && <span className="rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-1 text-xs text-white/40">{selected.knows ? "Sa: " + selected.knows : ""}</span>}
                  <button onClick={() => toggleDead(selected)} className={`rounded-lg border px-2.5 py-1 text-xs transition ${selected.is_dead ? "border-emerald-500/20 bg-emerald-900/20 text-emerald-300" : "border-red-500/20 bg-red-900/20 text-red-300"}`}>
                    {selected.is_dead ? "Ripristina in vita" : "Segna come morto"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              {selected.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Descrizione</p>
                  <p className="text-sm text-white/60 leading-relaxed">{selected.description}</p>
                </div>
              )}
              {selected.dialog && Object.keys(selected.dialog).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Dialoghi</p>
                  {Object.entries(selected.dialog).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-orange-500/10 bg-orange-900/8 px-3 py-2 mb-1">
                      <p className="text-[10px] text-orange-300/60">{key}</p>
                      <p className="text-xs text-white/50">{String(val)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Note DM</p>
              <textarea className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/60 resize-none focus:outline-none" rows={8} placeholder="Note private per questo NPC..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}