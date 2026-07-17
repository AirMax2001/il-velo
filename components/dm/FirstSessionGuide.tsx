"use client";
import { useState } from "react";
import type { SessionBlock } from "@/lib/mythos/schema";

const ENEMIES = [
  { name: "Capo dei Banditi", type: "boss", hp: 35, ac: 14, init: 16, attack: "+5", damage: "1d8+3" },
  { name: "Bandito 1", type: "enemy", hp: 18, ac: 12, init: 12, attack: "+3", damage: "1d6+1" },
  { name: "Bandito 2", type: "enemy", hp: 18, ac: 12, init: 10, attack: "+3", damage: "1d6+1" },
];

const COMBAT_STEPS = [
  {
    step: 1,
    title: "Iniziativa",
    icon: "🏃",
    desc: "Chiedi a ogni giocatore di tirare Iniziativa (d20 + Destrezza). Tira anche per i nemici (o usa i valori già pronti).",
    dmAction: "Apri la schermata Combattimento nell'app. Inserisci l'iniziativa dei PG e dei nemici, oppure usa i valori preimpostati.",
    ruleRef: "volume-2/iniziativa",
    playerTip: "L'iniziativa determina l'ordine di turno. Chi tira più alto agisce per primo.",
    detail: (
      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3 space-y-1">
        <p className="text-xs text-white/40 uppercase tracking-[0.1em]">Nemici (iniziativa già pronta)</p>
        {ENEMIES.map(e => (
          <p key={e.name} className="text-sm text-white/70">• {e.init} — {e.name}</p>
        ))}
      </div>
    ),
  },
  {
    step: 2,
    title: "Il turno",
    icon: "🎯",
    desc: "Ogni turno dà diritto a: UN'Azione + UN'Azione Bonus + Movimento (9m) + una Reazione (1/round).",
    dmAction: "Guida il giocatore di turno: 'Puoi muoverti fino a 9 metri e compiere un'azione. Cosa fai?'",
    ruleRef: "volume-2/turno",
    playerTip: "Azione = attaccare o lanciare incantesimo. Azione bonus = azione rapida (es. attacco con arma leggera in seconda mano). Movimento = fino a 9 metri.",
  },
  {
    step: 3,
    title: "Attaccare",
    icon: "⚔",
    desc: "Tira d20 + modificatore caratteristica (FOR/DES) + bonus competenza (se competente). Colpisci se il risultato ≥ CA del nemico.",
    dmAction: "Esempio: 'Tira per colpire. Il bandito ha CA 12, il capo ha CA 14.'",
    ruleRef: "volume-2/attaccare",
    playerTip: "d20 naturale 20 = critico (danni doppi). d20 naturale 1 = fallimento automatico.",
    detail: (
      <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3 space-y-1">
        <p className="text-xs text-white/40 uppercase tracking-[0.1em]">Nemici nello scontro</p>
        {ENEMIES.map(e => (
          <p key={e.name} className="text-sm text-white/70">• {e.name} — CA {e.ac} · PF {e.hp} · Attacco {e.attack} ({e.damage})</p>
        ))}
      </div>
    ),
  },
  {
    step: 4,
    title: "Danni e Critici",
    icon: "💥",
    desc: "Quando colpisci, tira il dado danno dell'arma + modificatore. In caso di critico (20 naturale), tira i dadi danno DUE VOLTE.",
    dmAction: "Esempio: 'La tua spada lunga fa 1d8 + FOR. Tira i danni!' Poi aggiorna i PF nella schermata con i bottoni +/-.",
    ruleRef: "volume-2/danni-critici",
    playerTip: "Danni da mischia = dado arma + FOR. Danni a distanza = dado arma + DES.",
  },
  {
    step: 5,
    title: "Turno dei nemici",
    icon: "👹",
    desc: "I nemici attaccano a turno. Tu decidi le loro azioni come fossero personaggi tuoi.",
    dmAction: "Descrivi cosa fanno: 'Il bandito ti carica con la spada!' Poi tira per colpire (o usa l'attacco precalcolato).",
    ruleRef: "volume-2/azioni-combattimento",
    playerTip: "Dopo l'attacco: 'Hai subito X danni. I tuoi PF erano Y, ora sono Z.'",
    detail: (
      <div className="rounded-lg border border-amber-500/15 bg-amber-900/10 p-3">
        <p className="text-[10px] uppercase tracking-[0.1em] text-amber-400/70 mb-1">Suggerimento narrativo</p>
        <p className="text-sm text-amber-200/80">Quando un bandito viene sconfitto, descrivi la sua reazione. Forse cade, forse cerca di fuggire, forse lancia l'arma.</p>
      </div>
    ),
  },
  {
    step: 6,
    title: "PF e sconfitta",
    icon: "❤️",
    desc: "Usa i bottoni +/-5 e +/-10 nella scheda del combattente per aggiornare i PF. A 0 PF il personaggio è a terra (morente).",
    dmAction: "Clicca '-X' sul combattente colpito. Quando un nemico arriva a 0 PF, segnalo come sconfitto.",
    ruleRef: "volume-2/danni-critici",
    playerTip: "Se un PG arriva a 0 PF: inizia a fare tiri salvezza contro la morte (d20, 10+ per successo). Tre successi = stabile. Tre fallimenti = morte.",
  },
  {
    step: 7,
    title: "Fine combattimento",
    icon: "🏁",
    desc: "Quando tutti i nemici sono sconfitti (o fuggono), il combattimento finisce.",
    dmAction: "Clicca 'Combattimento terminato' nella scena per procedere. Poi chiedi: 'Perlustrate il magazzino?', 'Cosa fate?'",
    ruleRef: "volume-2/azioni-combattimento",
    playerTip: "Ottimo lavoro! Ora puoi assegnare XP se previsti e passare alla scena successiva.",
  },
];

