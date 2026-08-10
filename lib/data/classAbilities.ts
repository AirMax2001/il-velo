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
      key: "monk_ki", name: "Ki", level: 2, action: "vedi effetti",
      uses: "punti Ki = livello da monaco, recupero dopo riposo breve/lungo",
      effect: "Spendi 1 Ki per: Raffica di Colpi (azione bonus: 2 attacchi senz'armi), Presa Difensiva (azione bonus: azione di Schivare), Passo del Vento (azione bonus: Scatto o Disimpegno + salto doppio).",
    },
    {
      key: "monk_colpo_stordente", name: "Colpo Stordente", level: 5, action: "dopo un colpo in mischia",
      uses: "1 Ki per colpo",
      effect: "Il bersaglio deve superare un TS COS o essere stordito fino alla fine del tuo prossimo turno.",
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
  ranger: [],
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