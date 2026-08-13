"use client";
import { useState } from "react";
import { getSpellsForClass, type Spell } from "@/lib/data/spells";
import { CLASS_ABILITIES, getArchetypeAbilities, getArchetypeForClass } from "@/lib/data/classAbilities";
import type { SheetCtx } from "./types";

type CastType = "action" | "bonus" | "reaction" | null;

const castType = (ct: string): CastType => {
  const c = (ct || "").toLowerCase();
  if (c.startsWith("1 azione bonus")) return "bonus";
  if (c.startsWith("1 reazione")) return "reaction";
  if (c.startsWith("1 azione")) return "action";
  return null;
};

const BASE_ACTIONS = [
  { name: "Scatto", desc: "Azione: la tua velocità di movimento raddoppia fino alla fine del turno." },
  { name: "Disimpegno", desc: "Azione: per questo turno il tuo movimento non provoca attacchi di opportunità da parte dei nemici." },
  { name: "Schivare", desc: "Azione: fino al tuo prossimo turno i tiri per colpire contro di te hanno svantaggio e i TS su DES hanno vantaggio." },
  { name: "Aiuto", desc: "Azione: un alleato entro 1,5 metri ottiene vantaggio sulla sua prossima prova caratteristica o sul prossimo tiro per colpire." },
  { name: "Nascondersi", desc: "Azione: fai una prova di Furtività per nasconderti. Richiede di aver copertura o essere fuori dalla vista." },
  { name: "Cercare", desc: "Azione: fai una prova di Percezione per individuare creature o oggetti nascosti." },
  { name: "Usare un Oggetto", desc: "Azione: attivi un oggetto magico o complesso (es. pozione rivolta ad altri, leva, oggetto incantato)." },
];

