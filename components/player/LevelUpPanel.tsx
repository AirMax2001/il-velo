"use client";
import type { Player } from "@/lib/types";
import { useState, useMemo } from "react";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { levelFromXp, xpForLevel, getFeaturesAtLevel, getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit, getAsiLevels } from "@/lib/data/leveling";
import { getArchetypeForClass, getArchetypeAbilities, getArchetypeCasting, getClassResources } from "@/lib/data/classAbilities";
import { getSpellsForClass } from "@/lib/data/spells";
import { getModifier, getProficiencyBonus } from "@/lib/characterEngine";

type Props = { player: Player; onApply: (updates: Record<string, any>) => void; };

const ABILITY_KEYS = ["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const;
const ABILITY_LABELS: Record<string,string> = { strength:"Forza", dexterity:"Destrezza", constitution:"Costituzione", intelligence:"Intelligenza", wisdom:"Saggezza", charisma:"Carisma" };
type AsiChoice = { type:"+2"; ability:string } | { type:"+1+1"; abilities:[string,string] } | null;

export function LevelUpPanel({ player, onApply }: Props){
  const cd = player.character_data || {} as any;
  const clsKey = findClassKey(player.class || "");
  const clsData = clsKey ? getClassData(clsKey) : null;
  const currentLevel = Number(player.level)||1;
  const derivedLevel = levelFromXp(Number(player.xp)||0);
  const canLevel = derivedLevel > currentLevel;
  const gained = canLevel ? derivedLevel-currentLevel : 0;
  const con = Number(cd.constitution)||10;
  const conMod = getModifier(con);
  const hitDie = clsData?.hitDie;
  const avg = hitDie ? Math.ceil(hitDie/2)+1+conMod : 0;

  const [show, setShow] = useState(canLevel);
  const [hpInputs, setHpInputs] = useState<Record<number,string>>({});
  const [asiChoices, setAsiChoices] = useState<Record<number, AsiChoice>>({});
  const [archChoice, setArchChoice] = useState<string>("");
  const [newCantrips, setNewCantrips] = useState<string[]>([]);
  const [newSpells, setNewSpells] = useState<string[]>([]); // flat list with level prefix handled via storage by level

  // auto open when canLevel becomes true
  // eslint-disable-next-line
  // compute HP new
  const hpForLevel = (lv:number): number | null => {
    if(lv===1) return hitDie ? hitDie+conMod : null;
    const raw = hpInputs[lv];
    if(raw!==undefined && raw!==""){
      const die = Number(raw);
      if(!isNaN(die) && die>=1 && hitDie && die<=hitDie) return Math.max(1, die+conMod);
    }
    return null;
  };
  const computeNewHp = (): number => {
    if(!hitDie) return Number(player.hp_max)||0;
    let total = 0;
    for(let lv=1; lv<=derivedLevel; lv++){
      if(lv===1) total += hitDie+conMod;
      else {
        const v = hpForLevel(lv);
        if(v!==null) total+=v;
        else total+=Math.max(1,avg);
      }
    }
    return total;
  };
  const newHp = computeNewHp();
  const hpGain = newHp - (Number(player.hp_max)||0);

  const asiLevels = getAsiLevels(clsKey||"default");
  const archData = clsKey? getArchetypeForClass(clsKey) : null;
  const archLevel = archData?.level ?? 3;
  const needsArch = canLevel && currentLevel < archLevel && derivedLevel >= archLevel;

  // spell deltas
  const oldCant = getCantripsKnown(clsKey||"", currentLevel);
  const newCant = getCantripsKnown(clsKey||"", derivedLevel);
  const cantDelta = Math.max(0, newCant - oldCant);

  const isPreparedCaster = clsKey && ["cleric", "druid", "wizard", "paladin"].includes(clsKey);
  const isKnownCaster = clsKey && ["bard", "ranger", "sorcerer", "warlock"].includes(clsKey);

  const oldKnown = isKnownCaster ? getSpellsKnownLimit(clsKey||"", currentLevel) : 0;
  const newKnown = isKnownCaster ? getSpellsKnownLimit(clsKey||"", derivedLevel) : 0;
  const knownDelta = isKnownCaster ? Math.max(0, newKnown - oldKnown) : 0;

  // For wizard: 2 spells added to spellbook per level
  const wizardSpellbookDelta = clsKey === "wizard" ? (derivedLevel - currentLevel) * 2 : 0;

  const slotOld = getSpellSlotsAtLevel(clsKey||"", currentLevel);
  const slotNew = getSpellSlotsAtLevel(clsKey||"", derivedLevel);
  const archCast = archChoice ? getArchetypeCasting(archChoice) : null;
  const pbNew = getProficiencyBonus(derivedLevel);
  const spellAbilityKey: string | null = (clsData as any)?.spellcasting?.ability || (clsData as any)?.spellcastingAbility || archCast?.ability || (clsKey==="wizard"?"intelligence":clsKey==="cleric"||clsKey==="druid"?"wisdom":clsKey==="bard"||clsKey==="sorcerer"||clsKey==="warlock"||clsKey==="paladin"?"charisma":clsKey==="ranger"?"wisdom":null);
  const spellAbilityMod = spellAbilityKey ? getModifier(Number(cd[spellAbilityKey])||10) : 0;
  const spellDC = 8 + spellAbilityMod + pbNew;
  const spellAtk = spellAbilityMod + pbNew;
  const abilityShort: Record<string,string> = { strength:"FOR", dexterity:"DES", constitution:"COS", intelligence:"INT", wisdom:"SAG", charisma:"CAR" };

  const availableCantrips = useMemo(()=>{
    if(!clsKey) return [];
    const list = getSpellsForClass(clsKey,0);
    const owned = new Set<string>([...(cd.cantrips||[])]);
    return list.filter(s=> !owned.has(s.name));
  },[clsKey, cd.cantrips]);

  const availableSpells = useMemo(()=>{
    if(!clsKey) return [];
    const maxLv = Math.max(...Object.keys(slotNew).map(n=>Number(n)), 0);
    const owned = new Set<string>([
      ...([1,2,3,4,5,6,7,8,9] as const).flatMap(lv=> (cd[`spells${lv}`]||[]) as string[])
    ]);
    const all: typeof availableCantrips = [];
    // For prepared casters (cleric, druid, paladin), they automatically know all spells
    // For wizard, they can choose 2 spells per level to add to spellbook
    // For known casters, they choose from their class list up to knownDelta
    const effectiveDelta = isPreparedCaster ? (clsKey === "wizard" ? wizardSpellbookDelta : 0) : knownDelta;
    if (effectiveDelta === 0) return all;
    for(let lv=1; lv<=maxLv; lv++){
      for(const s of getSpellsForClass(clsKey, lv)) if(!owned.has(s.name)) all.push(s as any);
    }
    // also arch list if arch gives extra list
    if(archCast?.list && archCast.list!==clsKey){
      for(let lv=1; lv<=maxLv; lv++) for(const s of getSpellsForClass(archCast.list, lv)) if(!owned.has(s.name)) all.push(s as any);
    }
    return all;
  },[clsKey, slotNew, cd, archCast, isPreparedCaster, knownDelta, wizardSpellbookDelta]);

  const toggleCantrip = (name:string)=>{
    setNewCantrips(prev=> prev.includes(name) ? prev.filter(x=>x!==name) : (prev.length < cantDelta ? [...prev, name] : prev));
  };
  const toggleSpell = (name:string)=>{
    const effectiveDelta = isPreparedCaster ? (clsKey === "wizard" ? wizardSpellbookDelta : 0) : knownDelta;
    setNewSpells(prev=> prev.includes(name) ? prev.filter(x=>x!==name) : (prev.length < effectiveDelta ? [...prev, name] : prev));
  };

  const nextXp = xpForLevel(currentLevel+1);
  const xpIn = Number(player.xp)||0;
  const prevXp = xpForLevel(currentLevel);
  const progress = Math.max(0, Math.min(100, ((xpIn-prevXp)/Math.max(1,nextXp-prevXp))*100));

  if(!canLevel) return null;

  const apply = ()=>{
    const updates: Record<string,any> = {
      level: derivedLevel,
      hp_max: newHp,
      hp_current: Math.max(Number(player.hp_current)||0, newHp), // porta al max se era pieno, altrimenti lascia ma assicura non oltre
      hitDiceTotal: hitDie ? `${derivedLevel}d${hitDie}` : undefined,
      proficiencyBonus: getProficiencyBonus(derivedLevel),
    };
    // ASI
    const asiUpdates: Record<string,number> = {};
    for(const [lv, ch] of Object.entries(asiChoices)){
      if(!ch) continue;
      if(ch.type==="+2"){ const cur= Number(cd[ch.ability])||10; asiUpdates[ch.ability]=Math.min(20, cur+2); }
      else { for(const ab of ch.abilities){ const cur= Number(cd[ab])||10; asiUpdates[ab]=Math.min(20, (asiUpdates[ab]!==undefined? asiUpdates[ab]: cur)+1); } }
    }
    // costruisci aggiornamenti per character_data SPREADATI nel payload (save li mette in body.character_data)
    const cdUpdates: Record<string,any> = { ...asiUpdates };
    if(archChoice && needsArch) cdUpdates.archetype = archChoice;
    if(newCantrips.length>0) cdUpdates.cantrips = [...(cd.cantrips||[]), ...newCantrips];
    if(newSpells.length>0){
      const tmp: Record<string,string[]> = {};
      for(let lv=1; lv<=9; lv++) tmp[`spells${lv}`] = [...((cd as any)[`spells${lv}`]||[])];
      for(const name of newSpells){
        let lvFound: number | null = null;
        for(let lv=1; lv<=9; lv++){ if(getSpellsForClass(clsKey||"", lv).some(s=>s.name===name)){ lvFound=lv; break; } if(archCast?.list && getSpellsForClass(archCast.list, lv).some(s=>s.name===name)){ lvFound=lv; break; } }
        if(lvFound){ const key=`spells${lvFound}`; tmp[key]=[...(tmp[key]||[]), name]; }
      }
      for(let lv=1; lv<=9; lv++){
        const k=`spells${lv}`;
        if(tmp[k].length !== ((cd as any)[k]||[]).length) cdUpdates[k]=tmp[k];
        else if(tmp[k].length>0 && newSpells.some(n=> tmp[k].includes(n) && !((cd as any)[k]||[]).includes(n))) cdUpdates[k]=tmp[k];
      }
      // assicurati di inviare anche i livelli toccati
      for(let lv=1; lv<=9; lv++) if(tmp[`spells${lv}`].some((n:string)=> newSpells.includes(n))) cdUpdates[`spells${lv}`]=tmp[`spells${lv}`];
    }
    const prevSlots = (cd.spellSlots||{}) as Record<number,{total?:number;expended?:number}>;
    const newSlotObj: Record<number,{total:number;expended:number}> = {};
    for(const [k,v] of Object.entries(slotNew)) newSlotObj[Number(k)]={ total: v, expended: prevSlots[Number(k)]?.expended ?? 0 };
    cdUpdates.spellSlots = newSlotObj;
    if(hitDie) cdUpdates.hitDiceTotal = `${derivedLevel}d${hitDie}`;
    Object.assign(updates, cdUpdates);
    if(archChoice && needsArch) updates.archetype = archChoice;
    // anche salva max hp separato
    onApply(updates);
    setShow(false);
  };

  if(!show){
    return (
      <div className="veil-panel p-4 border-veil-gold/30">
        <div className="flex items-center justify-between"><h3 className="text-sm text-veil-gold font-medium">⚡ Pronto al livello {derivedLevel}!</h3><span className="text-[10px] text-white/30">{currentLevel} → {derivedLevel}</span></div>
        <p className="text-[11px] text-emerald-300/80 mt-2">Hai {gained} livello{gained>1?"i":""} da riscuotere. HP {Number(player.hp_max)||0} → {newHp}.</p>
        <button onClick={()=>setShow(true)} className="w-full mt-3 rounded-xl border border-veil-gold/40 bg-veil-gold/20 px-3 py-2.5 text-sm text-veil-gold font-medium hover:bg-veil-gold/30 transition">📜 Apri Scheda Avanzamento (Dado Vita, scelte, incantesimi)</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="veil-panel p-5 border-veil-gold/40 shadow-[0_0_40px_rgba(218,180,113,0.15)]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg text-veil-gold font-bold">⚡ Avanzamento al Livello {derivedLevel}</h2>
              <p className="text-[11px] text-white/40 mt-0.5">{player.character_name || "Personaggio"} · {clsData?.name || player.class} · {currentLevel} → {derivedLevel} {gained>1?`(+${gained} livelli)`: ""} · Dado Vita d{hitDie} · COS {con} ({conMod>=0?`+${conMod}`:conMod})</p>
            </div>
            <button onClick={()=>setShow(false)} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:text-white/80 transition">✕ Chiudi</button>
          </div>

          {/* DADO VITA */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 mb-5">
            <h3 className="text-sm text-emerald-300 font-medium">❤️ Dado Vita & PF Massimi</h3>
            <p className="text-[11px] text-white/35 mt-1 leading-relaxed">Per ogni livello dopo il 1° <strong className="text-white/60">tira fisicamente 1d{hitDie}</strong>, inserisci il risultato nella casella e il sistema aggiunge automaticamente <strong className="text-white/60">+ mod COS ({conMod>=0?`+${conMod}`:conMod})</strong>. Se preferisci la <strong className="text-white/60">media</strong> metti {Math.ceil((hitDie||0)/2)+1} (il manuale: metà dado arrotondata per eccesso +1). Al 1° livello hai già {hitDie}+{conMod} PF.</p>
            <div className="mt-3 grid gap-2">
              {Array.from({length:gained},(_,i)=> currentLevel+1+i).map(lv=>{
                const val = hpInputs[lv] ?? "";
                const computed = hpForLevel(lv);
                const isAvg = computed===avg;
                return (
                  <div key={lv} className="flex flex-wrap items-center gap-2 rounded-lg bg-black/30 border border-white/[0.06] p-3">
                    <span className="text-xs text-white/70 font-medium w-20">Livello {lv}</span>
                    <span className="text-[11px] text-white/30">d{hitDie} =</span>
                    <input type="number" min={1} max={hitDie} placeholder={`1-${hitDie}`}
                      className="veil-input w-20 text-center !py-1.5"
                      value={val}
                      onChange={e=> setHpInputs(p=> ({...p, [lv]: e.target.value}))}
                    />
                    <span className="text-white/20">+</span>
                    <span className="rounded bg-white/[0.06] border border-white/10 px-2 py-1 text-[11px] text-white/60">COS {conMod>=0?`+${conMod}`:conMod}</span>
                    <span className="text-white/20">=</span>
                    <span className={`rounded px-2.5 py-1 text-xs font-bold border ${computed!==null? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300":"bg-white/[0.04] border-white/10 text-white/30"}`}>{computed!==null? `+${computed} PF`:"— PF"}</span>
                    <div className="ml-auto flex gap-1">
                      <button onClick={()=> setHpInputs(p=> ({...p, [lv]: String(Math.ceil((hitDie||0)/2)+1)}))} className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/40 hover:bg-white/[0.08]">Media {Math.ceil((hitDie||0)/2)+1}</button>
                      <button onClick={()=> { const r=Math.floor(Math.random()* (hitDie||6))+1; setHpInputs(p=> ({...p, [lv]: String(r)})); }} className="rounded border border-veil-gold/20 bg-veil-gold/10 px-2 py-1 text-[10px] text-veil-gold/70 hover:bg-veil-gold/20">🎲 Tira</button>
                    </div>
                    {isAvg && <span className="text-[9px] text-white/25 ml-2">(media)</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/40 border border-veil-gold/20 px-3 py-2">
              <span className="text-[11px] text-white/50">PF massimi totali</span>
              <span className="text-sm font-bold text-emerald-300">{Number(player.hp_max)||0} → {newHp} <span className="text-white/30 font-normal">({hpGain>=0?`+${hpGain}`:hpGain})</span></span>
            </div>
            <p className="text-[9px] text-white/25 mt-1.5">I dadi vita totali diventano <strong className="text-white/40">{derivedLevel}d{hitDie}</strong>. Verranno aggiunti automaticamente al salvataggio.</p>
          </div>

          {/* PER LIVELLO: feature, spell, asi, archetipo */}
          <div className="space-y-4">
            {Array.from({length:gained},(_,i)=> currentLevel+1+i).map(lv=>{
              const feats = getFeaturesAtLevel(clsKey||"", lv);
              const isAsi = asiLevels.includes(lv);
              const isArch = needsArch && lv===archLevel;
              const slotsAt = getSpellSlotsAtLevel(clsKey||"", lv);
              const slotsPrev = getSpellSlotsAtLevel(clsKey||"", lv-1);
              const slotDiff = Object.entries(slotsAt).filter(([k,v])=> (slotsPrev[Number(k)]||0) !== v).map(([k,v])=> `${k}°:${(slotsPrev[Number(k)]||0)}→${v}`);
              const cantAt = getCantripsKnown(clsKey||"", lv);
              const cantPrev = getCantripsKnown(clsKey||"", lv-1);
              const knownAt = getSpellsKnownLimit(clsKey||"", lv);
              const knownPrev = getSpellsKnownLimit(clsKey||"", lv-1);
              const resources = getClassResources(clsKey||"").filter(r=>{
                const before = r.max(lv-1, {strength:Number(cd.strength), charisma:Number(cd.charisma), wisdom:Number(cd.wisdom)}, getProficiencyBonus(lv-1));
                const after = r.max(lv, {strength:Number(cd.strength), charisma:Number(cd.charisma), wisdom:Number(cd.wisdom)}, getProficiencyBonus(lv));
                return after!==before;
              });

              return (
                <div key={lv} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2"><p className="text-sm text-veil-gold font-bold">Livello {lv}</p><span className="text-[10px] text-white/30">PB {getProficiencyBonus(lv)>=0? `+${getProficiencyBonus(lv)}`: getProficiencyBonus(lv)}</span></div>

                  {feats.length>0 && (
                    <div className="mb-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/30 mb-1.5">Novità di classe (manuale)</p>
                      {feats.map(f=> (
                        <div key={f.name} className="rounded-lg bg-black/30 border border-white/[0.05] p-2.5 mb-1.5">
                          <p className="text-xs text-veil-gold/80 font-medium">✦ {f.name}</p>
                          <p className="text-[11px] text-white/45 mt-1 leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(slotDiff.length>0 || cantAt!==cantPrev || knownAt!==knownPrev || resources.length>0) && (
                    <div className="mb-3 rounded-lg bg-indigo-950/10 border border-indigo-500/15 p-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-indigo-300/60 mb-1.5">Magia & Risorse</p>
                      {slotDiff.length>0 && <p className="text-[11px] text-white/60">🔷 Slot: {slotDiff.join(" · ")}</p>}
                      {cantAt!==cantPrev && <p className="text-[11px] text-white/60">✨ Trucchetti conosciuti: {cantPrev} → {cantAt} {cantAt>cantPrev? `(+${cantAt-cantPrev} da scegliere sotto)`: ""}</p>}
                      {knownAt!==knownPrev && clsKey && ["bard","ranger","sorcerer","warlock"].includes(clsKey) && <p className="text-[11px] text-white/60">📖 Incantesimi conosciuti: {knownPrev} → {knownAt} (+{knownAt-knownPrev})</p>}
                      {knownAt!==knownPrev && clsKey && ["cleric","druid","wizard","paladin"].includes(clsKey) && <p className="text-[11px] text-white/60">📖 Preparati: puoi preparare {knownAt} incantesimi (mod. caratteristica + livello)</p>}
                      {resources.length>0 && <div className="mt-1.5 space-y-0.5">{resources.map(r=> <p key={r.key} className="text-[11px] text-white/50">{r.icon} {r.name}: nuovo max {r.max(lv,{strength:Number(cd.strength),charisma:Number(cd.charisma),wisdom:Number(cd.wisdom)}, getProficiencyBonus(lv))} ({r.restore})</p>)}</div>}
                      {Object.keys(slotsAt).length===0 && cantAt===cantPrev && knownAt===knownPrev && <p className="text-[11px] text-white/30">Nessun nuovo slot a questo livello.</p>}
                    </div>
                  )}

                  {isAsi && (
                    <div className="mb-3 rounded-lg bg-veil-gold/5 border border-veil-gold/20 p-3">
                      <p className="text-xs text-veil-gold font-medium">🎓 Incremento Punteggi Caratteristica</p>
                      <p className="text-[10px] text-white/35 mt-1">Scegli <strong className="text-white/60">+2 a una</strong> caratteristica <em>oppure</em> <strong className="text-white/60">+1 a due diverse</strong>. Max 20. Dal manuale PHB ogni 4 livelli (ladro/guerriero hanno livelli extra).</p>
                      <div className="mt-2 grid gap-2">
                        <label className="text-[10px] text-white/50">Opzione A — +2</label>
                        <select className="veil-input w-full text-xs" value={asiChoices[lv]?.type==="+2"? asiChoices[lv]!.ability:""} onChange={e=> setAsiChoices(p=> ({...p, [lv]: e.target.value? {type:"+2", ability:e.target.value}: null}))}>
                          <option value="">— Seleziona caratteristica —</option>
                          {ABILITY_KEYS.map(k=> <option key={k} value={k}>{ABILITY_LABELS[k]} ({Number(cd[k])||10} → {Math.min(20,(Number(cd[k])||10)+2)})</option>)}
                        </select>
                        <label className="text-[10px] text-white/50">Opzione B — +1 +1</label>
                        <div className="flex gap-2">
                          <select className="veil-input flex-1 text-xs" value={asiChoices[lv]?.type==="+1+1"? asiChoices[lv]!.abilities[0]:""} onChange={e=> { const v=e.target.value; setAsiChoices(p=> ({...p, [lv]: v? {type:"+1+1", abilities:[v, (p[lv] as any)?.abilities?.[1]||v]}: null})); }}>
                            <option value="">—</option>{ABILITY_KEYS.map(k=> <option key={k} value={k}>{ABILITY_LABELS[k]}</option>)}
                          </select>
                          <select className="veil-input flex-1 text-xs" value={asiChoices[lv]?.type==="+1+1"? asiChoices[lv]!.abilities[1]:""} onChange={e=> { const v=e.target.value; setAsiChoices(p=> ({...p, [lv]: v? {type:"+1+1", abilities:[(p[lv] as any)?.abilities?.[0]||v, v]}: null})); }}>
                            <option value="">—</option>{ABILITY_KEYS.map(k=> <option key={k} value={k}>{ABILITY_LABELS[k]}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {isArch && archData && (
                    <div className="rounded-lg bg-violet-950/10 border border-violet-500/20 p-3">
                      <p className="text-xs text-violet-300 font-bold">🎭 Scelta {archData.label} — Livello {archLevel}</p>
                      <p className="text-[10px] text-white/35 mt-1">Scegli <strong className="text-white/60">una via</strong>. Determina abilità, incantesimi e risorse per tutto il resto della carriera. Non potrai cambiarla senza accordo DM.</p>
                      <div className="mt-3 grid gap-3">
                        {archData.options.map(opt=>{
                          const abs = getArchetypeAbilities(opt.key);
                          const cast = getArchetypeCasting(opt.key);
                          const selected = archChoice===opt.key;
                          return (
                            <label key={opt.key} className={`block text-left rounded-xl border p-3 cursor-pointer transition ${selected? "bg-violet-500/15 border-violet-400/40 shadow-[0_0_18px_rgba(139,92,246,0.15)]":"bg-black/30 border-white/[0.06] hover:border-violet-500/30"}`}>
                              <div className="flex items-center gap-2">
                                <input type="radio" name="arch" checked={selected} onChange={()=> setArchChoice(opt.key)} className="accent-violet-500"/>
                                <span className="text-sm font-bold text-violet-200">{opt.name}</span>
                                {cast && <span className="ml-auto rounded-full bg-violet-500/20 border border-violet-400/25 px-2 py-0.5 text-[9px] text-violet-200">{cast.ki? "Ki spells":"Sblocca magia"}</span>}
                              </div>
                              <p className="text-[11px] text-white/55 mt-2 leading-relaxed">{opt.description}</p>
                              <div className="mt-2 rounded bg-black/30 border border-white/[0.04] p-2.5">
                                <p className="text-[9px] uppercase tracking-[0.12em] text-violet-300/60">Cosa aggiunge</p>
                                {cast && <p className="text-[11px] text-indigo-300/70 mt-1">✨ {cast.label}</p>}
                                {abs.length>0 ? abs.map(a=> (
                                  <div key={a.key} className="mt-1.5">
                                    <p className="text-[11px] text-white/75 font-medium">• {a.name} <span className="text-[9px] text-white/30 font-normal">— {a.action} · {a.uses} {a.die? `· ${a.die}`:""}</span></p>
                                    <p className="text-[10px] text-white/40 leading-snug">{a.effect}</p>
                                  </div>
                                )) : <p className="text-[10px] text-white/30 mt-1">Capacità passive / potenziamenti descritti sopra.</p>}
                                <p className="text-[9px] text-white/25 mt-2"><strong className="text-white/40">Come si usa:</strong> {abs[0]?.action || "vedi effetto"} — cerca la capacità nel tab Incantesimi & Capacità e nel pannello Combattimento una volta salvato.</p>
                              </div>
                              <p className="text-[9px] text-white/25 mt-2"><strong className="text-white/40">Cosa devi selezionare:</strong> clicca il pallino per scegliere <em>{opt.name}</em>.</p>
                              <p className="text-[9px] text-white/25"><strong className="text-white/40">Cosa modifica:</strong> aggiunge le capacità sopra + eventuali incantesimi/lingue/competenze permanenti.</p>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scelta incantesimi nuovi globali */}
          {(cantDelta > 0 || knownDelta > 0 || (clsKey === "wizard" && wizardSpellbookDelta > 0)) && (
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-950/10 p-4">
              <h3 className="text-sm text-blue-200 font-medium">🔮 Nuovi Incantesimi da scegliere</h3>
              {isPreparedCaster && clsKey !== "wizard" && (
                <p className="text-[11px] text-emerald-300/80 mt-1">
                  {clsKey === "cleric" && "🙏 Chierico: conosci automaticamente TUTTI gli incantesimi da chierico per i livelli di slot che hai."}
                  {clsKey === "druid" && "🌿 Druido: conosci automaticamente TUTTI gli incantesimi da druido per i livelli di slot che hai."}
                  {clsKey === "paladin" && "⚔️ Paladino: conosci automaticamente TUTTI gli incantesimi da paladino per i livelli di slot che hai."}
                </p>
              )}
              {clsKey === "wizard" && wizardSpellbookDelta > 0 && (
                <p className="text-[11px] text-indigo-300/80 mt-1">
                  📖 Mago: aggiungi <strong>{wizardSpellbookDelta}</strong> incantesimi a tua scelta al tuo libro degli incantesimi (di livello per cui hai slot).
                </p>
              )}
              {!isPreparedCaster && (
                <p className="text-[11px] text-white/35 mt-1">Manuale PHB: al livello {derivedLevel} ottieni {cantDelta>0? `${cantDelta} trucchetto${cantDelta>1?"i":""}`:""} {cantDelta>0 && knownDelta>0? "e":""} {knownDelta>0? `${knownDelta} incantesimo${knownDelta>1?"i":""} nuovo${knownDelta>1?"i":""}`:""}. Selezionali qui sotto.</p>
              )}

              {cantDelta>0 && (
                <div className="mt-3">
                  <p className="text-xs text-white/70 mb-1.5">Trucchetti ({newCantrips.length}/{cantDelta}) — clicca una carta per selezionare</p>
                  <div className="grid gap-2 max-h-[420px] overflow-y-auto pr-1">
                    {availableCantrips.map(s=>{
                      const sel = newCantrips.includes(s.name);
                      const dl = (s.description||"").toLowerCase();
                      const isAtk = dl.includes("tiro per colpire")||dl.includes("tiro a distanza")||dl.includes("tiro in mischia");
                      const hasSave = dl.includes("deve superare un ts")||dl.includes("tiro salvezza")||dl.includes(" ts ");
                      return (
                        <button key={s.name} type="button" onClick={()=> toggleCantrip(s.name)} className={`text-left rounded-xl border p-3 transition ${sel? "bg-blue-500/15 border-blue-400/40":"bg-black/30 border-white/[0.06] hover:border-blue-500/30"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white/85">{s.name}</p>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${sel? "bg-blue-500/20 border-blue-400/30 text-blue-200":"bg-white/[0.04] border-white/10 text-white/40"}`}>{sel? "✓ Selezionato":"Seleziona"}</span>
                          </div>
                          <p className="text-[10px] text-white/35 mt-0.5">{s.school} · {s.castingTime} · {s.range} · {s.components} · Durata: {s.duration}</p>
                          <p className="text-[11px] text-white/45 mt-2 leading-relaxed">{s.description}</p>
                          <div className="mt-2 rounded bg-indigo-900/15 border border-indigo-500/15 px-2.5 py-1.5">
                            <p className="text-[10px] text-white/30"> <strong className="text-white/50">Costo:</strong> trucchetto — a volontà, non consuma slot. {isAtk? `Tiro per colpire: 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} (CAR ${abilityShort[spellAbilityKey||""]||""} ${spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+PB +${pbNew}) vs CA.`:""} {hasSave? `Tiro salvezza CD ${spellDC} (8+${spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+${pbNew}).`:""}</p>
                          </div>
                        </button>
                      );
                    })}
                    {availableCantrips.length===0 && <span className="text-[11px] text-white/30">Nessun trucchetto disponibile.</span>}
                  </div>
                </div>
              )}
              {(knownDelta>0 || (clsKey === "wizard" && wizardSpellbookDelta > 0)) && (
                <div className="mt-4">
                  <p className="text-xs text-white/70 mb-1.5">
                    {clsKey === "wizard"
                      ? `Incantesimi per il libro ({newSpells.length}/{wizardSpellbookDelta}) — fino a {Math.max(...Object.keys(slotNew).map(n=>Number(n)),1)}° livello`
                      : `Incantesimi ({newSpells.length}/{knownDelta}) — fino a {Math.max(...Object.keys(slotNew).map(n=>Number(n)),1)}° livello — clicca la carta per selezionare`
                    }
                  </p>
                  <div className="grid gap-2 max-h-[520px] overflow-y-auto pr-1">
                    {availableSpells.slice(0,80).map(s=>{
                      const sel = newSpells.includes(s.name);
                      const lvl = (s as any).level;
                      const dl = (s.description||"").toLowerCase();
                      const isAtk = dl.includes("tiro per colpire")||dl.includes("tiro a distanza")||dl.includes("tiro in mischia");
                      const hasSave = dl.includes("deve superare un ts")||dl.includes("tiro salvezza")||dl.includes(" ts ");
                      const diceMatch = s.description.match(/\d+d\d+(\s*\+\s*\d+)?/g);
                      return (
                        <button key={s.name} type="button" onClick={()=> toggleSpell(s.name)} className={`text-left rounded-xl border p-3 transition ${sel? "bg-veil-gold/12 border-veil-gold/30":"bg-black/30 border-white/[0.06] hover:border-veil-gold/25"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div><p className="text-sm font-medium text-white/85">{s.name} <span className="text-[11px] text-white/30 font-normal">— {lvl}° livello</span></p><p className="text-[10px] text-white/35">{s.school} · {s.castingTime} · {s.range} · {s.components} · {s.duration}</p></div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${sel? "bg-veil-gold/20 border-veil-gold/30 text-veil-gold":"bg-white/[0.04] border-white/10 text-white/40"}`}>{sel? "✓ Selezionato":"Seleziona"}</span>
                          </div>
                          <p className="text-[11px] text-white/45 mt-2 leading-relaxed">{s.description}</p>
                          <div className="mt-2 rounded bg-black/40 border border-white/[0.06] px-2.5 py-1.5 space-y-1">
                            <p className="text-[10px] text-white/35"><strong className="text-white/60">Costo:</strong> 1 slot di {lvl}° livello {lvl>1? `(o superiore per potenziarlo — vedi descrizione)`: ""}.</p>
                            {diceMatch && <p className="text-[10px] text-veil-gold/60"><strong className="text-veil-gold/80">Dadi:</strong> {diceMatch.slice(0,3).join(" · ")} — tira i dadi indicati; aggiungi mod. {abilityShort[spellAbilityKey||""]||""} se la descrizione lo dice (es. Cura Ferite 1d8+{spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}).</p>}
                            {(isAtk||hasSave) && <p className="text-[10px] text-indigo-200/70">{isAtk? `🎲 Tiro per colpire: 1d20 ${spellAtk>=0?`+${spellAtk}`:spellAtk} vs CA. `:""}{hasSave? `🛡️ Bersaglio: tiro salvezza vs CD ${spellDC}. `:""}<span className="text-white/25">(CD 8+{spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+{pbNew} · Atk {spellAbilityMod>=0?`+${spellAbilityMod}`:spellAbilityMod}+{pbNew})</span></p>}
                            <p className="text-[9px] text-white/25"><strong className="text-white/35">Come si casta:</strong> {s.castingTime} — in combattimento conta come {s.castingTime.toLowerCase().includes("bonus")? "azione bonus": s.castingTime.toLowerCase().includes("reazione")? "reazione":"azione"}. Componenti {s.components}.</p>
                          </div>
                        </button>
                      );
                    })}
                    {availableSpells.length===0 && <span className="text-[11px] text-white/30">Nessun incantesimo disponibile.</span>}
                  </div>
                  <p className="text-[9px] text-white/25 mt-1">Mostrati i primi 80 disponibili (filtrati per classe). Dopo il passaggio di livello puoi aggiungerne altri dalla scheda Incantesimi.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button onClick={apply} disabled={needsArch && !archChoice} className="flex-1 rounded-xl border border-veil-gold/40 bg-veil-gold/20 px-4 py-3 text-sm font-bold text-veil-gold hover:bg-veil-gold/30 transition disabled:opacity-40 disabled:cursor-not-allowed">⚡ Conferma e Sali a Livello {derivedLevel} — PF {newHp} · PB +{getProficiencyBonus(derivedLevel)}</button>
            <button onClick={()=>setShow(false)} className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/50 hover:border-white/20">Annulla</button>
          </div>
          {needsArch && !archChoice && <p className="text-[11px] text-amber-300/70 mt-2 text-center">Devi scegliere una {archData?.label} per continuare.</p>}
          <p className="text-[9px] text-white/25 mt-2 text-center">Le modifiche seguono il PHB 5e. Puoi sempre correggere caratteristiche/incantesimi nella scheda dopo.</p>
        </div>
      </div>
    </div>
  );
}
