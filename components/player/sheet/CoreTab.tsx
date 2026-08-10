"use client";
import type { CharacterData } from "@/lib/types";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import races from "@/lib/data/races";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import classes from "@/lib/data/classes";
import { getClassData, findClassKey } from "@/lib/data/classes";
import backgrounds from "@/lib/data/backgrounds";
import { getBackgroundData } from "@/lib/data/backgrounds";
import { getModifier, ALL_ABILITIES, ALL_SKILLS, ALL_SAVES, SKILL_ABILITY, SAVE_ABILITY, ABILITY_SHORT, SKILL_LABELS, SAVE_LABELS } from "@/lib/characterEngine";
import { LevelUpPanel } from "@/components/player/LevelUpPanel";
import { StatBox } from "./ui";
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
  const { form, cd, clsData, raceData, bgData, level, pb, expectedHP, hitDie, conMod, dexMod, raceSpeed, upd, updCd, updCdAll, save, onLevelUp } = ctx;

  return (
    <div className="space-y-4">
      {/* Avatar + Info principale */}
      <div className="veil-panel p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar url={form?.avatar_url} name={form?.character_name} size="xl" />
            <label className="cursor-pointer rounded-lg border border-veil-gold/20 px-2 py-1 text-[10px] text-veil-gold/50 hover:bg-veil-gold/10 hover:text-veil-gold transition text-center">
              Immagine
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
                className="text-[10px] text-red-300/40 hover:text-red-300">Rimuovi</button>
            )}
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-full sm:col-span-2">
              <LabelWithGuide fieldKey="character_name" label="Nome Personaggio" />
              <input type="text" className="veil-input mt-1 w-full"
                value={form?.character_name || ""}
                onChange={e => upd("character_name", e.target.value)}
                onBlur={() => save({ character_name: ctx.formRef.current?.character_name })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="level" label="Livello" />
              <input type="number" className="veil-input mt-1 w-full" min={1} max={20}
                value={form?.level || 1}
                onChange={e => upd("level", Number(e.target.value))}
                onBlur={() => save({ level: ctx.formRef.current?.level })} />
            </div>
            <div>
              <LabelWithGuide fieldKey="race" label="Razza" />
              <select className="veil-input mt-1 w-full"
                value={findRaceKey(form?.race || "") || form?.race || ""}
                onChange={e => {
                  const rk = e.target.value;
                  const rd = getRaceData(rk);
                  const name = rd?.name || rk;
                  upd("race", name);
                  if (rd?.speed) updCd("speed", rd.speed);
                }}
                onBlur={() => {
                  const rk = findRaceKey(form?.race || "");
                  const rd = rk ? getRaceData(rk) : null;
                  save({ race: form?.race, ...(rd?.speed ? { speed: rd.speed } : {}) });
                }}>
                <option value="">— Seleziona razza —</option>
                {Object.values(races).map(r => (
                  <option key={r.key} value={r.key}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <LabelWithGuide fieldKey="class_label" label="Classe" />
              <select className="veil-input mt-1 w-full"
                value={findClassKey(form?.class || "") || ""}
                onChange={e => {
                  const ck = e.target.value;
                  const clsd = getClassData(ck);
                  upd("class", clsd?.name || ck);
                }}
                onBlur={() => {
                  const ck = findClassKey(form?.class || "");
                  const clsd = ck ? getClassData(ck) : null;
                  if (!clsd) return;
                  const saveFields: Record<string, boolean> = {};
                  for (const sv of ["stStrength", "stDexterity", "stConstitution", "stIntelligence", "stWisdom", "stCharisma"]) {
                    saveFields[sv] = clsd.savingThrows.includes(sv);
                  }
                  save({ class: clsd.name, ...saveFields });
                }}>
                <option value="">— Seleziona classe —</option>
                {Object.values(classes).map(c => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <LabelWithGuide fieldKey="background" label="Background" />
              <select className="veil-input mt-1 w-full"
                value={Object.keys(backgrounds).find(k => (backgrounds as any)[k].name === form?.background) || form?.background || ""}
                onChange={e => {
                  const bk = e.target.value;
                  const bd = getBackgroundData(bk);
                  upd("background", bd?.name || bk);
                  if (bd?.skillProficiencies) {
                    const skillUpdates: Record<string, boolean> = {};
                    bd.skillProficiencies.forEach(s => { skillUpdates[s] = true; });
                    updCdAll(skillUpdates);
                  }
                }}
                onBlur={() => save({ background: ctx.formRef.current?.background })}>
                <option value="">— Seleziona background —</option>
                {Object.values(backgrounds).map(b => (
                  <option key={b.key} value={b.key}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <LabelWithGuide fieldKey="alignment" label="Allineamento" />
              <select className="veil-input mt-1 w-full"
                value={cd.alignment || ""}
                onChange={e => updCd("alignment", e.target.value)}
                onBlur={() => save({ alignment: form?.character_data?.alignment })}>
                <option value="">— Seleziona —</option>
                {["Legale Buono", "Neutrale Buono", "Caotico Buono", "Legale Neutrale", "Neutrale", "Caotico Neutrale", "Legale Malvagio", "Neutrale Malvagio", "Caotico Malvagio"].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <LabelWithGuide fieldKey="xp" label="XP" />
              <input type="number" className="veil-input mt-1 w-full" min={0}
                value={form?.xp || 0}
                onChange={e => upd("xp", Number(e.target.value))}
                onBlur={() => save({ xp: ctx.formRef.current?.xp })} />
            </div>
          </div>
        </div>
      </div>

      {/* Info razza */}
      {raceData && (
        <div className="veil-panel p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-veil-gold/80 font-medium">{raceData.name}</span>
            <span className="text-[10px] text-white/30">{raceData.speed}m · {raceData.size}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(raceData.abilityBonuses).filter(([, v]) => v > 0).map(([k, v]) => (
              <span key={k} className="rounded bg-veil-gold/10 px-1.5 py-0.5 text-[10px] text-veil-gold/70">
                {ABILITY_SHORT[k] || k}+{v}
              </span>
            ))}
            {raceData.traits.slice(0, 4).map(t => (
              <span key={t.name} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40" title={t.description}>{t.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Caratteristiche */}
      <div className="veil-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-veil-gold/80 font-medium">Caratteristiche</h3>
          {clsData && (
            <span className="text-[10px] text-white/30">
              Bonus Competenza: <strong className="text-veil-gold/60">+{pb}</strong>
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ABILITY_KEYS.map(k => {
            const base = Number(cd[k as keyof CharacterData]) || 10;
            const mod = getModifier(base);
            return (
              <div key={k} className="text-center">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/35 mb-1">{ABILITY_SHORT[k]}</p>
                <input type="number" className="veil-input w-full text-center text-lg font-bold px-1"
                  value={base}
                  min={1} max={20}
                  onChange={e => updCd(k, Number(e.target.value))}
                  onBlur={() => save({ [k]: form?.character_data?.[k as keyof CharacterData] })} />
                <p className="text-base text-veil-gold font-bold mt-1">{mod >= 0 ? `+${mod}` : `${mod}`}</p>
                <p className="text-[9px] text-white/20 mt-0.5">valore finale</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* PF + Stats di combattimento rapide */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Punti Ferita</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <LabelWithGuide fieldKey="hp_max" label="PF Max" />
            <input type="number" className="veil-input mt-1 w-full text-center" min={0}
              value={form?.hp_max || ""}
              onChange={e => upd("hp_max", Number(e.target.value))}
              onBlur={() => save({ hp_max: ctx.formRef.current?.hp_max })} />
            {expectedHP && <p className="text-[9px] text-white/20 mt-0.5 text-center">attesi: ~{expectedHP}</p>}
          </div>
          <div>
            <LabelWithGuide fieldKey="hp_current" label="PF Correnti" />
            <input type="number" className="veil-input mt-1 w-full text-center" min={0}
              value={form?.hp_current ?? ""}
              onChange={e => upd("hp_current", Number(e.target.value))}
              onBlur={() => save({ hp_current: ctx.formRef.current?.hp_current })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="temp_hp" label="PF Temporanei" />
            <input type="number" className="veil-input mt-1 w-full text-center" min={0}
              value={form?.temp_hp ?? ""}
              onChange={e => upd("temp_hp", Number(e.target.value))}
              onBlur={() => save({ temp_hp: ctx.formRef.current?.temp_hp })} />
          </div>
          <div>
            <LabelWithGuide fieldKey="hitDiceTotal" label="Dadi Vita" />
            <div className="veil-input mt-1 w-full text-center pointer-events-none opacity-60">
              {hitDie ? `${level}d${hitDie}` : "—"}
            </div>
            {hitDie && <p className="text-[9px] text-white/20 mt-0.5 text-center">COS mod: {conMod >= 0 ? `+${conMod}` : conMod}</p>}
          </div>
        </div>
        {form?.hp_max && form?.hp_max > 0 && (
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${((form?.hp_current || 0) / form.hp_max) > 0.5 ? "bg-emerald-500" : ((form?.hp_current || 0) / form.hp_max) > 0.25 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${Math.max(0, Math.min(100, ((form?.hp_current || 0) / form.hp_max) * 100))}%` }} />
          </div>
        )}
      </div>

      {/* Level-up guidato da XP */}
      <LevelUpPanel player={form || ({} as any)} onApply={onLevelUp} />

      {/* Stats veloci: CA / Iniziativa / Velocità / PB */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="veil-panel p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">CA</p>
          <input type="number" className="bg-transparent text-xl font-bold text-white w-full text-center border-none outline-none"
            value={cd.armorClass || ""}
            onChange={e => updCd("armorClass", Number(e.target.value))}
            onBlur={() => save({ armorClass: form?.character_data?.armorClass })} />
          <p className="text-[9px] text-white/20 mt-0.5">Classe Armatura</p>
        </div>
        <StatBox label="Iniziativa" value={dexMod >= 0 ? `+${dexMod}` : `${dexMod}`} sub="DES mod" />
        <div className="veil-panel p-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">Velocità</p>
          <input type="number" className="bg-transparent text-xl font-bold text-white w-full text-center border-none outline-none"
            value={cd.speed || raceSpeed || ""}
            onChange={e => updCd("speed", Number(e.target.value))}
            onBlur={() => save({ speed: form?.character_data?.speed })} />
          <p className="text-[9px] text-white/20 mt-0.5">{raceSpeed ? `razza: ${raceSpeed}m` : "metri"}</p>
        </div>
        <StatBox label="Bon. Competenza" value={`+${pb}`} sub={`liv. ${level}`} />
      </div>

      {/* Tiri Salvezza */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Tiri Salvezza</h3>
        {clsData && (
          <p className="text-[10px] text-white/30 mb-2">
            Competenze dalla classe: {clsData.savingThrows.map(s => {
              const found = SAVE_LIST.find(sl => sl.key === s);
              return found?.label || s;
            }).join(", ")} · non modificabili
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SAVE_LIST.map(sv => {
            const isClassSave = clsData?.savingThrows.includes(sv.key as any) || false;
            const monkAllSaves = ctx.clsKey === "monk" && level >= 14;
            const isChecked = isClassSave || monkAllSaves;
            const score = Number(cd[sv.ability as keyof CharacterData]) || 10;
            const mod = getModifier(score);
            const total = isChecked ? mod + pb : mod;
            return (
              <div key={sv.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${isChecked ? "border-veil-gold/20 bg-veil-gold/[0.04]" : "border-white/[0.04] bg-black/20"}`}>
                <input type="checkbox" className="accent-veil-gold w-4 h-4"
                  checked={isChecked}
                  disabled
                  title="I tiri salvezza derivano solo dalla classe"
                />
                <span className={`text-xs flex-1 ${isChecked ? "text-white/80" : "text-white/40"}`}>{sv.label}</span>
                <span className={`text-xs font-medium ${isChecked ? "text-veil-gold" : "text-white/30"}`}>
                  {total >= 0 ? `+${total}` : `${total}`}
                </span>
                {isChecked && <span className="text-[9px] text-veil-gold/30">{monkAllSaves ? "monaco" : "classe"}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Abilità */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Abilità</h3>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {SKILL_LIST.map(sk => {
            const isChecked = (cd as any)[sk.key] ?? false;
            const isClassOption = clsData?.skillOptions.includes(sk.key) || false;
            const isBgSkill = bgData?.skillProficiencies.includes(sk.key) || false;
            const isRaceSkill = raceData?.proficiencies?.skills?.includes(sk.key) || false;
            const isLocked = isBgSkill || isRaceSkill;
            const classCheckedCount = SKILL_LIST.filter(s =>
              (cd as any)[s.key] && clsData?.skillOptions.includes(s.key)
              && !bgData?.skillProficiencies.includes(s.key)
              && !raceData?.proficiencies?.skills?.includes(s.key)
            ).length;
            const atClassLimit = classCheckedCount >= (clsData?.skillPicks || 0);
            const score = Number(cd[sk.ability as keyof CharacterData]) || 10;
            const mod = getModifier(score);
            const total = isChecked ? mod + pb : mod;
            return (
              <label key={sk.key} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition text-sm
                ${isChecked ? isLocked ? "border-emerald-500/20 bg-emerald-900/[0.06]" : "border-veil-gold/20 bg-veil-gold/[0.04]" : isClassOption ? "border-white/[0.06] bg-black/20 hover:border-white/[0.10] cursor-pointer" : "border-white/[0.03] bg-black/10 opacity-40"}`}>
                <input type="checkbox" className="accent-veil-gold w-4 h-4 flex-shrink-0"
                  checked={isChecked}
                  disabled={!isClassOption && !isLocked}
                  onChange={e => {
                    if (isLocked) return;
                    if (e.target.checked && atClassLimit) return;
                    updCd(sk.key, e.target.checked);
                    save({ [sk.key]: e.target.checked });
                  }} />
                <span className={`flex-1 text-xs ${isChecked ? "text-white/80" : "text-white/40"}`}>
                  {sk.label}
                </span>
                <span className="text-[10px] text-white/25">{ABILITY_SHORT[sk.ability]}</span>
                <span className={`text-xs font-medium w-8 text-right ${isChecked ? "text-veil-gold" : "text-white/25"}`}>
                  {total >= 0 ? `+${total}` : `${total}`}
                </span>
                {isBgSkill && <span className="text-[9px] text-emerald-400/40">BG</span>}
                {isRaceSkill && !isBgSkill && <span className="text-[9px] text-emerald-400/40">razza</span>}
                {isClassOption && !isLocked && <span className="text-[9px] text-veil-gold/30">cls</span>}
              </label>
            );
          })}
        </div>
      </div>

      {/* Ispirazione */}
      <div className="veil-panel p-3 flex items-center gap-3">
        <input type="checkbox" id="inspiration" className="accent-veil-gold w-5 h-5"
          checked={cd.inspiration ?? false}
          onChange={e => { updCd("inspiration", e.target.checked); save({ inspiration: e.target.checked }); }} />
        <label htmlFor="inspiration" className="text-sm text-white/70 cursor-pointer flex-1">
          <span className="text-veil-gold/80">Ispirazione</span>
          <span className="text-white/30 text-xs ml-2">assegnata dal DM</span>
        </label>
      </div>
    </div>
  );
}