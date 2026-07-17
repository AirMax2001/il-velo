"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { getClassSavingThrows, getClassSkillPicks, getRaceStats } from "@/lib/dndClasses";

type Props = { player: Player; onUpdate: (p: Player) => void };

/* ── Point Buy cost table (D&D 5e: 27 punti, range 8-15 base) ── */
const POINT_BUY_MAX = 27;
function pointBuyCost(score: number): number {
  if (score <= 8) return 0;
  if (score === 9) return 1;
  if (score === 10) return 2;
  if (score === 11) return 3;
  if (score === 12) return 4;
  if (score === 13) return 5;
  if (score === 14) return 7;
  return 9; // 15
}
function totalPointsUsed(data: Record<string, any>): number {
  let total = 0;
  for (const k of ["strength","dexterity","constitution","intelligence","wisdom","charisma"]) {
    const s = Number(data[k]) || 8;
    total += s <= 8 ? 0 : pointBuyCost(Math.min(s, 15));
  }
  return total;
}

/* ── Sub-componenti fuori da CharacterSheet per evitare remount su ogni render ── */

function SheetInput({ fieldKey, label, value, onChange, onSave, narrow, type = "text", placeholder, onBlurExtra }: {
  fieldKey: string; label: string; value: any; onChange: (v: any) => void; onSave: (f: any) => void;
  narrow?: boolean; type?: string; placeholder?: string; onBlurExtra?: () => void;
}) {
  return (
    <div className={narrow ? "w-24" : ""}>
      <LabelWithGuide fieldKey={fieldKey} label={label} />
      <input
        type={type}
        className="veil-input mt-1 w-full"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={e => {
          const v = type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
          onChange(v);
        }}
        onBlur={() => { onSave({ [fieldKey]: value }); onBlurExtra?.(); }}
      />
    </div>
  );
}

function SheetTextarea({ fieldKey, label, value, onChange, onSave }: {
  fieldKey: string; label: string; value: any; onChange: (v: string) => void; onSave: (f: any) => void;
}) {
  return (
    <div>
      <LabelWithGuide fieldKey={fieldKey} label={label} />
      <textarea
        className="veil-input mt-1 w-full min-h-[60px]"
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        onBlur={() => onSave({ [fieldKey]: value })}
      />
    </div>
  );
}

