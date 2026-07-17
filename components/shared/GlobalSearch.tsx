"use client";

import { useEffect, useState, useCallback } from "react";

type SearchResult = {
  type: string;
  id: string;
  label: string;
  subtitle: string;
  section: string;
};

type GlobalSearchProps = {
  sessionId: string;
  onSelect: (type: string, id: string) => void;
  onClose: () => void;
};

export function GlobalSearch({ sessionId, onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchAll = useCallback(async () => {
    if (!sessionId || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = query.toLowerCase();

    try {
      const [
        npcsRes, playersRes, questsRes, locationsRes,
        relicsRes, factionsRes, eventsRes, timelineRes,
        cluesRes, notesRes
      ] = await Promise.all([
        fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/quests?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/relics?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/factions?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/events?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/timeline?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/clues?sessionId=${sessionId}`).then(r => r.json()),
        fetch(`/api/notes?sessionId=${sessionId}`).then(r => r.json())
      ]);

      const all: SearchResult[] = [];

      (npcsRes.items || []).forEach((n: any) => {
        if (n.name?.toLowerCase().includes(q)) all.push({ type: "npc", id: n.id, label: n.name, subtitle: n.description || "", section: "NPC" });
      });
      (playersRes.players || []).forEach((p: any) => {
        if (p.character_name?.toLowerCase().includes(q)) all.push({ type: "player", id: p.id, label: p.character_name, subtitle: `${p.race || ""} ${p.class || ""}`.trim(), section: "Personaggi" });
      });
      (questsRes.items || []).forEach((qs: any) => {
        if (qs.title?.toLowerCase().includes(q)) all.push({ type: "quest", id: qs.id, label: qs.title, subtitle: qs.description || "", section: "Quest" });
      });
      (locationsRes.locations || []).forEach((l: any) => {
        if (l.name?.toLowerCase().includes(q)) all.push({ type: "location", id: l.id, label: l.name, subtitle: l.atmosphere || "", section: "Luoghi" });
      });
      (relicsRes.items || []).forEach((r: any) => {
        if (r.name?.toLowerCase().includes(q)) all.push({ type: "relic", id: r.id, label: r.name, subtitle: r.description || "", section: "Reliquie" });
      });
      (factionsRes.items || []).forEach((f: any) => {
        if (f.name?.toLowerCase().includes(q)) all.push({ type: "faction", id: f.id, label: f.name, subtitle: f.ideology || "", section: "Fazioni" });
      });
      (eventsRes.items || []).forEach((e: any) => {
        if (e.title?.toLowerCase().includes(q)) all.push({ type: "event", id: e.id, label: e.title, subtitle: e.description || "", section: "Eventi" });
      });
      (timelineRes.items || []).forEach((t: any) => {
        if (t.title?.toLowerCase().includes(q)) all.push({ type: "timeline", id: t.id, label: t.title, subtitle: t.era || "", section: "Timeline" });
      });
      (cluesRes.items || []).forEach((c: any) => {
        if (c.title?.toLowerCase().includes(q)) all.push({ type: "clue", id: c.id, label: c.title, subtitle: c.content || "", section: "Indizi" });
      });
      (notesRes.items || []).forEach((n: any) => {
        if (n.title?.toLowerCase().includes(q)) all.push({ type: "note", id: n.id, label: n.title, subtitle: n.content || "", section: "Note" });
      });

      setResults(all.slice(0, 20));
      setSelectedIndex(0);
    } finally {
      setLoading(false);
    }
  }, [sessionId, query]);

  useEffect(() => {
    const timer = setTimeout(fetchAll, 200);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[selectedIndex]) {
        onSelect(results[selectedIndex].type, results[selectedIndex].id);
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [results, selectedIndex, onSelect, onClose]);

  const sectionColors: Record<string, string> = {
    NPC: "text-purple-300", Personaggi: "text-emerald-300", Quest: "text-veil-gold",
    Luoghi: "text-sky-300", Reliquie: "text-amber-300", Fazioni: "text-rose-300",
    Eventi: "text-teal-300", Timeline: "text-indigo-300", Indizi: "text-orange-300", Note: "text-zinc-300"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl">
        <div className="veil-premium-card overflow-hidden shadow-2xl">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-white/30">⌕</span>
            <input
              className="w-full border-0 bg-transparent px-12 py-4 text-lg text-white placeholder-white/30 outline-none"
              placeholder="Cerca NPC, quest, luoghi, reliquie..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white/60" onClick={onClose}>
              ESC
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border-t border-white/10">
            {loading && (
              <div className="p-6 text-center text-sm text-white/40">Ricerca in corso...</div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="p-6 text-center text-sm text-white/40">Nessun risultato per "{query}"</div>
            )}
            {!loading && results.length > 0 && (
              <div className="p-2">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                      i === selectedIndex ? "bg-veil-gold/15 border border-veil-gold/25" : "border border-transparent hover:bg-white/[0.04]"
                    }`}
                    onClick={() => { onSelect(r.type, r.id); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className={`text-xs font-medium uppercase tracking-wider ${sectionColors[r.section] || "text-white/50"}`}>
                      {r.section}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{r.label}</p>
                      {r.subtitle && <p className="truncate text-xs text-white/45">{r.subtitle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query.length < 2 && (
              <div className="p-6 text-center text-sm text-white/30">
                Inserisci almeno 2 caratteri per cercare tra NPC, personaggi, quest, luoghi, reliquie, fazioni, eventi, timeline, indizi e note.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
