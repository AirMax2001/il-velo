/* ── Abilità attivabili + Archetipi (PHB) ──────────────────────
   Le "attivabili" sono le capacità di classe che il giocatore
   usa in gioco (azioni, reazioni, dadi, usi). Le passive restano
   nelle Caratteristiche di Classe della scheda.
*/

export type ClassAbility = {
  key: string;
  name: string;
  level: number;
  action: string;
  die?: string;
  uses: string;
  effect: string;
};

export const CLASS_ABILITIES: Record<string, ClassAbility[]> = {
  barbarian: [
    {
      key: "barbarian_ira", name: "Ira", level: 1, action: "azione bonus",
      uses: "2 per riposo lungo",
      effect: "Per 1 minuto: vantaggio su prove/TS di FOR, +2 danni in mischia, resistenza a contundente/perforante/tagliente. Termina se sei incosciente o non attacchi/subisci danno in un round.",
    },
    {
      key: "barbarian_attacco_avventato", name: "Attacco Avventato", level: 2, action: "durante l'Ira",
      uses: "senza limite",
      effect: "Ottieni vantaggio sugli attacchi in mischia, ma i nemici hanno vantaggio sui loro attacchi contro di te.",
    },
  ],
  bard: [
    {
      key: "bard_ispirazione", name: "Ispirazione Bardica", level: 1, action: "azione bonus", die: "d6",
      uses: "mod CAR (min 1) per riposo lungo",
      effect: "Una creatura entro 18m riceve un dado d6: entro 10 minuti può aggiungerlo a una prova, un tiro per colpire o un tiro salvezza.",
    },
    {
      key: "bard_canto_riposo", name: "Canto del Riposo", level: 2, action: "durante riposo breve", die: "d6",
      uses: "senza limite",
      effect: "Suoni per gli alleati durante un riposo breve: ciascuno può tirare d6 in più per recuperare PF.",
    },
  ],
  cleric: [
    {
      key: "cleric_incanalare", name: "Incanalare Divinità", level: 2, action: "azione",
      uses: "1 per riposo breve/lungo (2 al lv. 6, 3 al 13°, 4 al 17°)",
      effect: "Usi l'effetto del tuo dominio (es. Destruggi Non-Morti, incantesimo di dominio potenziato).",
    },
  ],
  druid: [
    {
      key: "druid_forma_selvatica", name: "Forma Selvatica", level: 2, action: "azione bonus",
      uses: "2 per riposo breve/lungo",
      effect: "Ti trasformi in una bestia (CR 1/4 al 2°, 1/2 al 4°, 1 al 6°): usi le sue statistiche, mantieni INT/SAG/CAR. Al 10° puoi diventare un elementale (2 usi).",
    },
  ],
  fighter: [
    {
      key: "fighter_secondo_soffio", name: "Secondo Soffio", level: 1, action: "azione bonus",
      die: "1d10", uses: "1 per riposo breve/lungo",
      effect: "Recuperi 1d10 + livello da guerriero Punti Ferita.",
    },
    {
      key: "fighter_azione_impetuosa", name: "Azione Impetuosa", level: 2, action: "azione extra nel turno",
      uses: "1 per riposo breve/lungo (2 al 17°)",
      effect: "Compi un'azione extra nel tuo turno.",
    },
    {
      key: "fighter_indomito", name: "Indomito", level: 9, action: "reazione",
      uses: "1 per riposo lungo (2 al 13°, 3 al 17°)",
      effect: "Ritiri un tiro salvezza fallito.",
    },
  ],
  monk: [
    {
      key: "monk_raffica_colpi", name: "Raffica di Colpi", level: 2, action: "azione bonus",
      uses: "1 Ki",
      effect: "Dopo l'azione Attacco fai 2 attacchi senz'armi extra con le stesse regole (dado arti marziali: 1d4 al 1°-4° liv., 1d6 al 5°, 1d8 all'11°, 1d10 al 17°).",
    },
    {
      key: "monk_presa_difensiva", name: "Presa Difensiva", level: 2, action: "azione bonus",
      uses: "1 Ki",
      effect: "Compi l'azione di Schivare: i tiri per colpire contro di te hanno svantaggio fino al tuo prossimo turno.",
    },
    {
      key: "monk_passo_vento", name: "Passo del Vento", level: 2, action: "azione bonus",
      uses: "1 Ki",
      effect: "Compi un'azione di Scatto o Disimpegno e la distanza del tuo salto raddoppia per il turno.",
    },
    {
      key: "monk_deflessione_missili", name: "Deflessione Missili", level: 3, action: "reazione",
      uses: "senza limite",
      effect: "Reazione: riduci il danno di un attacco a distanza con arma di 1d10 + mod DES + livello da monaco. Se lo riduci a 0, il proiettile si schianta a terra.",
    },
    {
      key: "monk_colpo_stordente", name: "Colpo Stordente", level: 5, action: "dopo un colpo in mischia",
      uses: "1 Ki per colpo",
      effect: "Il bersaglio deve superare un TS COS o essere stordito fino alla fine del tuo prossimo turno.",
    },
    {
      key: "monk_evasione", name: "Evasione", level: 7, action: "passiva",
      uses: "senza limite",
      effect: "Un TS di DES riuscito = nessun danno; fallito = metà danno.",
    },
  ],
  paladin: [
    {
      key: "paladin_percezione_divino", name: "Percezione del Divino", level: 1, action: "azione",
      uses: "1 + mod CAR, riposo lungo",
      effect: "Percepisci celesti, infernali e non-morti entro 18m: ne conosci posizione e tipo.",
    },
    {
      key: "paladin_imposizione_mani", name: "Imposizione delle Mani", level: 1, action: "azione",
      uses: "pool di 5 × livello PF, riposo lungo",
      effect: "Curi una creatura con un tocco fino a esaurire il pool. Puoi spendere 5 PF per curare una malattia o un veleno.",
    },
    {
      key: "paladin_colpo_divino", name: "Colpo Divino", level: 2, action: "quando colpisci con un'arma", die: "2d8",
      uses: "1 slot incantesimo per colpo",
      effect: "Aggiungi 2d8 danno radiante (3d8 al 9°, 4d8 all'11°, 5d8 al 15°, 6d8 al 20°).",
    },
  ],
  rogue: [
    {
      key: "rogue_attacco_furtivo", name: "Attacco Furtivo", level: 1, action: "una volta per turno", die: "1d6",
      uses: "senza limite",
      effect: "Con vantaggio (o alleato entro 1,5m) aggiungi 1d6 al danno (3d6 al 5°, 5d6 al 9°, 7d6 al 13°, 9d6 al 17°).",
    },
    {
      key: "rogue_azione_furba", name: "Azione Furba", level: 2, action: "azione bonus",
      uses: "senza limite",
      effect: "Usi Disimpegno, Nascondersi o Scatto come azione bonus.",
    },
  ],
  sorcerer: [
    {
      key: "sorcerer_punti_stregoneria", name: "Punti Stregoneria", level: 2, action: "azione bonus",
      uses: "punti = livello da stregone, recupero dopo riposo lungo",
      effect: "Crei punti stregoneria e li spendi per la Metamagia (es. Incantesimo Ritardato, Duplicazione, Raddoppio) o per creare slot incantesimo.",
    },
    {
      key: "sorcerer_meta_incantamento_distant", name: "Meta: Incantamento a Distanza", level: 2, action: "quando lanci un incantesimo",
      uses: "1 Punto Stregoneria",
      effect: "L'incantesimo ha 9m di portata in più, o diventa a distanza.",
    },
    {
      key: "sorcerer_meta_incantamento_empowered", name: "Meta: Incantamento Potenziato", level: 2, action: "quando lanci un incantesimo",
      uses: "1 Punto Stregoneria per dado",
      effect: "Ri-tiri uno o più dadi di danno dell'incantesimo e scegli i nuovi risultati.",
    },
    {
      key: "sorcerer_meta_incantamento_extended", name: "Meta: Incantamento Esteso", level: 2, action: "quando lanci un incantesimo",
      uses: "1 Punto Stregoneria",
      effect: "La durata dell'incantesimo raddoppia (massimo 24h).",
    },
    {
      key: "sorcerer_meta_incantamento_heightened", name: "Meta: Incantamento Amplificato", level: 2, action: "quando lanci un incantesimo",
      uses: "3 Punti Stregoneria",
      effect: "Il primo TS per resistere all'incantesimo ha svantaggio.",
    },
    {
      key: "sorcerer_meta_incantamento_quickened", name: "Meta: Incantamento Rapido", level: 2, action: "quando lanci un incantesimo",
      uses: "2 Punti Stregoneria",
      effect: "Un incantesimo che richiede un'azione diventa azione bonus.",
    },
    {
      key: "sorcerer_meta_incantamento_subtle", name: "Meta: Incantamento Sottile", level: 2, action: "quando lanci un incantesimo",
      uses: "1 Punto Stregoneria",
      effect: "L'incantesimo non richiede componenti verbali o somatiche (lanciato in segreto).",
    },
    {
      key: "sorcerer_meta_incantamento_twinned", name: "Meta: Incantamento Doppio", level: 2, action: "quando lanci un incantesimo",
      uses: "punti = livello dell'incantesimo",
      effect: "L'incantesimo bersaglia una seconda creatura aggiuntiva.",
    },
  ],
  warlock: [
    {
      key: "warlock_invocazioni", name: "Invocazioni Mistiche", level: 2, action: "a seconda dell'invocazione",
      uses: "permanenti (10 al 18°)",
      effect: "Capacità o incantesimi permanenti scelti dal patrono: es. vista magica, raggio extra, incantesimi a volontà.",
    },
  ],
  wizard: [
    {
      key: "wizard_recupero_arcano", name: "Recupero Arcano", level: 1, action: "dopo un riposo breve",
      uses: "1 volta al giorno",
      effect: "Recuperi slot incantesimo spesi per un totale pari a metà del tuo livello da mago (arrotondato per eccesso), massimo 5° livello.",
    },
  ],
  ranger: [
    {
      key: "ranger_nemico_prescelto", name: "Nemico Prescelto", level: 1, action: "passiva",
      uses: "senza limite",
      effect: "Scegli un tipo di nemico: vantaggio su prove di SAG per ricordare info su di esso, +2 danni.",
    },
    {
      key: "ranger_esploratore_nativo", name: "Esploratore Nativo", level: 1, action: "passiva",
      uses: "senza limite",
      effect: "Scegli un terreno: vantaggio su iniziativa e alcune prove mentre viaggi in quel terreno.",
    },
    {
      key: "ranger_azione_aggigliata", name: "Azione Aggigliata", level: 2, action: "azione bonus",
      uses: "senza limite",
      effect: "Se il tuo Nemico Prescelto è entro 9m, puoi usare l'azione bonus per un attacco extra con arma.",
    },
  ],
};

