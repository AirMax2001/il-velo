export type RaceTrait = {
  name: string;
  description: string;
};

export type SubRace = {
  key: string;
  name: string;
  abilityBonuses: Record<string, number>;
  traits: RaceTrait[];
  proficiencies?: { skills?: string[]; armors?: string[]; weapons?: string[]; tools?: string[] };
  extraSkillCount?: number;
  resistances?: string[];
  description?: string;
};

export type RaceData = {
  key: string;
  name: string;
  description: string;
  abilityBonuses: Record<string, number>;
  speed: number;
  size: "Piccola" | "Media" | "Grande";
  languages: string[];
  traits: RaceTrait[];
  proficiencies?: { skills?: string[]; armors?: string[]; weapons?: string[]; tools?: string[] };
  darkvision?: number;
  resistances?: string[];
  extraSkillCount?: number;
  subRaces?: SubRace[];
  hasSubRace: boolean;
};

const races: Record<string, RaceData> = {
  nano: {
    key: "nano",
    name: "Nano",
    description: "I nani sono un popolo robusto e resistente, noti per la loro abilità nella lavorazione della pietra e dei metalli. Vivono a lungo e sono famosi per la loro determinazione.",
    abilityBonuses: { constitution: 2 },
    speed: 25,
    size: "Media",
    languages: ["Comune", "Nanico"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Resilienza nanica", description: "Vantaggio ai tiri salvezza contro avvelenamento. Resistenza al danno da veleno." },
      { name: "Addestramento nanico alle armi", description: "Competenza con asce da battaglia, asce bipenni, martelli da guerra e martelli leggeri." },
      { name: "Competenza negli strumenti", description: "Hai competenza in uno strumento da artigiano a scelta (strumenti da fabbro, da birraio, da muratore)." },
      { name: "Conoscenza della pietra", description: "Ogni volta che effettui una prova di Storia (INT) relativa all'origine di un lavoro in pietra, sei considerato competente e aggiungi il doppio del bonus di competenza." },
    ],
    proficiencies: { weapons: ["ascia da battaglia", "ascia bipenne", "martello da guerra", "martello leggero"] },
    darkvision: 18,
    resistances: ["veleno"],
    hasSubRace: true,
    subRaces: [
      {
        key: "nano_delle_colline",
        name: "Nano delle Colline",
        abilityBonuses: { wisdom: 1 },
        traits: [
          { name: "Durazza nanica", description: "Il tuo massimo di Punti Ferita aumenta di 1 per ogni livello del personaggio." },
        ],
        description: "I nani delle colline sono resistenti e saggi, con un profondo legame con la terra."
      },
      {
        key: "nano_delle_montagne",
        name: "Nano delle Montagne",
        abilityBonuses: { strength: 2 },
        traits: [
          { name: "Addestramento nanico alle armature", description: "Hai competenza con le armature leggere e medie." },
        ],
        proficiencies: { armors: ["leggera", "media"] },
        description: "I nani delle montagne sono forti e robusti, abituati alle dure condizioni delle vette."
      }
    ]
  },
  elfo: {
    key: "elfo",
    name: "Elfo",
    description: "Gli elfi sono creature magiche, agili e longeve. Hanno un profondo legame con la natura e la magia.",
    abilityBonuses: { dexterity: 2 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Elfico"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Ascendenza fatata", description: "Hai vantaggio ai tiri salvezza contro essere affascinato e non puoi essere addormentato magicamente." },
      { name: "Trance", description: "Non hai bisogno di dormire. Invece di dormire, mediti in uno stato di semi-coscienza per 4 ore al giorno." },
      { name: "Percezione acuta", description: "Hai competenza nell'abilità Percezione." },
    ],
    proficiencies: { skills: ["skillPerception"] },
    darkvision: 18,
    hasSubRace: true,
    subRaces: [
      {
        key: "elfo_alto",
        name: "Elfo Alto",
        abilityBonuses: { intelligence: 1 },
        traits: [
          { name: "Addestramento elfico alle armi", description: "Competenza con spada lunga, spada corta, arco corto e arco lungo." },
          { name: "Trucchetto", description: "Conosci un trucchetto a scelta dalla lista degli incantesimi da mago. La caratteristica per lanciarlo è Intelligenza." },
        ],
        proficiencies: { weapons: ["spada lunga", "spada corta", "arco corto", "arco lungo"] },
        description: "Gli elfi alti sono più legati alla magia e hanno una naturale predisposizione per gli incantesimi."
      },
      {
        key: "elfo_dei_boschi",
        name: "Elfo dei Boschi",
        abilityBonuses: { wisdom: 1 },
        traits: [
          { name: "Addestramento elfico alle armi", description: "Competenza con spada lunga, spada corta, arco corto e arco lungo." },
          { name: "Passo veloce", description: "La tua velocità base aumenta a 10,5m." },
          { name: "Maschera dei boschi", description: "Puoi tentare di nasconderti anche quando sei leggermente oscurato da fogliame, pioggia, neve o altri fenomeni naturali." },
        ],
        proficiencies: { weapons: ["spada lunga", "spada corta", "arco corto", "arco lungo"] },
        description: "Gli elfi dei boschi sono più selvaggi e legati alla natura, abili nel muoversi silenziosamente."
      },
      {
        key: "elfo_oscuro_drow",
        name: "Elfo Oscuro (Drow)",
        abilityBonuses: { charisma: 1 },
        traits: [
          { name: "Scurovisione superiore", description: "Vedi nella penombra fino a 36m come se fosse luce piena, e nel buio come se fosse penombra." },
          { name: "Sensibilità alla luce solare", description: "Hai svantaggio ai tiri per colpire e alle prove di Saggezza (Percezione) basate sulla vista quando tu, il bersaglio o ciò che stai cercando di percepire è alla luce diretta del sole." },
          { name: "Magia drow", description: "Conosci il trucchetto Luci danzanti. Al 3° livello, puoi lanciare l'incantesimo Bagliore fatato una volta. Al 5° livello, puoi lanciare l'incantesimo Tenebre una volta. Carisma è la tua caratteristica da incantatore." },
          { name: "Addestramento elfico alle armi", description: "Competenza con spada lunga, spada corta, arco corto e arco lungo." },
        ],
        proficiencies: { weapons: ["spada lunga", "spada corta", "arco corto", "arco lungo"] },
        description: "I drow vivono nel Sottosuolo e hanno sviluppato potenti abilità magiche e una perfetta visione al buio."
      }
    ]
  },
  halfling: {
    key: "halfling",
    name: "Halfling",
    description: "Gli halfling sono piccoli, agili e sorprendentemente coraggiosi. Preferiscono una vita semplice ma si dimostrano avventurieri intraprendenti.",
    abilityBonuses: { dexterity: 2 },
    speed: 25,
    size: "Piccola",
    languages: ["Comune", "Halfling"],
    traits: [
      { name: "Fortunato", description: "Quando ottieni 1 naturale con un tiro per colpire, una prova caratteristica o un tiro salvezza, puoi ritirare il dado e devi usare il nuovo risultato." },
      { name: "Coraggioso", description: "Hai vantaggio ai tiri salvezza contro essere spaventato." },
      { name: "Passo silenzioso", description: "Puoi muoverti attraverso lo spazio di qualsiasi creatura più grande di te." },
    ],
    hasSubRace: true,
    subRaces: [
      {
        key: "halfling_piedeleghero",
        name: "Halfling Piedeleghero",
        abilityBonuses: { charisma: 1 },
        traits: [
          { name: "Furtività innata", description: "Puoi tentare di nasconderti anche quando sei oscurato solo da una creatura più grande di te." },
        ],
        description: "Gli halfling piedeleghero sono più socievoli e tendono a vivere in comunità, con un naturale talento per la furtività."
      },
      {
        key: "halfling_robusto",
        name: "Halfling Robusto",
        abilityBonuses: { constitution: 1 },
        traits: [
          { name: "Resistenza halfling", description: "Hai vantaggio ai tiri salvezza contro avvelenamento e resistenza al danno da veleno." },
        ],
        resistances: ["veleno"],
        description: "Gli halfling robusti sono più resistenti e hanno fama di sopportare meglio le difficoltà."
      }
    ]
  },
  umano: {
    key: "umano",
    name: "Umano",
    description: "Gli umani sono la razza più versatile e ambiziosa. La loro capacità di adattamento li rende presenti in ogni angolo del mondo.",
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Un linguaggio extra a scelta"],
    traits: [
      { name: "Versatilità", description: "Tutte le tue caratteristiche aumentano di 1." },
    ],
    hasSubRace: false,
  },
  draconide: {
    key: "draconide",
    name: "Draconide",
    description: "I draconidi sono discendenti dei grandi draghi. Il loro aspetto ricorda quello dei draghi, con squame e artigli.",
    abilityBonuses: { strength: 2, charisma: 1 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Draconico"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Resistenza draconica", description: "Hai resistenza al tipo di danno associato al tuo antenato draconico." },
      { name: "Arma sputata", description: "Puoi usare la tua azione per esalare energia distruttiva. Il tuo antenato draconico determina il tipo di danno e l'area. Se usi questa caratteristica, non puoi usarla di nuovo fino al completamento di un riposo breve o lungo." },
      { name: "Ascendenza draconica", description: "Scegli il tipo di drago che è tuo antenato. Il tipo determina il danno della tua arma sputata e la resistenza." },
    ],
    darkvision: 18,
    hasSubRace: false,
    extraSkillCount: 0,
  },
  gnomo: {
    key: "gnomo",
    name: "Gnomo",
    description: "Gli gnomi sono piccoli, energici e dotati di una grande intelligenza. Amano la vita, gli scherzi e le invenzioni.",
    abilityBonuses: { intelligence: 2 },
    speed: 25,
    size: "Piccola",
    languages: ["Comune", "Gnomico"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Astuzia gnomesca", description: "Hai vantaggio a tutti i tiri salvezza su Intelligenza, Saggezza e Carisma contro la magia." },
    ],
    darkvision: 18,
    hasSubRace: true,
    subRaces: [
      {
        key: "gnomo_delle_foreste",
        name: "Gnomo delle Foreste",
        abilityBonuses: { dexterity: 1 },
        traits: [
          { name: "Illusionista naturale", description: "Conosci il trucchetto Immagine che hai. La caratteristica per lanciarlo è Intelligenza." },
          { name: "Comunicare con le piccole bestie", description: "Puoi comunicare idee semplici con animali di taglia Piccola o inferiore." },
        ],
        description: "Gli gnomi delle foreste hanno un talento naturale per le illusioni e un legame con gli animali."
      },
      {
        key: "gnomo_delle_rocce",
        name: "Gnomo delle Rocce",
        abilityBonuses: { constitution: 1 },
        traits: [
          { name: "Esperto artigiano", description: "Ogni volta che effettui una prova di Storia (INT) relativa a un oggetto magico, alchemico o tecnologico, puoi aggiungere il doppio del tuo bonus di competenza." },
          { name: "Costruttore di congegni", description: "Hai competenza con gli strumenti da artigiano (strumenti da fabbro). Puoi impiegare 1 ora e materiali per 10 mo per costruire un piccolo congegno meccanico." },
        ],
        proficiencies: { tools: ["strumenti da fabbro"] },
        description: "Gli gnomi delle rocce sono inventori e artigiani, noti per le loro creazioni ingegnose."
      }
    ]
  },
  mezzelfo: {
    key: "mezzelfo",
    name: "Mezzelfo",
    description: "I mezzelfi sono figli di umani ed elfi, un ponte tra due mondi. Hanno la curiosità degli umani e la longevità degli elfi.",
    abilityBonuses: { charisma: 2 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Elfico", "Un linguaggio extra a scelta"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Ascendenza fatata", description: "Hai vantaggio ai tiri salvezza contro essere affascinato e non puoi essere addormentato magicamente." },
      { name: "Competenza in abilità extra", description: "Ottieni competenza in due abilità a tua scelta." },
    ],
    darkvision: 18,
    extraSkillCount: 2,
    hasSubRace: false,
  },
  mezzorco: {
    key: "mezzorco",
    name: "Mezzorco",
    description: "I mezzorchi combinano la forza bruta degli orchi con l'adattabilità umana. Sono imponenti e temuti in battaglia.",
    abilityBonuses: { strength: 2, constitution: 1 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Orchesco"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Resistenza inflessibile", description: "Quando vieni ridotto a 0 Punti Ferita ma non vieni ucciso sul colpo, puoi scendere a 1 PF invece. Non puoi usare questa caratteristica di nuovo fino al completamento di un riposo lungo." },
      { name: "Attacchi selvaggi", description: "Quando ottieni un colpo critico in mischia, puoi tirare uno dei dadi di danno dell'arma un'ulteriore volta e aggiungerlo al danno extra del critico." },
      { name: "Minaccioso", description: "Ottieni competenza nell'abilità Intimidire." },
    ],
    proficiencies: { skills: ["skillIntimidation"] },
    darkvision: 18,
    hasSubRace: false,
  },
  tiefling: {
    key: "tiefling",
    name: "Tiefling",
    description: "I tiefling hanno sangue infernale nelle vene. Portano i segni del loro retaggio: corna, coda, occhi senza pupille e pelle dai toni insoliti.",
    abilityBonuses: { charisma: 2, intelligence: 1 },
    speed: 30,
    size: "Media",
    languages: ["Comune", "Infernale"],
    traits: [
      { name: "Scurovisione", description: "Vedi nella penombra fino a 18m come se fosse luce piena, e nel buio come se fosse penombra. Non distingue i colori." },
      { name: "Resistenza infernale", description: "Hai resistenza al danno da fuoco." },
      { name: "Eredità infernale", description: "Conosci il trucchetto Taumaturgia. Al 3° livello, puoi lanciare l'incantesimo Mano Rovente. Al 5° livello, puoi lanciare l'incantesimo Tenebre. Carisma è la tua caratteristica da incantatore." },
    ],
    darkvision: 18,
    resistances: ["fuoco"],
    hasSubRace: false,
  },
};

export default races;

export function getRaceData(key: string): RaceData | undefined {
  return races[key];
}

export function findRaceKey(name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  if (races[lower]) return lower;
  for (const [k, v] of Object.entries(races)) {
    if (v.name.toLowerCase() === lower) return k;
  }
  for (const [k, v] of Object.entries(races)) {
    if (v.subRaces) {
      for (const sr of v.subRaces) {
        if (sr.name.toLowerCase() === lower) return k;
      }
    }
  }
  return undefined;
}

export function getSubRaceData(raceKey: string, subRaceKey: string): SubRace | undefined {
  const race = races[raceKey];
  if (!race?.subRaces) return undefined;
  return race.subRaces.find(sr => sr.key === subRaceKey);
}
