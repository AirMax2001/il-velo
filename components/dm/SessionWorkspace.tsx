"use client";
import { useEffect, useState } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";
import type { DmSection } from "@/types/campaign";

type SessionPack = {
  id: string;
  session_id: string;
  title: string;
  session_number: number;
  data: any;
  created_at: string;
};

type SessionWorkspaceProps = { sessionId?: string; onNavigate?: (tab: DmSection) => void };

export function SessionWorkspace({ sessionId, onNavigate }: SessionWorkspaceProps) {
  const { engine } = useGameEngine();
  const [sessionPacks, setSessionPacks] = useState<SessionPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!activePackId) { setNotes(""); return; }
    const saved = localStorage.getItem(`veil-session-notes-${activePackId}`);
    setNotes(saved || "");
  }, [activePackId]);

  useEffect(() => {
    if (!activePackId) return;
    const t = setTimeout(() => localStorage.setItem(`veil-session-notes-${activePackId}`, notes), 400);
    return () => clearTimeout(t);
  }, [notes, activePackId]);

  async function loadPacks() {
    if (!sessionId) return;
    const d = await fetch(`/api/session-packs?sessionId=${sessionId}`).then(r => r.json());
    const packs = (d.items || []).sort((a: any, b: any) => (a.session_number || 0) - (b.session_number || 0));
    setSessionPacks(packs);
    setActivePackId(prev => prev || packs[packs.length - 1]?.id || null);
  }

  useEffect(() => {
    loadPacks();
  }, [sessionId]);

  async function addSession() {
    setError("");
    if (!title.trim()) { setError("Inserisci il nome della sessione."); return; }
    const n = num.trim() === "" ? null : Number(num);
    if (n !== null && (isNaN(n) || n <= 0)) { setError("Il numero sessione deve essere un numero valido."); return; }
    const res = await fetch("/api/session-packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, title: title.trim(), session_number: n, data: {} }),
    });
    if (!res.ok) { setError("Errore durante il salvataggio."); return; }
    setTitle("");
    setNum("");
    setShowForm(false);
    loadPacks();
  }

  function reopen(pack: SessionPack) {
    setActivePackId(pack.id);
    engine.loadSessionPack(pack.data);
  }

  async function remove(pack: SessionPack) {
    if (!window.confirm(`Eliminare "${pack.title || `Sessione ${pack.session_number}`}"?\nQuesta azione non può essere annullata.`)) return;
    const res = await fetch(`/api/session-packs?id=${pack.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setSessionPacks(prev => prev.filter(p => p.id !== pack.id));
    if (activePackId === pack.id) {
      const remaining = sessionPacks.filter(p => p.id !== pack.id);
      if (remaining.length > 0) { setActivePackId(remaining[0].id); engine.loadSessionPack(remaining[0].data); }
      else setActivePackId(null);
    }
  }

  if (!sessionId) {
    return <div className="flex h-full items-center justify-center"><p className="text-sm text-white/20">Nessuna campagna attiva.</p></div>;
  }

  const activePack = sessionPacks.find(p => p.id === activePackId) || null;

  return (
    <div className="flex h-full gap-6">
      {/* Colonne sinistra: note + sessioni */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Casella di testo per scrivere la sessione */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">
            📝 Appunti sessione{activePack && <span className="text-white/40 font-normal"> — {activePack.title || `Sessione ${activePack.session_number}`}</span>}
          </h3>
          <textarea
            className="w-full min-h-44 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 resize-none focus:border-veil-gold/30 focus:outline-none"
            placeholder={activePack ? `Scrivi qui gli appunti della sessione "${activePack.title || activePack.session_number}"...` : "Apri una sessione dalla lista per scrivere i suoi appunti."}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          {notes.length > 0 && <p className="mt-1 text-[10px] text-white/25">Salvati automaticamente per questa sessione.</p>}
          {!activePack && <p className="mt-1 text-[10px] text-white/25">Ogni sessione ha i suoi appunti.</p>}
        </div>

        {/* Sessioni */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-veil-gold/80 font-medium">🎞 Sessioni</h3>
            <button onClick={() => { setShowForm(!showForm); setError(""); }}
              className="rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-xs text-veil-gold hover:bg-veil-gold/20 transition">
              + Aggiungi Sessione
            </button>
          </div>

          {showForm && (
            <div className="mb-4 rounded-xl border border-veil-gold/20 bg-veil-gold/[0.04] p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-white/30 block mb-1">Nome sessione</label>
                  <input className="veil-input w-full" placeholder="Es. La miniera dimenticata" value={title} onChange={e => { setTitle(e.target.value); setError(""); }} autoFocus />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.1em] text-white/30 block mb-1">Numero progressivo</label>
                  <input className="veil-input w-full" type="number" min="1" placeholder="Es. 12" value={num} onChange={e => { setNum(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && addSession()} />
                </div>
              </div>
              {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={addSession} className="rounded-lg border border-veil-gold/40 bg-veil-gold/15 px-4 py-1.5 text-xs text-veil-gold hover:bg-veil-gold/25 transition">Salva sessione</button>
                <button onClick={() => { setShowForm(false); setError(""); }} className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/40 hover:text-white transition">Annulla</button>
              </div>
            </div>
          )}

          {sessionPacks.length === 0 && !showForm && (
            <p className="text-xs text-white/30 text-center py-6">Nessuna sessione salvata. Clicca "+ Aggiungi Sessione" per crearne una.</p>
          )}

          <div className="space-y-1.5">
            {sessionPacks.map(pack => (
              <div key={pack.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
                activePackId === pack.id
                  ? "border-veil-gold/25 bg-veil-gold/[0.06]"
                  : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
              }`}>
                <button onClick={() => reopen(pack)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white/80 truncate">{pack.title || `Sessione ${pack.session_number}`}</p>
                  <p className="text-[10px] text-white/30">#{pack.session_number || "?"} · {new Date(pack.created_at).toLocaleDateString("it-IT")}</p>
                </button>
                {activePackId === pack.id && <span className="text-[9px] uppercase tracking-wider text-veil-gold/60">aperta</span>}
                <button title="Riapri questa sessione" onClick={() => reopen(pack)}
                  className="rounded-lg border border-veil-gold/25 bg-veil-gold/[0.06] px-2.5 py-1.5 text-[11px] text-veil-gold/80 hover:bg-veil-gold/15 hover:text-veil-gold transition">
                  ▶ Riapri
                </button>
                <button title="Elimina sessione" onClick={() => remove(pack)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/25 hover:border-red-400/30 hover:bg-red-900/20 hover:text-red-300 transition">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne destra: navigazione rapida */}
      <div className="w-72 shrink-0 space-y-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Vai a</p>
        <button onClick={() => onNavigate?.("assets")}
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-10 transition hover:border-veil-gold/40 hover:bg-veil-gold/[0.05]">
          <span className="text-4xl transition-transform group-hover:scale-110">📦</span>
          <span className="text-lg font-semibold tracking-[0.08em] text-white group-hover:text-veil-gold transition">Passa agli Item</span>
          <span className="text-[11px] text-white/30">oggetti e risorse della campagna</span>
        </button>
        <button onClick={() => onNavigate?.("combat")}
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-10 transition hover:border-red-400/40 hover:bg-red-900/[0.06]">
          <span className="text-4xl transition-transform group-hover:scale-110">⚔️</span>
          <span className="text-lg font-semibold tracking-[0.08em] text-white group-hover:text-red-300 transition">Passa al Combattimento</span>
          <span className="text-[11px] text-white/30">gestisci iniziativa e PF in battaglia</span>
        </button>
        <button onClick={() => onNavigate?.("players")}
          className="group flex w-full flex-col items-center justify-center gap-2 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-10 transition hover:border-emerald-400/40 hover:bg-emerald-900/[0.06]">
          <span className="text-4xl transition-transform group-hover:scale-110">🧝</span>
          <span className="text-lg font-semibold tracking-[0.08em] text-white group-hover:text-emerald-300 transition">Passa ai Giocatori</span>
          <span className="text-[11px] text-white/30">scheda, PF e comando live del party</span>
        </button>
      </div>
    </div>
  );
}