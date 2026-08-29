"use client";
import { useEffect, useState, useRef } from "react";

type GalleryImage = {
  id: string;
  session_id: string;
  session_pack_id: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  session_packs?: { title: string; session_number: number } | null;
};

function resizeImage(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function GalleryModule({ sessionId }: { sessionId: string }) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filterPack, setFilterPack] = useState<string | null>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedPack, setSelectedPack] = useState<string>("");
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!sessionId) return;
    const [g, p] = await Promise.all([
      fetch(`/api/gallery?sessionId=${sessionId}`).then(r => r.json()),
      fetch(`/api/session-packs?sessionId=${sessionId}`).then(r => r.json()),
    ]);
    setImages(g.items || []);
    setPacks((p.items || []).sort((a:any,b:any)=>(a.session_number||0)-(b.session_number||0)));
  }

  useEffect(() => { load(); }, [sessionId]);

  async function handleFiles(files: FileList | null, packId: string | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let hadError = "";
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const dataUrl = await resizeImage(file, 1400, 0.75);
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            session_pack_id: packId || selectedPack || null,
            image_url: dataUrl,
            caption: caption.trim() || null,
          }),
        });
        const d = await res.json().catch(()=>({}));
        if (!res.ok) hadError = (d as any).error || "Errore upload";
        else if ((d as any).item) setImages(prev => [(d as any).item, ...prev]);
        else if ((d as any).error) hadError = (d as any).error;
      } catch (e:any) { hadError = e?.message || "Errore upload"; }
    }
    setUploading(false);
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    if (hadError) alert(hadError.includes("session_gallery") ? "Tabella galleria mancante — esegui supabase/gallery.sql nel SQL Editor di Supabase." : hadError);
  }

  async function del(id: string) {
    if (!window.confirm("Eliminare questa foto?")) return;
    await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
    setImages(prev => prev.filter(i => i.id !== id));
    setLightbox(null);
  }

  if (!sessionId) return <p className="text-sm text-white/30">Nessuna campagna attiva.</p>;

  const filtered = filterPack ? images.filter(i => i.session_pack_id === filterPack) : images;
  const packMap = new Map(packs.map((p:any)=>[p.id, p]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Galleria</h2>
        <span className="text-xs text-white/30">{images.length} foto</span>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
        <p className="text-xs text-veil-gold/70 font-medium mb-3">📸 Carica foto sessione</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select value={selectedPack} onChange={e=>setSelectedPack(e.target.value)} className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-sm text-white/70">
            <option value="">Galleria generale (senza sessione)</option>
            {packs.map((p:any)=><option key={p.id} value={p.id}>#{p.session_number} — {p.title}</option>)}
          </select>
          <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Didascalia (opzionale)" className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-sm text-white/70 placeholder:text-white/25" />
          <label className={`flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-medium cursor-pointer transition ${uploading ? "border-white/10 bg-white/5 text-white/30" : "border-veil-gold/30 bg-veil-gold/10 text-veil-gold hover:bg-veil-gold/20"}`}>
            {uploading ? "Caricamento..." : "+ Scegli foto"}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e=>handleFiles(e.target.files, null)} />
          </label>
        </div>
        <p className="text-[10px] text-white/25 mt-2">JPEG/PNG/WEBP — ridimensionate automaticamente, salvate come Data URL.</p>
      </div>

      {/* Filtri per sessione */}
      {packs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setFilterPack(null)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${!filterPack ? "border-veil-gold/30 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/20 text-white/40 hover:text-white"}`}>Tutte ({images.length})</button>
          {packs.map((p:any)=>{
            const cnt = images.filter(i=>i.session_pack_id===p.id).length;
            return (
              <button key={p.id} onClick={()=>setFilterPack(filterPack===p.id? null : p.id)} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filterPack===p.id ? "border-veil-gold/30 bg-veil-gold/10 text-veil-gold" : "border-white/[0.06] bg-black/20 text-white/40 hover:text-white"}`}>
                #{p.session_number} {p.title} {cnt>0 && `(${cnt})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Griglia */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-10 text-center">
          <p className="text-3xl mb-2">🖼️</p>
          <p className="text-sm text-white/40">Nessuna foto {filterPack ? "per questa sessione" : "in galleria"}.</p>
          <p className="text-xs text-white/25 mt-1">Carica dalla galleria o con la graffetta 📎 accanto a ogni sessione.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(img => {
            const pack = img.session_pack_id ? packMap.get(img.session_pack_id) : null;
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30">
                <button onClick={()=>setLightbox(img)} className="block w-full">
                  <img src={img.image_url} alt={img.caption || "foto"} className="h-56 w-full object-cover transition group-hover:scale-[1.02]" />
                </button>
                <div className="p-3">
                  <p className="text-xs text-white/60 line-clamp-2">{img.caption || <span className="text-white/25 italic">senza didascalia</span>}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-white/25">{pack ? `#${pack.session_number} — ${pack.title}` : "Galleria generale"} · {new Date(img.created_at).toLocaleDateString("it-IT")}</span>
                    <button onClick={()=>del(img.id)} className="text-[11px] text-white/30 hover:text-red-300">Elimina</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={()=>setLightbox(null)}>
          <div className="relative max-h-[90vh] max-w-5xl w-full" onClick={e=>e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.caption || ""} className="max-h-[85vh] w-full object-contain rounded-2xl border border-white/10" />
            {lightbox.caption && <p className="mt-3 text-center text-sm text-white/70">{lightbox.caption}</p>}
            <button onClick={()=>setLightbox(null)} className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
