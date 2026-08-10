"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import { getBackgroundData } from "@/lib/data/backgrounds";
import backgrounds from "@/lib/data/backgrounds";
import { getModifier, getProficiencyBonus, getSpellDC, getSpellAttack, parseConditions, preparedSpellLimit } from "@/lib/characterEngine";
import { getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit } from "@/lib/data/leveling";
import { SaveBadge } from "./sheet/ui";
import { CoreTab } from "./sheet/CoreTab";
import { SpellTab } from "./sheet/SpellTab";
import { MagicTab } from "./sheet/MagicTab";
import { GearTab } from "./sheet/GearTab";
import { PersonalityTab } from "./sheet/PersonalityTab";
import { ExtraTab } from "./sheet/ExtraTab";
import { RulesTab } from "./sheet/RulesTab";
import type { SheetCtx } from "./sheet/types";

type Props = { player: Player; onUpdate: (p: Player) => void };
type SheetTab = "core" | "combat" | "magic" | "gear" | "personality" | "extra" | "rules";

const TABS: { id: SheetTab; label: string; short: string; icon: string }[] = [
  { id: "core", label: "Nucleo", short: "Nucleo", icon: "⚡" },
  { id: "combat", label: "Spell", short: "Spell", icon: "🧙" },
  { id: "magic", label: "Magia", short: "Magia", icon: "✨" },
  { id: "gear", label: "Equipaggiamento", short: "Equip.", icon: "🎒" },
  { id: "personality", label: "Personalità", short: "Pers.", icon: "📖" },
  { id: "extra", label: "Extra", short: "Extra", icon: "🔧" },
  { id: "rules", label: "Regole", short: "Regole", icon: "📜" },
];

