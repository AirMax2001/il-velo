"use client";
import type { Player } from "@/lib/types";
import { getClassData, findClassKey } from "@/lib/data/classes";
import {
  levelFromXp, xpForLevel, getFeaturesAtLevel, getSpellSlotsAtLevel,
  getCantripsKnown, getSpellsKnownLimit, getAsiLevels, WARLOCK_SLOT_LEVEL,
} from "@/lib/data/leveling";
import { getArchetypeForClass, getArchetypeAbilities, getArchetypeCasting } from "@/lib/data/classAbilities";
import { calculateHP, getModifier, getProficiencyBonus } from "@/lib/characterEngine";

type Props = {
  player: Player;
  onApply: (updates: Record<string, any>) => void;
};

export function LevelUpPanel({ player, onApply }: Props) {
  const cd = player.character_data || {};
  const clsKey = findClassKey(player.class || "");
  const clsData = clsKey ? getClassData(clsKey) : null;

  const currentLevel = Number(player.level) || 1;
  const derivedLevel = levelFromXp(Number(player.xp) || 0);
  const canLevel = derivedLevel > currentLevel;
  const gained = canLevel ? derivedLevel - currentLevel : 0;

  const con = Number(cd.constitution) || 10;
  const conMod = getModifier(con);
  const hitDie = clsData?.hitDie;

  const hpAt = (lv: number) => (clsData ? calculateHP(clsData, con, lv) : 0);
  const newHp = hpAt(derivedLevel);
  const hpGain = canLevel && player.hp_max ? newHp - Number(player.hp_max) : null;

  const spellAbility = clsData?.spellcasting?.spellcastingAbility;
  const spellAbilityMod = spellAbility ? getModifier(Number(cd[spellAbility]) || 10) : 0;
  const preparedLimit = (lv: number) => {
    if (clsKey === "paladin") return spellAbilityMod + Math.floor(lv / 2);
    if (clsKey && ["cleric", "druid", "wizard"].includes(clsKey)) return spellAbilityMod + lv;
    return 0;
  };

  function apply() {
    const oldMax = Number(player.hp_max) || 0;
    const curHp = Number(player.hp_current) || 0;
    const slotTotals = getSpellSlotsAtLevel(clsKey || "", derivedLevel);
    const prevSlots = (cd.spellSlots || {}) as Record<number, { total?: number; expended?: number }>;
    const newSlots: Record<number, { total: number; expended: number }> = {};
    for (const [lv, total] of Object.entries(slotTotals)) {
      newSlots[Number(lv)] = { total, expended: prevSlots[Number(lv)]?.expended ?? 0 };
    }
    onApply({
      level: derivedLevel,
      hp_max: newHp,
      hp_current: curHp >= oldMax ? newHp : curHp,
      spellSlots: newSlots,
      hitDiceTotal: hitDie ? `${derivedLevel}d${hitDie}` : undefined,
      proficiencyBonus: getProficiencyBonus(derivedLevel),
    });
  }

  const nextXp = xpForLevel(currentLevel + 1);
  const xpInLevel = Number(player.xp) || 0;
  const prevXp = xpForLevel(currentLevel);
  const progress = Math.max(0, Math.min(100, ((xpInLevel - prevXp) / Math.max(1, nextXp - prevXp)) * 100));

  return (
    <div className={`veil-panel p-4 ${canLevel ? "border-veil-gold/30" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-veil-gold/80 font-medium">⚡ Avanzamento</h3>
        <span className="text-[10px] text-white/30">
          {currentLevel} → {derivedLevel > currentLevel ? `livello ${derivedLevel}` : `livello ${currentLevel}`}
        </span>
      </div>

      {!canLevel && (
        <>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-veil-gold/50 transition-all"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-white/30 mt-1.5">
            {xpInLevel} / {nextXp} XP al livello {currentLevel + 1}
          </p>
        </>
      )}

      {canLevel && (
        <div className="space-y-3">
          <p className="text-[11px] text-emerald-300/80">
            ✅ Hai XP sufficienti per salire di {gained} livello{gained > 1 ? "i" : ""}!
          </p>

          {Array.from({ length: gained }, (_, i) => currentLevel + 1 + i).map(lv => (
            <div key={lv} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-veil-gold font-medium">Livello {lv}</p>
                <span className="text-[10px] text-emerald-400/60">
                  +{hpAt(lv) - hpAt(lv - 1)} PF
                </span>
              </div>

              {/* Feature del livello */}
              {getFeaturesAtLevel(clsKey || "", lv).map(f => (
                <div key={f.name} className="mb-1.5">
                  <p className="text-xs text-white/80">✦ {f.name}</p>
                  <p className="text-[10px] text-white/40">{f.description}</p>
                </div>
              ))}

              {/* ASI */}
              {getAsiLevels(clsKey || "").includes(lv) && (
                <p className="text-[11px] text-veil-gold/80 mt-1">
                  🎓 Incremento Punteggi di Caratteristica: +2 a una o +1 a due (max 20)
                </p>
              )}

              {/* Archetipo */}
              {(() => {
                const arch = getArchetypeForClass(clsKey || "");
                if (!arch || lv < arch.level) return null;
                const picked = (cd as any).archetype || "";
                if (picked) {
                  const cast = getArchetypeCasting(picked);
                  const acts = getArchetypeAbilities(picked);
                  return (
                    <p className="text-[11px] text-violet-300/80 mt-1">
                      ✨ {arch.label}: {arch.options.find(o => o.key === picked)?.name}
                      {cast ? ` · ${cast.label}` : ""}
                      {acts.length > 0 ? ` · ${acts.map(a => a.name).join(", ")}` : ""}
                    </p>
                  );
                }
                const magicOptions = arch.options.filter(o => getArchetypeCasting(o.key));
                return (
                  <p className="text-[11px] text-violet-300/80 mt-1">
                    🎭 Scegli il tuo {arch.label.toLowerCase()} nella scheda (tab Personaggio).
                    {magicOptions.length > 0 && ` ${magicOptions.map(o => o.name).join(" e ")} sbloccano anche la magia.`}
                  </p>
                );
              })()}

              {/* Incantesimi */}
              {(() => {
                const slots = getSpellSlotsAtLevel(clsKey || "", lv);
                const cant = getCantripsKnown(clsKey || "", lv);
                const known = getSpellsKnownLimit(clsKey || "", lv) || preparedLimit(lv);
                const hasMagic = clsData?.spellcasting;
                if (!hasMagic) return null;
                const gainedSlots = Object.entries(slots)
                  .filter(([sLv, n]) => n > (getSpellSlotsAtLevel(clsKey || "", lv - 1)[Number(sLv)] ?? 0));
                return (
                  <div className="text-[10px] text-white/40 space-y-0.5 mt-1">
                    {cant > 0 && <p>✨ Trucchetti: fino a {cant}</p>}
                    {known > 0 && <p>📖 Incantesimi noti/preparati: fino a {known}</p>}
                    {gainedSlots.length > 0 && (
                      <p>🔮 Nuovi slot: {gainedSlots.map(([sLv, n]) => `${n} di ${sLv}°`).join(", ")}
                        {clsKey === "warlock" ? ` (livello ${WARLOCK_SLOT_LEVEL[lv] ?? 1})` : ""}
                      </p>
                    )}
                  </div>
                );
              })()}

              {getFeaturesAtLevel(clsKey || "", lv).length === 0 && !getAsiLevels(clsKey || "").includes(lv) && !clsData?.spellcasting && (
                <p className="text-[10px] text-white/30">Nessuna nuova capacità in questo livello.</p>
              )}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button onClick={apply}
              className="rounded-xl border border-veil-gold/30 bg-veil-gold/15 px-4 py-2 text-sm text-veil-gold hover:bg-veil-gold/25 transition">
              ⚡ Sali al livello {derivedLevel}
            </button>
            {hpGain !== null && <span className="text-[10px] text-white/30">PF max {player.hp_max} → {newHp}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
