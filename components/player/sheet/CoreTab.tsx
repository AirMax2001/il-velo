"use client";
import { useState, useEffect } from "react";
import type { CharacterData } from "@/lib/types";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { SKILL_DESCRIPTIONS } from "@/components/shared/AbilityReferenceTables";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import races from "@/lib/data/races";
import { getRaceData, findRaceKey, getSubRaceData } from "@/lib/data/races";
import { levelFromXp, xpForLevel } from "@/lib/data/leveling";
import { getClassData } from "@/lib/data/classes";
import { getArchetypeForClass } from "@/lib/data/classAbilities";
import { getModifier, ALL_ABILITIES, ALL_SKILLS, ALL_SAVES, SKILL_ABILITY, SAVE_ABILITY, ABILITY_SHORT, SKILL_LABELS, SAVE_LABELS } from "@/lib/characterEngine";
import { LevelUpPanel } from "@/components/player/LevelUpPanel";
import { RacePopup } from "@/components/player/RacePopup";
import { ClassPopup } from "@/components/player/ClassPopup";
import { StatBox, SuggestField, CollapseSection } from "./ui";
import type { SheetCtx } from "./types";

const ABILITY_KEYS = ALL_ABILITIES;
const SKILL_LIST = ALL_SKILLS.map(k => ({ key: k, label: SKILL_LABELS[k], ability: SKILL_ABILITY[k] }));
const SAVE_LIST = (ALL_SAVES as readonly string[]).map(k => ({ key: k, label: SAVE_LABELS[k as any], ability: SAVE_ABILITY[k as any] }));

function resizeImage(file: File, maxDim: number, quality: number, cb: (dataUrl: string) => void) {
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
    cb(c.toDataURL("image/jpeg", quality));
  };
  img.src = URL.createObjectURL(file);
}

