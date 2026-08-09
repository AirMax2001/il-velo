"use client";

const CANTRIP_REFERENCE = [
  { name: "Filferro", school: "Trasmutazione", effect: "Manipola piccoli oggetti a distanza senza toccarli" },
  { name: "Frastuono", school: "Ammaliamento", effect: "Crea un suono d'allarme che sveglia creature addormentate" },
  { name: "Luci Danzanti", school: "Evocazione", effect: "Crea fino a 4 piccole luci fluttuanti controllabili" },
  { name: "Mano Magica", school: "Evocazione", effect: "Crea una mano spettrale che manipola oggetti leggeri a distanza" },
  { name: "Messaggio", school: "Trasmutazione", effect: "Sussurra un breve messaggio a distanza, con possibilità di risposta" },
  { name: "Prestigio", school: "Trasmutazione", effect: "Piccoli effetti sensoriali o pulizia/sporcizia di oggetti" },
  { name: "Trucchetto", school: "Illusione", effect: "Piccoli effetti illusori sonori/visivi di breve durata" },
];

const SPELL_REFERENCE: { level: number; list: { name: string; school: string; effect: string }[] }[] = [
  {
    level: 1,
    list: [
      { name: "Amicizia Animale", school: "Ammaliamento", effect: "Rende amichevole un animale nei tuoi confronti" },
      { name: "Cura Ferite", school: "Evocazione", effect: "Ripristina Punti Ferita a contatto" },
      { name: "Individuazione del Magico", school: "Divinazione", effect: "Rileva la presenza di magia nelle vicinanze" },
      { name: "Bagliore Fatato", school: "Evocazione", effect: "Fa brillare bersagli in un'area, rendendoli visibili e più facili da colpire" },
      { name: "Parola Curativa", school: "Evocazione", effect: "Cura a distanza, lanciato come azione bonus" },
      { name: "Sonno", school: "Ammaliamento", effect: "Addormenta creature in un'area partendo da quelle più deboli" },
      { name: "Ripara", school: "Trasmutazione", effect: "Ripara un oggetto danneggiato" },
      { name: "Tiro Tremante*", school: "Ammaliamento", effect: "Attira l'attenzione di una creatura facendo vibrare un piccolo oggetto" },
    ],
  },
  {
    level: 2,
    list: [
      { name: "Aiuto", school: "Abiurazione", effect: "Aumenta temporaneamente i Punti Ferita massimi di alleati" },
      { name: "Immagine Riflessa", school: "Illusione", effect: "Crea copie illusorie di te stesso per confondere gli attaccanti" },
      { name: "Paralizzare / Persona*", school: "Ammaliamento", effect: "Immobilizza un umanoide che fallisce il tiro salvezza" },
      { name: "Suggestione", school: "Ammaliamento", effect: "Convince magicamente un bersaglio a compiere un'azione ragionevole" },
      { name: "Cecità e Sordità", school: "Trasmutazione", effect: "Rende un bersaglio cieco o sordo" },
      { name: "Invisibilità", school: "Illusione", effect: "Rende invisibile una creatura toccata" },
      { name: "Metallo Rovente", school: "Trasmutazione", effect: "Rende rovente un oggetto metallico, infliggendo danno" },
      { name: "Passo Nebbioso", school: "Congiurazione", effect: "Teletrasporto a corto raggio istantaneo" },
      { name: "Intrufolamento*", school: "Illusione", effect: "Probabilmente aiuta a muoversi senza essere notato/rilevato magicamente" },
    ],
  },
  {
    level: 3,
    list: [
      { name: "Dissolvi Magie", school: "Abiurazione", effect: "Termina un incantesimo attivo su una creatura, oggetto o effetto" },
      { name: "Parola di Cura di Massa", school: "Evocazione", effect: "Come Parola Curativa ma colpisce più bersagli contemporaneamente" },
    ],
  },
  {
    level: 4,
    list: [
      { name: "Confusione", school: "Ammaliamento", effect: "Fa agire in modo casuale/erratico le creature in un'area" },
      { name: "Invisibilità Maggiore", school: "Illusione", effect: "Come Invisibilità ma dura più a lungo e resta attiva anche attaccando" },
      { name: "Scudo di Ghiaccio*", school: "Evocazione", effect: "Probabilmente crea una barriera protettiva di ghiaccio" },
      { name: "Cecità e Sordità di Massa*", school: "Trasmutazione", effect: "Versione ad area di Cecità e Sordità" },
    ],
  },
  {
    level: 5,
    list: [
      { name: "Cerchio di Teletrasportazione", school: "Congiurazione", effect: "Crea un portale permanente collegato a un luogo prestabilito" },
      { name: "Pietra di Sefuzione*", school: "—", effect: "Nome non riconosciuto con certezza — potrebbe essere una variante di \"Sequestro\" o un incantesimo homebrew." },
    ],
  },
];

export function SpellReferenceTables({ only }: { only?: "cantrips" | "spells" }) {
  const cell = "px-3 py-2 text-xs";
  const th = "px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-veil-gold/70 text-left";
  return (
    <div className="space-y-6">
      {only !== "spells" && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <h4 className="px-3 py-2 text-xs text-veil-gold/80 font-medium bg-white/[0.03]">
            Trucchetti (livello 0 — a volontà)
          </h4>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className={th}>Trucchetto</th>
                <th className={th}>Scuola</th>
                <th className={th}>Cosa fa</th>
              </tr>
            </thead>
            <tbody>
              {CANTRIP_REFERENCE.map(a => (
                <tr key={a.name} className="border-t border-white/[0.05]">
                  <td className={`${cell} text-white/80 font-medium`}>{a.name}</td>
                  <td className={`${cell} text-veil-gold/60`}>{a.school}</td>
                  <td className={`${cell} text-white/45`}>{a.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {only !== "cantrips" && (
        <div className="space-y-4">
          {SPELL_REFERENCE.map(g => (
            <div key={g.level} className="rounded-xl border border-white/[0.06] overflow-hidden">
              <h4 className="px-3 py-2 text-xs text-veil-gold/80 font-medium bg-white/[0.03]">
                Incantesimi di {g.level}° Livello
              </h4>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className={th}>Incantesimo</th>
                    <th className={th}>Scuola</th>
                    <th className={th}>Cosa fa</th>
                  </tr>
                </thead>
                <tbody>
                  {g.list.map(a => (
                    <tr key={a.name} className="border-t border-white/[0.05]">
                      <td className={`${cell} text-white/80 font-medium`}>{a.name}</td>
                      <td className={`${cell} text-veil-gold/60`}>{a.school}</td>
                      <td className={`${cell} text-white/45`}>{a.effect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}