"use client";

const ABILITY_REFERENCE = [
  { name: "Forza", means: "Potenza fisica", uses: "Attacchi in mischia, Atletica, sfondare porte, sollevare pesi" },
  { name: "Destrezza", means: "Agilità e riflessi", uses: "CA, attacchi a distanza, Furtività, Acrobazia, iniziativa" },
  { name: "Costituzione", means: "Resistenza fisica", uses: "Punti Ferita, tiri salvezza contro veleno/malattia/sfinimento" },
  { name: "Intelligenza", means: "Sapere e logica", uses: "Incantesimi (mago), Arcano, Storia, Indagare, Natura, Religione" },
  { name: "Saggezza", means: "Percezione e istinto", uses: "Incantesimi (chierico/druido), Percezione, Intuizione, Medicina" },
  { name: "Carisma", means: "Presenza e influenza", uses: "Incantesimi (stregone/bardo/warlock), Persuasione, Inganno, Intimidire" },
];

export const SKILL_DESCRIPTIONS: Record<string, string> = {
  Atletica: "Arrampicarsi, nuotare, saltare, lottare, scappare da una presa",
  Acrobazia: "Equilibrio, capriole, atterrare in piedi",
  "Rapidità di Mano": "Borseggiare, nascondere oggetti, prestidigitazione",
  Furtività: "Muoversi senza essere visti o sentiti",
  Arcano: "Incantesimi, oggetti magici, creature magiche",
  Indagare: "Dedurre indizi, trovare meccanismi nascosti",
  Storia: "Eventi storici, leggende, regni antichi",
  Natura: "Piante, animali, meteo, terreno",
  Religione: "Divinità, riti, non-morti, piani ultraterreni",
  Intuizione: "Capire intenzioni altrui, scoprire bugie",
  Percezione: "Notare dettagli, intuire nemici nascosti",
  "Addestrare Animali": "Calmare o controllare animali",
  Medicina: "Stabilizzare compagni, diagnosticare malattie",
  Sopravvivenza: "Tracce, orientamento, procacciarsi cibo",
  Inganno: "Mentire, bluffare, fingere un'identità",
  Intimidire: "Minacciare o spaventare",
  Intrattenere: "Musica, danza, recitazione, performance",
  Persuasione: "Convincere con diplomazia o argomentazioni oneste",
};

const SKILL_REFERENCE = [
  { name: "Atletica", ability: "Forza" },
  { name: "Acrobazia", ability: "Destrezza" },
  { name: "Rapidità di Mano", ability: "Destrezza" },
  { name: "Furtività", ability: "Destrezza" },
  { name: "Arcano", ability: "Intelligenza" },
  { name: "Indagare", ability: "Intelligenza" },
  { name: "Storia", ability: "Intelligenza" },
  { name: "Natura", ability: "Intelligenza" },
  { name: "Religione", ability: "Intelligenza" },
  { name: "Intuizione", ability: "Saggezza" },
  { name: "Percezione", ability: "Saggezza" },
  { name: "Addestrare Animali", ability: "Saggezza" },
  { name: "Medicina", ability: "Saggezza" },
  { name: "Sopravvivenza", ability: "Saggezza" },
  { name: "Inganno", ability: "Carisma" },
  { name: "Intimidire", ability: "Carisma" },
  { name: "Intrattenere", ability: "Carisma" },
  { name: "Persuasione", ability: "Carisma" },
].map(s => ({ ...s, uses: SKILL_DESCRIPTIONS[s.name] }));

export function AbilityReferenceTables({ only }: { only?: "ability" | "skill" }) {
  const cell = "px-3 py-2 text-xs";
  const th = "px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-veil-gold/70 text-left";
  return (
    <div className="space-y-6">
      {only !== "skill" && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className={th}>Caratteristica</th>
                <th className={th}>Cosa rappresenta</th>
                <th className={th}>Usi principali</th>
              </tr>
            </thead>
            <tbody>
              {ABILITY_REFERENCE.map(a => (
                <tr key={a.name} className="border-t border-white/[0.05]">
                  <td className={`${cell} text-white/80 font-medium`}>{a.name}</td>
                  <td className={`${cell} text-white/60`}>{a.means}</td>
                  <td className={`${cell} text-white/45`}>{a.uses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {only !== "ability" && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className={th}>Abilità</th>
                <th className={th}>Caratteristica</th>
                <th className={th}>Quando si usa</th>
              </tr>
            </thead>
            <tbody>
              {SKILL_REFERENCE.map(a => (
                <tr key={a.name} className="border-t border-white/[0.05]">
                  <td className={`${cell} text-white/80 font-medium`}>{a.name}</td>
                  <td className={`${cell} text-veil-gold/60`}>{a.ability}</td>
                  <td className={`${cell} text-white/45`}>{a.uses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}