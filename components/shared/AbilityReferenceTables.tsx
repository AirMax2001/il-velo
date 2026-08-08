"use client";

const ABILITY_REFERENCE = [
  { name: "Forza", means: "Potenza fisica", uses: "Attacchi in mischia, Atletica, sfondare porte, sollevare pesi" },
  { name: "Destrezza", means: "Agilità e riflessi", uses: "CA, attacchi a distanza, Furtività, Acrobazia, iniziativa" },
  { name: "Costituzione", means: "Resistenza fisica", uses: "Punti Ferita, tiri salvezza contro veleno/malattia/sfinimento" },
  { name: "Intelligenza", means: "Sapere e logica", uses: "Incantesimi (mago), Arcano, Storia, Indagare, Natura, Religione" },
  { name: "Saggezza", means: "Percezione e istinto", uses: "Incantesimi (chierico/druido), Percezione, Intuizione, Medicina" },
  { name: "Carisma", means: "Presenza e influenza", uses: "Incantesimi (stregone/bardo/warlock), Persuasione, Inganno, Intimidire" },
];

const SKILL_REFERENCE = [
  { name: "Atletica", ability: "Forza", uses: "Arrampicarsi, nuotare, saltare, lottare, scappare da una presa" },
  { name: "Acrobazia", ability: "Destrezza", uses: "Equilibrio, capriole, atterrare in piedi" },
  { name: "Rapidità di Mano", ability: "Destrezza", uses: "Borseggiare, nascondere oggetti, prestidigitazione" },
  { name: "Furtività", ability: "Destrezza", uses: "Muoversi senza essere visti o sentiti" },
  { name: "Arcano", ability: "Intelligenza", uses: "Incantesimi, oggetti magici, creature magiche" },
  { name: "Indagare", ability: "Intelligenza", uses: "Dedurre indizi, trovare meccanismi nascosti" },
  { name: "Storia", ability: "Intelligenza", uses: "Eventi storici, leggende, regni antichi" },
  { name: "Natura", ability: "Intelligenza", uses: "Piante, animali, meteo, terreno" },
  { name: "Religione", ability: "Intelligenza", uses: "Divinità, riti, non-morti, piani ultraterreni" },
  { name: "Intuizione", ability: "Saggezza", uses: "Capire intenzioni altrui, scoprire bugie" },
  { name: "Percezione", ability: "Saggezza", uses: "Notare dettagli, intuire nemici nascosti" },
  { name: "Addestrare Animali", ability: "Saggezza", uses: "Calmare o controllare animali" },
  { name: "Medicina", ability: "Saggezza", uses: "Stabilizzare compagni, diagnosticare malattie" },
  { name: "Sopravvivenza", ability: "Saggezza", uses: "Tracce, orientamento, procacciarsi cibo" },
  { name: "Inganno", ability: "Carisma", uses: "Mentire, bluffare, fingere un'identità" },
  { name: "Intimidire", ability: "Carisma", uses: "Minacciare o spaventare" },
  { name: "Intrattenere", ability: "Carisma", uses: "Musica, danza, recitazione, performance" },
  { name: "Persuasione", ability: "Carisma", uses: "Convincere con diplomazia o argomentazioni oneste" },
];

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