const SCENE_TIPS: Record<string, {
  tip: string;
  dice?: string;
  ruleRef?: string;
  narrative?: string;
}> = {
  introduction: {
    tip: "Leggi il testo introduttivo con calma. Fai una pausa dopo ogni frase importante. I giocatori devono sentire l'atmosfera.",
    narrative: "Usa un tono calmo e descrittivo. Non avere fretta.",
    ruleRef: "volume-1/come-funziona-una-sessione",
  },
  character_intro: {
    tip: "Fai presentare ogni giocatore: nome, aspetto, cosa sta facendo in quel momento. Non serve tirare dadi.",
    narrative: "Dopo ogni presentazione, chiedi: 'Cosa fa [Personaggio]?' per coinvolgerli subito.",
    ruleRef: "volume-1/ruolo-giocatori",
  },
  roleplay: {
    tip: "Lascia che i giocatori interpretino liberamente. Parla con voci diverse per gli NPC. Non serve tirare dadi per dialoghi semplici.",
    ruleRef: "volume-10",
    narrative: "Se i giocatori esitano, dai tu lo spunto: 'Vedi un mercato affollato...'",
  },
  free_roleplay: {
    tip: "Lascia che i giocatori interpretino liberamente. Parla con voci diverse per gli NPC. Non serve tirare dadi per dialoghi semplici.",
    ruleRef: "volume-10",
  },
  travel: {
    tip: "Descrivi il paesaggio mentre viaggiano. Non serve tirare per ogni passo. Se cercano qualcosa lungo la strada, chiedi Percezione (d20 + SAG).",
    dice: "Percezione: d20 + modificatore Saggezza (CD 12 per notare dettagli)",
    ruleRef: "volume-6",
  },
  exploration: {
    tip: "I giocatori esplorano un'area. Descrivi cosa vedono con tutti i sensi: odori, suoni, consistenze. Se cercano oggetti, chiedi Indagare (d20 + INT).",
    dice: "Indagare: d20 + modificatore Intelligenza (CD 12 per trovare oggetti nascosti)",
    ruleRef: "volume-6",
  },
  investigation: {
    tip: "Raccogliere indizi: chiedi tiri di Percezione (d20 + SAG) per notare dettagli, Intuizione (d20 + SAG) per capire se qualcuno mente, o Arcana (d20 + INT) per oggetti magici/antichi.",
    dice: "Arcana: d20 + Intelligenza (CD 14 per capire l'antico pergamena)",
    ruleRef: "volume-1/caratteristiche",
    narrative: "Scene_015: dopo il combattimento, i PG trovano un antico foglio. Se qualcuno ha competenza in Arcana, fallo tirare!",
  },
  dialogue: {
    tip: "Interpreta l'NPC con personalità. Chiedi al giocatore 'Cosa gli dici?' Non far tirare per semplici conversazioni.",
    dice: "Se cercano di convincere: Persuasione (d20 + CAR). Se mentono: Inganno (d20 + CAR). Se vogliono capire le intenzioni: Intuizione (d20 + SAG).",
    ruleRef: "volume-10",
  },
  npc_intro: {
    tip: "Quando un nuovo NPC viene introdotto, descrivi aspetto, tono di voce e comportamento prima ancora di farlo parlare.",
    ruleRef: "volume-7",
  },
  ending: {
    tip: "Riassumi cosa è successo nella sessione. Chiedi ai giocatori cosa hanno imparato e cosa pensano di fare nella prossima. Assegna XP se previsti.",
    narrative: "Concludi con una frase ad effetto che lasci i giocatori col desiderio di scoprire cosa succede dopo.",
    ruleRef: "volume-7",
  },
  puzzle: {
    tip: "Lascia che i giocatori ragionino ad alta voce. Se sono bloccati, permetti un tiro di Intelligenza (d20 + INT) per avere un indizio.",
    dice: "Intelligenza: d20 + modificatore Intelligenza (CD 12 per un indizio)",
    ruleRef: "volume-6",
  },
};