function SaveBadge({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const cfg = { idle: ["border-white/10 text-white/45","pronta"], saving: ["border-veil-gold/40 text-veil-gold","salvataggio..."], saved: ["border-emerald-400/35 text-emerald-200","salvata"], error: ["border-red-400/35 text-red-200","errore"] }[state];
  return <span className={`rounded-full border px-2 py-1 text-xs ${cfg[0]}`}>{cfg[1]}</span>;
}

function mod(score: number | undefined): string {
  if (score == null) return "0";
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function parseConditions(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") try { return JSON.parse(raw); } catch { return []; }
  return [];
}

const abilityScoreKeys = ["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const;
const abilityLabels: Record<string, string> = { strength:"FOR", dexterity:"DES", constitution:"COS", intelligence:"INT", wisdom:"SAG", charisma:"CAR" };

const coinTypes = [{ key:"pp", label:"PP" }, { key:"gp", label:"GP" }, { key:"ep", label:"PE" }, { key:"sp", label:"SP" }, { key:"cp", label:"CP" }];

const skillKeys: { key: string; label: string; ability: string }[] = [
  { key:"skillAthletics", label:"Atletica", ability:"strength" },
  { key:"skillAcrobatics", label:"Acrobazia", ability:"dexterity" },
  { key:"skillSleightOfHand", label:"Rapidità di Mano", ability:"dexterity" },
  { key:"skillStealth", label:"Furtività", ability:"dexterity" },
  { key:"skillArcana", label:"Arcano", ability:"intelligence" },
  { key:"skillHistory", label:"Storia", ability:"intelligence" },
  { key:"skillInvestigation", label:"Indagare", ability:"intelligence" },
  { key:"skillNature", label:"Natura", ability:"intelligence" },
  { key:"skillReligion", label:"Religione", ability:"intelligence" },
  { key:"skillAnimalHandling", label:"Addestrare Animali", ability:"wisdom" },
  { key:"skillInsight", label:"Intuizione", ability:"wisdom" },
  { key:"skillMedicine", label:"Medicina", ability:"wisdom" },
  { key:"skillPerception", label:"Percezione", ability:"wisdom" },
  { key:"skillSurvival", label:"Sopravvivenza", ability:"wisdom" },
  { key:"skillDeception", label:"Inganno", ability:"charisma" },
  { key:"skillIntimidation", label:"Intimidire", ability:"charisma" },
  { key:"skillPerformance", label:"Intrattenere", ability:"charisma" },
  { key:"skillPersuasion", label:"Persuasione", ability:"charisma" },
];

/* ── Resize image to dataUrl (max dim, quality 0-1) ── */
function resizeImage(file: File, maxDim: number, quality: number, cb: (dataUrl: string) => void) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    cb(c.toDataURL("image/jpeg", quality));
  };
  img.src = URL.createObjectURL(file);
}

/* ── Componente principale ── */

export function CharacterSheet({ player, onUpdate }: Props) {
  const [form, setForm] = useState(player);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const playerRef = useRef(player);
  const formRef = useRef(form);
  formRef.current = form;
  const savingRef = useRef(false);

  useEffect(() => {
    if (player && player !== playerRef.current) {
      setForm(player);
      playerRef.current = player;
    }
  }, [player]);

  const upd = useCallback((key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }, []);
  const updCd = useCallback((key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), [key]: value } }));
  }, []);
  const updCdAll = useCallback((obj: Record<string, any>) => {
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), ...obj } }));
  }, []);

  const save = useCallback(async (fields: Partial<Player & CharacterData>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    const prevForm = formRef.current;
    setForm((prev: any) => ({ ...prev, ...fields }));
    setSaveState("saving");
    try {
      const body: any = { id: player.id };
      const cd: any = {};
      let hasCd = false;
      for (const [k, v] of Object.entries(fields)) {
        if (["character_name","race","class","level","xp","hp_current","hp_max","temp_hp","coins","conditions","age","personality","history","goals","fear","important_person","secret","background","dm_private_notes","player_name","avatar_url"].includes(k)) {
          body[k] = v;
        } else {
          cd[k] = v;
          hasCd = true;
        }
      }
      if (hasCd) {
        const cur = formRef.current;
        const curCd = cur?.character_data || {};
        body.character_data = { ...curCd, ...cd };
      }
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Salvataggio fallito");
      setForm(d.player);
      onUpdate(d.player);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      setForm(prevForm);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    } finally {
      savingRef.current = false;
    }
  }, [player.id, onUpdate]);

  const cd = form?.character_data || {};
  const attacks = Array.isArray(cd.attacks) ? cd.attacks : [];
  const spellSlots = (cd.spellSlots || {}) as Record<number, { total?: number; expended?: number }>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-veil-gold">Scheda personaggio</h2>
        <SaveBadge state={saveState} />
      </div>

      {/* Info Base */}
      <div className="veil-panel p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-full flex items-center gap-4">
          <PlayerAvatar url={form?.avatar_url} name={form?.character_name} size="xl" />
          <label className="cursor-pointer rounded-xl border border-veil-gold/20 px-3 py-2 text-xs text-veil-gold/60 hover:bg-veil-gold/10 hover:text-veil-gold transition">
            Carica immagine
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
            <button onClick={() => { upd("avatar_url", ""); save({ avatar_url: "" }); }}
              className="text-xs text-red-300/50 hover:text-red-300">Rimuovi</button>
          )}
        </div>
        <SheetInput fieldKey="character_name" label="Nome" value={form?.character_name} onChange={v => upd("character_name", v)} onSave={save} />
        <SheetInput fieldKey="race" label="Razza" value={form?.race} onChange={v => upd("race", v)} onSave={save} placeholder="Es: Elfo, Nano, Umano" />
        <SheetInput fieldKey="class" label="Classe" value={form?.class} onChange={v => upd("class", v)} onSave={save} placeholder="Es: Guerriero, Mago, Ladro"
          onBlurExtra={() => {
            const st = getClassSavingThrows(formRef.current?.class || "");
            if (st.length > 0) {
              const autoSt: Record<string, boolean> = {};
              abilityScoreKeys.forEach(k => {
                const stKey = "st" + k.charAt(0).toUpperCase() + k.slice(1);
                autoSt[stKey] = st.includes(stKey);
              });
              save(autoSt);
            }
          }} />
        <SheetInput fieldKey="level" label="Livello" value={form?.level} onChange={v => upd("level", v)} onSave={save} type="number" />
        <SheetInput fieldKey="background" label="Background" value={form?.background} onChange={v => upd("background", v)} onSave={save} placeholder="Es: Soldato, Accolito" />
        <SheetInput fieldKey="alignment" label="Allineamento" value={cd.alignment} onChange={v => updCd("alignment", v)} onSave={save} placeholder="es. Caotico Buono" />
        <SheetInput fieldKey="xp" label="XP" value={form?.xp} onChange={v => upd("xp", v)} onSave={save} type="number" />
      </div>

      {/* Info Razza */}
      {form?.race && (() => {
        const raceData = getRaceStats(form.race);
        if (!raceData) return null;
        const bonuses = Object.entries(raceData.abilityBonuses).filter(([, v]) => v > 0);
        return (
          <div className="veil-panel p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-veil-gold/80">{raceData.name}</h3>
              <span className="text-[10px] text-white/30">Velocità: {raceData.speed}ft</span>
            </div>
            {bonuses.length > 0 && (
              <p className="text-xs text-veil-gold/50 mt-2">
                Bonus razziali: {bonuses.map(([k, v]) => `${abilityLabels[k] || k} +${v}`).join(", ")}
              </p>
            )}
            {raceData.traits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {raceData.traits.map((t, i) => (
                  <span key={i} className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">{t}</span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Caratteristiche */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-veil-gold/80">Caratteristiche</h3>
          {(() => {
            const used = totalPointsUsed(cd);
            const remaining = POINT_BUY_MAX - used;
            return (
              <span className={`text-xs ${remaining < 0 ? "text-red-400" : "text-white/40"}`}>
                Punti: {used}/{POINT_BUY_MAX} {remaining < 0 ? `(-${Math.abs(remaining)})` : `(${remaining} rimasti)`}
              </span>
            );
          })()}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {abilityScoreKeys.map(k => {
            const score = Number(cd[k]) || 8;
            const base = Math.min(score, 15);
            const cost = base <= 8 ? 0 : pointBuyCost(base);
            return (
              <div key={k} className="text-center">
                <LabelWithGuide fieldKey={k} label={abilityLabels[k]} className="justify-center text-xs text-white/40 mb-1" />
                <input type="number" className="veil-input w-full text-center text-lg font-bold"
                  value={score}
                  onChange={e => updCd(k, Number(e.target.value))}
                  onBlur={() => save({ [k]: formRef.current?.character_data?.[k as keyof CharacterData] })} />
                <p className="text-sm text-veil-gold mt-1">{mod(score)}</p>
                <p className="text-[9px] text-white/30 mt-0.5">costo {cost}pt</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tiri Salvezza */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Tiri Salvezza</h3>
        {(() => {
          const classSt = getClassSavingThrows(formRef.current?.class || "");
          return (
            <>
              {classSt.length > 0 && <p className="text-[10px] text-veil-gold/50 mb-3">Competenze automatiche: {classSt.map(k => abilityLabels[k.replace("st","").toLowerCase()] || k).join(", ")}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {abilityScoreKeys.map(k => {
                  const stKey = "st" + k.charAt(0).toUpperCase() + k.slice(1);
                  const isClassSt = classSt.includes(stKey);
                  return (
                    <div key={stKey} className={`flex items-center gap-2 ${isClassSt ? "opacity-100" : "opacity-40"}`}>
                      <input type="checkbox" className="accent-veil-gold" checked={(cd as any)[stKey] ?? false}
                        disabled={!isClassSt}
                        onChange={e => { const v = e.target.checked; updCd(stKey, v); save({ [stKey]: v }); }} />
                      <LabelWithGuide fieldKey={stKey} label={abilityLabels[k]} className={`text-xs ${isClassSt ? "text-white/80" : "text-white/40"}`} />
                      <span className="text-xs text-veil-gold/50 ml-auto">{mod(cd[k])}</span>
                      {isClassSt && <span className="text-[9px] text-veil-gold/40">✓ classe</span>}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* Abilità */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Abilità</h3>
        {(() => {
          const cur = formRef.current;
          const cls = getClassSkillPicks(cur?.class || "");
          const raceData = getRaceStats(cur?.race || "");
          const totalPicks = cls.picks + (raceData?.extraSkills ?? 0);
          const picked = skillKeys.filter(sk => (cd as any)[sk.key]).length;
          const picksLeft = totalPicks > 0 ? totalPicks - picked : 0;
          return (
            <>
              {totalPicks > 0 && (
                <p className={`text-[10px] mb-3 ${picksLeft < 0 ? "text-red-400" : "text-veil-gold/50"}`}>
                  Competenze: {picked}/{totalPicks} ({cls.picks} classe{raceData?.extraSkills ? ` + ${raceData.extraSkills} razza` : ""}) {picksLeft < 0 ? "(superato!)" : `(ancora ${picksLeft})`}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {skillKeys.map(sk => {
                  const inClass = cls.options.includes(sk.key);
                  const anyOpt = cls.options.length === 0;
                  return (
                    <div key={sk.key} className={`flex items-center gap-2 ${anyOpt || inClass ? "" : "opacity-30"}`}>
                      <input type="checkbox" className="accent-veil-gold"
                        checked={(cd as any)[sk.key] ?? false}
                        onChange={e => updCd(sk.key, e.target.checked)} />
                      <LabelWithGuide fieldKey={sk.key} label={`${sk.label} (${abilityLabels[sk.ability]})`} className="text-xs text-white/60" />
                      {inClass && <span className="text-[9px] text-veil-gold/40">classe</span>}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>

      {/* Combattimento */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Combattimento</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SheetInput fieldKey="armorClass" label="CA" value={cd.armorClass} onChange={v => updCd("armorClass", v)} onSave={save} type="number" />
          <SheetInput fieldKey="initiative" label="Iniziativa" value={cd.initiative} onChange={v => updCd("initiative", v)} onSave={save} type="number" />
          <SheetInput fieldKey="speed" label="Velocità" value={cd.speed} onChange={v => updCd("speed", v)} onSave={save} type="number" />
          <SheetInput fieldKey="proficiencyBonus" label="Bonus Competenza" value={cd.proficiencyBonus} onChange={v => updCd("proficiencyBonus", v)} onSave={save} type="number" />
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input type="checkbox" className="accent-veil-gold" checked={cd.inspiration ?? false}
              onChange={e => { const v = e.target.checked; updCd("inspiration", v); save({ inspiration: v }); }} />
            <LabelWithGuide fieldKey="inspiration" label="Ispirazione" />
          </label>
        </div>
      </div>

      {/* HP */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Punti Ferita</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SheetInput fieldKey="hp_max" label="PF Max" value={form?.hp_max} onChange={v => upd("hp_max", v)} onSave={save} type="number" />
          <SheetInput fieldKey="hp_current" label="PF Correnti" value={form?.hp_current} onChange={v => upd("hp_current", v)} onSave={save} type="number" />
          <SheetInput fieldKey="temp_hp" label="PF Temp" value={form?.temp_hp} onChange={v => upd("temp_hp", v)} onSave={save} type="number" />
          <SheetInput fieldKey="hitDiceTotal" label="Dadi Vita" value={cd.hitDiceTotal} onChange={v => updCd("hitDiceTotal", v)} onSave={save} placeholder="3d10" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <LabelWithGuide fieldKey="deathSaveSuccesses" label="Tiri Morte - Successi" />
            <div className="flex gap-1 mt-1">
              {[0,1,2].map(i => (
                <button key={i} onClick={() => { const v = Math.min((cd.deathSaveSuccesses||0) === i ? i-1 : i, 3); updCd("deathSaveSuccesses", v); save({ deathSaveSuccesses: v }); }}
                  className={`h-6 w-6 rounded-full border text-xs ${(cd.deathSaveSuccesses||0) > i ? "bg-emerald-500/30 border-emerald-400/50 text-emerald-200" : "border-white/10 text-white/30"}`}>✓</button>
              ))}
            </div>
          </div>
          <div>
            <LabelWithGuide fieldKey="deathSaveFailures" label="Tiri Morte - Fallimenti" />
            <div className="flex gap-1 mt-1">
              {[0,1,2].map(i => (
                <button key={i} onClick={() => { const v = Math.min((cd.deathSaveFailures||0) === i ? i-1 : i, 3); updCd("deathSaveFailures", v); save({ deathSaveFailures: v }); }}
                  className={`h-6 w-6 rounded-full border text-xs ${(cd.deathSaveFailures||0) > i ? "bg-red-500/30 border-red-400/50 text-red-200" : "border-white/10 text-white/30"}`}>✕</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs text-white/50">Condizioni</label>
          <p className="mt-1 text-sm text-white/70">{parseConditions(form?.conditions).join(", ") || "nessuna"}</p>
          <p className="mt-1 text-[10px] text-white/30">Gestite dal DM</p>
        </div>
      </div>

      {/* Attacchi */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-veil-gold/80">Attacchi</h3>
          <button onClick={() => updCd("attacks", [...attacks, { name:"", bonus:"", damage:"" }])}
            className="text-xs text-veil-gold/60 hover:text-veil-gold border border-veil-gold/20 rounded-lg px-2 py-1">+ Aggiungi</button>
        </div>
        {attacks.length === 0 && <p className="text-xs text-white/30">Nessun attacco registrato.</p>}
        {attacks.map((a, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input className="veil-input flex-1 text-xs" placeholder="Arma" value={a.name}
              onChange={e => updCdAll({ attacks: attacks.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
            <input className="veil-input w-20 text-xs" placeholder="Bonus" value={a.bonus}
              onChange={e => updCdAll({ attacks: attacks.map((x, j) => j === i ? { ...x, bonus: e.target.value } : x) })} />
            <input className="veil-input w-28 text-xs" placeholder="Danno/Tipo" value={a.damage}
              onChange={e => updCdAll({ attacks: attacks.map((x, j) => j === i ? { ...x, damage: e.target.value } : x) })} />
            <button onClick={() => { const na = attacks.filter((_, j) => j !== i); updCd("attacks", na); save({ attacks: na }); }}
              className="text-xs text-red-300/50 hover:text-red-300">×</button>
          </div>
        ))}
      </div>

      {/* Incantesimi */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Incantesimi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SheetInput fieldKey="spellcastingAbility" label="Caratteristica Incantatore" value={cd.spellcastingAbility} onChange={v => updCd("spellcastingAbility", v)} onSave={save} placeholder="INT/SAG/CAR" />
          <SheetInput fieldKey="spellSaveDC" label="CD Incantesimi" value={cd.spellSaveDC} onChange={v => updCd("spellSaveDC", v)} onSave={save} type="number" />
          <SheetInput fieldKey="spellAttackBonus" label="Bonus Attacco" value={cd.spellAttackBonus} onChange={v => updCd("spellAttackBonus", v)} onSave={save} type="number" />
        </div>
        <div className="mt-3">
          <LabelWithGuide fieldKey="cantrips" label="Cantrips" />
          <input className="veil-input mt-1 w-full text-xs" placeholder="Es: Luci danzanti, Mano magica, Trama..." value={(cd.cantrips||[]).join(", ")}
            onChange={e => updCd("cantrips", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
        </div>
        <div className="mt-4">
          <p className="text-xs text-white/50 mb-2">Slot Incantesimi</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[1,2,3,4,5].map(lv => (
              <div key={lv} className="text-center">
                <p className="text-[10px] text-white/30">Liv.{lv}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input type="number" className="veil-input w-10 text-center text-xs" placeholder="0" value={spellSlots[lv]?.total ?? ""}
                    onChange={e => updCdAll({ spellSlots: { ...spellSlots, [lv]: { total: Number(e.target.value), expended: spellSlots[lv]?.expended ?? 0 } } })} />
                  <span className="text-[10px] text-white/20">/</span>
                  <input type="number" className="veil-input w-10 text-center text-xs" placeholder="0" value={spellSlots[lv]?.expended ?? ""}
                    onChange={e => updCdAll({ spellSlots: { ...spellSlots, [lv]: { total: spellSlots[lv]?.total ?? 0, expended: Number(e.target.value) } } })} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personalità */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Personalità</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SheetTextarea fieldKey="personalityTraits" label="Tratti Personalità" value={cd.personalityTraits} onChange={v => updCd("personalityTraits", v)} onSave={save} />
          <SheetTextarea fieldKey="ideals" label="Ideali" value={cd.ideals} onChange={v => updCd("ideals", v)} onSave={save} />
          <SheetTextarea fieldKey="bonds" label="Legami" value={cd.bonds} onChange={v => updCd("bonds", v)} onSave={save} />
          <SheetTextarea fieldKey="flaws" label="Difetti" value={cd.flaws} onChange={v => updCd("flaws", v)} onSave={save} />
        </div>
        <div className="mt-4">
          <SheetTextarea fieldKey="history" label="Storia" value={form?.history} onChange={v => upd("history", v)} onSave={save} />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SheetTextarea fieldKey="goals" label="Obiettivo" value={form?.goals} onChange={v => upd("goals", v)} onSave={save} />
          <SheetInput fieldKey="fear" label="Paura" value={form?.fear} onChange={v => upd("fear", v)} onSave={save} />
          <SheetInput fieldKey="important_person" label="Persona importante" value={form?.important_person} onChange={v => upd("important_person", v)} onSave={save} />
          <SheetTextarea fieldKey="secret" label="Segreto" value={form?.secret} onChange={v => upd("secret", v)} onSave={save} />
        </div>
      </div>

      {/* Aspetto */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Aspetto</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SheetInput fieldKey="age" label="Età" value={form?.age} onChange={v => upd("age", v)} onSave={save} />
          <SheetInput fieldKey="height" label="Altezza" value={cd.height} onChange={v => updCd("height", v)} onSave={save} placeholder="170cm" />
          <SheetInput fieldKey="weight" label="Peso" value={cd.weight} onChange={v => updCd("weight", v)} onSave={save} placeholder="70kg" />
          <SheetInput fieldKey="eyes" label="Occhi" value={cd.eyes} onChange={v => updCd("eyes", v)} onSave={save} />
          <SheetInput fieldKey="skin" label="Pelle" value={cd.skin} onChange={v => updCd("skin", v)} onSave={save} />
          <SheetInput fieldKey="hair" label="Capelli" value={cd.hair} onChange={v => updCd("hair", v)} onSave={save} />
        </div>
      </div>

      {/* Extra */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Extra</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SheetTextarea fieldKey="languages" label="Linguaggi" value={cd.languages} onChange={v => updCd("languages", v)} onSave={save} />
          <SheetTextarea fieldKey="otherProficiencies" label="Altre Competenze" value={cd.otherProficiencies} onChange={v => updCd("otherProficiencies", v)} onSave={save} />
          <SheetTextarea fieldKey="allies" label="Alleati e Organizzazioni" value={cd.allies} onChange={v => updCd("allies", v)} onSave={save} />
          <SheetTextarea fieldKey="treasure" label="Tesoro" value={cd.treasure} onChange={v => updCd("treasure", v)} onSave={save} />
        </div>
      </div>

      {/* Monete */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 mb-3">Monete</h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {coinTypes.map(c => (
            <div key={c.key}>
              <p className="text-[10px] uppercase text-white/30 mb-1">{c.label}</p>
              <input type="number" className="veil-input w-full text-center text-sm" value={(cd as any)[c.key] ?? 0}
                onChange={e => updCd(c.key, Number(e.target.value))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
