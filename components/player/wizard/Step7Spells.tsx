"use client";
import { getSpellsForClass } from "@/lib/data/spells";
import { getModifier, ABILITY_LABELS, type AbilityName } from "@/lib/characterEngine";
import type { WizardCtx } from "./types";

export function Step7Spells({ ctx }: { ctx: WizardCtx }) {
  const { data, setData, cls, finalScores, pb } = ctx;
  if (!cls?.spellcasting) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl text-veil-gold">Incantesimi</h2>
          <p className="text-sm text-white/50 mt-1">La classe selezionata non usa la magia. Puoi procedere.</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-black/20 p-8 text-center">
          <p className="text-4xl mb-3">⚔️</p>
          <p className="text-white/40">{cls?.name || "Questa classe"} non lancia incantesimi al livello 1.</p>
          <p className="text-[11px] text-white/25 mt-1">Premi "Prossimo" per continuare.</p>
        </div>
      </div>
    );
  }

  const sc = cls.spellcasting;
  const spellAbility = sc.spellcastingAbility as AbilityName;
  const scMod = finalScores ? getModifier(finalScores[spellAbility]) : 0;
  const spellDC = 8 + pb + scMod;
  const spellAtk = pb + scMod;
  const cantripsSelected = data.selectedSpells.filter(s => getSpellsForClass(data.classKey, 0).some(sp => sp.name === s)).length;
  const spellsSelected = data.selectedSpells.filter(s => getSpellsForClass(data.classKey, 1).some(sp => sp.name === s)).length;

  function toggleSpell(name: string, level: 0 | 1) {
    const maxCantrips = sc.cantripsKnown;
    const maxSpells = sc.spellsKnown;
    setData(prev => {
      const sel = prev.selectedSpells;
      if (sel.includes(name)) return { ...prev, selectedSpells: sel.filter(s => s !== name) };
      if (level === 0 && cantripsSelected >= maxCantrips) return prev;
      if (level === 1 && spellsSelected >= maxSpells) return prev;
      return { ...prev, selectedSpells: [...sel, name] };
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl text-veil-gold">Incantesimi</h2>
        <p className="text-sm text-white/50 mt-1">
          Come {cls.name}, usi <strong className="text-white/70">{ABILITY_LABELS[spellAbility]}</strong> per lanciare incantesimi.
          CD: <strong className="text-white/70">{spellDC}</strong> · Bonus attacco: <strong className="text-white/70">+{spellAtk}</strong>
        </p>
      </div>

      {sc.cantripsKnown > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50 font-medium">Trucchetti (a volontà)</p>
            <span className={`text-xs ${cantripsSelected >= sc.cantripsKnown ? "text-emerald-400" : "text-veil-gold/60"}`}>
              {cantripsSelected}/{sc.cantripsKnown}
            </span>
          </div>
          <div className="grid gap-1.5 max-h-44 overflow-y-auto pr-1">
            {getSpellsForClass(data.classKey, 0).map(spell => {
              const isSelected = data.selectedSpells.includes(spell.name);
              const canAdd = cantripsSelected < sc.cantripsKnown;
              return (
                <button key={spell.name} onClick={() => toggleSpell(spell.name, 0)}
                  className={`text-left rounded-xl border p-2.5 transition ${isSelected ? "border-veil-gold/40 bg-veil-gold/[0.06]" : canAdd ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" : "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${isSelected ? "bg-veil-gold/30 border-veil-gold text-veil-gold" : "border-white/20"}`}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <p className="text-sm text-white font-medium">{spell.name}</p>
                    <span className="text-[10px] text-white/30 ml-auto">{spell.school}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1 ml-6">{spell.castingTime} · {spell.range} · {spell.duration}</p>
                  <p className="text-[10px] text-white/45 mt-0.5 ml-6">{spell.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sc.spellsKnown > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50 font-medium">Incantesimi 1° Livello</p>
            <span className={`text-xs ${spellsSelected >= sc.spellsKnown ? "text-emerald-400" : "text-veil-gold/60"}`}>
              {spellsSelected}/{sc.spellsKnown}
            </span>
          </div>
          <div className="grid gap-1.5 max-h-44 overflow-y-auto pr-1">
            {getSpellsForClass(data.classKey, 1).map(spell => {
              const isSelected = data.selectedSpells.includes(spell.name);
              const canAdd = spellsSelected < sc.spellsKnown;
              return (
                <button key={spell.name} onClick={() => toggleSpell(spell.name, 1)}
                  className={`text-left rounded-xl border p-2.5 transition ${isSelected ? "border-blue-500/40 bg-blue-900/[0.08]" : canAdd ? "border-white/[0.06] bg-black/30 hover:border-white/[0.14]" : "border-white/[0.04] bg-black/20 opacity-40 cursor-not-allowed"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${isSelected ? "bg-blue-500/30 border-blue-400 text-blue-300" : "border-white/20"}`}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <p className="text-sm text-white font-medium">{spell.name}</p>
                    <span className="text-[10px] text-blue-300/40 ml-auto">1°</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1 ml-6">{spell.castingTime} · {spell.range} · {spell.duration}</p>
                  <p className="text-[10px] text-white/45 mt-0.5 ml-6">{spell.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sc.spellsKnown === 0 && sc.cantripsKnown > 0 && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
          <p className="text-xs text-blue-300/70">
            Il {cls.name} prepara gli incantesimi invece di conoscerli a memoria. Scegli solo i trucchetti ora —
            gli incantesimi preparabili dipendono dal tuo livello di {ABILITY_LABELS[spellAbility]}.
          </p>
        </div>
      )}
    </div>
  );
}