type Props = {
  scene?: SessionBlock | null;
  sessionNumber?: number;
};

export function FirstSessionGuide({ scene, sessionNumber }: Props) {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  if (!scene || (sessionNumber && sessionNumber !== 1)) return null;

  const isCombat = scene.isCombat || scene.type === "combat";
  const sceneTip = SCENE_TIPS[scene.type || ""];
  const steps = COMBAT_STEPS;

  return (
    <div className={`rounded-2xl border transition-all ${
      isCombat
        ? "border-red-500/30 bg-red-950/20"
        : "border-veil-gold/20 bg-black/30"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg">{isCombat ? "⚔" : "📖"}</span>
        <span className="flex-1 text-sm font-medium text-white/80">
          {isCombat ? "Guida Combattimento 🆕" : "Guida per il DM 🆕"}
        </span>
        <span className={`text-sm text-white/30 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {isCombat ? (
            <>
              <p className="text-xs text-red-300/70 leading-relaxed">
                Prima sessione — primo combattimento! Segui i 7 passaggi uno alla volta.
                Ogni passo spiega cosa fare, quale dado tirare e cosa dire ai giocatori.
              </p>

              {/* Step progress bar */}
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`flex-1 h-1.5 rounded-full transition ${
                      i === currentStep
                        ? "bg-red-400"
                        : i < currentStep
                        ? "bg-red-600/40"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Current step */}
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-sm text-red-300">
                    {steps[currentStep].icon}
                  </span>
                  <span className="text-xs text-red-400/70">PASSO {steps[currentStep].step}/7</span>
                  <span className="text-sm font-medium text-white ml-auto">{steps[currentStep].title}</span>
                </div>

                <p className="text-sm text-white/70 leading-relaxed">{steps[currentStep].desc}</p>

                <div className="rounded-lg border border-amber-500/15 bg-amber-900/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-amber-400/70 mb-1">Cosa fare ora</p>
                  <p className="text-sm text-amber-200/80">{steps[currentStep].dmAction}</p>
                </div>

                <div className="rounded-lg border border-sky-500/15 bg-sky-900/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-sky-400/70 mb-1">Spiega ai giocatori</p>
                  <p className="text-sm text-sky-200/70 italic">&ldquo;{steps[currentStep].playerTip}&rdquo;</p>
                </div>

                {steps[currentStep].detail}
              </div>

              {/* Nav buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="rounded-lg border border-white/[0.06] px-4 py-2 text-xs text-white/40 hover:text-white/70 disabled:opacity-20 transition"
                >
                  ← Precedente
                </button>
                <span className="text-xs text-white/20">{currentStep + 1} / {steps.length}</span>
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="rounded-lg border border-red-500/30 bg-red-600/20 px-4 py-2 text-xs text-red-300 hover:bg-red-600/30 transition"
                  >
                    Successivo →
                  </button>
                ) : (
                  <p className="text-xs text-emerald-400/70 py-2">✓ Combattimento completato!</p>
                )}
              </div>
            </>
          ) : (
            <>
              {sceneTip ? (
                <div className="space-y-3">
                  <p className="text-sm text-white/70 leading-relaxed">{sceneTip.tip}</p>

                  {sceneTip.narrative && (
                    <div className="rounded-lg border border-violet-500/15 bg-violet-900/10 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-violet-400/70 mb-1">Consiglio narrativo</p>
                      <p className="text-sm text-violet-200/80">{sceneTip.narrative}</p>
                    </div>
                  )}

                  {sceneTip.dice && (
                    <div className="rounded-lg border border-amber-500/15 bg-amber-900/10 p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-amber-400/70 mb-1">Tiro utile per questa scena</p>
                      <p className="text-sm text-amber-200/80">🎲 {sceneTip.dice}</p>
                    </div>
                  )}

                  {sceneTip.ruleRef && (
                    <div className="rounded-lg border border-veil-gold/10 bg-veil-gold/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50 mb-1">Regola d'oro per il DM</p>
                      <p className="text-sm text-veil-gold/70">
                        Se non sai cosa far tirare: CD 10 = facile, CD 15 = medio, CD 20 = difficile.
                        Se il giocatore fa qualcosa di epico e il dado lo supporta, lascia che accada!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-white/70 leading-relaxed">
                    Leggi il contenuto della scena ai giocatori. Lascia che reagiscano.
                    Se un giocatore vuole fare qualcosa di incerto, chiedi un tiro: d20 + modificatore appropriato.
                  </p>
                  <div className="rounded-lg border border-veil-gold/10 bg-veil-gold/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-veil-gold/50 mb-1">Regola d'oro</p>
                    <p className="text-sm text-veil-gold/70">
                      CD facile = 10, CD media = 15, CD difficile = 20.
                      Quando un giocatore fa qualcosa di epico e il dado lo supporta, lascia che accada!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
