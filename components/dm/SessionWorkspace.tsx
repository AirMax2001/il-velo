"use client";
import { useEffect, useState, useRef } from "react";
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

function resizeImageForGallery(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      const maxDim = 1400;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function SessionWorkspace({ sessionId, onNavigate }: SessionWorkspaceProps) {
  const { engine } = useGameEngine();
  const [sessionPacks, setSessionPacks] = useState<SessionPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadingPackId, setUploadingPackId] = useState<string | null>(null);
  const [galleryCounts, setGalleryCounts] = useState<Record<string, number>>({});
  const [packImages, setPackImages] = useState<any[]>([]);
  const [carouselLightbox, setCarouselLightbox] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [viewSessionId, setViewSessionId] = useState<string>(sessionId || "");
  const [menu, setMenu] = useState<{ word: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setViewSessionId(sessionId || ""); }, [sessionId]);

  useEffect(() => {
    fetch("/api/session?list=1").then(r=>r.json()).then(d=> setCampaigns(d.sessions || [])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!activePackId) { setNotes(""); setPackImages([]); return; }
    const saved = localStorage.getItem(`veil-session-notes-${activePackId}`);
    setNotes(saved || "");
    fetch(`/api/gallery?sessionId=${viewSessionId}&sessionPackId=${activePackId}`).then(r=>r.json()).then(d=> setPackImages(d.items||[])).catch(()=>setPackImages([]));
  }, [activePackId, viewSessionId]);

  useEffect(() => {
    if (!activePackId) return;
    const t = setTimeout(() => localStorage.setItem(`veil-session-notes-${activePackId}`, notes), 400);
    return () => clearTimeout(t);
  }, [notes, activePackId]);

  async function loadPacks() {
    const sid = viewSessionId || sessionId;
    if (!sid) return;
    const d = await fetch(`/api/session-packs?sessionId=${sid}`).then(r => r.json());
    const packs = (d.items || []).sort((a: any, b: any) => (a.session_number || 0) - (b.session_number || 0));
    setSessionPacks(packs);
    setActivePackId(prev => {
      const exists = packs.some((p:any)=>p.id===prev);
      return exists ? prev : packs[packs.length - 1]?.id || null;
    });
    try {
      const g = await fetch(`/api/gallery?sessionId=${sid}`).then(r=>r.json());
      const counts: Record<string,number> = {};
      for (const im of (g.items||[])) if (im.session_pack_id) counts[im.session_pack_id] = (counts[im.session_pack_id]||0)+1;
      setGalleryCounts(counts);
    } catch {}
  }

  async function uploadForPack(packId: string, files: FileList | null) {
    const sid = viewSessionId || sessionId;
    if (!files || files.length===0) return;
    setUploadingPackId(packId);
    let hadError = "";
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const dataUrl = await resizeImageForGallery(file);
        const res = await fetch("/api/gallery", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ session_id: sid, session_pack_id: packId, image_url: dataUrl, caption: null }) });
        const j = await res.json().catch(()=>({}));
        if (!res.ok) hadError = j.error || "Errore upload";
      } catch (e:any) { hadError = e?.message || "Errore upload"; }
    }
    setUploadingPackId(null);
    if (hadError) {
      alert(hadError.includes("session_gallery") ? "Tabella galleria mancante — esegui supabase/gallery.sql nel SQL Editor di Supabase." : hadError);
      return;
    }
    try {
      const g = await fetch(`/api/gallery?sessionId=${sid}`).then(r=>r.json());
      const counts: Record<string,number> = {};
      for (const im of (g.items||[])) if (im.session_pack_id) counts[im.session_pack_id] = (counts[im.session_pack_id]||0)+1;
      setGalleryCounts(counts);
      if (packId === activePackId) {
        const pg = await fetch(`/api/gallery?sessionId=${sid}&sessionPackId=${packId}`).then(r=>r.json());
        setPackImages(pg.items||[]);
      }
    } catch {}
  }

  async function deleteCarouselImage(id: string) {
    if (!window.confirm("Eliminare questa foto?")) return;
    await fetch(`/api/gallery?id=${id}`, { method:"DELETE" });
    setPackImages(prev=>prev.filter((i:any)=>i.id!==id));
    setGalleryCounts(prev=>{ const n={...prev}; for(const k in n) if(activePackId===k) n[k]=Math.max(0,(n[k]||1)-1); return n; });
    setCarouselLightbox(null);
  }

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    if (menu) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);

  useEffect(() => {
    loadPacks();
  }, [viewSessionId]);

  async function addSession() {
    const sid = viewSessionId || sessionId;
    if (!sid) { setError("Seleziona prima una campagna."); return; }
    setError("");
    if (!title.trim()) { setError("Inserisci il nome della sessione."); return; }
    const n = num.trim() === "" ? null : Number(num);
    if (n !== null && (isNaN(n) || n <= 0)) { setError("Il numero sessione deve essere un numero valido."); return; }
    const res = await fetch("/api/session-packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid, title: title.trim(), session_number: n, data: {} }),
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

  const effectiveSessionId = viewSessionId || sessionId;
  if (!effectiveSessionId) {
    return <div className="flex h-full items-center justify-center"><p className="text-sm text-white/20">Nessuna campagna attiva.</p></div>;
  }

  const activePack = sessionPacks.find(p => p.id === activePackId) || null;

  return (
    <div className="flex h-full gap-6">
      {/* Colonne sinistra: note + sessioni */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Selettore campagna */}
        <div className="rounded-2xl border border-veil-gold/15 bg-veil-gold/[0.03] p-3 flex items-center gap-3">
          <span className="text-xs font-medium text-veil-gold/70">📜 Campagna</span>
          <select value={viewSessionId} onChange={e=>{ setViewSessionId(e.target.value); setActivePackId(null); }} className="flex-1 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2 text-sm text-white/80">
            <option value="">— Seleziona campagna —</option>
            {campaigns.map((c:any)=><option key={c.id} value={c.id}>{c.name} — {c.code}</option>)}
          </select>
          {campaigns.length===0 && <span className="text-[10px] text-white/30">nessuna</span>}
        </div>
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
          {/* Solo parole in MAIUSCOLO cliccabili */}
          {(() => {
            const words = [...new Set(notes.match(/\b[A-ZÀÈÉÌÒÙ]{2,}\b/g) || [])];
            if (words.length === 0) return null;
            return (
              <div className="mt-3 rounded-xl border border-veil-gold/15 bg-veil-gold/[0.04] p-3 relative">
                <p className="text-[10px] uppercase tracking-[0.1em] text-veil-gold/50 mb-2">Parole in maiuscolo — clicca per creare</p>
                <div className="flex flex-wrap gap-2">
                  {words.map(w => (
                    <button
                      key={w}
                      onClick={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setMenu({ word: w, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                      }}
                      className="rounded-lg border border-veil-gold/30 bg-veil-gold/15 px-3 py-1 text-xs font-bold text-veil-gold hover:bg-veil-gold/25 transition"
                    >
                      {w}
                    </button>
                  ))}
                </div>
                {menu && (
                  <div
                    ref={menuRef}
                    style={{ left: menu.x, top: menu.y }}
                    className="fixed z-[80] -translate-x-1/2 rounded-xl border border-white/[0.08] bg-[#0f1015] shadow-2xl overflow-hidden"
                  >
                    <div className="px-3 py-1.5 border-b border-white/[0.06] bg-white/[0.03] text-[10px] text-white/40 text-center">{menu.word}</div>
                    <button
                      onClick={() => {
                        const ww = menu.word;
                        setMenu(null);
                        const sid = viewSessionId || sessionId;
                        localStorage.setItem("veil-pending-npc", JSON.stringify({ name: ww.charAt(0) + ww.slice(1).toLowerCase(), sessionId: sid }));
                        onNavigate?.("npcs");
                      }}
                      className="block w-full px-5 py-2.5 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition"
                    >
                      👤 NPC — crea {menu.word}
                    </button>
                    <button
                      onClick={() => {
                        const ww = menu.word;
                        setMenu(null);
                        const sid = viewSessionId || sessionId;
                        localStorage.setItem("veil-pending-item", JSON.stringify({ name: ww.charAt(0) + ww.slice(1).toLowerCase(), sessionId: sid }));
                        onNavigate?.("assets");
                      }}
                      className="block w-full px-5 py-2.5 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition"
                    >
                      📦 Oggetto — crea {menu.word}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
          {notes.length > 0 && <p className="mt-1 text-[10px] text-white/25">Salvati automaticamente per questa sessione.</p>}
          {!activePack && <p className="mt-1 text-[10px] text-white/25">Ogni sessione ha i suoi appunti.</p>}

          {/* Carosello foto della sessione attiva */}
          {activePack && (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/30">Foto sessione {packImages.length>0 && `· ${packImages.length}`}</p>
                {packImages.length>0 && <span className="text-[10px] text-white/20">trascina per scorrere ↔</span>}
              </div>
              {packImages.length===0 ? (
                <p className="text-xs text-white/25 text-center py-3 border border-dashed border-white/10 rounded-xl bg-black/10">Nessuna foto — usa la graffetta 📎 accanto alla sessione o carica in Galleria.</p>
              ) : (
                <div
                  className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
                  style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" as any }}
                  onMouseDown={e=>{
                    const el=e.currentTarget; let isDown=true, startX=e.pageX - el.offsetLeft, scrollLeft=el.scrollLeft;
                    const move=(ev:MouseEvent)=>{ if(!isDown) return; ev.preventDefault(); const x=ev.pageX - el.offsetLeft; const walk=(x-startX)*1.2; el.scrollLeft=scrollLeft-walk; };
                    const up=()=>{ isDown=false; window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
                    window.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
                  }}
                >
                  {packImages.map((img:any)=>(
                    <div key={img.id} className="relative shrink-0 snap-start">
                      <button onClick={()=>setCarouselLightbox(img)} className="block h-28 w-40 overflow-hidden rounded-xl border border-white/[0.06] bg-black/30 hover:border-veil-gold/30 transition">
                        <img src={img.image_url} alt={img.caption||"foto"} className="h-full w-full object-cover" draggable={false} />
                      </button>
                      <button onClick={()=>deleteCarouselImage(img.id)} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 border border-white/20 text-[10px] text-white/60 hover:text-red-300 hover:border-red-400/40">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                <label title="Carica foto per questa sessione" className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg border text-sm cursor-pointer transition ${uploadingPackId===pack.id ? "border-veil-gold/20 bg-veil-gold/10 text-veil-gold/50" : "border-white/10 bg-black/30 text-white/40 hover:border-veil-gold/30 hover:text-veil-gold hover:bg-veil-gold/10"}`}>
                  {uploadingPackId===pack.id ? "…" : <>📎{galleryCounts[pack.id] ? <span className="ml-0.5 text-[9px] text-veil-gold">{galleryCounts[pack.id]}</span> : null}</>}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingPackId===pack.id} onChange={e=>uploadForPack(pack.id, e.target.files)} />
                </label>
                <button onClick={() => reopen(pack)} className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white/80 truncate">{pack.title || `Sessione ${pack.session_number}`}</p>
                  <p className="text-[10px] text-white/30">#{pack.session_number || "?"} · {new Date(pack.created_at).toLocaleDateString("it-IT")} {galleryCounts[pack.id] ? `· 🖼 ${galleryCounts[pack.id]}` : ""}</p>
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
      <div className="w-72 shrink-0 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Vai a</p>
        <button onClick={() => onNavigate?.("locations")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-6 transition hover:border-teal-400/40 hover:bg-teal-900/[0.06]">
          <span className="text-3xl transition-transform group-hover:scale-110">🧭</span>
          <span className="text-base font-semibold tracking-[0.08em] text-white group-hover:text-teal-300 transition">Passa alle Locations</span>
          <span className="text-[11px] text-white/30">mappa e luoghi della campagna</span>
        </button>
        <button onClick={() => onNavigate?.("assets")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-6 transition hover:border-veil-gold/40 hover:bg-veil-gold/[0.05]">
          <span className="text-3xl transition-transform group-hover:scale-110">📦</span>
          <span className="text-base font-semibold tracking-[0.08em] text-white group-hover:text-veil-gold transition">Passa agli Item</span>
          <span className="text-[11px] text-white/30">oggetti e risorse della campagna</span>
        </button>
        <button onClick={() => onNavigate?.("combat")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-6 transition hover:border-red-400/40 hover:bg-red-900/[0.06]">
          <span className="text-3xl transition-transform group-hover:scale-110">⚔️</span>
          <span className="text-base font-semibold tracking-[0.08em] text-white group-hover:text-red-300 transition">Passa al Combattimento</span>
          <span className="text-[11px] text-white/30">gestisci iniziativa e PF in battaglia</span>
        </button>
        <button onClick={() => onNavigate?.("players")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-6 transition hover:border-emerald-400/40 hover:bg-emerald-900/[0.06]">
          <span className="text-3xl transition-transform group-hover:scale-110">🧝</span>
          <span className="text-base font-semibold tracking-[0.08em] text-white group-hover:text-emerald-300 transition">Passa ai Giocatori</span>
          <span className="text-[11px] text-white/30">scheda, PF e comando live del party</span>
        </button>
        <button onClick={() => onNavigate?.("npcs")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-6 transition hover:border-violet-400/40 hover:bg-violet-900/[0.06]">
          <span className="text-3xl transition-transform group-hover:scale-110">👤</span>
          <span className="text-base font-semibold tracking-[0.08em] text-white group-hover:text-violet-300 transition">Passa agli NPC</span>
          <span className="text-[11px] text-white/30">personaggi e dialoghi della campagna</span>
        </button>
        <button onClick={() => onNavigate?.("table")}
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-5 transition hover:border-white/20 hover:bg-white/[0.04]">
          <span className="text-2xl transition-transform group-hover:scale-110">▤</span>
          <span className="text-sm font-semibold tracking-[0.08em] text-white/80 group-hover:text-white transition">Tavolo</span>
          <span className="text-[11px] text-white/30">schermo tavolo</span>
        </button>
        <button onClick={() => onNavigate?.("settings")}
          className="group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border border-white/[0.06] bg-black/20 px-6 py-4 transition hover:border-white/15 hover:bg-white/[0.03]">
          <span className="text-xl transition-transform group-hover:scale-110">⚙</span>
          <span className="text-xs font-semibold tracking-[0.08em] text-white/60 group-hover:text-white/80 transition">Impostazioni</span>
          <span className="text-[10px] text-white/25">tema, pulisci chat</span>
        </button>
      </div>

      {carouselLightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={()=>setCarouselLightbox(null)}>
          <div className="relative max-h-[90vh] max-w-4xl w-full" onClick={e=>e.stopPropagation()}>
            <img src={carouselLightbox.image_url} alt="" className="max-h-[85vh] w-full object-contain rounded-2xl border border-white/10" />
            <button onClick={()=>setCarouselLightbox(null)} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">×</button>
          </div>
        </div>
      )}
    </div>
  );
}