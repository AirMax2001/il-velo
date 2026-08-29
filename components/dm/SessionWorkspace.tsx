"use client";
import { useEffect, useState, useRef } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";
import type { DmSection } from "@/types/campaign";
import { LocationModule } from "@/components/dm/modules/LocationModule";
import { ObjectsModule } from "@/components/dm/modules/ObjectsModule";
import { GalleryModule } from "@/components/dm/modules/GalleryModule";
import { CombatCards } from "@/components/dm/CombatCards";
import { PlayerCards } from "@/components/dm/PlayerCards";
import { NpcModule } from "@/components/dm/modules/NpcModule";
import { TableWorkspace } from "@/components/dm/TableWorkspace";

type SessionPack = {
  id: string;
  session_id: string;
  title: string;
  session_number: number;
  data: any;
  created_at: string;
};

type SessionWorkspaceProps = { sessionId?: string; onNavigate?: (tab: DmSection) => void; onSearch?: () => void; onLogout?: () => void };

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

export function SessionWorkspace({ sessionId, onNavigate, onSearch, onLogout }: SessionWorkspaceProps) {
  const { engine } = useGameEngine();
  const [centralView, setCentralView] = useState<"scene" | DmSection>("scene");
  const [showSessions, setShowSessions] = useState(true);
  const [showPhotos, setShowPhotos] = useState(true);
  const [settingsTheme, setSettingsTheme] = useState("default");
  const [settingsMounted, setSettingsMounted] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("veil_theme") || "default";
    setSettingsTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    setSettingsMounted(true);
  }, []);
  function changeSettingsTheme(t: string) {
    setSettingsTheme(t);
    localStorage.setItem("veil_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }
  useEffect(() => {
    const h = (e: any) => { if (e.detail) setCentralView(e.detail); };
    window.addEventListener("veil-set-central" as any, h);
    return () => window.removeEventListener("veil-set-central" as any, h);
  }, []);
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

  // blocco colonne fisse: sinistra giocatori + centro + destra — centro tocca sopra come barra nera cerca/esci
  return (
    <div className="flex gap-6 px-6 pb-6 pt-0 items-start">
      {/* Colonna centrale: cambia solo qui */}
      <div className="flex-1 min-w-0 space-y-5 overflow-y-auto h-[calc(100vh-1rem)] pr-2 pt-4">
        {centralView !== "scene" ? (
          <div className="min-h-full">
            {centralView === "locations" && <LocationModule sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "assets" && <ObjectsModule sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "gallery" && <GalleryModule sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "combat" && <CombatCards sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "players" && <PlayerCards sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "npcs" && <NpcModule sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "table" && <TableWorkspace sessionId={viewSessionId || sessionId || ""} />}
            {centralView === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-[0.08em] text-white">Impostazioni</h3>
                  <p className="text-xs text-white/40 mt-1">Tema e pulizia chat</p>
                </div>
                {settingsMounted && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: "default", name: "Default", desc: "Oscuro elegante" },
                      { id: "draconic", name: "Draconic", desc: "Rosso drago" },
                      { id: "arcane", name: "Arcane", desc: "Magia viola" },
                      { id: "nature", name: "Nature", desc: "Foresta verde" },
                      { id: "shadowfell", name: "Shadowfell", desc: "Ombra e tenebra" },
                      { id: "celestial", name: "Celestial", desc: "Chiaro sacro" },
                      { id: "infernal", name: "Infernal", desc: "Inferno rossastro" },
                      { id: "ocean", name: "Ocean", desc: "Abisso marino" },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => changeSettingsTheme(t.id)}
                        className={`rounded-2xl border p-4 text-left transition ${settingsTheme === t.id ? "border-veil-gold/30 bg-veil-gold/10" : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"}`}
                      >
                        <span className="text-xs uppercase tracking-wider text-veil-gold/60">{t.name}</span>
                        <p className="mt-1 text-xs text-white/50">{t.desc}</p>
                        {settingsTheme === t.id && <span className="mt-1 inline-block text-xs text-veil-gold">✓ Attivo</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70">Pulisci chat</p>
                    <p className="text-[11px] text-white/30">Elimina tutti i messaggi di gruppo</p>
                  </div>
                  <button onClick={async()=>{ const sid=viewSessionId||sessionId; if(!sid) return; if(!window.confirm("Eliminare tutti i messaggi della chat di gruppo?")) return; await fetch(`/api/roleplay?sessionId=${sid}`, { method: "DELETE" }); }} className="rounded-xl border border-red-500/20 bg-red-900/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/30">✕ Pulisci</button>
                </div>
              </div>
            )}
            {centralView === "campaign" && (
              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-6">
                <h3 className="text-sm text-veil-gold font-medium mb-3">Campagna</h3>
                <p className="text-xs text-white/40">Gestisci la campagna dal selettore sopra gli appunti di Scene.</p>
                <button onClick={() => setCentralView("scene")} className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-1.5 text-xs text-white/50">← Torna a Scene</button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Selettore campagna + appunti + sessioni — vista Scene */}
        {/* Selettore campagna — con cerca/esci alla stessa altezza per far toccare il blocco centrale sopra */}
        <div className="rounded-2xl border border-veil-gold/15 bg-veil-gold/[0.03] p-3 flex items-center gap-3">
          <span className="text-xs font-medium text-veil-gold/70">📜 Campagna</span>
          <select value={viewSessionId} onChange={e=>{ setViewSessionId(e.target.value); setActivePackId(null); }} className="flex-1 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2 text-sm text-white/80">
            <option value="">— Seleziona campagna —</option>
            {campaigns.map((c:any)=><option key={c.id} value={c.id}>{c.name} — {c.code}</option>)}
          </select>
          {campaigns.length===0 && <span className="text-[10px] text-white/30">nessuna</span>}
          <button onClick={onSearch} title="Cerca (⌘K)" className="shrink-0 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-white/30 hover:text-white hover:border-white/15">⌕</button>
          <button onClick={onLogout} title="Esci" className="shrink-0 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-white/30 hover:text-red-300 hover:border-red-400/20">⊘</button>
        </div>
        {/* Casella di testo per scrivere la sessione */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm text-veil-gold/80 font-medium mb-3">
            📝 Appunti sessione{activePack && <span className="text-white/40 font-normal"> — {activePack.title || `Sessione ${activePack.session_number}`}</span>}
          </h3>
          <textarea
            className="w-full min-h-72 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 resize-none focus:border-veil-gold/30 focus:outline-none"
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
                        setCentralView("npcs");
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
                        setCentralView("assets");
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

          {/* Carosello foto della sessione attiva — a tendina */}
          {activePack && (
            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <button onClick={() => setShowPhotos(v=>!v)} className="flex items-center justify-between w-full mb-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 flex items-center gap-2">Foto sessione {packImages.length>0 && `· ${packImages.length}`} <span className={`text-white/30 text-xs transition ${showPhotos ? "" : "-rotate-90"}`}>▾</span></p>
                {showPhotos && packImages.length>0 && <span className="text-[10px] text-white/20">trascina per scorrere ↔</span>}
              </button>
              {showPhotos && (
                packImages.length===0 ? (
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
                )
              )}
            </div>
          )}
        </div>

        {/* Sessioni — a tendina */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowSessions(v=>!v)} className="flex items-center gap-2">
              <h3 className="text-sm text-veil-gold/80 font-medium">🎞 Sessioni</h3>
              <span className={`text-white/30 text-xs transition ${showSessions ? "" : "-rotate-90"}`}>▾</span>
              <span className="text-[10px] text-white/30 ml-1">{sessionPacks.length}</span>
            </button>
            <button onClick={() => { setShowForm(!showForm); setError(""); setShowSessions(true); }}
              className="rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-xs text-veil-gold hover:bg-veil-gold/20 transition">
              + Aggiungi Sessione
            </button>
          </div>

          {showSessions && (
            <>
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
            </>
          )}
        </div>
          </>
        )}
      </div>

      {/* Colonne destra: navigazione rapida — cambia solo il centro, fissa */}
      <div className="w-72 shrink-0 space-y-2 overflow-y-auto h-[calc(100vh-1rem)] sticky top-4 pr-1">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Vai a</p>
        <button onClick={() => setCentralView("scene")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-4 transition ${centralView==="scene" ? "border-veil-gold/30 bg-veil-gold/10" : "border-white/[0.06] bg-black/25 hover:border-veil-gold/20"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">🎬</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="scene" ? "text-veil-gold" : "text-white group-hover:text-veil-gold"}`}>Scene</span>
          <span className="text-[10px] text-white/30">torna agli appunti</span>
        </button>
        <button onClick={() => setCentralView("locations")}
          className="group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border border-white/[0.06] bg-black/25 px-6 py-5 transition hover:border-teal-400/40 hover:bg-teal-900/[0.06]">
          <span className="text-2xl transition-transform group-hover:scale-110">🧭</span>
          <span className="text-sm font-semibold tracking-[0.08em] text-white group-hover:text-teal-300 transition">Passa alle Locations</span>
          <span className="text-[10px] text-white/30">mappa e luoghi</span>
        </button>
        <button onClick={() => setCentralView("assets")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-5 transition ${centralView==="assets" ? "border-veil-gold/30 bg-veil-gold/10" : "border-white/[0.06] bg-black/25 hover:border-veil-gold/30"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">📦</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="assets" ? "text-veil-gold" : "text-white group-hover:text-veil-gold"}`}>Passa agli Item</span>
          <span className="text-[10px] text-white/30">oggetti e risorse</span>
        </button>
        <button onClick={() => setCentralView("combat")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-5 transition ${centralView==="combat" ? "border-red-400/30 bg-red-900/15" : "border-white/[0.06] bg-black/25 hover:border-red-400/30"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">⚔️</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="combat" ? "text-red-300" : "text-white group-hover:text-red-300"}`}>Passa al Combattimento</span>
          <span className="text-[10px] text-white/30">iniziativa e PF</span>
        </button>
        <button onClick={() => setCentralView("players")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-5 transition ${centralView==="players" ? "border-emerald-400/30 bg-emerald-900/15" : "border-white/[0.06] bg-black/25 hover:border-emerald-400/30"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">🧝</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="players" ? "text-emerald-300" : "text-white group-hover:text-emerald-300"}`}>Passa ai Giocatori</span>
          <span className="text-[10px] text-white/30">scheda party</span>
        </button>
        <button onClick={() => setCentralView("npcs")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-5 transition ${centralView==="npcs" ? "border-violet-400/30 bg-violet-900/15" : "border-white/[0.06] bg-black/25 hover:border-violet-400/30"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">👤</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="npcs" ? "text-violet-300" : "text-white group-hover:text-violet-300"}`}>Passa agli NPC</span>
          <span className="text-[10px] text-white/30">personaggi</span>
        </button>
        <button onClick={() => setCentralView("table")}
          className={`group flex w-full flex-col items-center justify-center gap-1.5 rounded-3xl border px-6 py-5 transition ${centralView==="table" ? "border-white/20 bg-white/[0.06]" : "border-white/[0.06] bg-black/25 hover:border-white/20"}`}>
          <span className="text-2xl transition-transform group-hover:scale-110">▤</span>
          <span className={`text-sm font-semibold tracking-[0.08em] transition ${centralView==="table" ? "text-white" : "text-white/80 group-hover:text-white"}`}>Tavolo</span>
          <span className="text-[11px] text-white/30">schermo tavolo</span>
        </button>
        <button onClick={() => setCentralView("settings")}
          className={`group flex w-full flex-col items-center justify-center gap-1 rounded-3xl border px-6 py-4 transition ${centralView==="settings" ? "border-white/20 bg-white/[0.06]" : "border-white/[0.06] bg-black/20 hover:border-white/15"}`}>
          <span className="text-xl transition-transform group-hover:scale-110">⚙</span>
          <span className={`text-xs font-semibold tracking-[0.08em] transition ${centralView==="settings" ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>Impostazioni</span>
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