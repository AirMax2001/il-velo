"use client";
import {
  ALL_SKILLS, SKILL_ABILITY, SKILL_LABELS, ABILITY_SHORT, getModifier,
  type SkillKey,
} from "@/lib/characterEngine";
import { skillGuides } from "@/lib/fieldGuides";
import type { WizardCtx } from "./types";

export function Step5Skills({ ctx }: { ctx: WizardCtx }) {
  const { data, setData, cls, bgSkills, raceSkills, subRaceSkills, finalScores, pb } = ctx;
  if (!cls) return null;
  const autoSkillsSet = new Set<SkillKey>([...bgSkills, ...raceSkills, ...subRaceSkills]);
  const classPicks = data.selectedSkills.filter(s => cls.skillOptions.includes(s)).length;
  const picksLeft = cls.skillPicks - classPicks;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Abilità</h2>
        <p className="text-sm text-white/50 mt-1">
          Il tuo {cls.name} può scegliere <strong className="text-white/70">{cls.skillPicks} abilità</strong> dalla lista della classe.
          Le abilità da background e razza sono aggiunte automaticamente.
        </p>
      </div>

      <div className={`rounded-xl border px-3 py-2 text-xs ${picksLeft < 0 ? "border-red-500/30 bg-red-900/10 text-red-300" : picksLeft === 0 ? "border-emerald-500/30 bg-emerald-900/10 text-emerald-300" : "border-veil-gold/20 bg-veil-gold/5 text-veil-gold/70"}`}>
        {picksLeft > 0 ? `Scegli ancora ${picksLeft} abilità dalla classe` : picksLeft === 0 ? "✓ Abilità di classe complete!" : `⚠ Hai selezionato troppo (${Math.abs(picksLeft)} di troppo)`}
      </div>

      <div className="grid gap-1.5 max-h-72 overflow-y-auto pr-1">
        {ALL_SKILLS.map(skill => {
          const isAutomatic = autoSkillsSet.has(skill);
          const isClassSkill = cls.skillOptions.includes(skill);
          const isSelected = data.selectedSkills.includes(skill) || isAutomatic;
          const canPick = !isSelected && isClassSkill && classPicks < cls.skillPicks;
          const canRemove = isSelected && !isAutomatic;
          const ability = SKILL_ABILITY[skill];
          const mod = finalScores ? getModifier(finalScores[ability]) + (isSelected ? pb : 0) : 0;
          const guide = skillGuides.find(g => g.key === skill);

          const source = isAutomatic
            ? bgSkills.includes(skill) ? "background" : raceSkills.includes(skill) || subRaceSkills.includes(skill) ? "razza" : "auto"
            : isClassSkill ? "classe" : null;

          if (!isAutomatic && !isClassSkill) return null;

          return (
            <button key={skill} onClick={() => {
              if (isAutomatic) return;
              if (isSelected) {
                setData(prev => ({ ...prev, selectedSkills: prev.selectedSkills.filter(s => s !== skill) }));
              } else if (canPick) {
                setData(prev => ({ ...prev, selectedSkills: [...prev.selectedSkills, skill] }));
              }
            }}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition
                ${isAutomatic ? "border-emerald-500/20 bg-emerald-900/10 cursor-default" :
                isSelected ? "border-veil-gold/40 bg-veil-gold/[0.06]" :
                canPick ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" :
                "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${isSelected ? isAutomatic ? "bg-emerald-600/30 border-emerald-400 text-emerald-300" : "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                {isSelected ? "✓" : ""}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isSelected ? "text-white" : "text-white/60"}`}>{SKILL_LABELS[skill]}</span>
                  <span className="text-[10px] text-white/30">({ABILITY_SHORT[ability]})</span>
                  {isSelected && <span className="text-xs text-veil-gold/60">{finalScores ? (mod >= 0 ? `+${mod}` : `${mod}`) : ""}</span>}
                  {source && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${source === "background" ? "bg-emerald-900/30 text-emerald-300/60" : source === "razza" ? "bg-indigo-900/30 text-indigo-300/60" : "bg-veil-gold/10 text-veil-gold/50"}`}>
                      {source}
                    </span>
                  )}
                </div>
                {guide && <p className="text-[10px] text-white/30 mt-0.5">{guide.guide}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}