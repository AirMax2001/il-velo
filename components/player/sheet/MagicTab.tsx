"use client";
import { useState } from "react";
import { getSpellsForClass, getSpellByName } from "@/lib/data/spells";
import { getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit, WARLOCK_SLOT_LEVEL } from "@/lib/data/leveling";
import { getArchetypeSlotsAtLevel } from "@/lib/data/classAbilities";
import { preparedSpellLimit, getModifier } from "@/lib/characterEngine";
import { ABILITY_SHORT } from "@/lib/characterEngine";
import type { SheetCtx } from "./types";

export function MagicTab({ ctx }: { ctx: SheetCtx }) {
  const { cd, clsKey, clsData, level, pb, spellAbility, spellAbilityMod, spellDC, spellAtk, updCd, updCdAll, save, archCasting } = ctx;
  const hasSpellcasting = !!clsData?.spellcasting || !!spellAbility || !!archCasting;
  const listKey = clsData?.spellcasting ? (clsKey || "") : (archCasting?.list || clsKey || "");
  const autoSlotTotals = archCasting?.slots ? getArchetypeSlotsAtLevel(cd.archetype || "", level) : clsKey ? getSpellSlotsAtLevel(clsKey, level) : {};
  const cantripLimit = archCasting?.cantripsKnown ?? (clsKey ? getCantripsKnown(clsKey, level) : 0);
  const preparedLimit = clsKey ? preparedSpellLimit(clsKey, level, spellAbilityMod) : 0;
  const spellLimit = archCasting?.spellsKnown ? archCasting.spellsKnown(level) : ((clsKey ? getSpellsKnownLimit(clsKey, level) : 0) || preparedLimit || 999);
  const totalKnown = [1,2,3,4,5,6,7,8,9].reduce((acc,lvl)=> acc + ((((cd as any)[`spells${lvl}`])||[]) as string[]).length,0);
  const spellSlots = (cd.spellSlots || {}) as Record<number, {total?:number; expended?:number}>;
  const maxSpellLv = Math.max(0, ...Object.entries(autoSlotTotals).filter(([,v])=> (v as number)>0).map(([k])=> Number(k)), 0);
  const PREPARED = ["cleric","druid","paladin","wizard"];
  const isPrepared = !!clsKey && PREPARED.includes(clsKey);
  const canEdit = hasSpellcasting && !!ctx.dmMode; // matita solo per DM su tutti gli incantesimi/trucchetti — i giocatori vedono solo i selezionati
  const [editingCantrips, setEditingCantrips] = useState(false);
  const [editingSpells, setEditingSpells] = useState(false);
  const cantrips = (cd.cantrips||[]) as string[];
  const spellAbilityLabel = spellAbility ? (ABILITY_SHORT[spellAbility] || spellAbility) : null;

  const spellDesc = (name:string)=> getSpellsForClass(listKey,0).find(s=>s.name===name) || [1,2,3,4,5,6,7,8,9].flatMap(lv=> getSpellsForClass(listKey, lv)).find(s=>s.name===name);

  return (
    <div className="space-y-4">
      {!hasSpellcasting && (
        <div className="veil-panel p-6 text-center">
          <p className="text-3xl mb-3">⚔️</p>
          <p className="text-white/40">{clsData?.name || "Questa classe"} non usa la magia.</p>
          <p className="text-[11px] text-white/25 mt-1">Se hai oggetti magici o capacità speciali, usa la sezione Attacchi.</p>
        </div>
      )}
      {hasSpellcasting && (
        <>
          {archCasting?.ki && (
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Arti delle Ombre</h3>
              <p className="text-[10px] text-white/30 mb-3">Magie della Via dell'Ombra che lanci spendendo <strong className="text-veil-gold/70">2 Ki</strong> ciascuna (vedi Punti Ki nel tab Combattimento). Non consumano slot.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {archCasting.ki.spells.map(name=>{ const sp=getSpellByName(name); if(!sp) return null; return (<div key={name} className="rounded-lg border border-indigo-500/15 bg-indigo-950/10 px-2.5 py-2"><div className="flex items-center gap-2"><p className="flex-1 text-xs text-white/70 font-medium">{name}</p><span className="text-[9px] text-indigo-300/60">{sp.school}</span><span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[9px] text-indigo-200/80">2 Ki</span></div><p className="text-[10px] text-white/35 mt-1 leading-snug">{sp.description}</p></div>); })}
              </div>
            </div>
          )}

          {/* Slot */}
          <div className="veil-panel p-4">
            <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Slot Incantesimi</h3>
            <p className="text-[10px] text-white/30 mb-3 leading-relaxed">Uno <strong className="text-white/50">slot</strong> è una carica di magia: lanciare consuma uno slot del suo livello (o superiore per potenziare). Clicca le palline per usarli. Si recuperano con riposo lungo.{clsKey==="warlock" && <> I tuoi slot sono sempre di livello {WARLOCK_SLOT_LEVEL[level]??1}.</>}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[1,2,3,4,5,6,7,8,9].map(lv=>{
                const total=autoSlotTotals[lv]??0; const used=spellSlots[lv]?.expended??0; const avail=Math.max(0,total-used);
                return (<div key={lv} className="text-center"><p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p><div className="flex items-center justify-center gap-1 mb-1"><div className="veil-input w-10 text-center text-xs p-1 opacity-70">{total||"—"}</div><span className="text-[10px] text-white/20">/</span><input type="number" className="veil-input w-10 text-center text-xs p-1" placeholder="0" min={0} max={Math.max(total,0)} value={used||""} disabled={total===0} onChange={e=> updCdAll({ spellSlots:{ ...spellSlots, [lv]:{total, expended:Number(e.target.value)}}})} onBlur={()=> save({ spellSlots: ctx.formRef.current?.character_data?.spellSlots})}/></div><div className="flex justify-center gap-0.5 flex-wrap">{Array.from({length:Math.min(total,9)},(_,i)=>(<button key={i} onClick={()=>{const nv=i<used?i:i+1; updCdAll({ spellSlots:{ ...spellSlots, [lv]:{total, expended:Math.min(nv,total)}}}); save({ spellSlots:{ ...spellSlots, [lv]:{total, expended:Math.min(nv,total)}}});}} className={`w-4 h-4 rounded-full border transition ${i < (total-used) ? "bg-blue-500/40 border-blue-400/50":"bg-white/[0.04] border-white/10"}`} title={i < (total-used) ? "Slot disponibile":"Slot usato"}/>))}</div>{total>0 && <p className="text-[9px] text-white/20 mt-0.5">{avail} disponibili</p>}</div>);
              })}
            </div>
          </div>

          {/* Trucchetti - solo selezionati */}
          <div className="veil-panel p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm text-veil-gold/80 font-medium">Trucchetti</h3>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-blue-900/20 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300/70">{cantrips.length}{cantripLimit? `/${cantripLimit}`:""}</span>
                {canEdit && <button onClick={()=>setEditingCantrips(true)} className="rounded-lg border border-blue-400/20 bg-blue-900/15 px-2 py-1 text-[11px] text-blue-200/70 hover:bg-blue-900/25 transition" title="Modifica trucchetti (preparati: scegli tra tutti i trucchetti della tua classe fino al livello sbloccato)">✏️</button>}
              </div>
            </div>
            <p className="text-[10px] text-white/30 mb-3">A volontà, non consumano slot. {canEdit? "Puoi modificarli con la matita (preparati).":"Solo quelli selezionati fino al livello attuale."} {cantripLimit>0 && <>Max <strong className="text-veil-gold/70">{cantripLimit}</strong>.</>}</p>
            {cantrips.length===0 ? <p className="text-xs text-white/25 text-center py-3">Nessun trucchetto selezionato.{canEdit? " Usa ✏️ per sceglierli.":""}</p> : (
              <div className="grid gap-2">
                {cantrips.map(name=>{
                  const sp=spellDesc(name);
                  if(!sp) return <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-sm text-white/80">{name}</p></div>;
                  const dl=(sp.description||"").toLowerCase();
                  const isAtk=dl.includes("tiro per colpire")||dl.includes("tiro a distanza");
                  const hasSave=dl.includes("deve superare un ts")||dl.includes("tiro salvezza");
                  return (
                    <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-2"><p className="text-sm text-white/80 font-medium">{sp.name}</p><span className="text-[11px] text-white/25">{sp.school}</span></div>
                      <p className="text-[10px] text-white/30">{sp.castingTime} · {sp.range} · {sp.components} · {sp.duration}</p>
                      <p className="text-xs text-white/40 mt-1.5 leading-relaxed">{sp.description}</p>
                      <p className="text-[10px] mt-2 rounded bg-indigo-900/15 border border-indigo-500/15 px-2 py-1.5 text-indigo-200/60">{isAtk? `🎲 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} (${spellAbilityLabel||""} ${spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+PB +${pb}) vs CA`:"A volontà"} {hasSave? `· 🛡️ CD ${spellDC} (8+${spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+${pb})`:""} · Non consuma slot</p>
                    </div>
                  );
                })}
              </div>
            )}
            {!canEdit && <p className="text-[9px] text-white/20 mt-2 text-center">Classe non preparata: i trucchetti si cambiano solo al level-up (vedi LevelUpPanel).</p>}
          </div>

          {/* Incantesimi Noti/Preparati - solo selezionati */}
          <div className="veil-panel p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm text-veil-gold/80 font-medium">Incantesimi {isPrepared? "Preparati":"Noti"}</h3>
              <div className="flex items-center gap-1.5">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${spellLimit<999 && totalKnown>spellLimit? "bg-red-900/20 border-red-400/30 text-red-300":"bg-blue-900/20 border-blue-500/20 text-blue-300/70"}`}>{totalKnown}{spellLimit<999? `/${spellLimit}`:""}</span>
                {canEdit && <button onClick={()=>setEditingSpells(true)} className="rounded-lg border border-veil-gold/20 bg-veil-gold/10 px-2 py-1 text-[11px] text-veil-gold/70 hover:bg-veil-gold/20 transition" title="Modifica incantesimi (preparati: scegli tra tutti fino al livello sbloccato)">✏️</button>}
              </div>
            </div>
            <p className="text-[10px] text-white/30 mb-3 leading-relaxed">{isPrepared? `Preparati fino a ${spellLimit} (puoi cambiarli dopo ogni riposo lungo).`:`Conosciuti fino a ${spellLimit} (PHB: sostituisci 1 solo al level-up).`} Solo fino a {maxSpellLv||1}° livello sbloccato. {canEdit? "Usa ✏️ per modificare.":"Vedi solo quelli selezionati."}</p>
            {[1,2,3,4,5,6,7,8,9].filter(lv=> lv<= (maxSpellLv||1)).map(lv=>{
              const cur=((cd as any)[`spells${lv}`]||[]) as string[];
              if(cur.length===0) return null;
              return (
                <div key={lv} className="mb-3">
                  <p className="text-xs text-white/40 mb-1.5">🗝 {lv}° Livello · {cur.length} selezionati</p>
                  <div className="grid gap-2">
                    {cur.map(name=>{
                      const sp=spellDesc(name) || getSpellByName(name);
                      if(!sp) return <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-sm text-white/80">{name}</p></div>;
                      const dl=(sp.description||"").toLowerCase();
                      const isAtk=dl.includes("tiro per colpire")||dl.includes("tiro a distanza");
                      const hasSave=dl.includes("deve superare un ts")||dl.includes("tiro salvezza");
                      const dice=sp.description.match(/\d+d\d+(\s*\+\s*\d+)?/g);
                      return (
                        <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2"><p className="text-sm text-white/80 font-medium">{sp.name}</p><span className="text-[11px] text-white/25">{sp.school}</span></div>
                          <p className="text-[10px] text-white/30">{sp.castingTime} · {sp.range} · {sp.components} · {sp.duration}</p>
                          <p className="text-xs text-white/40 mt-1.5 leading-relaxed">{sp.description}</p>
                          <div className="mt-2 rounded bg-black/40 border border-white/[0.06] px-2.5 py-1.5 space-y-0.5">
                            <p className="text-[10px] text-white/35"><strong className="text-white/60">Costo:</strong> 1 slot {lv}° {isAtk? `· 🎲 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} vs CA`:""} {hasSave? `· 🛡️ CD ${spellDC}`:""} {dice? `· 🎲 ${dice.slice(0,2).join(" · ")}`:""}</p>
                            <p className="text-[10px] text-white/25"><strong className="text-white/50">Come si casta:</strong> {sp.castingTime} · Componenti {sp.components} · {isAtk? `Tiro per colpire ${spellAtk>=0?`+${spellAtk}`:spellAtk}`: hasSave? `TS CD ${spellDC}`:"Effetto automatico"}.</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {totalKnown===0 && <p className="text-xs text-white/25 text-center py-3">Nessun incantesimo selezionato.{canEdit? " Usa ✏️ per sceglierli.":""}</p>}
            {!canEdit && <p className="text-[9px] text-white/20 mt-2 text-center">Classe non preparata: gli incantesimi si cambiano solo 1 al level-up (bardo/stregone/warlock/ranger).</p>}
            {spellLimit<999 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]"><div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-blue-500/40 transition-all" style={{width:`${Math.min(100,(totalKnown/Math.max(1,spellLimit))*100)}%`}}/></div><span className="text-[10px] text-white/40 flex-shrink-0">{totalKnown}/{spellLimit}</span></div>
            )}
          </div>
        </>
      )}
      {editingCantrips && <CantripEditModal ctx={ctx} listKey={listKey} limit={cantripLimit} spellDC={spellDC} spellAtk={spellAtk} spellAbility={spellAbility} spellAbilityMod={spellAbilityMod} pb={pb} onClose={()=>setEditingCantrips(false)} maxLv={maxSpellLv} />}
      {editingSpells && <SpellEditModal ctx={ctx} listKey={listKey} maxLv={maxSpellLv} limit={spellLimit} spellDC={spellDC} spellAtk={spellAtk} spellAbilityLabel={spellAbilityLabel} spellAbilityMod={spellAbilityMod} pb={pb} onClose={()=>setEditingSpells(false)} />}
    </div>
  );
}

function CantripEditModal({ ctx, listKey, limit, spellDC, spellAtk, spellAbility, spellAbilityMod, pb, onClose }: any){
  const { cd, updCd, save } = ctx;
  const [sel, setSel] = useState<string[]>(()=> [...(cd.cantrips||[])]);
  const all=getSpellsForClass(listKey,0);
  const toggle=(n:string)=> setSel(p=> p.includes(n)? p.filter(x=>x!==n) : (limit && p.length>=limit? p : [...p,n]));
  const saveSel=()=>{ updCd("cantrips", sel); save({ cantrips: sel }); onClose(); };
  return (<div className="fixed inset-0 z-[70] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto"><div className="mx-auto max-w-2xl px-4 py-6"><div className="veil-panel p-5 border-blue-400/20"><div className="flex items-center justify-between mb-3"><h2 className="text-sm text-blue-200 font-bold">✏️ Modifica Trucchetti</h2><button onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50">✕</button></div><p className="text-[11px] text-white/35 mb-3">Scegli fino a <strong className="text-white/60">{limit||"—"}</strong> trucchetti (livello 0) tra tutti quelli della tua classe. Selezionati {sel.length}{limit?`/${limit}`:""}.</p>{limit && sel.length>limit && <p className="text-[11px] text-red-300 mb-2">Oltre il limite!</p>}<div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-1">{all.map((s:any)=>{const ch=sel.includes(s.name); const dl=(s.description||"").toLowerCase(); const isAtk=dl.includes("tiro per colpire"); const hasSave=dl.includes("deve superare un ts"); return (<button key={s.name} type="button" onClick={()=>toggle(s.name)} className={`text-left rounded-xl border p-3 transition ${ch?"bg-blue-500/15 border-blue-400/40":"bg-black/30 border-white/[0.06] hover:border-blue-500/30"}`}><div className="flex items-center justify-between gap-2"><p className="text-sm text-white/80 font-medium">{s.name}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${ch?"bg-blue-500/20 border-blue-400/30 text-blue-200":"bg-white/[0.04] border-white/10 text-white/40"}`}>{ch?"✓":"Seleziona"}</span></div><p className="text-[10px] text-white/30">{s.school} · {s.castingTime} · {s.range} · {s.components} · {s.duration}</p><p className="text-[11px] text-white/45 mt-1.5 leading-relaxed">{s.description}</p><p className="text-[10px] mt-1.5 rounded bg-indigo-900/15 border border-indigo-500/15 px-2 py-1 text-indigo-200/60">{isAtk?`🎲 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} vs CA`:"A volontà"} {hasSave?`· 🛡️ CD ${spellDC}`:""} · Non consuma slot</p></button>);})}</div><div className="mt-4 flex gap-2"><button onClick={saveSel} disabled={!!limit && sel.length>limit} className="flex-1 rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-2.5 text-sm font-bold text-blue-200 disabled:opacity-40">💾 Salva {sel.length}{limit?`/${limit}`:""}</button><button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/50">Annulla</button></div></div></div></div>);
}