/* ── Archetipi (scelte di specializzazione per classe) ──────── */

export type ArchetypeOption = {
  key: string;
  name: string;
  description: string;
};

export const ARCHETYPES: Record<string, { level: number; label: string; options: ArchetypeOption[] }> = {
  barbarian: {
    level: 3, label: "Percorso Primitivo",
    options: [
      { key: "berserker", name: "Berserker", description: "Durante l'Ira puoi entrare in Furia Selvaggia: 1 attacco in più con un'azione bonus, ma ottieni un livello di esaurimento." },
      { key: "totem", name: "Guerriero Totemico", description: "Scegli un animale totem (orso, aquila, lupo): resistenze, velocità o vantaggi per gli alleati." },
      { key: "ancestrale", name: "Guardiano Ancestrale", description: "Gli spiriti ancestrali proteggono te e i tuoi alleati, riducendo i danni subiti da chi attacca i tuoi compagni." },
    ],
  },
  bard: {
    level: 3, label: "Collegio Bardico",
    options: [
      { key: "sapere", name: "Collegio del Sapere", description: "Competenze extra e Ispirazione di Taglio (reazione: riduci un tiro per colpire o una prova avversaria del tuo dado ispirazione)." },
      { key: "valore", name: "Collegio del Valore", description: "Competenza con armature medie, scudi e armi da guerra. Ispirazione usabile per attacchi e danno aggiuntivo." },
      { key: "spade", name: "Collegio delle Spade", description: "Stile di Combattimento con due armi, prestazioni da schermidore: movimenti e attacchi fluidi in combattimento." },
    ],
  },
  cleric: {
    level: 1, label: "Dominio Divino",
    options: [
      { key: "vita", name: "Dominio della Vita", description: "Che incantesimi curativi potenziati, competenza con armature pesanti. Incanalare Divinità: Preservare Vita (cura 5×livello PF in un'area)." },
      { key: "luce", name: "Dominio della Luce", description: "Difesa dalla luce travolgente contro i nemici. Incanalare Divinità: Radianza dell'Alba (raggio di luce radiante)." },
      { key: "guerra", name: "Dominio della Guerra", description: "Competenza con armi da guerra e armature pesanti. Incanalare Divinità: Colpo Guidato (+10 a un tiro per colpire)." },
      { key: "inganno", name: "Dominio dell'Inganno", description: "Vantaggio nelle prove di inganno, invocazione di duplicati. Incanalare Divinità: Inganno di Invocazione (duplicato illusorio)." },
      { key: "conoscenza", name: "Dominio della Conoscenza", description: "Competenze in molte abilità e lingue. Incanalare Divinità: Conoscenza degli Eoni (competenza temporanea in un'abilità o strumento)." },
      { key: "natura", name: "Dominio della Natura", description: "Potere sulla natura, comando su piante e animali una volta al giorno. Incanalare Divinità: Incanto della Natura." },
      { key: "tempesta", name: "Dominio della Tempesta", description: "Colpi che rimbombano di tuono, controllo su tempeste. Incanalare Divinità: Ira della Tempesta (fulmini vendicativi)." },
    ],
  },
  druid: {
    level: 2, label: "Cerchio Druidico",
    options: [
      { key: "luna", name: "Cerchio della Luna", description: "Forma Selvatica più potente: bestie con CR pari a un terzo del livello, ti trasformi come azione bonus." },
      { key: "terra", name: "Cerchio della Terra", description: "Incantesimi legati al terreno scelto (foresta, montagna, palude...) e recupero di slot dopo un riposo breve." },
      { key: "sogni", name: "Cerchio dei Sogni", description: "Poteri onirici: guarigione a distanza, comunicazione con i sogni, nottambulo." },
    ],
  },
  fighter: {
    level: 3, label: "Archetipo Combattente",
    options: [
      { key: "campione", name: "Campione", description: "Colpi critici su 19-20, abilità atletiche superiori. Al 7°: metà competenza su FOR/DES/COS in più." },
      { key: "maestro_armi", name: "Maestro d'Armi", description: "Dadi Manovra (d8) per manovre speciali: disarmo, spinta, parata, comando (al 3° hai 4 manovre)." },
      { key: "cavaliere", name: "Cavaliere", description: "Sfida marziale (provochi un nemico), comando alleato, incantesimi del cavaliere basati su INT." },
    ],
  },
  monk: {
    level: 3, label: "Tradizione Monastica",
    options: [
      { key: "via_aperta", name: "Via Aperta", description: "Padronanza delle arti marziali: schivate e contrattacchi. Spendi Ki per schivare i colpi e lanciare l'onda dell'energia Ki." },
      { key: "ombra", name: "Via dell'Ombra", description: "Arti delle ombre: incantesimi oscuri (Tenebre, Oscurità), teletrasporto nell'ombra, morte silenziosa." },
      { key: "quattro_elementi", name: "Via dei Quattro Elementi", description: "Spendi Ki per lanciare effetti elementali: ondata d'acqua, pugno di pietra, manto di fuoco, alito di ghiaccio." },
    ],
  },
  paladin: {
    level: 3, label: "Giuramento Sacro",
    options: [
      { key: "devozione", name: "Giuramento di Devozione", description: "Ferocia contro il male: arma radiosa, aura di devozione contro l'affascinamento, entità sacre." },
      { key: "antichi", name: "Giuramento degli Antichi", description: "Guardiano della luce e della vita: aura di protezione dagli incantesimi, resistenza alla magia." },
      { key: "vendetta", name: "Giuramento di Vendetta", description: "Cacciatore di colpevoli: nemico giurato con vantaggio sugli attacchi, teletrasporto vendicativo." },
    ],
  },
  ranger: {
    level: 3, label: "Archetipo del Ranger",
    options: [
      { key: "cacciatore", name: "Cacciatore", description: "Nemico Prescelto devastante: nemico del cacciatore (danno extra), difesa da colpo, attacco a raffica." },
      { key: "maestro_bestie", name: "Maestro delle Bestie", description: "Un compagno animale combatte al tuo fianco, obbedisce ai tuoi comandi e agisce nel tuo turno." },
    ],
  },
  rogue: {
    level: 3, label: "Archetipo Ladresco",
    options: [
      { key: "ladro", name: "Ladro", description: "Mano veloce come azione bonus (uso oggetti, scasso, Mano Lesta), arrampicata con le mani libere." },
      { key: "assassino", name: "Assassino", description: "Colpi mortali su nemici sorpresi: critico automatico, vantaggio su chi non ha ancora agito, infiltrazioni perfette." },
      { key: "truffatore_arcano", name: "Truffatore Arcano", description: "Magia arcana del ladro: trucchetti e incantesimi arcani, Mano Magica invisibile." },
    ],
  },
  sorcerer: {
    level: 1, label: "Origine Magica",
    options: [
      { key: "stirpe_draconica", name: "Stirpe Draconica", description: "Squame draconiche (CA 13 senza armatura), +1 PF per livello da stregone, resistenza al tipo di danno del drago." },
      { key: "magia_selvaggia", name: "Magia Selvaggia", description: "Ondate di magia caotica: dopo un incantesimo puoi innestare una magia selvaggia casuale con effetti imprevedibili." },
    ],
  },
  warlock: {
    level: 1, label: "Patrono",
    options: [
      { key: "arcano", name: "Arcano (Fiend)", description: "Patto col diavolo: cura quando riduci un nemico a 0 PF, male oscuro per colpire i nemici, resistenze infernali." },
      { key: "fatato", name: "Fatato (Archfey)", description: "Magia fatata: affascinamento, spavento, gli alleati tornano dalla morte in modo capriccioso." },
      { key: "antico", name: "Antico (Great Old One)", description: "Potere inconoscibile: telepatia, resistenza alle letture mentali, presenza annientante per rendere agli alleati vantaggio." },
    ],
  },
  wizard: {
    level: 2, label: "Scuola Magica",
    options: [
      { key: "abiurazione", name: "Abiurazione", description: "Scudi arcani: arcobaleno protettivo che assorbe danni, resistenza alla magia, protezione potente." },
      { key: "congiurazione", name: "Congiurazione", description: "Crea oggetti e creature: evocazioni minori/benigne rafforzate, teletrasporto improvvisato." },
      { key: "divinazione", name: "Divinazione", description: "Portento: vedi il futuro e sostituisci un tiro con un d20 anticipato, resistenza alle menzogne." },
      { key: "ammaliamento", name: "Ammaliamento", description: "Ipnotismo: vantaggio sugli incantesimi di ammaliamento, sguardo ipnotico, pressione mentale." },
      { key: "evocazione", name: "Evocazione", description: "Scultore di incantesimi: modelli gli effetti dei tuoi incantesimi di evocazione, potenziandoli." },
      { key: "illusione", name: "Illusione", description: "Illusioni migliorate: le illusioni sopravvivono all'ispezione, le tue illusioni sembrano reali." },
      { key: "necromanzia", name: "Necromanzia", description: "Padronanza dei non morti: recupero PF quando uccidi, potenziamento degli schiavi non morti." },
      { key: "trasmutazione", name: "Trasmutazione", description: "Alchimista: cambi forma, trasmuti materiali, crei pietre filosofali." },
    ],
  },
};

