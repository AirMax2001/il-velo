"use client";
import { useState } from "react";
import { LabelWithGuide } from "@/components/shared/FieldGuide";
import {
  CONDITIONS_LIST, parseConditions, serializeConditions, CONDITION_DETAILS,
  getModifier, ALL_SKILLS, SKILL_ABILITY, ABILITY_SHORT, SKILL_LABELS,
} from "@/lib/characterEngine";
import { getSpellsForClass } from "@/lib/data/spells";
import { CLASS_ABILITIES, getArchetypeAbilities, getArchetypeForClass, getClassResources } from "@/lib/data/classAbilities";
import { getFeaturesAtLevel } from "@/lib/data/leveling";
import { getRaceSpells } from "@/lib/data/races";
import { findRaceKey } from "@/lib/data/races";
import { SKILL_DESCRIPTIONS } from "@/components/shared/AbilityReferenceTables";
import { CollapseSection } from "./ui";
import { ResourceBar } from "./ResourceBar";
import { CombatOverlay } from "./CombatOverlay";
import type { SheetCtx } from "./types";

const SKILL_LIST = ALL_SKILLS.map(k => ({ key: k, label: SKILL_LABELS[k], ability: SKILL_ABILITY[k] }));

export function SpellTab({ ctx }: { ctx: SheetCtx }) {
  const {
    form, cd, clsKey, clsData, level, pb, attacks, conditions,
    hitDie, autoSlotTotals, spellSlots, upd, updCd, updCdAll, save,
    spellAbility, spellAbilityMod, spellDC, spellAtk, archCasting,
    bgData, raceData, cantripLimit, spellLimit,
  } = ctx;

  const canCast = !!clsData?.spellcasting || !!spellAbility || !!archCasting;
  const spellListKey = clsData?.spellcasting ? (clsKey || "") : (archCasting?.list || clsKey || "");
  const spellAbilityLabel = spellAbility ? (ABILITY_SHORT[spellAbility] || spellAbility) : null;
  
  // Determine caster type: prepared (cleric, druid, wizard, paladin) vs known (bard, ranger, sorcerer, warlock)
  const isPreparedCaster = clsKey && ["cleric", "druid", "wizard", "paladin"].includes(clsKey);
  const isKnownCaster = clsKey && ["bard", "ranger", "sorcerer", "warlock"].includes(clsKey);
  
  const [query, setQuery] = useState("");
  const [showCombat, setShowCombat] = useState(false);
  const [openLevels, setOpenLevels] = useState<Record<number, boolean>>({});
  const [infoOpen, setInfoOpen] = useState<Record<string, boolean>>({});
  const [spellInfoOpen, setSpellInfoOpen] = useState<Record<string, boolean>>({});
  const [profInfoOpen, setProfInfoOpen] = useState(false);
  const [showCantrips, setShowCantrips] = useState(true);
  const [showResAbilities, setShowResAbilities] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const cantrips = ((cd.cantrips || []) as string[]).slice(0, cantripLimit || undefined);
  const maxSpellLv = Math.max(0, ...Object.entries(autoSlotTotals).filter(([, v]) => (v as number) > 0).map(([k]) => Number(k)), 0);
  const rawKnownSpells = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv =>
    (((cd as any)[`spells${lv}`] || []) as string[]).map(name => ({ name, lv })));
  // For prepared casters, show ALL spells in spellbook (no limit).
  // For known casters, limit to spellLimit (from SPELLS_KNOWN table).
  const knownSpells = isPreparedCaster
    ? (maxSpellLv > 0 ? rawKnownSpells.filter(s => s.lv <= maxSpellLv) : rawKnownSpells)
    : (maxSpellLv > 0 ? rawKnownSpells.filter(s => s.lv <= maxSpellLv) : rawKnownSpells).slice(0, spellLimit || undefined);

  const availableAbilities = (CLASS_ABILITIES[clsKey || ""] || [])
    .filter(a => a.level <= level)
    .sort((a, b) => a.level - b.level);

  const archetype = clsKey ? getArchetypeForClass(clsKey) : null;
  const archetypeKey = cd.archetype || "";
  const archetypeLabel = archetype?.options.find(o => o.key === archetypeKey)?.name;
  const archetypeAbilities = archetypeKey
    ? getArchetypeAbilities(archetypeKey).filter(a => a.level <= level)
    : [];

  const chosenSkills = SKILL_LIST.filter(s => (cd as any)[s.key]);

  const resources = clsKey ? getClassResources(clsKey) : [];
  const raceKey = findRaceKey(form?.race || "");
  const raceSpells = raceKey ? getRaceSpells(raceKey, (cd as any).subRaceKey, level) : [];
  const spent = (cd.resources || {}) as Record<string, { total?: number; expended?: number }>;

  function toggleResource(key: string, i: number, total: number) {
    const cur = spent[key]?.expended ?? 0;
    const newVal = cur > i ? i : i + 1;
    const next = { ...spent, [key]: { total, expended: Math.min(newVal, total) } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  function adjustResource(key: string, total: number, delta: number) {
    const cur = spent[key]?.expended ?? 0;
    const newVal = Math.max(0, Math.min(total, cur + delta));
    const next = { ...spent, [key]: { total, expended: newVal } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  function restResource(key: string, total: number) {
    const next = { ...spent, [key]: { total, expended: 0 } };
    updCdAll({ resources: next });
    save({ resources: next });
  }

  const spellDesc = (name: string) => getSpellsForClass(spellListKey, 0).find(s => s.name === name)
    || [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv => getSpellsForClass(spellListKey, lv)).find(s => s.name === name);

  const matches = (name: string): boolean => {
    if (!searching) return true;
    const sp = spellDesc(name);
    return name.toLowerCase().includes(q)
      || (sp?.school || "").toLowerCase().includes(q)
      || (sp?.description || "").toLowerCase().includes(q);
  };

  const hpCur = Number(form?.hp_current) || 0;
  const hpMax = Number(form?.hp_max) || 0;
  const isDead = hpCur <= 0;
  const deathSuccesses = cd.deathSaveSuccesses || 0;
  const deathFailures = cd.deathSaveFailures || 0;
  const isStabilized = deathSuccesses >= 3;
  const isTrulyDead = deathFailures >= 3;

  function handleDeathSave(type: "success" | "failure") {
    if (type === "success") {
      const newSuccesses = deathSuccesses + 1;
      if (newSuccesses >= 3) {
        upd("hp_current", 1);
        updCd("deathSaveSuccesses", 0);
        updCd("deathSaveFailures", 0);
        save({ hp_current: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 });
      } else {
        updCd("deathSaveSuccesses", newSuccesses);
        save({ deathSaveSuccesses: newSuccesses });
      }
    } else {
      const newFailures = deathFailures + 1;
      updCd("deathSaveFailures", newFailures);
      save({ deathSaveFailures: newFailures });
    }
  }

  return (
    <div className="space-y-4">
      {/* Condizione sopra PF — ovale cliccabile con descrizione sotto */}
      {conditions.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            {conditions.map(c => (
              <button key={c} onClick={() => setSelectedCondition(selectedCondition === c ? null : c)} className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${selectedCondition === c ? "border-red-400 bg-red-500/20 text-red-200" : "border-red-500/40 bg-red-900/30 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]"}`}>{c}</button>
            ))}
          </div>
          {selectedCondition && (
            <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-black/30 p-3 text-center">
              <p className="text-xs font-bold text-red-300">{selectedCondition}</p>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{CONDITION_DETAILS[selectedCondition] || "Nessuna descrizione disponibile."}</p>
            </div>
          )}
        </div>
      )}

      {/* Punti Ferita - Always at top */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Punti Ferita</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <LabelWithGuide fieldKey="hp_current" label="PF Correnti" />
            <input type="number" className="veil-input mt-1 w-full text-center text-lg font-bold"
              value={form?.hp_current ?? ""}
              onChange={e => upd("hp_current", Number(e.target.value))}
              onBlur={() => save({ hp_current: ctx.formRef.current?.hp_current })} />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-white/35 mb-1">PF Max</p>
            <p className="text-lg font-bold text-white/60">{hpMax || "—"}</p>
          </div>
          <div className="text-center">
            <LabelWithGuide fieldKey="hitDiceTotal" label="Dadi Vita" />
            <p className="text-lg font-bold text-veil-gold mt-1">{hitDie ? `${level}d${hitDie}` : "—"}</p>
          </div>
        </div>
        {hpMax > 0 && (
          <>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
              <div className={`h-full rounded-full transition-all duration-300 ${hpCur > hpMax * 0.5 ? "bg-emerald-500" : hpCur > hpMax * 0.25 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.max(0, Math.min(100, (hpCur / hpMax) * 100))}%` }} />
            </div>
            <p className="text-[10px] text-white/25 mt-1.5 text-center">{hpCur} / {hpMax} PF {form?.temp_hp ? `+${form.temp_hp} temp` : ""}</p>
          </>
        )}
      </div>

      {/* Schermata Tiri per la Morte - sotto PF quando si va a 0 */}
      {isDead && !isTrulyDead && (
        <div className="veil-panel p-4 border border-red-500/30 bg-red-900/10">
          <h3 className="text-sm text-red-300 font-bold text-center mb-2">Tiri per la Morte</h3>
          <p className="text-[10px] text-white/40 text-center mb-3">
            Tira 1d20: 10+ = successo, &lt;10 = fallimento · 3 successi = stabilizzato · 3 fallimenti = morte
          </p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center">
              <p className="text-[10px] text-emerald-300/70 mb-1.5 font-medium">Successi</p>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <button key={i} onClick={() => handleDeathSave("success")}
                    className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition ${
                      i < deathSuccesses
                        ? "bg-emerald-500/30 border-emerald-400/60 text-emerald-300"
                        : "bg-white/[0.04] border-white/10 text-white/30 hover:border-emerald-400/30"
                    }`}>
                    {i < deathSuccesses ? "✓" : "○"}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-red-300/70 mb-1.5 font-medium">Fallimenti</p>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <button key={i} onClick={() => handleDeathSave("failure")}
                    className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition ${
                      i < deathFailures
                        ? "bg-red-500/30 border-red-400/60 text-red-300"
                        : "bg-white/[0.04] border-white/10 text-white/30 hover:border-red-400/30"
                    }`}>
                    {i < deathFailures ? "✗" : "○"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {isStabilized && (
            <p className="text-center text-emerald-300 font-medium text-xs animate-pulse">
              Stabilizzato! +1 PF
            </p>
          )}
          {isTrulyDead && (
            <div className="text-center mt-2">
              <p className="text-red-400 font-bold text-lg animate-pulse mb-2">MORTO</p>
              <button onClick={() => {
                upd("hp_current", 1);
                updCd("deathSaveSuccesses", 0);
                updCd("deathSaveFailures", 0);
                save({ hp_current: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 });
              }} className="rounded-xl border border-veil-gold/40 bg-veil-gold/10 px-4 py-2 text-sm text-veil-gold hover:bg-veil-gold/20 transition font-medium">
                Resuscita (1 PF)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Competenze */}
      {(() => {
        const armor = clsData?.armorProficiencies || [];
        const weapons = clsData?.weaponProficiencies || [];
        const tools = clsData?.toolProficiencies || [];
        const raceArmors = raceData?.proficiencies?.armors || [];
        const raceWeapons = raceData?.proficiencies?.weapons || [];
        const raceTools = raceData?.proficiencies?.tools || [];
        const bgTools = bgData?.toolProficiencies || [];
        const allArmor = [...new Set([...armor, ...raceArmors])];
        const allWeapons = [...new Set([...weapons, ...raceWeapons])];
        const allTools = [...new Set([...tools, ...raceTools, ...bgTools])];
        if (allArmor.length === 0 && allWeapons.length === 0 && allTools.length === 0) return null;
        return (
          <div className="veil-panel p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm text-veil-gold/80 font-medium">Competenze</h3>
              <button onClick={() => setProfInfoOpen(o => !o)} className="w-5 h-5 rounded-full border border-veil-gold/20 bg-veil-gold/10 flex items-center justify-center text-[10px] text-veil-gold/70 hover:bg-veil-gold/20 transition" title="Mostra dettagli">i</button>
            </div>
            <div className="space-y-2">
              {allArmor.length > 0 && (
                <div className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">🛡️ Armature</p>
                  <p className="text-xs text-white/70">{allArmor.join(", ")}</p>
                </div>
              )}
              {allWeapons.length > 0 && (
                <div className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">⚔️ Armi</p>
                  <p className="text-xs text-white/70">{allWeapons.join(", ")}</p>
                </div>
              )}
              {allTools.length > 0 && (
                <div className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">🔧 Strumenti</p>
                  <p className="text-xs text-white/70">{allTools.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Attacchi */}
      <div className="veil-panel p-4">
        <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Attacchi</h3>
        {attacks.length === 0 && (
          <p className="text-xs text-white/30 text-center py-3">Nessun attacco. Le armi si aggiungono dall&apos;inventario.</p>
        )}
        <div className="space-y-2">
          {attacks.map((a: any, i: number) => (
            <div key={i} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <input className="veil-input text-xs flex-1 min-w-0" placeholder="Nome arma"
                  value={a.name}
                  onChange={e => {
                    const na = attacks.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x);
                    updCdAll({ attacks: na });
                  }}
                  onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
                <button onClick={() => {
                  const na = attacks.filter((_: any, j: number) => j !== i);
                  updCd("attacks", na);
                  save({ attacks: na });
                }} className="shrink-0 text-red-300/40 hover:text-red-300 text-sm">×</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-white/30 mb-0.5">Bonus</p>
                  <input className="veil-input w-full text-xs text-center" placeholder="+5"
                    value={a.bonus}
                    onChange={e => {
                      const na = attacks.map((x: any, j: number) => j === i ? { ...x, bonus: e.target.value } : x);
                      updCdAll({ attacks: na });
                    }}
                    onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-0.5">Danno</p>
                  <input className="veil-input w-full text-xs text-center" placeholder="1d8+3"
                    value={a.damage}
                    onChange={e => {
                      const na = attacks.map((x: any, j: number) => j === i ? { ...x, damage: e.target.value } : x);
                      updCdAll({ attacks: na });
                    }}
                    onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-0.5">Tipo</p>
                  <input className="veil-input w-full text-xs text-center" placeholder="Tagliente"
                    value={a.type || ""}
                    onChange={e => {
                      const na = attacks.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x);
                      updCdAll({ attacks: na });
                    }}
                    onBlur={() => save({ attacks: ctx.formRef.current?.character_data?.attacks })} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Morto - schermata bloccata */}
      {isTrulyDead && !isDead && (
        <div className="veil-panel p-6 border border-red-500/30 bg-red-900/10 text-center">
          <p className="text-red-400 font-bold text-xl mb-3">MORTO</p>
          <button onClick={() => {
            upd("hp_current", 1);
            updCd("deathSaveSuccesses", 0);
            updCd("deathSaveFailures", 0);
            save({ hp_current: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 });
          }} className="rounded-xl border border-veil-gold/40 bg-veil-gold/10 px-4 py-2 text-sm text-veil-gold hover:bg-veil-gold/20 transition font-medium">
            Resuscita (1 PF)
          </button>
        </div>
      )}

      {/* Resto del contenuto solo se non morto */}
      {!isTrulyDead && (
        <>

          {resources.length > 0 && (
            <div className="veil-panel p-4">
              <button onClick={() => setShowResAbilities(o => !o)} className="flex items-center justify-between gap-2 w-full cursor-pointer">
                <span className="text-sm text-veil-gold/80 font-medium">Risorse di Classe</span>
                <span className="text-[10px] text-veil-gold/40">{showResAbilities ? "▲" : "▼"}</span>
              </button>
              {showResAbilities && (
                <>
                  <div className="h-px bg-white/[0.06] mt-3 mb-3" />
                  <div className="flex justify-center mb-3">
                    <ResourceBar clsKey={clsKey} level={level} pb={pb} cd={cd} updCdAll={updCdAll} save={save} />
                  </div>
                  {(() => {
                    const abilities = CLASS_ABILITIES[clsKey || ""] || [];
                    const archetypeAbilities = getArchetypeAbilities(cd.archetype || "");
                    const allAbilities = [...abilities, ...archetypeAbilities];

                    const resourceAbilityMap: Record<string, string[]> = {
                      barbarian: ["barbarian_ira","barbarian_attacco_avventato","berserker_furia","totem_spirito","ancestrali_guardiani"],
                      bard: ["bard_ispirazione","bard_canto_riposo","sapere_ispirazione_taglio","valore_ispirazione_combattiva","spade_stile_duello","spade_bravura"],
                      cleric: ["cleric_incanalare","vita_preservare_vita","luce_radianza_alba","guerra_colpo_guidato","inganno_duplicato","conoscenza_eoni","natura_incanto","tempesta_ira"],
                      druid: ["druid_forma_selvatica","luna_forma_combattiva","terra_recupero_naturale","sogni_guarigione_distante"],
                      fighter: ["fighter_secondo_soffio","fighter_azione_impetuosa","fighter_indomito","campione_critico","maestro_manovre","cavaliere_sfida"],
                      monk: ["monk_raffica_colpi","monk_presa_difensiva","monk_passo_vento","monk_deflessione_missili","monk_colpo_stordente","monk_evasione","via_aperta_onda_ki","ombra_passo_ombroso","elementi_ondata_acqua","elementi_pugno_pietra","elementi_manto_fuoco","elementi_alito_ghiaccio"],
                      paladin: ["paladin_percezione_divino","paladin_imposizione_mani","paladin_colpo_divino","devozione_arma_radiosa","antichi_presenza","vendetta_nemico_giurato"],
                      ranger: ["ranger_nemico_prescelto","ranger_esploratore_nativo","ranger_azione_aggigliata","cacciatore_difesa","bestie_comando"],
                      rogue: ["rogue_attacco_furtivo","rogue_azione_furba","ladro_mano_veloce","assassino_colpo_mortale","truffatore_mano_magica"],
                      sorcerer: ["sorcerer_punti_stregoneria","sorcerer_meta_incantamento_distant","sorcerer_meta_incantamento_empowered","sorcerer_meta_incantamento_extended","sorcerer_meta_incantamento_heightened","sorcerer_meta_incantamento_quickened","sorcerer_meta_incantamento_subtle","sorcerer_meta_incantamento_twinned","draconica_squame","selvaggia_ondata"],
                      warlock: ["warlock_invocazioni","arcano_colpo_oscuro","fatato_ferocia","antico_telepatia"],
                      wizard: ["wizard_recupero_arcano","abiurazione_scudo_arcano","congiurazione_evocazione_minore","divinazione_portento","ammaliamento_sguardo","evocazione_scultore","illusione_migliorata","necromanzia_recupero","trasmutazione_alchimia"],
                    };

                    const resourceAbilityKeys = resourceAbilityMap[clsKey || ""] || [];
                    const resourceAbilities = allAbilities.filter(a => {
                      if (a.level > level) return false;
                      return resourceAbilityKeys.includes(a.key);
                    });

                    if (resourceAbilities.length === 0) return null;

                    const resourceNames: Record<string, string> = {
                      bard: "🎵 Ispirazione Bardica", monk: "☯ Punti Ki", barbarian: "🔥 Ire",
                      cleric: "✨ Incanalare Divinità", sorcerer: "💠 Punti Stregoneria / Metamagia",
                      fighter: "⚡ Risorse Combattive", wizard: "📖 Recupero Arcano",
                      druid: "🐻 Forme Selvatiche", paladin: "👁️ Percezioni del Divino",
                      ranger: "🏹 Risorse del Ranger", rogue: "🗡️ Risorse del Ladro",
                      warlock: "🔮 Invocazioni",
                    };

                    return (
                      <div>
                        <h3 className="text-xs text-veil-gold/60 font-medium mb-2">{resourceNames[clsKey || ""] || "Capacità"}</h3>
                        <div className="space-y-2">
                          {resourceAbilities.map(a => (
                            <div key={a.key} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-veil-gold/80 font-medium">{a.name}</p>
                                <div className="flex items-center gap-1.5">
                                  {a.die && <span className="text-[9px] text-veil-gold/60 rounded-full bg-veil-gold/10 border border-veil-gold/20 px-2 py-0.5 font-bold">{a.die}</span>}
                                  <span className="text-[9px] text-white/30 rounded-full bg-white/[0.04] px-2 py-0.5">{a.action}</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{a.effect}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[9px] text-white/30">Usi: {a.uses}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Magie Razziali (PHB) — non contano nei limiti di classe */}
          {raceSpells.length > 0 && (
            <div className="veil-panel p-4">
              <h3 className="text-sm text-veil-gold/80 font-medium">✨ Magie Razziali</h3>
              <p className="text-[11px] text-white/30 mt-1">Sbloccate dalla razza al livello indicato, lancia 1 volta al giorno senza slot (trucchetti a volontà).</p>
              <div className="mt-3 space-y-2">
                {raceSpells.map(rs => (
                  <div key={rs.spell + rs.level} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-veil-gold/80 font-medium">{rs.spell}</p>
                      <span className="text-[10px] text-white/30 rounded-full bg-white/[0.04] px-2 py-0.5">{rs.spellLevel === 0 ? "trucchetto" : `${rs.spellLevel}° livello`} · liv. {rs.level}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1">Caratteristica: {rs.ability}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trucchetti */}
          {cantrips.length > 0 && (
            <div className="veil-panel p-4">
              <button onClick={() => setShowCantrips(o => !o)} className="flex items-center justify-between gap-2 w-full cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-veil-gold/80 font-medium">
                  ✨ Trucchetti
                  <span className="text-[11px] text-white/30 rounded-full bg-white/[0.06] px-2 py-0.5">{cantrips.length}</span>
                </span>
                <span className="text-[10px] text-veil-gold/40">{showCantrips ? "▲" : "▼"}</span>
              </button>
              {showCantrips && (
                <>
                  <p className="text-[10px] text-white/30 mt-2 mb-2">A volontà, non consumano slot.</p>
                  <div className="space-y-2">
                    {cantrips.map(name => {
                      const sp = spellDesc(name);
                      const key = `cantrip-inline-${name}`;
                      const open = !!spellInfoOpen[key];
                      return (
                        <div key={name} className="rounded-lg bg-black/20 border border-white/[0.06] p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-veil-gold/80 font-medium">{name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] text-white/30 rounded-full bg-white/[0.04] px-2 py-0.5">{sp?.school || ""}</span>
                              <button onClick={() => setSpellInfoOpen(o => ({ ...o, [key]: !o[key] }))} className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold transition">i</button>
                            </div>
                          </div>
                          {open && sp && <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{sp.description}</p>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {canCast && (
            <div className="veil-panel p-4 space-y-5">
              <div>
                <h3 className="text-sm text-veil-gold/80 font-medium mb-3">Statistiche Incantatore</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] text-blue-300/50">Caratteristica</p>
                  <button onClick={()=>setInfoOpen(o=>({...o, caratt: !o.caratt}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
                </div>
                <p className="text-sm text-blue-200 font-medium">{spellAbilityLabel || "—"}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{spellAbility || ""}</p>
                {infoOpen.caratt && (
                  <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                    <strong className="text-white/60">Cosa è:</strong> la caratteristica di lancio della tua classe
                    (es. Mago = INT, Chierico = SAG, Bardo = CAR).<br />
                    <strong className="text-white/60">A cosa serve:</strong> dal suo modificatore dipendono CD Inc. e Attacco.<br />
                    <strong className="text-white/60">Quando usarla:</strong> ogni volta che lanci un incantesimo.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] text-blue-300/50">CD Inc.</p>
                  <button onClick={()=>setInfoOpen(o=>({...o, cd: !o.cd}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
                </div>
                <p className="text-xl font-bold text-blue-200">{spellDC}</p>
                <p className="text-[10px] text-white/25 mt-0.5">8 (base) {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : `${spellAbilityMod}`} ({spellAbilityLabel || "—"}) +{pb} (PB)</p>
                {infoOpen.cd && (
                  <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                    <strong className="text-white/60">Cosa è:</strong> Classe Difficoltà Incantatore, la soglia da superare.<br />
                    <strong className="text-white/60">A cosa serve:</strong> il nemico deve fare un tiro salvezza ≥ a questo numero.<br />
                    <strong className="text-white/60">Quando usarla:</strong> con incantesimi che impongono un tiro salvezza
                    (es. Sonno, Fiamma Sacra): tira 1d20 + il suo mod. e deve superare la CD.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] text-blue-300/50">Mod Attacco</p>
                  <button onClick={()=>setInfoOpen(o=>({...o, atk: !o.atk}))} className="w-5 h-5 rounded-full border border-blue-400/20 bg-blue-900/20 flex items-center justify-center text-[10px] text-blue-300/70 hover:bg-blue-900/30 transition" title="Mostra descrizione">i</button>
                </div>
                <p className="text-xl font-bold text-blue-200">{spellAtk >= 0 ? `+${spellAtk}` : `${spellAtk}`}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{spellAbilityMod >= 0 ? `+${spellAbilityMod}` : `${spellAbilityMod}`} ({spellAbilityLabel || "—"}) +{pb} (PB)</p>
                {infoOpen.atk && (
                  <p className="text-[10px] text-white/40 mt-2 leading-snug border-t border-white/[0.06] pt-2">
                    <strong className="text-white/60">Cosa è:</strong> il bonus al tuo tiro per colpire magico.<br />
                    <strong className="text-white/60">A cosa serve:</strong> lo sommi a 1d20 per superare la CA del bersaglio.<br />
                    <strong className="text-white/60">Quando usarla:</strong> con incantesimi con tiro per colpire
                    (es. Dardo di Fuoco, Raggio di Gelo): se il totale è ≥ CA, colpisci.
                  </p>
                )}
              </div>
                </div>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div>
                <h3 className="text-sm text-veil-gold/80 font-medium mb-3 text-center">Slot Incantesimi Disponibili</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                    const total = autoSlotTotals[lv] ?? 0;
                    if (total === 0) return null;
                    const used = spellSlots[lv]?.expended ?? 0;
                    const available = Math.max(0, total - used);
                    return (
                      <div key={lv} className="text-center flex flex-col items-center">
                        <p className="text-[10px] text-white/30 mb-1">{lv}° Liv.</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { const nv = Math.min(total, used + 1); updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); save({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Spendi (− toglie un pallino)">−</button>
                          <div className="flex justify-center gap-0.5 flex-wrap">
                            {Array.from({ length: Math.min(total, 9) }, (_, i) => (
                              <button key={i} onClick={() => {
                                const newUsed = i < used ? i : i + 1;
                                updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                                save({ spellSlots: { ...spellSlots, [lv]: { total, expended: Math.min(newUsed, total) } } });
                              }}
                                className={`w-5 h-5 rounded-full border transition ${i < (total - used) ? "bg-blue-500/40 border-blue-400/50" : "bg-white/[0.04] border-white/10"}`}
                                title={i < (total - used) ? "Slot disponibile (clicca per usare)" : "Slot usato"} />
                            ))}
                          </div>
                          <button onClick={() => { const nv = Math.max(0, used - 1); updCdAll({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); save({ spellSlots: { ...spellSlots, [lv]: { total, expended: nv } } }); }} className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[11px] text-white/50 hover:border-white/20 hover:text-white" title="Recupera (+ aggiunge un pallino)">+</button>
                        </div>
                        <p className="text-[9px] text-white/25 mt-0.5">{available} disponibili</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              {isPreparedCaster && (
                <>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-3">
                    <h3 className="text-sm text-emerald-300 font-medium mb-2 text-center">Incantesimi Preparati</h3>
                    <p className="text-center text-white/70">
                      Puoi preparare <strong className="text-emerald-300">{spellLimit}</strong> incantesimi
                      (mod. {spellAbilityLabel} {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : spellAbilityMod} + livello {level} = {spellLimit}).
                    </p>
                    <p className="text-[10px] text-white/30 mt-1 text-center">Hai {knownSpells.length} incantesimi nel tuo libro/nel tuo repertorio.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Incantesimi per livello (collassabili) */}
          {knownSpells.length > 0 && (
            <CollapseSection
              title="Incantesimi"
              subtitle="Consumano slot del livello corrispondente."
              defaultOpen={true}
              badge={<span className="rounded-full bg-veil-gold/10 border border-veil-gold/20 px-2 py-0.5 text-[11px] text-veil-gold/70">{knownSpells.map(s => s.name).filter(name => matches(name)).length}</span>}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lv => {
                const list = knownSpells.filter(s => s.lv === lv);
                if (list.length === 0) return null;
                const open = searching ? true : openLevels[lv] !== false;
                return (
                  <div key={lv} className="mb-2">
                    <button type="button" onClick={() => setOpenLevels(o => ({ ...o, [lv]: !open }))}
                      className="w-full flex items-center justify-between gap-2 text-left mb-1 py-1 group">
                      <p className="text-xs text-white/40">{lv}° Livello</p>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-white/40">{list.length}</span>
                        <span className={`text-white/30 text-[10px] transition-transform duration-200 group-hover:text-white/60 ${open ? "" : "-rotate-90"}`}>▼</span>
                      </span>
                    </button>
                    {open && (
                      <div className="space-y-2">
                        {list.map(({ name }) => {
                          const sp = spellDesc(name);
                          if (searching && !matches(name)) return null;
                          const key=`spell-${name}`;
                          const open=!!spellInfoOpen[key];
                          const descLower = (sp?.description || "").toLowerCase();
                          const isAtk = descLower.includes("tiro per colpire") || descLower.includes("tiro a distanza") || descLower.includes("tiro in mischia");
                          const hasSave = descLower.includes("deve superare un ts") || descLower.includes("tiro salvezza") || descLower.includes(" ts ");
                          return (
                            <div key={name} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-white/80">{name}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-white/25">{sp?.school || ""}</span>
                                  <button onClick={()=>setSpellInfoOpen(o=>({...o,[key]:!o[key]}))} className="w-5 h-5 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/40 hover:border-veil-gold/20 hover:text-veil-gold transition" title="Mostra descrizione">i</button>
                                </div>
                              </div>
                              {open && sp && <p className="text-xs text-white/40 mt-1.5 leading-relaxed border-t border-white/[0.06] pt-1.5">{sp.description}</p>}
                              {open && sp && (isAtk || hasSave) && (
                                <p className="text-[10px] mt-2 rounded bg-indigo-900/20 border border-indigo-500/20 px-2 py-1.5 leading-snug text-indigo-200/70">
                                  {isAtk ? <>🎲 <strong className="text-indigo-200">Tiro per colpire:</strong> 1d20 {spellAtk >= 0 ? `+${spellAtk}` : spellAtk} (mod. {spellAbilityLabel} {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : spellAbilityMod} + comp. +{pb}) vs CA. Se colpisci → tira i danni indicati.</> : null}
                                  {isAtk && hasSave ? <br /> : null}
                                  {hasSave ? <>🛡️ <strong className="text-indigo-200">Tiro salvezza:</strong> bersaglio tira 1d20 + suo mod. vs CD {spellDC} (8 + {spellAbilityMod >= 0 ? `+${spellAbilityMod}` : spellAbilityMod} + {pb}). Se fallisce → effetto pieno.</> : null}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {searching && knownSpells.filter(s => matches(s.name)).length === 0 && (
                <p className="text-xs text-white/30 text-center py-2">Nessun incantesimo corrisponde alla ricerca.</p>
              )}
            </CollapseSection>
          )}
        </>
      )}

      {showCombat && <CombatOverlay ctx={ctx} onClose={() => setShowCombat(false)} />}

    </div>
  );
}