function SpellEditModal({ ctx, listKey, maxLv, limit, spellDC, spellAtk, spellAbilityLabel, spellAbilityMod, pb, onClose }: any){
  const { cd, updCdAll, save } = ctx;
  const init=[1,2,3,4,5,6,7,8,9].flatMap(lv=> (cd[`spells${lv}`]||[]) as string[]);
  const [sel, setSel]=useState<string[]>(()=> [...init].filter(n=>{for(let lv=1;lv<=maxLv;lv++) if(getSpellsForClass(listKey,lv).some(s=>s.name===n)) return true; return false;}));
  const allByLv:Record<number,any[]>={}; for(let lv=1;lv<=maxLv;lv++) allByLv[lv]=getSpellsForClass(listKey,lv);
  const toggle=(n:string)=> setSel(p=> p.includes(n)? p.filter(x=>x!==n) : (limit && p.length>=limit? p : [...p,n]));
  const saveSel=()=>{ const upd:Record<string,any>={}; for(let lv=1;lv<=9;lv++) upd[`spells${lv}`]=[]; for(const n of sel) for(let lv=1;lv<=maxLv;lv++) if(getSpellsForClass(listKey,lv).some(s=>s.name===n)){ upd[`spells${lv}`].push(n); break; } updCdAll(upd); save(upd); onClose(); };
  return (<div className="fixed inset-0 z-[70] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto"><div className="mx-auto max-w-3xl px-4 py-6"><div className="veil-panel p-5 border-veil-gold/20"><div className="flex items-center justify-between mb-3"><h2 className="text-sm text-veil-gold font-bold">✏️ Modifica Incantesimi Preparati</h2><button onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50">✕</button></div><p className="text-[11px] text-white/35 mb-3">Scegli fino a <strong className="text-white/60">{limit}</strong> incantesimi fino a {maxLv}° livello. Puoi cambiarli dopo ogni riposo lungo. Selezionati {sel.length}/{limit}.</p>{limit && sel.length>limit && <p className="text-[11px] text-red-300 mb-2">Oltre il limite!</p>}<div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">{[1,2,3,4,5,6,7,8,9].filter(lv=> lv<=maxLv).map(lv=>{const list=allByLv[lv]||[]; if(list.length===0) return null; return (<div key={lv}><p className="text-xs text-white/40 mb-1.5">🗝 {lv}° Livello — {list.length} disponibili</p><div className="grid gap-2">{list.map((s:any)=>{const ch=sel.includes(s.name); const dl=(s.description||"").toLowerCase(); const isAtk=dl.includes("tiro per colpire"); const hasSave=dl.includes("deve superare un ts"); const dice=s.description.match(/\d+d\d+/g); return (<button key={s.name} type="button" onClick={()=>toggle(s.name)} className={`text-left rounded-xl border p-3 transition ${ch?"bg-veil-gold/10 border-veil-gold/30":"bg-black/30 border-white/[0.06] hover:border-veil-gold/20"}`}><div className="flex items-start justify-between gap-2"><div><p className="text-sm text-white/80 font-medium">{s.name}</p><p className="text-[10px] text-white/30">{s.school} · {s.castingTime} · {s.range} · {s.components} · {s.duration}</p></div><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${ch?"bg-veil-gold/20 border-veil-gold/30 text-veil-gold":"bg-white/[0.04] border-white/10 text-white/40"}`}>{ch?"✓":"Seleziona"}</span></div><p className="text-[11px] text-white/45 mt-1.5 leading-relaxed">{s.description}</p><div className="mt-1.5 rounded bg-black/40 border border-white/[0.05] px-2 py-1.5 space-y-0.5"><p className="text-[10px] text-white/30"><strong className="text-white/50">Costo:</strong> 1 slot {lv}° {isAtk?`· 🎲 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} vs CA`:""} {hasSave?`· 🛡️ CD ${spellDC}`:""} {dice?`· 🎲 ${dice.slice(0,2).join(" · ")}`:""}</p><p className="text-[9px] text-white/20"><strong className="text-white/30">Come si casta:</strong> {s.castingTime} · {s.components} · Preparato</p></div></button>);})}</div></div>);})}</div><div className="mt-4 flex gap-2"><button onClick={saveSel} disabled={!!limit && sel.length>limit} className="flex-1 rounded-xl border border-veil-gold/30 bg-veil-gold/15 px-4 py-2.5 text-sm font-bold text-veil-gold disabled:opacity-40">💾 Salva {sel.length}/{limit}</button><button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/50">Annulla</button></div><p className="text-[9px] text-white/25 mt-2 text-center">Solo fino a {maxLv}° livello sbloccato — gli altri si sbloccano salendo di livello.</p></div></div></div>);
}
