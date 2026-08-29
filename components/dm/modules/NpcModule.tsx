"use client";
import { useEffect, useState, useMemo } from "react";
import races from "@/lib/data/races";
import classes from "@/lib/data/classes";
import backgrounds from "@/lib/data/backgrounds";
import { getModifier, STANDARD_ARRAY, ALL_ABILITIES, ABILITY_SHORT } from "@/lib/characterEngine";

const DAMAGE_TYPES = ["acido","contundente","freddo","fuoco","forza","fulmine","necrotico","perforante","psichico","radioso","tagliente","tonante","veleno"];

function DamageMultiSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useMemo(() => ({ current: null as any }), []);
  // chiudi fuori click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const el = document.getElementById(`dmg-${label.replace(/\s/g,"")}`);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, label]);
  const selected = value ? value.split(",").map(s=>s.trim()).filter(Boolean) : [];
  return (
    <div id={`dmg-${label.replace(/\s/g,"")}`} className="relative">
      <label className="text-[9px] uppercase tracking-wider text-white/30">{label}</label>
      <button type="button" onClick={()=>setOpen(v=>!v)} className="mt-1 w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70">
        <span className="truncate">{selected.length ? selected.join(", ") : "— Nessuna"}</span>
        <span className="text-white/30 text-xs ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-white/[0.08] bg-[#0f1015] p-2 shadow-2xl">
          {DAMAGE_TYPES.map(t=> {
            const checked = selected.includes(t);
            return (
              <label key={t} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] cursor-pointer">
                <input type="checkbox" checked={checked} onChange={e=>{
                  const next = e.target.checked ? [...selected, t] : selected.filter((x:string)=>x!==t);
                  onChange(next.join(", "));
                }} className="accent-emerald-500" />
                <span className="text-xs text-white/70 capitalize">{t}</span>
              </label>
            );
          })}
          <button onClick={()=>setOpen(false)} className="mt-1 w-full rounded-lg bg-white/[0.06] py-1 text-[10px] text-white/50 hover:bg-white/[0.10]">Chiudi</button>
        </div>
      )}
    </div>
  );
}