export function CharacterSheet({ player, onUpdate }: Props) {
  const [form, setForm] = useState(player);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<SheetTab>("core");
  const playerRef = useRef(player);
  const formRef = useRef(form);
  formRef.current = form;
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const pendingRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (player && player !== playerRef.current) {
      if (!dirtyRef.current) setForm(player);
      playerRef.current = player;
    }
  }, [player]);

  /* ── State updaters ── */
  const upd = useCallback((key: string, value: any) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }, []);
  const updCd = useCallback((key: string, value: any) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), [key]: value } }));
  }, []);
  const updCdAll = useCallback((obj: Record<string, any>) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, character_data: { ...(prev.character_data || {}), ...obj } }));
  }, []);
  const updAll = useCallback((obj: Record<string, any>) => {
    dirtyRef.current = true;
    setForm((prev: any) => ({ ...prev, ...obj }));
  }, []);

  /* ── Save ── */
  const save = useCallback(async (fields: Record<string, any>) => {
    if (savingRef.current) {
      pendingRef.current = { ...(pendingRef.current || {}), ...fields };
      return;
    }
    savingRef.current = true;
    setSaveState("saving");
    try {
      const body: any = { id: player.id };
      const cdFields: Record<string, any> = {};
      const topLevelFields = new Set([
        "character_name", "race", "class", "level", "xp", "hp_current", "hp_max",
        "temp_hp", "coins", "conditions", "age", "personality", "history", "goals",
        "fear", "important_person", "secret", "background", "dm_private_notes",
        "player_name", "avatar_url",
      ]);
      for (const [k, v] of Object.entries(fields)) {
        if (topLevelFields.has(k)) body[k] = v;
        else { cdFields[k] = v; }
      }
      if (Object.keys(cdFields).length > 0) {
        const curCd = formRef.current?.character_data || {};
        body.character_data = { ...curCd, ...cdFields };
      }
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Salvataggio fallito");
      const merged = { ...(formRef.current || {}), ...body };
      setForm(merged);
      onUpdate(merged);
      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    } finally {
      savingRef.current = false;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) save(pending);
    }
  }, [player.id, onUpdate]);

  /* ── Level-up applicato dal pannello ── */
  const handleLevelUp = useCallback((updates: Record<string, any>) => {
    updAll(updates);
    save(updates);
  }, [updAll, save]);

  /* ── Dati derivati ── */
  const cd = form?.character_data || ({} as CharacterData);
  const attacks = Array.isArray(cd.attacks) ? cd.attacks : [];
  const spellSlots = (cd.spellSlots || {}) as Record<number, { total?: number; expended?: number }>;
  const conditions = parseConditions(form?.conditions);
  const hpPct = form?.hp_max ? (form?.hp_current || 0) / form.hp_max : 0;

  const clsKey = findClassKey(formRef.current?.class || "");
  const clsData = clsKey ? getClassData(clsKey) : null;
  const raceKey = findRaceKey(formRef.current?.race || "");
  const raceData = raceKey ? getRaceData(raceKey) : null;
  const bgData = form?.background ? getBackgroundData(
    Object.keys(backgrounds).find(k => (backgrounds as any)[k].name === form.background) || form.background
  ) : null;

  const level = Number(formRef.current?.level) || 1;
  const pb = getProficiencyBonus(level);

  /* Caratteristiche: i valori in scheda sono FINALI (bonus razziali già inclusi alla creazione) */
  const getTotalScore = useCallback((ability: string): number => {
    return Number(cd[ability as keyof CharacterData]) || 10;
  }, [cd]);

  /* Auto-calcoli dalla classe/razza */
  const hitDie = clsData?.hitDie;
  const conMod = getModifier(getTotalScore("constitution"));
  const dexMod = getModifier(getTotalScore("dexterity"));
  const raceSpeed = raceData?.speed;
  const expectedHP = hitDie ? hitDie + conMod + (level - 1) * (Math.ceil(hitDie / 2) + 1 + conMod) : null;

  /* Incantesimi: caratteristica auto da classe */
  const spellAbility = clsData?.spellcasting?.spellcastingAbility;
  const spellAbilityScore = spellAbility ? getTotalScore(spellAbility) : 10;
  const spellAbilityMod = getModifier(spellAbilityScore);
  const spellDC = spellAbility ? getSpellDC(spellAbility as any, { [spellAbility]: spellAbilityScore } as any, pb) : 0;
  const spellAtk = spellAbility ? getSpellAttack(spellAbility as any, { [spellAbility]: spellAbilityScore } as any, pb) : 0;

  /* Slot/Trucchetti/Incantesimi automatici dal leveling PHB */
  const autoSlotTotals = clsKey ? getSpellSlotsAtLevel(clsKey, level) : {};
  const cantripLimit = clsKey ? getCantripsKnown(clsKey, level) : 0;
  const preparedLimit = clsKey ? preparedSpellLimit(clsKey, level, spellAbilityMod) : 0;
  const spellLimit = (clsKey ? getSpellsKnownLimit(clsKey, level) : 0) || preparedLimit || 999;
  const totalKnown = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, lvl) =>
    acc + ((((cd as any)[`spells${lvl}`]) || []) as string[]).length, 0);

  /* Abilità/Saving Throws: classe garantisce competenze, background aggiunge le sue */
  const classSkillSet = new Set(clsData?.savingThrows || []);
  const bgSkillSet = new Set<string>((bgData?.skillProficiencies || []).filter(Boolean));
  const raceSkillSet = new Set<string>((raceData?.proficiencies?.skills || []).filter(Boolean));

  const handleAddAttack = useCallback((atk: { name: string; bonus: string; damage: string; type: string }) => {
    const na = [...attacks, atk];
    updCd("attacks", na);
    save({ attacks: na });
  }, [attacks, updCd, save]);

  const ctx: SheetCtx = {
    form, formRef, cd,
    attacks, spellSlots, conditions,
    clsKey, clsData, raceData, bgData,
    level, pb, hitDie, conMod, dexMod, raceSpeed, expectedHP,
    spellAbility, spellAbilityScore, spellAbilityMod, spellDC, spellAtk,
    autoSlotTotals, cantripLimit, preparedLimit, spellLimit, totalKnown,
    classSkillSet, bgSkillSet, raceSkillSet,
    upd, updCd, updCdAll, updAll, save,
    onLevelUp: handleLevelUp, onAddAttack: handleAddAttack,
  };

  const tabRenderers: Record<SheetTab, () => React.ReactNode> = {
    core: () => <CoreTab ctx={ctx} />,
    combat: () => <SpellTab ctx={ctx} />,
    magic: () => <MagicTab ctx={ctx} />,
    gear: () => <GearTab ctx={ctx} />,
    personality: () => <PersonalityTab ctx={ctx} />,
    extra: () => <ExtraTab ctx={ctx} />,
    rules: () => <RulesTab />,
  };

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-0">
      {/* Header scheda */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-veil-gold font-medium">Scheda Personaggio</h2>
        <SaveBadge state={saveState} />
      </div>

      {/* Stat rapide sticky */}
      <div className="sticky top-0 z-20 -mx-2 mb-3 rounded-xl border border-white/[0.08] bg-[#10141b]/95 px-2 py-2 backdrop-blur-md">
        <div className={`grid gap-2 ${clsData ? "grid-cols-4" : "grid-cols-2"} sm:grid-cols-5`}>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">PF</p>
            <p className={`text-sm font-bold truncate ${hpPct > 0.5 ? "text-emerald-300" : hpPct > 0.25 ? "text-yellow-300" : "text-red-300"}`}>
              {form?.hp_current ?? "?"}<span className="text-white/30 font-normal">/{form?.hp_max ?? "?"}</span>
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">CA</p>
            <p className="text-sm font-bold truncate">{cd.armorClass || "—"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Vel.</p>
            <p className="text-sm font-bold truncate">{cd.speed || raceSpeed || "—"}</p>
          </div>
          {clsData && (
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Init</p>
              <p className="text-sm font-bold truncate">{dexMod >= 0 ? `+${dexMod}` : dexMod}</p>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">PB</p>
            <p className="text-sm font-bold truncate">+{pb}</p>
          </div>
        </div>
        {form?.hp_max && form.hp_max > 0 && (
          <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${hpPct > 0.5 ? "bg-emerald-500" : hpPct > 0.25 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${Math.max(0, Math.min(100, hpPct * 100))}%` }} />
          </div>
        )}
      </div>

      {/* Tab nav: desktop (sopra) */}
      <div className="hidden md:flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs transition flex items-center gap-1.5 ${activeTab === t.id ? "bg-veil-gold/15 border border-veil-gold/30 text-veil-gold" : "bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/70 hover:border-white/[0.10]"}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tabRenderers[activeTab]?.()}
      </div>

      {/* Bottom nav: mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t border-veil-gold/20 bg-[#10141b]/95 backdrop-blur-md">
        <div className="flex overflow-x-auto">
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 min-w-[54px] flex flex-col items-center gap-0.5 py-2.5 px-1 transition ${active ? "text-veil-gold" : "text-white/40 hover:text-white/70"}`}>
                <span className="text-base leading-none">{t.icon}</span>
                <span className="text-[9px] leading-none">{t.short}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-veil-gold/70" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}