function Item({ icon, title, meta, desc, gold }: { icon?: string; title: string; meta?: string; desc: string; gold?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${gold ? "border-veil-gold/25 bg-veil-gold/[0.05]" : "border-white/[0.06] bg-black/30"}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-white/80 font-medium">{icon && `${icon} `}{title}</p>
        {meta && <span className="text-[9px] text-veil-gold/50 flex-shrink-0">{meta}</span>}
      </div>
      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

function TurnBlock({ title, subtitle, active, done, always, onConfirm, children }: {
  title: string; subtitle?: string; active: boolean; done: boolean; always?: boolean;
  onConfirm?: () => void; children?: React.ReactNode;
}) {
  const visible = always || active || done;
  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${always ? "border-indigo-400/25 bg-indigo-950/10" : active ? "border-veil-gold/60 bg-veil-gold/[0.06] shadow-[0_0_28px_rgba(218,180,113,0.18)]" : done ? "border-emerald-400/20 bg-black/20" : "border-white/[0.06] bg-black/20"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${always ? "text-indigo-300/80" : active ? "text-veil-gold" : done ? "text-emerald-300/70" : "text-white/35"}`}>
            {active && "▶ "}{title}
          </p>
          {subtitle && <p className="text-[11px] text-white/30 mt-0.5">{subtitle}</p>}
        </div>
        {active ? (
          <button type="button" onClick={onConfirm}
            className="shrink-0 h-10 w-10 rounded-full border border-veil-gold/60 bg-veil-gold/20 text-lg font-bold text-veil-gold hover:bg-veil-gold/35 transition flex items-center justify-center"
            title="Conferma: ho fatto/finito questa parte del turno">
            ✓
          </button>
        ) : done ? (
          <span className="shrink-0 h-8 w-8 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-sm text-emerald-300 flex items-center justify-center">✓</span>
        ) : null}
      </div>
      {visible && children && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

export function CombatOverlay({ ctx, onClose }: { ctx: SheetCtx; onClose: () => void }) {
  const { cd, clsKey, clsData, form, level, dexMod, raceSpeed, pb } = ctx;
  const [stage, setStage] = useState<"roll" | "turn" | "done">("roll");
  const [roll, setRoll] = useState("");
  const [rollError, setRollError] = useState("");
  const [initTotal, setInitTotal] = useState(0);
  const [phase, setPhase] = useState(0);

  const speed = Number(cd.speed) || raceSpeed || 9;
  const rollNum = Number(roll);
  const rollValid = !isNaN(rollNum) && rollNum >= 1 && rollNum <= 20;
  const totalPreview = rollValid ? rollNum + dexMod : null;

  const cantrips = (cd.cantrips || []) as string[];
  const knownSpells: { name: string; lv: number }[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap(lv =>
    (((cd as any)[`spells${lv}`] || []) as string[]).map(name => ({ name, lv })));

  const spellByName = (name: string): Spell | undefined => {
    for (let lv = 0; lv <= 9; lv++) {
      const found = getSpellsForClass(clsKey || "", lv).find(s => s.name === name);
      if (found) return found;
      const archFound = ctx.archCasting?.list ? getSpellsForClass(ctx.archCasting.list, lv).find(s => s.name === name) : undefined;
      if (archFound) return archFound;
    }
    return undefined;
  };

  const classAbilities = (CLASS_ABILITIES[clsKey || ""] || []).filter(a => a.level <= level);
  const archetypeKey = cd.archetype || "";
  const archetypeAbilities = archetypeKey ? getArchetypeAbilities(archetypeKey).filter(a => a.level <= level) : [];
  const allAbilities = [...classAbilities, ...archetypeAbilities];

  const byAction = (t: CastType) => allAbilities.filter(a => a.action === (t === "bonus" ? "azione bonus" : t === "reaction" ? "reazione" : "azione"));
  const spellsOf = (t: CastType) => {
    const items: { name: string; lv: number; sp: Spell }[] = [];
    cantrips.forEach(n => {
      const sp = spellByName(n);
      if (sp && castType(sp.castingTime) === t) items.push({ name: n, lv: 0, sp });
    });
    knownSpells.forEach(({ name, lv }) => {
      const sp = spellByName(name);
      if (sp && castType(sp.castingTime) === t) items.push({ name, lv, sp });
    });
    return items;
  };

  function submitInit() {
    if (!rollValid) { setRollError("Inserisci un numero da 1 a 20."); return; }
    setRollError("");
    setInitTotal(rollNum + dexMod);
    setStage("turn");
    setPhase(0);
  }

  function confirm() {
    if (phase < 3) setPhase(phase + 1);
    else setStage("done");
  }

  const actionSpells = spellsOf("action");
  const bonusSpells = spellsOf("bonus");
  const reactionSpells = spellsOf("reaction");

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0c12]/98 backdrop-blur-md overflow-y-auto">
      <div className="mx-auto max-w-lg min-h-full px-4 py-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base text-veil-gold font-medium">⚔️ Combattimento</h2>
            <p className="text-[11px] text-white/35 truncate">{form?.character_name || ""} · liv. {level} · {clsData?.name || ""}</p>
          </div>
          <button type="button" onClick={onClose}
            className="shrink-0 rounded-xl border border-red-300/25 px-3 py-1.5 text-xs text-red-300/70 hover:bg-red-900/20 transition">
            ❌ Esci
          </button>
        </div>

        {/* FASE 1: Iniziativa */}
        {stage === "roll" && (
          <div className="veil-panel p-6 text-center my-auto">
            <p className="text-4xl">🎲</p>
            <h3 className="text-lg text-veil-gold font-medium mt-2">Entra in Combattimento</h3>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Tira l'iniziativa (1d20) con il tuo metodo preferito e inserisci il risultato.
              Il modificatore di Destrezza viene aggiunto in automatico.
            </p>
            <div className="mt-5 flex items-start justify-center gap-2 sm:gap-3">
              <div>
                <p className="text-[10px] text-white/30 mb-1">Tiro (1d20)</p>
                <input type="number" min={1} max={20} autoFocus
                  className="veil-input w-20 text-center text-xl font-bold"
                  value={roll}
                  onChange={e => { setRoll(e.target.value); setRollError(""); }}
                  onKeyDown={e => e.key === "Enter" && submitInit()} />
              </div>
              <p className="text-white/40 text-xl font-bold mt-6">+</p>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Mod. DES</p>
                <div className="veil-input w-20 text-center text-xl font-bold opacity-70 pointer-events-none">
                  {dexMod >= 0 ? `+${dexMod}` : dexMod}
                </div>
              </div>
              <p className="text-white/40 text-xl font-bold mt-6">=</p>
              <div>
                <p className="text-[10px] text-white/30 mb-1">Totale</p>
                <div className="veil-input w-20 text-center text-xl font-bold text-veil-gold">
                  {totalPreview ?? "—"}
                </div>
              </div>
            </div>
            {rollError && <p className="text-[11px] text-red-300 mt-2">{rollError}</p>}
            <button type="button" onClick={submitInit} disabled={!rollValid}
              className="veil-btn w-full mt-5 disabled:opacity-40 disabled:cursor-not-allowed">
              Conferma Iniziativa
            </button>
          </div>
        )}

        {/* FASE 2: Turno */}
        {stage === "turn" && (
          <>
            <div className="rounded-xl border border-veil-gold/25 bg-veil-gold/[0.06] px-4 py-3 mb-4 text-center">
              <p className="text-xs text-white/60">
                🎲 La tua iniziativa: <strong className="text-veil-gold">{roll} + {dexMod >= 0 ? `+${dexMod}` : dexMod} = {initTotal}</strong>
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                La posizione nel gruppo (quanto sei vicino agli altri) arriverà quando colleghiamo tutti i giocatori al combattimento.
              </p>
            </div>

            <div className="space-y-3">
              {/* MOVIMENTO */}
              <TurnBlock
                title="Movimento"
                subtitle={`Velocità: ${speed} metri`}
                active={phase === 0}
                done={phase > 0}
                onConfirm={confirm}>
                <Item icon="👟" title={`Muoviti fino a ${speed} metri`}
                  desc={`Puoi dividere il movimento come vuoi (es. ${Math.round(speed / 2)}m prima e ${Math.round(speed / 2)}m dopo l'attacco). Lasciare la portata di un nemico provoca un attacco di opportunità (reazione del nemico): puoi evitarlo con Disimpegno nella sezione Azione.`} />
                <Item icon="⛰️" title="Terreno e saltare"
                  desc="Il terreno difficile costa il doppio. Puoi saltare una distanza pari al tuo modificatore di Forza (in metri) con rincorsa." />
              </TurnBlock>

              {/* AZIONE */}
              <TurnBlock
                title="Azione"
                subtitle="Una sola azione per turno, con tutto quello che puoi fare"
                active={phase === 1}
                done={phase > 1}
                onConfirm={confirm}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Azioni base</p>
                {BASE_ACTIONS.map(a => <Item key={a.name} title={a.name} desc={a.desc} />)}
                {(cd.attacks || []).length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 pt-1">🗡️ I tuoi attacchi</p>
                    {(cd.attacks || []).map((a: any, i: number) => (
                      <Item key={i} icon="⚔️" title={a.name || "Attacco"}
                        meta={`1d20 + ${a.bonus || "0"} vs CA`}
                        desc={`Tiri 1d20 e sommi ${a.bonus || "0"}: se il totale è maggiore o uguale alla CA del bersaglio, infliggi ${a.damage || "—"} danni ${a.type ? `di tipo ${a.type}` : ""}.`} />
                    ))}
                  </>
                )}
                {byAction("action").length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 pt-1">✨ Capacità di classe</p>
                    {byAction("action").map(a => (
                      <Item key={a.key} gold title={`✦ ${a.name}`}
                        meta={[a.action, a.uses, a.die].filter(Boolean).join(" · ")}
                        desc={a.effect} />
                    ))}
                  </>
                )}
                {actionSpells.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 pt-1">🔮 Trucchetti e incantesimi (1 azione)</p>
                    {actionSpells.map(({ name, lv, sp }) => (
                      <Item key={name} icon={lv === 0 ? "🎩" : "🔮"} title={name}
                        meta={`${lv === 0 ? "Trucchetto" : `${lv}° livello`} · ${sp.school} · ${sp.range}`}
                        desc={`${sp.castingTime} · Componenti: ${sp.components} · Durata: ${sp.duration}. ${sp.description}`} />
                    ))}
                  </>
                )}
              </TurnBlock>

              {/* AZIONE BONUS */}
              <TurnBlock
                title="Azione Bonus"
                subtitle="Se hai una capacità o un incantesimo con azione bonus"
                active={phase === 2}
                done={phase > 2}
                onConfirm={confirm}>
                {byAction("bonus").length === 0 && bonusSpells.length === 0 && (
                  <p className="text-[11px] text-white/30">Non hai capacità o incantesimi con azione bonus da usare in questo turno.</p>
                )}
                {byAction("bonus").map(a => (
                  <Item key={a.key} gold title={`✦ ${a.name}`}
                    meta={[a.action, a.uses, a.die].filter(Boolean).join(" · ")}
                    desc={a.effect} />
                ))}
                {bonusSpells.map(({ name, lv, sp }) => (
                  <Item key={name} icon="🔮" title={name}
                    meta={`${lv === 0 ? "Trucchetto" : `${lv}° livello`} · ${sp.school} · ${sp.range}`}
                    desc={`${sp.castingTime} · Componenti: ${sp.components} · Durata: ${sp.duration}. ${sp.description}`} />
                ))}
              </TurnBlock>

              {/* INTERAZIONE GRATUITA */}
              <TurnBlock
                title="Interazione gratuita con un oggetto"
                subtitle="Una per turno, non costa nulla"
                active={phase === 3}
                done={phase > 3}
                onConfirm={confirm}>
                <Item title="Cosa puoi fare"
                  desc="Una volta per turno puoi interagire gratis con un oggetto: sfoderare o rinfoderare un'arma, aprire o chiudere una porta, raccogliere un oggetto a terra, estrarre una pozione dallo zaino, consegnare un oggetto a un alleato a fianco." />
                <Item title="Limiti"
                  desc="È un movimento rapido, non un'azione: se vuoi fare qualcosa di più complesso (bere una pozione, attivare un oggetto) devi usare la tua Azione." />
              </TurnBlock>

              {/* REAZIONE */}
              <TurnBlock
                title="Reazione"
                subtitle="Può avvenire sempre, anche fuori dal tuo turno · una sola per round"
                active={false}
                done={false}
                always>
                {byAction("reaction").length === 0 && reactionSpells.length === 0 && (
                  <p className="text-[11px] text-white/30">Non hai capacità o incantesimi con reazione. La puoi comunque usare per un attacco di opportunità se un nemico lascia la tua portata.</p>
                )}
                {byAction("reaction").map(a => (
                  <Item key={a.key} gold title={`✦ ${a.name}`}
                    meta={[a.action, a.uses, a.die].filter(Boolean).join(" · ")}
                    desc={a.effect} />
                ))}
                {reactionSpells.map(({ name, lv, sp }) => (
                  <Item key={name} icon="🔮" title={name}
                    meta={`${lv === 0 ? "Trucchetto" : `${lv}° livello`} · ${sp.school} · ${sp.range}`}
                    desc={`${sp.castingTime} · Componenti: ${sp.components} · Durata: ${sp.duration}. ${sp.description}`} />
                ))}
              </TurnBlock>
            </div>
          </>
        )}

        {/* FASE 3: Turno finito */}
        {stage === "done" && (
          <div className="veil-panel p-6 text-center my-auto">
            <p className="text-4xl">✅</p>
            <h3 className="text-lg text-veil-gold font-medium mt-2">Turno completato</h3>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Hai esaurito movimento, azione, azione bonus e interazione gratuita.
              Niente si illumina più: ora aspetti il turno degli altri.
              La tua <strong className="text-white/60">reazione resta disponibile</strong> in qualsiasi momento, anche fuori dal tuo turno.
            </p>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setPhase(0)}
                className="flex-1 rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-3 py-2.5 text-xs text-veil-gold hover:bg-veil-gold/20 transition">
                🔁 Nuovo turno
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:border-white/25 transition">
                🏁 Esci dal combattimento
              </button>
            </div>
            <p className="text-[9px] text-white/20 mt-3">Bonus di competenza {pb > 0 ? `+${pb}` : pb} · liv. {level}</p>
          </div>
        )}
      </div>
    </div>
  );
}