export function CoreTab({ ctx }: { ctx: SheetCtx }) {
  const { form, cd, clsKey, clsData, raceData, bgData, level, pb, expectedHP, hitDie, conMod, dexMod, raceSpeed, upd, updCd, updCdAll, save, onLevelUp, dmMode } = ctx;

  const [isDesktop, setIsDesktop] = useState(false);
  const [xpAdd, setXpAdd] = useState("");
  const [xpError, setXpError] = useState("");
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showRacePopup, setShowRacePopup] = useState(false);
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [showCharPopup, setShowCharPopup] = useState(false);
  const [saveInfoOpen, setSaveInfoOpen] = useState(false);
  const [abilityInfoOpen, setAbilityInfoOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  const derivedLevel = levelFromXp(Number(form?.xp) || 0);
  const canLevel = derivedLevel > level;
  const nextXp = xpForLevel(level + 1);

  function applyXp(sign: 1 | -1) {
    setXpError("");
    const add = Number(xpAdd);
    if (!xpAdd || isNaN(add) || add <= 0) { setXpError("Inserisci un numero valido."); return; }
    const total = Math.max(0, (Number(form?.xp) || 0) + sign * add);
    const derivedAfter = levelFromXp(total);
    if (derivedAfter < level) {
      upd("xp", total);
      upd("level", derivedAfter);
      save({ xp: total, level: derivedAfter });
    } else {
      upd("xp", total);
      save({ xp: total });
    }
    setXpAdd("");
    if (derivedAfter < level) setShowLevelUp(false);
  }

  const subRaceKey = cd.subRaceKey || "";

  return (
    <div className="space-y-4">
      {/* Avatar + Info principale */}
      <div className="veil-panel p-3">
        {/* Mobile: vertical layout */}
        <div className="flex flex-col gap-3 sm:hidden">
          {/* Avatar top-left, name+book and race/class to the right */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 -mt-1">
              <PlayerAvatar url={form?.avatar_url} name={form?.character_name} size="xl" />
              <label className="cursor-pointer rounded border border-veil-gold/20 px-1.5 py-0.5 text-[9px] text-veil-gold/50 hover:bg-veil-gold/10 hover:text-veil-gold transition text-center">
                {form?.avatar_url ? "Modifica" : "Immagine"}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  resizeImage(file, 200, 0.6, dataUrl => {
                    upd("avatar_url", dataUrl);
                    save({ avatar_url: dataUrl });
                  });
                }} />
              </label>
              {form?.avatar_url && (
                <button onClick={() => { upd("avatar_url", ""); save({ avatar_url: "" }); }} className="text-[9px] text-red-300/40 hover:text-red-300">Rimuovi</button>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2 min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">{form?.character_name || "—"}</h2>
                <button onClick={() => setShowCharPopup(true)} className="shrink-0 rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 transition cursor-pointer font-medium" title="Personaggio" aria-label="Personaggio">📖</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { const rk = findRaceKey(form?.race || ""); if(rk) setShowRacePopup(true); }} className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 hover:border-veil-gold/50 transition cursor-pointer shrink-0 font-medium">
                  {form?.race || "—"}
                </button>
                <button type="button" onClick={() => setShowClassPopup(true)} className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 hover:border-veil-gold/50 transition cursor-pointer shrink-0 font-medium">
                  {form?.class || "—"}
                </button>
                {canLevel && <button onClick={()=>setShowLevelUp(true)} className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 text-[12px] text-emerald-300 font-medium animate-pulse shrink-0">⚡ Lv {derivedLevel} pronto!</button>}
              </div>
            </div>
          </div>
          {/* EXP row */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">Lv {level}</span>
              <span className="text-sm font-bold text-veil-gold">{Number(form?.xp||0).toLocaleString("it-IT")} XP</span>
              <span className="text-[10px] text-white/30">{canLevel ? <span className="text-emerald-300">pronto al passaggio</span> : ` / ${nextXp.toLocaleString("it-IT")} al Lv ${level+1}`}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="number" min={1} placeholder="+XP" className="veil-input w-16 min-w-0 text-xs !py-1 !px-2" value={xpAdd} onChange={e=>{setXpAdd(e.target.value); setXpError("");}} onKeyDown={e=> e.key==="Enter" && applyXp(1)} />
              {dmMode && <button onClick={()=>applyXp(-1)} className="shrink-0 rounded-lg border border-red-400/30 bg-red-900/10 px-2 py-1 text-[11px] text-red-300/80 hover:bg-red-900/20 transition" title="Solo DM">−</button>}
              <button onClick={()=>applyXp(1)} className="shrink-0 rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-2 py-1 text-[11px] text-veil-gold hover:bg-veil-gold/20 transition">+ Aggiungi</button>
              {canLevel && <button onClick={()=>setShowLevelUp(true)} className="shrink-0 rounded-lg border border-veil-gold/30 bg-veil-gold/15 px-2.5 py-1 text-[11px] text-veil-gold font-medium">📜 Avanza</button>}
            </div>
            {xpError && <p className="w-full text-[11px] text-red-300">{xpError}</p>}
          </div>
        </div>

        {/* Desktop: original horizontal layout */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex flex-col items-center gap-1 -mt-1">
            <PlayerAvatar url={form?.avatar_url} name={form?.character_name} size="xl" />
            <label className="cursor-pointer rounded border border-veil-gold/20 px-1.5 py-0.5 text-[9px] text-veil-gold/50 hover:bg-veil-gold/10 hover:text-veil-gold transition text-center">
              {form?.avatar_url ? "Modifica" : "Immagine"}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                resizeImage(file, 200, 0.6, dataUrl => {
                  upd("avatar_url", dataUrl);
                  save({ avatar_url: dataUrl });
                });
              }} />
            </label>
            {form?.avatar_url && (
              <button onClick={() => { upd("avatar_url", ""); save({ avatar_url: "" }); }} className="text-[9px] text-red-300/40 hover:text-red-300">Rimuovi</button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-white truncate">{form?.character_name || "—"}</h2>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { const rk = findRaceKey(form?.race || ""); if(rk) setShowRacePopup(true); }} className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 hover:border-veil-gold/50 transition cursor-pointer shrink-0 font-medium">
                    {form?.race || "—"}
                  </button>
                  <button type="button" onClick={() => setShowClassPopup(true)} className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 hover:border-veil-gold/50 transition cursor-pointer shrink-0 font-medium">
                    {form?.class || "—"}
                  </button>
                  {canLevel && <button onClick={()=>setShowLevelUp(true)} className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1.5 text-[12px] text-emerald-300 font-medium animate-pulse shrink-0">⚡ Lv {derivedLevel} pronto!</button>}
                </div>
              </div>
              <button onClick={() => setShowCharPopup(true)} className="shrink-0 rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-1.5 text-[12px] text-veil-gold hover:bg-veil-gold/20 transition cursor-pointer font-medium" title="Personaggio" aria-label="Personaggio">📖</button>
            </div>
            <div className="mt-2 flex items-center gap-2 overflow-hidden">
              <span className="text-sm font-bold text-white">Lv {level}</span>
              <span className="text-sm font-bold text-veil-gold">{Number(form?.xp||0).toLocaleString("it-IT")} XP</span>
              <span className="text-[10px] text-white/30">{canLevel ? <span className="text-emerald-300">pronto al passaggio</span> : ` / ${nextXp.toLocaleString("it-IT")} al Lv ${level+1}`}</span>
              <div className="ml-auto flex items-center gap-1.5">
                <input type="number" min={1} placeholder="+XP" className="veil-input w-16 min-w-0 text-xs !py-1 !px-2" value={xpAdd} onChange={e=>{setXpAdd(e.target.value); setXpError("");}} onKeyDown={e=> e.key==="Enter" && applyXp(1)} />
                {dmMode && <button onClick={()=>applyXp(-1)} className="shrink-0 rounded-lg border border-red-400/30 bg-red-900/10 px-2 py-1 text-[11px] text-red-300/80 hover:bg-red-900/20 transition" title="Solo DM">−</button>}
                <button onClick={()=>applyXp(1)} className="shrink-0 rounded-lg border border-veil-gold/30 bg-veil-gold/10 px-2 py-1 text-[11px] text-veil-gold hover:bg-veil-gold/20 transition">+ Aggiungi</button>
                {canLevel && <button onClick={()=>setShowLevelUp(true)} className="shrink-0 rounded-lg border border-veil-gold/30 bg-veil-gold/15 px-2.5 py-1 text-[11px] text-veil-gold font-medium">📜 Avanza</button>}
              </div>
              {xpError && <p className="w-full text-[11px] text-red-300">{xpError}</p>}
            </div>
          </div>
        </div>
      </div>
      {showLevelUp && canLevel && (
        <LevelUpPanel player={form || ({} as any)} onApply={(u)=>{ onLevelUp(u); setShowLevelUp(false); }} />
      )}

      {/* Stats veloci: CA / Iniziativa / Velocità / PB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="veil-panel p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35 mb-1">Classe Armatura</p>
          <div className="text-xl font-bold text-white">{cd.armorClass || "—"}</div>
        </div>
        <StatBox label="Iniziativa" value={dexMod >= 0 ? `+${dexMod}` : `${dexMod}`} sub="DES mod" />
        <div className="veil-panel p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">Velocità</p>
          <div className="text-xl font-bold text-white">{cd.speed || raceSpeed || "—"}</div>
          <p className="text-[9px] text-white/20 mt-0.5">{raceSpeed ? `razza: ${raceSpeed}m` : "metri"}</p>
        </div>
        <StatBox label="Bon. Competenza" value={`+${pb}`} sub={`liv. ${level}`} />
      </div>

      {/* Caratteristiche */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Caratteristiche</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ABILITY_KEYS.map(k => {
            const base = Number(cd[k as keyof CharacterData]) || 10;
            const mod = getModifier(base);
            return (
              <div key={k} className="text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/35 mb-1">{ABILITY_SHORT[k]}</p>
                <div className="veil-input w-full text-center text-lg font-bold px-1 pointer-events-none opacity-80 bg-black/20">{base}</div>
                <p className="text-base text-veil-gold font-bold mt-1">{mod >= 0 ? `+${mod}` : `${mod}`}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tiri Salvezza */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm text-veil-gold/80 font-medium">Tiri Salvezza</h3>
          <button onClick={()=>setSaveInfoOpen(o=>!o)} className="w-5 h-5 rounded-full border border-veil-gold/20 bg-veil-gold/10 flex items-center justify-center text-[10px] text-veil-gold/70 hover:bg-veil-gold/20 transition" title="Mostra descrizione">i</button>
        </div>
        {saveInfoOpen && (
          <>
            <p className="text-[10px] text-white/30 mb-3 leading-relaxed">
              I tiri salvezza servono per resistere a effetti avversi: incantesimi, trappole, veleni,
              pericoli ambientali. Quando un effetto ti colpisce, tiri <strong className="text-white/50">1d20</strong> e sommi il
              modificatore dell'abilità corrispondente; se la caratteristica è tra le competenze della tua classe
              (checkbox attiva), aggiungi anche il <strong className="text-white/50">Bonus di Competenza (+{pb})</strong>.
              Il risultato deve superare la CD dell'effetto (es. la CD Incantatore di un mago nemico).
            </p>
            {clsData && (
              <p className="text-[10px] text-white/30 mb-2">
                Competenze dalla classe: {clsData.savingThrows.map(s => {
                  const found = SAVE_LIST.find(sl => sl.key === s);
                  return found?.label || s;
                }).join(", ")} · non modificabili
              </p>
            )}
          </>
        )}
        {(() => {
          const filtered = SAVE_LIST.filter(sv => {
            const isClassSave = clsData?.savingThrows.includes(sv.key as any) || false;
            const monkAllSaves = ctx.clsKey === "monk" && level >= 14;
            return isClassSave || monkAllSaves;
          });
          if (filtered.length === 0) return <p className="text-[11px] text-white/25 text-center py-2">Nessun tiro salvezza competente a questo livello.</p>;
          return (
            <div className="flex flex-wrap justify-center gap-2">
              {filtered.map(sv => {
                const score = Number(cd[sv.ability as keyof CharacterData]) || 10;
                const mod = getModifier(score);
                const total = mod + pb;
                const monkAll = ctx.clsKey === "monk" && level >= 14;
                return (
                  <div key={sv.key} className="flex items-center justify-center gap-2 rounded-xl border border-veil-gold/25 bg-veil-gold/[0.07] px-4 py-2 min-w-[140px] text-center">
                    <span className="text-xs text-white/85">{sv.label}</span>
                    <span className="text-xs font-bold text-veil-gold">{total >= 0 ? `+${total}` : `${total}`}</span>
                    {monkAll && <span className="text-[9px] text-veil-gold/30">monaco</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Abilità */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm text-veil-gold/80 font-medium">Abilità</h3>
          <button onClick={()=>setAbilityInfoOpen(o=>!o)} className="w-5 h-5 rounded-full border border-veil-gold/20 bg-veil-gold/10 flex items-center justify-center text-[10px] text-veil-gold/70 hover:bg-veil-gold/20 transition" title="Mostra descrizioni">i</button>
        </div>
        {abilityInfoOpen && (
          <>
            {clsData && (
              <p className="text-[10px] text-white/30 mb-2">
                {clsData.skillPicks} abilità dalla classe ·
                {bgData && ` ${bgData.skillProficiencies.length} dal background`}
                {raceData?.proficiencies?.skills?.length ? ` · ${raceData.proficiencies.skills.length} dalla razza` : ""}
              </p>
            )}
            <p className="text-[10px] text-white/20 mb-2">
              Puoi selezionare solo abilità della lista della classe. Le abilità di background e razza sono automatiche.
            </p>
            <p className="text-[10px] text-white/25 mb-3 leading-snug border border-white/[0.04] bg-black/20 rounded-lg px-2.5 py-2">
              <span className="text-veil-gold/60 font-medium">Come si tira:</span> d20 + mod. caratteristica + competenza (se spuntata).<br />
              Esempio <strong className="text-white/50">Atletica</strong> per Monaco Tiefling con FOR 16 (+3) e competenza: <span className="text-white/60">d20 +3 (FOR) +2 (competenza) = d20+5</span>. Lanci un d20 fisico e sommi +5.
            </p>
          </>
        )}
        {(() => {
          const selected = SKILL_LIST.filter(sk => (cd as any)[sk.key]);
          if (selected.length === 0) return <p className="text-[11px] text-white/25 text-center py-2">Nessuna abilità selezionata.</p>;
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {selected.map(sk => {
                const isBgSkill = bgData?.skillProficiencies.includes(sk.key) || false;
                const isRaceSkill = raceData?.proficiencies?.skills?.includes(sk.key) || false;
                const isLocked = isBgSkill || isRaceSkill;
                const score = Number(cd[sk.ability as keyof CharacterData]) || 10;
                const mod = getModifier(score);
                const total = mod + pb;
                const source = isBgSkill ? "background" : isRaceSkill ? "razza" : "classe";
                return (
                  <div key={sk.key} className={`flex flex-col rounded-lg border px-2.5 py-1.5 text-sm ${isLocked ? "border-emerald-500/25 bg-emerald-900/[0.09]" : "border-veil-gold/25 bg-veil-gold/[0.07]"}`}>
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1 text-xs text-white/85 font-medium">{sk.label}</span>
                      <span className="text-[10px] text-white/30">{ABILITY_SHORT[sk.ability]}</span>
                      <span className="text-xs font-bold w-8 text-right text-veil-gold">{total >= 0 ? `+${total}` : `${total}`}</span>
                      {isBgSkill && <span className="text-[9px] text-emerald-400/50">BG</span>}
                      {isRaceSkill && !isBgSkill && <span className="text-[9px] text-emerald-400/50">razza</span>}
                      {!isLocked && <span className="text-[9px] text-veil-gold/40">cls</span>}
                    </div>
                    {abilityInfoOpen && (
                      <>
                        <p className="text-[10px] text-white/25 pl-6 pt-1 leading-snug">{SKILL_DESCRIPTIONS[sk.label]}</p>
                        <div className="ml-6 mt-1.5 rounded-md bg-black/25 border border-white/[0.05] px-2 py-1.5">
                          <p className="text-[8px] uppercase tracking-[0.12em] text-veil-gold/40 mb-1">Aggiungici al d20</p>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/60">{ABILITY_SHORT[sk.ability]} {mod >= 0 ? `+${mod}` : mod}</span>
                            <span className="text-white/20 text-[10px]">+</span>
                            <span className="rounded bg-veil-gold/10 border border-veil-gold/15 px-1.5 py-0.5 text-[10px] text-veil-gold/70">comp. +{pb} <span className="text-[8px] opacity-50">({source})</span></span>
                            <span className="text-white/20 text-[10px]">=</span>
                            <span className="rounded bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">{total >= 0 ? `+${total}` : total}</span>
                          </div>
                          <p className="text-[9px] text-white/25 mt-1">→ 1d20 {total >= 0 ? `+${total}` : total}</p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

        {showRacePopup && (
          <RacePopup
            raceKey={findRaceKey(form?.race || "") || ""}
            subRaceKey={cd.subRaceKey}
            onClose={() => setShowRacePopup(false)}
          />
        )}
        {showClassPopup && (
          <ClassPopup
            clsKey={clsKey}
            clsData={clsData}
            level={level}
            cd={cd}
            onClose={() => setShowClassPopup(false)}
            onPickArchetype={(key) => {
              const arch = clsKey ? getArchetypeForClass(clsKey) : null;
              const req = arch?.level ?? 999;
              if (level < req) return;
              updCd("archetype", key); save({ archetype: key });
            }}
          />
        )}

        {/* Popup Personaggio — tratti, storia, aspetto, background, lingue */}
        {showCharPopup && (
          <div className="fixed inset-0 z-[80] bg-[#05070d]/90 backdrop-blur-md overflow-y-auto" onClick={() => setShowCharPopup(false)}>
            <div className="mx-auto max-w-2xl px-4 py-6" onClick={e => e.stopPropagation()}>
              <div className="veil-panel p-5 border-veil-gold/40 shadow-[0_0_40px_rgba(218,180,113,0.15)]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg text-veil-gold font-bold">📖 Personaggio</h2>
                  <button onClick={() => setShowCharPopup(false)} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-white/20 hover:text-white/80 transition">✕ Chiudi</button>
                </div>

                {/* Tratti di personalità */}
                <div className="mb-4">
                  <h3 className="text-sm text-veil-gold/80 font-medium mb-2">
                    Tratti {bgData && <span className="text-[10px] text-white/30 font-normal ml-1">Background: {bgData.name}</span>}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SuggestField label="Tratti di Personalità" fieldKey="personalityTraits" value={cd.personalityTraits || ""} suggestions={bgData?.personalityTraits || []}
                      onChange={v => updCd("personalityTraits", v)} onPick={v => save({ personalityTraits: v })}
                      onBlur={() => save({ personalityTraits: ctx.formRef.current?.character_data?.personalityTraits })} />
                    <SuggestField label="Ideali" fieldKey="ideals" value={cd.ideals || ""} suggestions={bgData?.ideals || []}
                      onChange={v => updCd("ideals", v)} onPick={v => save({ ideals: v })}
                      onBlur={() => save({ ideals: ctx.formRef.current?.character_data?.ideals })} />
                    <SuggestField label="Legami" fieldKey="bonds" value={cd.bonds || ""} suggestions={bgData?.bonds || []} isTop
                      onChange={v => updCd("bonds", v)} onPick={v => save({ bonds: v })}
                      onBlur={() => save({ bonds: ctx.formRef.current?.character_data?.bonds })} />
                    <SuggestField label="Difetti" fieldKey="flaws" value={cd.flaws || ""} suggestions={bgData?.flaws || []} isTop
                      onChange={v => updCd("flaws", v)} onPick={v => save({ flaws: v })}
                      onBlur={() => save({ flaws: ctx.formRef.current?.character_data?.flaws })} />
                  </div>
                </div>

                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Storia e Motivazioni */}
                <div className="mb-4">
                  <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Storia e Motivazioni</h3>
                  <div className="space-y-3">
                    <div>
                      <LabelWithGuide fieldKey="history" label="Storia del Personaggio" />
                      <textarea className="veil-input mt-1 w-full min-h-[80px] text-sm"
                        value={form?.history || ""}
                        onChange={e => upd("history", e.target.value)}
                        onBlur={() => save({ history: ctx.formRef.current?.history })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <LabelWithGuide fieldKey="goals" label="Obiettivo" />
                        <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
                          value={form?.goals || ""}
                          onChange={e => upd("goals", e.target.value)}
                          onBlur={() => save({ goals: ctx.formRef.current?.goals })} />
                      </div>
                      <div>
                        <LabelWithGuide fieldKey="fear" label="Paura" />
                        <input type="text" className="veil-input mt-1 w-full text-sm"
                          value={form?.fear || ""}
                          onChange={e => upd("fear", e.target.value)}
                          onBlur={() => save({ fear: ctx.formRef.current?.fear })} />
                      </div>
                      <div>
                        <LabelWithGuide fieldKey="important_person" label="Persona Importante" />
                        <input type="text" className="veil-input mt-1 w-full text-sm"
                          value={form?.important_person || ""}
                          onChange={e => upd("important_person", e.target.value)}
                          onBlur={() => save({ important_person: ctx.formRef.current?.important_person })} />
                      </div>
                      <div>
                        <LabelWithGuide fieldKey="secret" label="Segreto" />
                        <textarea className="veil-input mt-1 w-full min-h-[50px] text-sm"
                          value={form?.secret || ""}
                          onChange={e => upd("secret", e.target.value)}
                          onBlur={() => save({ secret: ctx.formRef.current?.secret })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Aspetto Fisico */}
                <div className="mb-4">
                  <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Aspetto Fisico</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <LabelWithGuide fieldKey="age" label="Età" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={form?.age || ""}
                        onChange={e => upd("age", e.target.value)}
                        onBlur={() => save({ age: ctx.formRef.current?.age })} />
                    </div>
                    <div>
                      <LabelWithGuide fieldKey="height" label="Altezza" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={cd.height || ""} placeholder="180cm"
                        onChange={e => updCd("height", e.target.value)}
                        onBlur={() => save({ height: ctx.formRef.current?.character_data?.height })} />
                    </div>
                    <div>
                      <LabelWithGuide fieldKey="weight" label="Peso" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={cd.weight || ""} placeholder="80kg"
                        onChange={e => updCd("weight", e.target.value)}
                        onBlur={() => save({ weight: ctx.formRef.current?.character_data?.weight })} />
                    </div>
                    <div>
                      <LabelWithGuide fieldKey="eyes" label="Occhi" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={cd.eyes || ""} placeholder="Azzurri"
                        onChange={e => updCd("eyes", e.target.value)}
                        onBlur={() => save({ eyes: ctx.formRef.current?.character_data?.eyes })} />
                    </div>
                    <div>
                      <LabelWithGuide fieldKey="skin" label="Carnagione" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={cd.skin || ""} placeholder="Olivastra"
                        onChange={e => updCd("skin", e.target.value)}
                        onBlur={() => save({ skin: ctx.formRef.current?.character_data?.skin })} />
                    </div>
                    <div>
                      <LabelWithGuide fieldKey="hair" label="Capelli" />
                      <input type="text" className="veil-input mt-1 w-full text-sm"
                        value={cd.hair || ""} placeholder="Corvino, lungo"
                        onChange={e => updCd("hair", e.target.value)}
                        onBlur={() => save({ hair: ctx.formRef.current?.character_data?.hair })} />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Caratteristiche dal Background */}
                <div className="mb-4">
                  <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Caratteristiche dal Background</h3>
                  {bgData ? (
                    <div className="rounded-lg bg-black/20 border border-white/[0.06] p-3">
                      <p className="text-xs text-blue-400/70 font-medium">{bgData.feature.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{bgData.feature.description}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/30">Nessun background selezionato.</p>
                  )}
                </div>

                <div className="h-px bg-white/[0.06] mb-4" />

                {/* Lingue */}
                <div>
                  <h3 className="text-sm text-veil-gold/80 font-medium mb-2">Lingue</h3>
                  <p className="text-[10px] text-white/30 mb-1">
                    {raceData ? `Lingua/e dalla razza: ${raceData.languages.join(", ")}` : ""}
                    {bgData?.languages ? ` · ${bgData.languages} extra dal background` : ""}
                  </p>
                  <textarea className="veil-input w-full min-h-[60px] text-sm"
                    placeholder="Comune, Nanico, Elfico..."
                    value={cd.languages || raceData?.languages.join(", ") || ""}
                    onChange={e => updCd("languages", e.target.value)}
                    onBlur={() => save({ languages: ctx.formRef.current?.character_data?.languages })} />
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}