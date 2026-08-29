"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Player, CharacterData } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import { getBackgroundData } from "@/lib/data/backgrounds";
import backgrounds from "@/lib/data/backgrounds";
import { getModifier, getProficiencyBonus, getSpellDC, getSpellAttack, parseConditions, preparedSpellLimit } from "@/lib/characterEngine";
import { getSpellSlotsAtLevel, getCantripsKnown, getSpellsKnownLimit } from "@/lib/data/leveling";
import { getArchetypeCasting, getArchetypeSlotsAtLevel } from "@/lib/data/classAbilities";
import { CoreTab } from "@/components/player/sheet/CoreTab";
import { SpellTab } from "@/components/player/sheet/SpellTab";
import { GearTab } from "@/components/player/sheet/GearTab";
import { PartyTab } from "@/components/player/sheet/PartyTab";
import type { SheetCtx } from "./sheet/types";

type Props = { player: Player; onUpdate: (p: Player) => void; onExit?: () => void; onSaveStateChange?: (s: "idle" | "saving" | "saved" | "error") => void; sessionId?: string; dmMode?: boolean };
type SheetTab = "core" | "combat" | "gear" | "party";

const TABS: { id: SheetTab; label: string; short: string; icon: string }[] = [
  { id: "core", label: "Nucleo", short: "Nucleo", icon: "⚡" },
  { id: "combat", label: "Combattimento", short: "Combattimento", icon: "⚔️" },
  { id: "gear", label: "Equipaggiamento", short: "Equipaggiamento", icon: "🎒" },
  { id: "party", label: "Party", short: "Party", icon: "👥" },
];

export function CharacterSheet({ player, onUpdate, onExit, onSaveStateChange, sessionId, dmMode }: Props) {
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
    onSaveStateChange?.(saveState);
  }, [saveState, onSaveStateChange]);

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

  /* Incantesimi: caratteristica auto da classe (o da archetipo che sblocca la magia) */
  const archCasting = (formRef.current?.character_data?.archetype)
    ? getArchetypeCasting(formRef.current?.character_data?.archetype)
    : null;
  const archSlots = archCasting ? getArchetypeSlotsAtLevel(formRef.current?.character_data?.archetype || "", level) : {};
  const spellAbility = clsData?.spellcasting?.spellcastingAbility || archCasting?.ability;
  const spellAbilityScore = spellAbility ? getTotalScore(spellAbility) : 10;
  const spellAbilityMod = getModifier(spellAbilityScore);
  const spellDC = spellAbility ? getSpellDC(spellAbility as any, { [spellAbility]: spellAbilityScore } as any, pb) : 0;
  const spellAtk = spellAbility ? getSpellAttack(spellAbility as any, { [spellAbility]: spellAbilityScore } as any, pb) : 0;

  /* Slot/Trucchetti/Incantesimi automatici dal leveling PHB (archetipo se la classe non lancia) */
  const autoSlotTotals = archCasting?.slots ? archSlots : clsKey ? getSpellSlotsAtLevel(clsKey, level) : {};
  const cantripLimit = archCasting?.cantripsKnown ?? (clsKey ? getCantripsKnown(clsKey, level) : 0);
  const preparedLimit = clsKey ? preparedSpellLimit(clsKey, level, spellAbilityMod) : 0;
  const spellLimit = archCasting?.spellsKnown
    ? archCasting.spellsKnown(level)
    : ((clsKey ? getSpellsKnownLimit(clsKey, level) : 0) || preparedLimit || 999);
  const totalKnown = [1, 2, 3, 4, 5, 6, 7, 8, 9].reduce((acc, lvl) =>
    acc + ((((cd as any)[`spells${lvl}`]) || []) as string[]).length, 0);

  /* Abilità/Saving Throws: classe garantisce competenze, background aggiunge le sue */
  const classSkillSet = new Set(clsData?.savingThrows || []);
  const bgSkillSet = new Set<string>((bgData?.skillProficiencies || []).filter(Boolean));
  const raceSkillSet = new Set<string>((raceData?.proficiencies?.skills || []).filter(Boolean));

  const handleAddAttack = useCallback((atk: { name: string; bonus: string; damage: string; type: string }) => {
    const lower = atk.name.toLowerCase();
    const na = attacks.some(a => a.name.toLowerCase() === lower)
      ? attacks.map(a => a.name.toLowerCase() === lower ? { ...a, ...atk } : a)
      : [...attacks, atk];
    updCd("attacks", na);
    save({ attacks: na });
  }, [attacks, updCd, save]);

  const ctx: SheetCtx = {
    form, formRef, cd,
    attacks, spellSlots, conditions,
    clsKey, clsData, raceData, bgData,
    archCasting,
    level, pb, hitDie, conMod, dexMod, raceSpeed, expectedHP,
    spellAbility, spellAbilityScore, spellAbilityMod, spellDC, spellAtk,
    autoSlotTotals, cantripLimit, preparedLimit, spellLimit, totalKnown,
    classSkillSet, bgSkillSet, raceSkillSet,
    upd, updCd, updCdAll, updAll, save,
    onLevelUp: handleLevelUp, onAddAttack: handleAddAttack,
    dmMode,
  };

  const tabRenderers: Record<SheetTab, () => React.ReactNode> = {
    core: () => <CoreTab ctx={ctx} />,
    combat: () => <SpellTab ctx={ctx} />,
    gear: () => <GearTab ctx={ctx} />,
    party: () => <PartyTab ctx={ctx} sessionId={sessionId} onExit={onExit} />,
  };

  const hasInspiration = !!cd.inspiration;
  return (
    <div className={`w-full px-2 pb-24 sm:px-4 lg:px-8 ${hasInspiration ? "rounded-2xl border border-veil-gold/25 bg-[rgba(201,164,76,0.04)] shadow-[0_0_22px_rgba(201,164,76,0.18),0_0_48px_rgba(201,164,76,0.07)]" : ""}`}>
      {/* Tab content */}
      <div>
        {tabRenderers[activeTab]?.()}
      </div>

      {/* Bottom nav: sempre visibile, bloccata in basso */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-veil-gold/20 bg-[#10141b]/95 backdrop-blur-md">
        <div className="flex">
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition ${active ? "text-veil-gold" : "text-white/40 hover:text-white/70"}`}>
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="text-[11px] leading-tight font-medium whitespace-nowrap">{t.short}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-10 rounded-full bg-veil-gold/70" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}