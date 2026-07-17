"use client";
import { useEffect, useState } from "react";

function LocationTreeItem({
  location,
  allLocations,
  npcs,
  depth,
  onSelect,
  selectedId,
}: {
  location: any;
  allLocations: any[];
  npcs: any[];
  depth: number;
  onSelect: (loc: any) => void;
  selectedId: string | null;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = allLocations.filter((l: any) => l.parent_id === location.id);
  const locationNpcs = npcs.filter((n: any) => n.location_id === location.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedId === location.id;

  const iconMap: Record<string, string> = {
    world: "🌍", nation: "🏴", region: "🏔", city: "🏙",
    forest: "🌲", swamp: "🌿", dungeon: "🏚", tavern: "🍺",
    shop: "🏪", temple: "⛪", ruins: "🏛", harbor: "⚓",
  };
  const icon = iconMap[location.location_type] || "📍";

  return (
    <div>
      <div
        onClick={() => { onSelect(location); setExpanded(!expanded); }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-sm ${
          isSelected
            ? "bg-veil-gold/10 text-veil-gold"
            : "text-white/70 hover:bg-white/[0.04] hover:text-white"
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        <span className="text-base shrink-0">{icon}</span>
        <span className="truncate flex-1">{location.name}</span>
        <span className="text-[10px] text-white/30 uppercase">{location.location_type}</span>
        {hasChildren && (
          <span className="text-xs text-white/30">{expanded ? "▾" : "▸"}</span>
        )}
        {locationNpcs.length > 0 && (
          <span className="text-[10px] text-cyan-400/60">{locationNpcs.length} NPC</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {children.map((child: any) => (
            <LocationTreeItem
              key={child.id}
              location={child}
              allLocations={allLocations}
              npcs={npcs}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationModule({ sessionId }: { sessionId: string }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const noteKey = selected ? `veil-location-note-${selected.id}` : "";

  useEffect(() => { if (sessionId) { loadLocations(); loadNpcs(); } }, [sessionId]);

  async function loadLocations() {
    const d = await fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json());
    setLocations(d.locations || []);
  }
  async function loadNpcs() {
    const d = await fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json());
    setNpcs(d.items || []);
  }

  useEffect(() => {
    if (!noteKey) return;
    const saved = localStorage.getItem(noteKey);
    if (saved) setNote(saved); else setNote("");
  }, [noteKey]);
  useEffect(() => { if (noteKey) localStorage.setItem(noteKey, note); }, [note, noteKey]);

  const roots = locations.filter((l: any) => !l.parent_id);
  const locationNpcs = selected ? npcs.filter((n: any) => n.location_id === selected.id) : [];

  if (!sessionId) return <p className="text-white/40 text-sm">Nessuna campagna attiva</p>;

  const iconMap: Record<string, string> = {
    world: "🌍", nation: "🏴", region: "🏔", city: "🏙",
    forest: "🌲", swamp: "🌿", dungeon: "🏚", tavern: "🍺",
    shop: "🏪", temple: "⛪", ruins: "🏛", harbor: "⚓",
  };

  async function updateLocation(id: string, fields: Record<string, any>) {
    await fetch("/api/locations", { method: "PATCH", body: JSON.stringify({ id, ...fields }) });
    loadLocations();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white mb-6">Luoghi</h2>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-2 max-h-[70vh] overflow-y-auto">
          {roots.length === 0 && (
            <p className="text-sm text-white/30 p-4">Nessuna location importata.</p>
          )}
          {roots.map((root: any) => (
            <LocationTreeItem
              key={root.id}
              location={root}
              allLocations={locations}
              npcs={npcs}
              depth={0}
              onSelect={setSelected}
              selectedId={selected?.id}
            />
          ))}
        </div>

        <div>
          {!selected ? (
            <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-8 text-center">
              <p className="text-sm text-white/30">Seleziona un luogo dall'albero</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-black/30">
              <div className="border-b border-white/[0.06] p-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{iconMap[selected.location_type] || "📍"}</span>
                  <div>
                    <h3 className="text-xl text-veil-gold">{selected.name}</h3>
                    <p className="mt-1 text-sm text-white/50 capitalize">{selected.location_type || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  {/* Map coordinates */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Coordinate mappa</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">X</span>
                        <input
                          className="w-20 rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-veil-gold/30"
                          type="number" min={0} max={100} step={0.5}
                          value={selected.map_x ?? ""}
                          onChange={e => updateLocation(selected.id, { map_x: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">Y</span>
                        <input
                          className="w-20 rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5 text-xs text-white/70 focus:outline-none focus:border-veil-gold/30"
                          type="number" min={0} max={100} step={0.5}
                          value={selected.map_y ?? ""}
                          onChange={e => updateLocation(selected.id, { map_y: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <span className="text-[10px] text-white/20">(% sulla mappa)</span>
                    </div>
                  </div>

                  {selected.ambient_description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Descrizione</p>
                      <p className="text-sm text-white/60 leading-relaxed">{selected.ambient_description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selected.atmosphere && (
                      <span className={`rounded-lg border px-2.5 py-1 text-xs ${
                        selected.atmosphere === "calm"
                          ? "border-emerald-500/20 bg-emerald-900/20 text-emerald-300"
                          : selected.atmosphere === "disturbed"
                          ? "border-red-500/20 bg-red-900/20 text-red-300"
                          : "border-violet-500/20 bg-violet-900/20 text-violet-300"
                      }`}>
                        {selected.atmosphere}
                      </span>
                    )}
                    {selected.is_current && (
                      <span className="rounded-lg border border-veil-gold/20 bg-veil-gold/10 px-2.5 py-1 text-xs text-veil-gold">
                        Luogo corrente
                      </span>
                    )}
                  </div>

                  {locationNpcs.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">NPC presenti</p>
                      <div className="flex flex-wrap gap-2">
                        {locationNpcs.map((n: any) => (
                          <span key={n.id} className="rounded-lg border border-stone-500/20 bg-stone-900/30 px-3 py-1.5 text-xs text-stone-300/70">○ {n.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sub-locations */}
                  {(() => {
                    const subLocs = locations.filter((l: any) => l.parent_id === selected.id);
                    if (subLocs.length === 0) return null;
                    return (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Sotto-luoghi</p>
                        <div className="flex flex-wrap gap-2">
                          {subLocs.map((sl: any) => (
                            <button
                              key={sl.id}
                              onClick={() => setSelected(sl)}
                              className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-1.5 text-xs text-white/50 hover:border-veil-gold/20 hover:text-veil-gold/70 transition"
                            >
                              {iconMap[sl.location_type] || "📍"} {sl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-2">Note DM</p>
                  <textarea
                    className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/60 resize-none focus:outline-none"
                    rows={8}
                    placeholder="Note private per questo luogo..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}