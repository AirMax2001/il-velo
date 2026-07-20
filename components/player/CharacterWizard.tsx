"use client";
import { useState, useEffect } from "react";
import { wizardSteps, getGuide } from "@/lib/fieldGuides";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import type { Player, CharacterData } from "@/lib/types";

type Props = {
  player: Player;
  onComplete: (data: Player) => void;
  onClose: () => void;
};

const WIZARD_KEY = "veil-wizard-done";
const WIZARD_SAVE_KEY = "veil-wizard-data";

export function isWizardDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(WIZARD_KEY) === "true";
}

export function markWizardDone() {
  localStorage.setItem(WIZARD_KEY, "true");
  localStorage.removeItem(WIZARD_SAVE_KEY);
}

function loadWizardData(): { step: number; form: any; cd: any } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(WIZARD_SAVE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveWizardData(step: number, form: any, cd: any) {
  localStorage.setItem(WIZARD_SAVE_KEY, JSON.stringify({ step, form, cd }));
}

export function CharacterWizard({ player, onComplete, onClose }: Props) {
  const saved = loadWizardData();
  const [step, setStep] = useState(saved?.step || 0);
  const [form, setForm] = useState(saved?.form || player);
  const [cd, setCd] = useState<CharacterData>(saved?.cd || player.character_data || {});
  const [saving, setSaving] = useState(false);

  const current = wizardSteps[step];
  const total = wizardSteps.length;

  // Auto-save on every field change
  useEffect(() => { saveWizardData(step, form, cd); }, [step, form, cd]);

  function updateField(key: string, value: any) {
    if (["character_name", "race", "class", "level", "xp", "hp_current", "hp_max", "temp_hp", "coins", "conditions", "age", "personality", "history", "goals", "fear", "important_person", "secret", "background"].includes(key)) {
      setForm((f: any) => ({ ...f, [key]: value }));
    } else {
      setCd((prev: any) => ({ ...prev, [key]: value }));
    }
  }

  function fieldsInStep(): { key: string; label: string; value: any; guide: string; type: string }[] {
    return current.fields.map(key => {
      const guide = getGuide(key);
      const val = ["character_name", "race", "class", "level", "xp", "hp_current", "hp_max", "temp_hp", "coins", "conditions", "age", "personality", "history", "goals", "fear", "important_person", "secret", "background"].includes(key)
        ? (form as any)[key] : (cd as any)[key];
      const isNumber = ["level", "xp", "hp_current", "hp_max", "temp_hp", "coins", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma", "armorClass", "initiative", "speed", "proficiencyBonus", "spellSaveDC", "spellAttackBonus"].includes(key);
      const isCheckbox = key.startsWith("st") || key.startsWith("skill");
      const isTextarea = ["history", "goals", "secret", "personalityTraits", "ideals", "bonds", "flaws", "languages", "otherProficiencies", "allies", "treasure"].includes(key);
      const type = isCheckbox ? "checkbox" : isNumber ? "number" : isTextarea ? "textarea" : "text";
      return { key, label: guide?.label || key, value: val ?? (isCheckbox ? false : ""), guide: guide?.guide || "", type };
    });
  }

  function isStepComplete(): boolean {
    return fieldsInStep().every(f => {
      if (f.type === "checkbox") return true;
      return f.value !== "" && f.value !== null && f.value !== undefined;
    });
  }

  function mod(score: number | undefined): string {
    if (score == null) return "0";
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  }

  async function finish() {
    setSaving(true);
    try {
      const body: any = { id: player.id };
      for (const [k, v] of Object.entries(form)) {
        if (k === "character_data" || k === "id") continue;
        body[k] = v;
      }
      body.character_data = cd;
      const res = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.player) {
        markWizardDone();
        onComplete(d.player);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl border border-veil-gold/20 bg-[#0a0806] p-6 shadow-[0_0_80px_rgba(140,92,30,0.15)]">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {wizardSteps.map((s, i) => (
            <div key={s.id} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-veil-gold/60" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-veil-gold/50">Passo {step + 1} di {total}</p>
          <h2 className="text-xl text-veil-gold mt-1">{current.title}</h2>
          <p className="text-sm text-white/50 mt-1">{current.desc}</p>
          <div className="mt-3 rounded-xl border border-veil-gold/10 bg-veil-gold/[0.04] px-4 py-3">
            <p className="text-xs text-veil-gold/70 leading-relaxed">{current.guide}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {fieldsInStep().map(f => {
            if (f.type === "checkbox") {
              return (
                <label key={f.key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="accent-veil-gold w-4 h-4" checked={!!f.value}
                    onChange={e => updateField(f.key, e.target.checked)} />
                  <div>
                    <span className="text-sm text-white/70">{f.label}</span>
                    {f.guide && <p className="text-[11px] text-white/40 mt-0.5">{f.guide}</p>}
                  </div>
                </label>
              );
            }
            if (f.type === "textarea") {
              return (
                <div key={f.key}>
                  <LabelWithGuide fieldKey={f.key} label={f.label} className="text-sm text-white/70 mb-1" />
                  {f.guide && <p className="text-[11px] text-white/40 mb-1">{f.guide}</p>}
                  <textarea className="veil-input w-full min-h-[80px]" value={f.value}
                    onChange={e => updateField(f.key, e.target.value)} />
                </div>
              );
            }
            // Abilità scores row — mostra modificatore
            if (["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].includes(f.key)) {
              const score = Number(f.value) || 10;
              return (
                <div key={f.key}>
                  <LabelWithGuide fieldKey={f.key} label={f.label} className="text-sm text-white/70 mb-1" />
                  {f.guide && <p className="text-[11px] text-white/40 mb-1">{f.guide}</p>}
                  <div className="flex items-center gap-3">
                    <input type="number" className="veil-input w-24 text-center text-lg font-bold" value={score}
                      onChange={e => updateField(f.key, Number(e.target.value))} min={1} max={30} />
                    <span className="text-sm text-veil-gold">Modificatore: {mod(score)}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={f.key}>
                <LabelWithGuide fieldKey={f.key} label={f.label} className="text-sm text-white/70 mb-1" />
                {f.guide && <p className="text-[11px] text-white/40 mb-1">{f.guide}</p>}
                <input type={f.type} className="veil-input w-full" value={f.value}
                  onChange={e => updateField(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} min={f.type === "number" ? 0 : undefined} />
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-white/40 hover:text-white/60">Salta guida</button>
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:border-white/20">
                Indietro
              </button>
            )}
            {step < total - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="rounded-xl bg-veil-gold/20 border border-veil-gold/40 px-5 py-2 text-xs font-semibold text-veil-gold hover:bg-veil-gold/30 transition">
                Prossimo
              </button>
            ) : (
              <button onClick={finish} disabled={saving}
                className="rounded-xl bg-veil-gold/20 border border-veil-gold/40 px-5 py-2 text-xs font-semibold text-veil-gold hover:bg-veil-gold/30 disabled:opacity-50">
                {saving ? "Salvataggio..." : "Completa scheda!"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
