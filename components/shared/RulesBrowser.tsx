"use client";
import { useState } from "react";
import { rulesData, type RuleVolume } from "@/lib/rulesData";

export function RulesBrowser() {
  const [selectedVolume, setSelectedVolume] = useState<RuleVolume | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredChapters = selectedVolume
    ? selectedVolume.chapters.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const allChapters = rulesData.flatMap(v =>
    v.chapters.map(c => ({ ...c, volumeTitle: v.title, volumeId: v.id }))
  );
  const searchResults = search
    ? allChapters.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.content.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 15)
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <input
        className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70 placeholder-white/20 focus:border-veil-gold/30 focus:outline-none mb-4"
        placeholder="Cerca nelle regole..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Search Results */}
      {search && searchResults.length > 0 && (
        <div className="mb-4 space-y-1">
          {searchResults.map(c => (
            <button
              key={c.volumeId + c.id}
              onClick={() => {
                setSelectedVolume(rulesData.find(v => v.id === c.volumeId) ?? rulesData[0]);
                setSelectedChapter(c.id);
                setSearch("");
              }}
              className="w-full text-left rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.06]"
            >
              <span className="text-veil-gold/60">{c.volumeTitle}</span> — {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Volume selector */}
      {!selectedVolume && !search && (
        <div className="space-y-2">
          {rulesData.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedVolume(v)}
              className="w-full text-left rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 hover:border-veil-gold/20 hover:bg-veil-gold/[0.04] transition-colors"
            >
              <p className="text-sm text-veil-gold/80">{v.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{v.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Chapter list */}
      {selectedVolume && !selectedChapter && !search && (
        <div>
          <button
            onClick={() => setSelectedVolume(null)}
            className="text-xs text-veil-gold/50 hover:text-veil-gold/80 mb-3"
          >
            ← Indietro
          </button>
          <p className="text-xs text-white/40 mb-3">{selectedVolume.title}</p>
          <div className="space-y-1">
            {selectedVolume.chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.id)}
                className="w-full text-left rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
              >
                {ch.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chapter content */}
      {selectedVolume && selectedChapter && !search && (
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setSelectedChapter(null)}
            className="text-xs text-veil-gold/50 hover:text-veil-gold/80 mb-1"
          >
            ← Capitoli
          </button>
          <p className="text-[10px] text-white/30 mb-3">{selectedVolume.title}</p>
          {(() => {
            const ch = selectedVolume.chapters.find(c => c.id === selectedChapter);
            if (!ch) return null;
            return (
              <div className="prose prose-invert prose-xs max-w-none">
                <h4 className="text-sm text-veil-gold/80 mb-2 font-semibold">{ch.title}</h4>
                <div className="text-xs text-white/60 leading-relaxed whitespace-pre-line">
                  {ch.content}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