export function getArchetypeForClass(classKey: string): { level: number; label: string; options: ArchetypeOption[] } | null {
  return ARCHETYPES[classKey] || null;
}

/* ── Capacità attivabili degli Archetipi ──────────────────────
   Quando il giocatore sceglie un archetipo (es. Tradizione Monastica)
   sblocca queste capacità, che compaiono nel tab Spell. */

export const ARCHETYPE_ABILITIES: Record<string, ClassAbility[]> = {
  berserker: [
    { key: "berserker_furia", name: "Furia Selvaggia", level: 3, action: "azione bonus durante l'Ira", die: "1d8",
      uses: "1 Ira per uso", effect: "Un attacco in più con un'azione bonus, ma ottieni un livello di esaurimento alla fine dell'Ira." },
  ],
  totem: [
    { key: "totem_spirito", name: "Spirito Totemico", level: 3, action: "quando entri in Ira",
      uses: "1 Ira per uso", effect: "Scegli lo spirito guida: orso (resistenze da guerriero), aquila (vantaggio su percezione e opportunità), lupo (alleati in vantaggio sui nemici vicini)." },
  ],
  ancestrale: [
    { key: "ancestrali_guardiani", name: "Guardiani Ancestrali", level: 3, action: "quando attacchi",
      uses: "durante l'Ira", effect: "Il primo nemico che colpisci ha svantaggio sugli attacchi contro i tuoi alleati e subisce meno danni." },
  ],
  sapere: [
    { key: "sapere_ispirazione_taglio", name: "Ispirazione di Taglio", level: 3, action: "reazione", die: "1d6",
      uses: "1 uso di Ispirazione Bardica", effect: "Riduci di 1d6 il tiro di un nemico entro 18m." },
  ],
  valore: [
    { key: "valore_ispirazione_combattiva", name: "Ispirazione Combattiva", level: 3, action: "azione bonus", die: "1d6",
      uses: "1 uso di Ispirazione Bardica", effect: "Un alleato entro 18m può aggiungere il dado a un attacco o a un danno." },
  ],
  spade: [
    { key: "spade_stile_duello", name: "Stile di Combattimento con due Armi", level: 3, action: "passiva",
      uses: "senza limite", effect: "Quando fai un attacco con l'arma secondaria, aggiungi il tuo mod DES al danno." },
    { key: "spade_bravura", name: "Bravura", level: 3, action: "azione bonus dopo un attacco", die: "d6",
      uses: "1 uso di Ispirazione Bardica", effect: "Spendi un dado ispirazione: aggiungilo al danno, o ottieni bonus CA pari al dado fino al tuo prossimo turno, o respingi un attacco." },
  ],
  vita: [
    { key: "vita_preservare_vita", name: "Preservare Vita", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Curi fino a 5 × livello PF di creature entro 9m, dividendoli come vuoi." },
  ],
  luce: [
    { key: "luce_radianza_alba", name: "Radianza dell'Alba", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Raggio di luce radiante: nemici entro 9m, TS DES o danni radianti." },
  ],
  guerra: [
    { key: "guerra_colpo_guidato", name: "Colpo Guidato", level: 1, action: "dopo un tiro per colpire",
      uses: "1 Incanalare Divinità", effect: "Aggiungi +10 a un tiro per colpire che hai appena effettuato." },
  ],
  inganno: [
    { key: "inganno_duplicato", name: "Inganno di Invocazione", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Crei un duplicato illusorio di te stesso: i nemici devono scegliere quale bersagliare." },
  ],
  conoscenza: [
    { key: "conoscenza_eoni", name: "Conoscenza degli Eoni", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Ottieni competenza in un'abilità o strumento a scelta per 10 minuti." },
  ],
  natura: [
    { key: "natura_incanto", name: "Incanto della Natura", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Comandi piante e animali: una creatura deve superare TS SAG o essere affascinata." },
  ],
  tempesta: [
    { key: "tempesta_ira", name: "Ira della Tempesta", level: 1, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Fulmini vendicativi: chi ti attacca in mischia subisce danni da tuono." },
  ],
  luna: [
    { key: "luna_forma_combattiva", name: "Forma Selvatica Potenziata", level: 2, action: "azione bonus",
      uses: "1 uso di Forma Selvatica", effect: "Ti trasformi in una bestia più potente: CR pari a un terzo del tuo livello." },
  ],
  terra: [
    { key: "terra_recupero_naturale", name: "Recupero Naturale", level: 2, action: "durante riposo breve",
      uses: "1 volta per riposo lungo", effect: "Recuperi slot incantesimo per un totale pari a metà del tuo livello da druido." },
  ],
  sogni: [
    { key: "sogni_guarigione_distante", name: "Guarigione dei Sogni", level: 2, action: "azione bonus",
      uses: "2 volte per riposo lungo", effect: "Curi un alleato entro 36m per 1d4 PF." },
  ],
  campione: [
    { key: "campione_critico", name: "Critico Migliorato", level: 3, action: "passiva",
      uses: "senza limite", effect: "I tuoi colpi critici arrivano con 19-20." },
  ],
  maestro_armi: [
    { key: "maestro_manovre", name: "Dadi Manovra", level: 3, action: "azione/azione bonus/reazione", die: "d8",
      uses: "4 per riposo breve/lungo", effect: "Manovre speciali (disarmo, spinta, parata, comando): aggiungi il dado al tiro o al danno." },
  ],
  cavaliere: [
    { key: "cavaliere_sfida", name: "Sfida Marziale", level: 3, action: "azione bonus",
      uses: "1 volta per riposo breve", effect: "Provochi un nemico entro 9m: se ti attacca altrove ha svantaggio." },
  ],
  via_aperta: [
    { key: "via_aperta_onda_ki", name: "Onda di Energia Ki", level: 3, action: "azione",
      uses: "2 Ki", effect: "Scateni un'onda di energia da pugno: bersagli in una linea, TS DES o 2d6 danni da forza." },
  ],
  ombra: [
    { key: "ombra_passo_ombroso", name: "Passo Ombroso", level: 3, action: "azione bonus",
      uses: "2 Ki", effect: "Svanisci in tenebre e riappari in un punto che vedi entro 18m." },
  ],
  quattro_elementi: [
    { key: "elementi_ondata_acqua", name: "Ondata d'Acqua", level: 3, action: "azione", die: "2d10",
      uses: "2 Ki", effect: "Una frusta d'acqua colpisce una creatura entro 9m: TS DES o 2d10 danni da contundente e viene atterrata." },
    { key: "elementi_pugno_pietra", name: "Pugno di Pietra", level: 3, action: "azione", die: "3d10",
      uses: "2 Ki", effect: "Un colpo di aria compressa su una creatura entro 9m: TS FOR o 3d10 danni da contundente e viene spinta indietro." },
    { key: "elementi_manto_fuoco", name: "Manto di Fuoco", level: 3, action: "azione bonus", die: "1d4",
      uses: "2 Ki", effect: "Il tuo corpo si avvolge di fiamme: per 1 minuto chi ti colpisce in mischia subisce 1d4 danni da fuoco." },
    { key: "elementi_alito_ghiaccio", name: "Alito di Ghiaccio", level: 3, action: "azione", die: "2d8",
      uses: "2 Ki", effect: "Espiri un cono di gelo di 4,5m: le creature devono superare un TS COS o subire 2d8 danni da freddo." },
  ],
  devozione: [
    { key: "devozione_arma_radiosa", name: "Arma Sacra", level: 3, action: "azione bonus",
      uses: "1 Incanalare Divinità", effect: "La tua arma emette luce: aggiungi mod CAR ai tiri per colpire." },
  ],
  antichi: [
    { key: "antichi_presenza", name: "Presenza della Natura", level: 3, action: "azione",
      uses: "1 Incanalare Divinità", effect: "Bestie e piante ti riconoscono come amico: non ti attaccano a meno che non le provochi." },
  ],
  vendetta: [
    { key: "vendetta_nemico_giurato", name: "Nemico Giurato", level: 3, action: "azione bonus",
      uses: "1 volta per riposo lungo", effect: "Scegli un nemico: vantaggio sui suoi attacchi e sui suoi tiri salvezza contro di te." },
  ],
  cacciatore: [
    { key: "cacciatore_difesa", name: "Difesa dal Colpo", level: 3, action: "reazione",
      uses: "1 volta per round", effect: "Riduci i danni di un attacco subito della tua competenza." },
  ],
  maestro_bestie: [
    { key: "bestie_comando", name: "Compagno Animale", level: 3, action: "azione bonus",
      uses: "senza limite", effect: "Il tuo compagno animale agisce nel tuo turno e obbedisce ai tuoi comandi." },
  ],
  ladro: [
    { key: "ladro_mano_veloce", name: "Mano Veloce", level: 3, action: "azione bonus",
      uses: "senza limite", effect: "Usi un oggetto, scassi o usi la Mano Lesta come azione bonus." },
  ],
  assassino: [
    { key: "assassino_colpo_mortale", name: "Colpo Assassino", level: 3, action: "passiva",
      uses: "una volta per combattimento", effect: "Critico automatico contro creature sorprese che non hanno ancora agito." },
  ],
  truffatore_arcano: [
    { key: "truffatore_mano_magica", name: "Mano Magica", level: 3, action: "azione bonus",
      uses: "senza limite", effect: "Mano Magica invisibile: usa oggetti, recupera cose, distrae." },
  ],
  stirpe_draconica: [
    { key: "draconica_squame", name: "Squame Draconiche", level: 1, action: "passiva",
      uses: "senza limite", effect: "CA 13 + mod DES senza armatura, +1 PF per livello da stregone." },
  ],
  magia_selvaggia: [
    { key: "selvaggia_ondata", name: "Ondata di Magia Selvaggia", level: 1, action: "quando lanci un incantesimo",
      uses: "a discrezione del DM", effect: "Dopo un incantesimo puoi innestare un effetto casuale dalla tabella della magia selvaggia." },
  ],
  arcano: [
    { key: "arcano_colpo_oscuro", name: "Colpo Oscuro", level: 1, action: "quando colpisci", die: "1d6",
      uses: "senza limite", effect: "Danno extra del patto quando riduci un nemico a 0 PF." },
  ],
  fatato: [
    { key: "fatato_ferocia", name: "Ferocia Fatata", level: 1, action: "quando colpisci",
      uses: "senza limite", effect: "Il tuo patrono fatato ti dà poteri di affascinamento e paura." },
  ],
  antico: [
    { key: "antico_telepatia", name: "Telepatia dell'Antico", level: 1, action: "azione",
      uses: "senza limite", effect: "Parli telepaticamente con creature entro 36m che comprendono una lingua." },
  ],
  abiurazione: [
    { key: "abiurazione_scudo_arcano", name: "Scudo Arcano", level: 2, action: "reazione",
      uses: "2 volte per riposo lungo", effect: "Assorbi danni da incantesimi: aggiungi il tuo mod INT al tuo tiro salvezza." },
  ],
  congiurazione: [
    { key: "congiurazione_evocazione_minore", name: "Evocazione Minore", level: 2, action: "azione",
      uses: "1 volta per riposo lungo", effect: "Evochi un oggetto o una creatura minore benigna per alcuni minuti." },
  ],
  divinazione: [
    { key: "divinazione_portento", name: "Portento", level: 2, action: "reazione",
      uses: "2 per riposo lungo", effect: "Prevedi il futuro: sostituisci un tiro (tuo o di un nemico) con un d20 che hai tirato in anticipo." },
  ],
  ammaliamento: [
    { key: "ammaliamento_sguardo", name: "Sguardo Ipnotico", level: 2, action: "azione",
      uses: "1 volta per riposo breve", effect: "Il nemico deve superare un TS SAG o essere affascinato da te." },
  ],
  evocazione: [
    { key: "evocazione_scultore", name: "Scultore di Incantesimi", level: 2, action: "passiva",
      uses: "senza limite", effect: "Modelli i tuoi incantesimi di evocazione per non colpire gli alleati." },
  ],
  illusione: [
    { key: "illusione_migliorata", name: "Illusione Migliorata", level: 2, action: "passiva",
      uses: "senza limite", effect: "Le tue illusioni sopravvivono all'ispezione: chi le esamina crede che siano reali." },
  ],
  necromanzia: [
    { key: "necromanzia_recupero", name: "Recupero Necrotico", level: 2, action: "passiva",
      uses: "senza limite", effect: "Quando uccidi una creatura con un incantesimo recuperi PF pari al suo livello." },
  ],
  trasmutazione: [
    { key: "trasmutazione_alchimia", name: "Alchimia", level: 2, action: "azione",
      uses: "1 volta per riposo lungo", effect: "Creazione di un elisir o di materiali con le tue abilità alchemiche." },
  ],
};

export function getArchetypeAbilities(archetypeKey: string): ClassAbility[] {
  return ARCHETYPE_ABILITIES[archetypeKey] || [];
}

/* ── Incantatori per Archetipo (PHB) ─────────────────────────
   Alcuni archetipi sbloccano la magia in classi che altrimenti
   non lanciano (es. Truffatore Arcano, Cavaliere) o magie pagate
   in Ki (Via dell'Ombra). */

export type ArchetypeCasting = {
  label: string;
  list: string;
  ability?: string;
  cantripsKnown?: number;
  spellsKnown?: (level: number) => number;
  slots?: (level: number) => number[];
  ki?: { cost: number; spells: string[] };
};

/* Slot e incantesimi conosciuti dei Terzi Incantatori (Truffatore Arcano / Cavaliere).
   Indice = livello - 1. */
const THIRD_CAST_SLOTS: number[][] = [
  [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3],
  [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1],
];
const THIRD_CAST_KNOWN = [
  0, 0, 3, 4, 4, 4, 5, 6, 6, 7,
  7, 7, 8, 9, 9, 10, 10, 10, 11, 11,
];

export const ARCHETYPE_CASTING: Record<string, ArchetypeCasting> = {
  truffatore_arcano: {
    label: "Magia arcana: trucchetti e incantesimi da mago (caratteristica INT)",
    list: "wizard",
    ability: "intelligence",
    cantripsKnown: 3,
    spellsKnown: lv => THIRD_CAST_KNOWN[Math.max(0, lv - 1)] ?? 0,
    slots: lv => THIRD_CAST_SLOTS[Math.max(0, lv - 1)] ?? [],
  },
  cavaliere: {
    label: "Magia del cavaliere: incantesimi da mago delle scuole di abiurazione ed evocazione (INT)",
    list: "wizard",
    ability: "intelligence",
    cantripsKnown: 3,
    spellsKnown: lv => THIRD_CAST_KNOWN[Math.max(0, lv - 1)] ?? 0,
    slots: lv => THIRD_CAST_SLOTS[Math.max(0, lv - 1)] ?? [],
  },
  via_ombra: {
    label: "Arti delle Ombre: magie pagate in punti Ki (2 Ki ciascuna)",
    list: "wizard",
    ki: { cost: 2, spells: ["Tenebre", "Scurovisione", "Passo Senza Tracce", "Silenzio"] },
  },
};

export function getArchetypeCasting(archetypeKey: string): ArchetypeCasting | null {
  return ARCHETYPE_CASTING[archetypeKey] || null;
}

export function getArchetypeSlotsAtLevel(archetypeKey: string, level: number): Record<number, number> {
  const c = getArchetypeCasting(archetypeKey);
  const arr = c?.slots ? c.slots(level) : [];
  const out: Record<number, number> = {};
  arr.forEach((n, i) => { if (n > 0) out[i + 1] = n; });
  return out;
}

/* ── Risorse consumabili di classe (es. Ki) ───────────────────
   Mostrate nel tab Magia come slot consumabili, come gli slot
   incantesimo. Il totale è automatico per classe/livello. */

export type ClassResourceDef = {
  key: string;
  name: string;
  icon: string;
  color: string;
  restore: string;
  max: (level: number, cd: { strength?: number; charisma?: number; wisdom?: number }, pb: number) => number;
};

export const CLASS_RESOURCES: Record<string, ClassResourceDef[]> = {
  barbarian: [
    { key: "ira", name: "Ire", icon: "🔥", color: "bg-red-500/40 border-red-400/50",
      restore: "riposo lungo", max: (_lv, _cd, pb) => 2 + pb },
  ],
  bard: [
    { key: "ispirazione_bardica", name: "Ispirazioni Bardiche", icon: "🎵", color: "bg-pink-500/40 border-pink-400/50",
      restore: "riposo lungo", max: (_lv, cd, _pb) => Math.max(1, Math.floor((Number(cd.charisma) || 10 - 10) / 2)) },
  ],
  cleric: [
    { key: "incanalare_divinita", name: "Incanalare Divinità", icon: "✨", color: "bg-yellow-500/40 border-yellow-400/50",
      restore: "riposo breve/lungo", max: (lv, _cd, _pb) => lv >= 17 ? 4 : lv >= 13 ? 3 : lv >= 6 ? 2 : 1 },
  ],
  druid: [
    { key: "forma_selvatica", name: "Forme Selvatiche", icon: "🐻", color: "bg-emerald-500/40 border-emerald-400/50",
      restore: "riposo breve/lungo", max: (_lv, _cd, _pb) => 2 },
  ],
  fighter: [
    { key: "secondo_soffio", name: "Secondi Soffi", icon: "🫁", color: "bg-orange-500/40 border-orange-400/50",
      restore: "riposo breve/lungo", max: (_lv, _cd, _pb) => 1 },
    { key: "azione_impetuosa", name: "Azioni Impetuose", icon: "⚡", color: "bg-cyan-500/40 border-cyan-400/50",
      restore: "riposo breve/lungo", max: (lv, _cd, _pb) => lv >= 17 ? 2 : 1 },
  ],
  monk: [
    { key: "ki", name: "Punti Ki", icon: "☯", color: "bg-indigo-500/40 border-indigo-400/50",
      restore: "riposo breve/lungo", max: (lv, _cd, _pb) => lv },
  ],
  paladin: [
    { key: "percezione_divino", name: "Percezioni del Divino", icon: "👁️", color: "bg-amber-500/40 border-amber-400/50",
      restore: "riposo lungo", max: (_lv, cd, _pb) => Math.max(1, 1 + Math.floor((Number(cd.charisma) || 10 - 10) / 2)) },
  ],
  sorcerer: [
    { key: "punti_stregoneria", name: "Punti Stregoneria", icon: "💠", color: "bg-violet-500/40 border-violet-400/50",
      restore: "riposo lungo", max: (lv, _cd, _pb) => lv },
  ],
  wizard: [
    { key: "recupero_arcano", name: "Recuperi Arcano", icon: "📖", color: "bg-blue-500/40 border-blue-400/50",
      restore: "riposo lungo", max: (_lv, _cd, _pb) => 1 },
  ],
};

export function getClassResources(classKey: string): ClassResourceDef[] {
  return CLASS_RESOURCES[classKey] || [];
}