export function NpcModule({ sessionId }: { sessionId: string }) {
  const [npcs, setNpcs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "alive" | "dead">("all");
  const noteKey = selected ? `veil-npc-note-${selected.id}` : "";
  const [showDnd, setShowDnd] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name:"", role:"", description:"", race:"", class:"", background:"", alignment:"", hp:"", ac:"", speed:"", FOR:"", DES:"", COS:"", INT:"", SAG:"", CAR:"", resistances:"", immunities:"", vulnerabilities:"", languages:"", senses:"" });
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  useEffect(() => {
    const checkPending = () => {
      const raw = localStorage.getItem("veil-pending-npc");
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.name) {
          setCreateForm(prev => ({ ...prev, name: parsed.name }));
          if (parsed.sessionId) setPendingSessionId(parsed.sessionId);
        } else {
          setCreateForm(prev => ({ ...prev, name: raw }));
        }
      } catch {
        setCreateForm(prev => ({ ...prev, name: raw }));
      }
      setShowCreate(true);
      localStorage.removeItem("veil-pending-npc");
    };
    checkPending();
    window.addEventListener("focus", checkPending);
    const id = setInterval(checkPending, 600);
    const onStorage = (e: StorageEvent) => { if (e.key === "veil-pending-npc") checkPending(); };
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("focus", checkPending); window.removeEventListener("storage", onStorage); clearInterval(id); };
  }, [sessionId]);
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

  // Helper: caratteristiche consigliate in base a classe + razza (come in giocatore)
  function applyRecommended(next: typeof createForm, raceKey?: string, classKey?: string) {
    const cls = classKey ? (classes as any)[classKey] : null;
    const race = raceKey ? (races as any)[raceKey] : null;
    const subRace = race && next.race ? (race.subRaces || []).find((sr:any)=> sr.name===next.race || sr.key===next.race) : null;
    const effRace = subRace || race;
    // speed, lingue, sensi, resistenze da razza — popola sempre quando selezioni razza
    if (race) {
      next.speed = String(race.speed || 30) + "m";
      next.languages = race.languages.join(", ");
      const dark = (subRace as any)?.darkvision ?? race.darkvision;
      if (dark) next.senses = `Scurovisione ${dark}m`;
      else next.senses = "Nessuno";
      const res = (race.resistances || []).concat((subRace as any)?.resistances || []);
      if (res.length) next.resistances = res.join(", ");
      else {
        const m = race.traits.map((t:any)=>t.description).join(" ").match(/Resistenza al danno da ([a-zàèéìòù]+)/i);
        next.resistances = m ? m[1] : "";
      }
      next.immunities = "";
      next.vulnerabilities = "";
      // se la razza ha tratto immunità esplicito, sovrascrivi
      const immTrait = race.traits.find((t:any)=>t.name.toLowerCase().includes("immunità") || t.description.toLowerCase().includes("immunità"));
      if (immTrait) {
        const mm = immTrait.description.match(/immunità[^a-z]*([a-z, ]+)/i);
        if (mm) next.immunities = mm[1].trim();
      }
    }
    // background di default se non scelto
    if (!next.background && classKey) {
      // suggerisci background legato alla classe: prendi il primo disponibile
      const bgs = Object.values(backgrounds as any) as any[];
      if (bgs[0]) next.background = bgs[0].name;
    }
    // Caratteristiche consigliate: STANDARD_ARRAY assegnato alle primaryAbility della classe
    if (cls && (!next.FOR && !next.DES && !next.COS && !next.INT && !next.SAG && !next.CAR)) {
      const order: string[] = [...ALL_ABILITIES];
      const primary = (cls.primaryAbility || []) as string[];
      // porta le primary in testa
      const sorted = [...primary, ...order.filter(a => !primary.includes(a))];
      const mapShort: Record<string,string> = { strength:"FOR", dexterity:"DES", constitution:"COS", intelligence:"INT", wisdom:"SAG", charisma:"CAR" };
      sorted.forEach((ab, idx) => {
        const short = mapShort[ab];
        if (short) (next as any)[short] = String(STANDARD_ARRAY[idx] ?? 10);
      });
      // applica bonus razziali se presenti
      if (race?.abilityBonuses) {
        for (const [k,v] of Object.entries(race.abilityBonuses as Record<string,number>)) {
          if (v) {
            const short = mapShort[k];
            if (short) (next as any)[short] = String(Math.min(20, Number((next as any)[short]||10) + v));
          }
        }
      }
      // calcola PF consigliato: dado vita + mod COS
      const con = Number((next as any)["COS"] || 10);
      const conMod = getModifier(con);
      const hd = cls.hitDie || 8;
      if (!next.hp) next.hp = String(hd + conMod);
      if (!next.ac) {
        // CA base: 10 + DES mod se senza armatura, altrimenti lascia vuoto
        const desMod = getModifier(Number((next as any)["DES"]||10));
        next.ac = String(10 + desMod);
      }
    }
    return next;
  }

  async function createNpc() {
    if (!createForm.name.trim()) return;
    const sid = pendingSessionId || sessionId;
    const data:any = {};
    for (const k of ["race","class","background","alignment","hp","ac","speed","resistances","immunities","vulnerabilities","languages","senses"]) if ((createForm as any)[k]) data[k]=(createForm as any)[k];
    for (const ab of ["FOR","DES","COS","INT","SAG","CAR"]) if ((createForm as any)[ab]) data["ability_"+ab]=(createForm as any)[ab];
    const res = await fetch("/api/npcs", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ session_id: sid, name: createForm.name.trim(), role: createForm.role || data.class || null, description: createForm.description || "", data }) });
    const j = await res.json();
    if (!res.ok || j.error) {
      const msg = j.error || "Errore salvataggio";
      if (msg.includes("data") || msg.includes("column") || msg.includes("schema cache")) {
        alert("Tabella NPC non aggiornata — esegui supabase/npcs_dnd.sql nel SQL Editor di Supabase, poi riprova. Salvo comunque i dati base.");
        // fallback senza data
        const r2 = await fetch("/api/npcs", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ session_id: sid, name: createForm.name.trim(), role: createForm.role || data.class || null, description: createForm.description || "" }) });
        const j2 = await r2.json();
        if (j2.item) { setNpcs(prev=>[j2.item,...prev]); setSelected(j2.item); setShowCreate(false); setPendingSessionId(null); setCreateForm({ name:"", role:"", description:"", race:"", class:"", background:"", alignment:"", hp:"", ac:"", speed:"", FOR:"", DES:"", COS:"", INT:"", SAG:"", CAR:"", resistances:"", immunities:"", vulnerabilities:"", languages:"", senses:"" }); return; }
      }
      alert("Errore: " + msg);
      return;
    }
    if (j.item) { setNpcs(prev=>[j.item,...prev]); setSelected(j.item); setShowCreate(false); setPendingSessionId(null); setCreateForm({ name:"", role:"", description:"", race:"", class:"", background:"", alignment:"", hp:"", ac:"", speed:"", FOR:"", DES:"", COS:"", INT:"", SAG:"", CAR:"", resistances:"", immunities:"", vulnerabilities:"", languages:"", senses:"" }); }
  }

  if (!sessionId) return <p className="text-white/40 text-sm">Nessuna campagna attiva</p>;

  const filtered = filter === "all" ? npcs : npcs.filter(n => filter === "dead" ? n.is_dead : !n.is_dead);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">NPC</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate(v=>!v)} className={`rounded-xl border px-4 py-1.5 text-xs font-medium transition ${showCreate ? "border-veil-gold/30 bg-veil-gold/15 text-veil-gold" : "border-emerald-500/30 bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/30"}`}>{showCreate ? "Annulla" : "+ Crea NPC"}</button>
          <button onClick={() => setFilter("all")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "all" ? "border-white/20 bg-white/10 text-white" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Tutti ({npcs.length})</button>
          <button onClick={() => setFilter("alive")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "alive" ? "border-emerald-500/30 bg-emerald-900/20 text-emerald-300" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Vivi ({npcs.filter(n => !n.is_dead).length})</button>
          <button onClick={() => setFilter("dead")} className={`rounded-xl border px-3 py-1.5 text-xs transition ${filter === "dead" ? "border-red-500/30 bg-red-900/20 text-red-300" : "border-white/[0.06] bg-black/20 text-white/50"}`}>Morti ({npcs.filter(n => n.is_dead).length})</button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
          <h3 className="text-sm font-semibold text-emerald-300 mb-4">Nuovo NPC</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Nome *</label>
              <input value={createForm.name} onChange={e=>setCreateForm({...createForm, name:e.target.value})} placeholder="Es. GIULIO" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/25" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Ruolo / Classe</label>
              <input value={createForm.role} onChange={e=>setCreateForm({...createForm, role:e.target.value})} placeholder="Es. Mercante, Guerriero" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/70 placeholder:text-white/25" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Descrizione</label>
              <textarea value={createForm.description} onChange={e=>setCreateForm({...createForm, description:e.target.value})} placeholder="Aspetto, personalità..." rows={2} className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 placeholder:text-white/25 resize-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Razza</label>
              <select value={createForm.race} onChange={e=>{ const v=e.target.value; let next={...createForm, race: (races as any)[v]?.name || v}; next=applyRecommended(next, v, (classes as any)[createForm.class] ? Object.keys(classes as any).find(k=>(classes as any)[k].name===createForm.class) || "" : ""); setCreateForm(next); }} className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70">
                <option value="">— Seleziona razza —</option>
                {Object.entries(races as any).map(([k,r]:any)=><option key={k} value={k}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Classe</label>
              <select value={Object.keys(classes as any).find(k=>(classes as any)[k].name===createForm.class) || createForm.class} onChange={e=>{ const v=e.target.value; const clsName=(classes as any)[v]?.name || v; let next={...createForm, class: clsName, role: clsName}; const raceKey=Object.keys(races as any).find(k=>(races as any)[k].name===createForm.race) || createForm.race; next=applyRecommended(next, raceKey, v); setCreateForm(next); }} className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70">
                <option value="">— Seleziona classe —</option>
                {Object.entries(classes as any).map(([k,c]:any)=><option key={k} value={k}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Background</label>
              <select value={Object.keys(backgrounds as any).find(k=>(backgrounds as any)[k].name===createForm.background) || createForm.background} onChange={e=>{ const v=e.target.value; const bgName=(backgrounds as any)[v]?.name || v; setCreateForm({...createForm, background: bgName}); }} className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70">
                <option value="">— Seleziona background —</option>
                {Object.entries(backgrounds as any).map(([k,b]:any)=><option key={k} value={k}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Allineamento</label>
              <select value={createForm.alignment} onChange={e=>setCreateForm({...createForm, alignment:e.target.value})} className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70">
                <option value="">—</option>
                {["LB","NB","CB","LN","N","CN","LM","NM","CM"].map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><p className="text-[9px] text-emerald-300/60">Come in giocatore: razza/classe compilano movimento, lingue e caratteristiche consigliate (modificabili).</p></div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">PF</label>
              <input value={createForm.hp} onChange={e=>setCreateForm({...createForm, hp:e.target.value})} placeholder="12" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70 text-center" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">CA</label>
              <input value={createForm.ac} onChange={e=>setCreateForm({...createForm, ac:e.target.value})} placeholder="15" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70 text-center" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Velocità</label>
              <input value={createForm.speed} onChange={e=>setCreateForm({...createForm, speed:e.target.value})} placeholder="9m" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70 text-center" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Caratteristiche FOR DES COS INT SAG CAR</label>
              <div className="mt-1 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {["FOR","DES","COS","INT","SAG","CAR"].map(ab=>(
                  <div key={ab} className="text-center">
                    <span className="text-[9px] text-white/30">{ab}</span>
                    <input value={(createForm as any)[ab]} onChange={e=>setCreateForm({...createForm, [ab]: e.target.value} as any)} placeholder="10" className="mt-0.5 w-full rounded-lg border border-white/[0.06] bg-black/30 px-1 py-1.5 text-xs text-white/70 text-center" />
                  </div>
                ))}
              </div>
            </div>
            <DamageMultiSelect label="Resistenze" value={createForm.resistances} onChange={v=>setCreateForm({...createForm, resistances: v})} />
            <DamageMultiSelect label="Immunità" value={createForm.immunities} onChange={v=>setCreateForm({...createForm, immunities: v})} />
            <DamageMultiSelect label="Vulnerabilità" value={createForm.vulnerabilities} onChange={v=>setCreateForm({...createForm, vulnerabilities: v})} />
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30">Lingue</label>
              <input value={createForm.languages} onChange={e=>setCreateForm({...createForm, languages:e.target.value})} placeholder="Comune, Elfico..." className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Sensi</label>
              <input value={createForm.senses} onChange={e=>setCreateForm({...createForm, senses:e.target.value})} placeholder="Percezione passiva 12, scurovisione 18m" className="mt-1 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-xs text-white/70" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createNpc} disabled={!createForm.name.trim()} className="rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-5 py-2 text-sm text-emerald-300 hover:bg-emerald-900/30 disabled:opacity-40 transition">Salva NPC</button>
            <button onClick={()=>setShowCreate(false)} className="rounded-xl border border-white/10 px-5 py-2 text-sm text-white/40 hover:text-white transition">Annulla</button>
          </div>
        </div>
      )}

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

              {/* Scheda D&D dettagliata */}
              <div className="rounded-xl border border-white/[0.06] bg-black/20">
                <button onClick={()=>setShowDnd(v=>!v)} className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                  <span className="text-xs font-medium text-veil-gold">📜 Scheda D&D — caratteristiche, vita, resistenze, background</span>
                  <span className={`text-white/30 text-xs transition ${showDnd ? "" : "rotate-180"}`}>▾</span>
                </button>
                {showDnd && (
                  <div className="px-3 pb-3 space-y-3 border-t border-white/[0.06] pt-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["race","Razza","Elfo, Umano..."],
                        ["class","Classe","Guerriero, Mago..."],
                        ["background","Background","Soldato, Saggio..."],
                        ["alignment","Allineamento","LB, N, CM..."],
                      ].map(([k,label,ph])=>(
                        <div key={k}>
                          <label className="text-[9px] uppercase tracking-wider text-white/30">{label}</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5 text-xs text-white/70"
                            placeholder={ph}
                            value={selected.data?.[k] || ""}
                            onChange={e=>{
                              const nd={...(selected.data||{}), [k]: e.target.value};
                              setSelected((p:any)=>({...p, data: nd}));
                            }}
                            onBlur={()=>{
                              fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: selected.data })});
                              setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: selected.data} : n));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["hp","PF","12"],
                        ["ac","CA","15"],
                        ["speed","Velocità","9m"],
                      ].map(([k,label,ph])=>(
                        <div key={k}>
                          <label className="text-[9px] uppercase tracking-wider text-white/30">{label}</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5 text-xs text-white/70 text-center"
                            placeholder={ph}
                            value={selected.data?.[k] || ""}
                            onChange={e=>{
                              const nd={...(selected.data||{}), [k]: e.target.value};
                              setSelected((p:any)=>({...p, data: nd}));
                            }}
                            onBlur={()=>{
                              fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: selected.data })});
                              setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: selected.data} : n));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-white/30">Caratteristiche (FOR DES COS INT SAG CAR)</label>
                      <div className="mt-1 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {["FOR","DES","COS","INT","SAG","CAR"].map(ab=>{
                          const key="ability_"+ab;
                          return (
                            <div key={ab} className="text-center">
                              <span className="text-[9px] text-white/30">{ab}</span>
                              <input
                                className="mt-0.5 w-full rounded-lg border border-white/[0.06] bg-black/30 px-1 py-1 text-xs text-white/70 text-center"
                                placeholder="10"
                                value={selected.data?.[key] || ""}
                                onChange={e=>{
                                  const nd={...(selected.data||{}), [key]: e.target.value};
                                  setSelected((p:any)=>({...p, data: nd}));
                                }}
                                onBlur={()=>{
                                  fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: selected.data })});
                                  setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: selected.data} : n));
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <DamageMultiSelect label="Resistenze" value={selected.data?.resistances || ""} onChange={v=>{ const nd={...(selected.data||{}), resistances: v}; setSelected((p:any)=>({...p, data: nd})); fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: nd })}); setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: nd} : n)); }} />
                      <DamageMultiSelect label="Immunità" value={selected.data?.immunities || ""} onChange={v=>{ const nd={...(selected.data||{}), immunities: v}; setSelected((p:any)=>({...p, data: nd})); fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: nd })}); setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: nd} : n)); }} />
                      <DamageMultiSelect label="Vulnerabilità" value={selected.data?.vulnerabilities || ""} onChange={v=>{ const nd={...(selected.data||{}), vulnerabilities: v}; setSelected((p:any)=>({...p, data: nd})); fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: nd })}); setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: nd} : n)); }} />
                      {[
                        ["senses","Sensi","Percezione passiva 12, scurovisione 18m"],
                        ["languages","Lingue","Comune, Elfico..."],
                      ].map(([k,label,ph])=>(
                        <div key={k}>
                          <label className="text-[9px] uppercase tracking-wider text-white/30">{label}</label>
                          <input
                            className="mt-1 w-full rounded-lg border border-white/[0.06] bg-black/30 px-2 py-1.5 text-xs text-white/70"
                            placeholder={ph}
                            value={selected.data?.[k] || ""}
                            onChange={e=>{
                              const nd={...(selected.data||{}), [k]: e.target.value};
                              setSelected((p:any)=>({...p, data: nd}));
                            }}
                            onBlur={()=>{
                              fetch("/api/npcs",{method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: selected.id, data: selected.data })});
                              setNpcs(prev=>prev.map(n=> n.id===selected.id ? {...n, data: selected.data} : n));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-white/20">Salvataggio automatico al cambio campo (dati in `data` JSON).</p>
                  </div>
                )}
              </div>
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