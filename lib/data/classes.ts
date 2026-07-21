export type EquipmentChoice = {
  label: string;
  options: { name: string; quantity: number }[][];
};

export type ClassSpellcasting = {
  spellcastingAbility: string;
  cantripsKnown: number;
  spellsKnown: number;
  spellSlots: Record<number, number>;
};

export type ClassData = {
  key: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string[];
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  skillPicks: number;
  skillOptions: string[];
  features: { name: string; description: string }[];
  equipment: EquipmentChoice[];
  spellcasting?: ClassSpellcasting;
  multiclassRequirements?: Record<string, number>;
};

const classes: Record<string, ClassData> = {
  barbarian: {
    key: "barbarian",
    name: "Barbaro",
    description: "Un feroce guerriero che combatte con la furia primordiale. La sua rabbia in battaglia gli conferisce forza sovrumana e resistenza incredibile.",
    hitDie: 12,
    primaryAbility: ["strength"],
    savingThrows: ["stStrength", "stConstitution"],
    armorProficiencies: ["leggera", "media", "scudi"],
    weaponProficiencies: ["semplici", "da guerra"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillAnimalHandling", "skillAthletics", "skillIntimidation", "skillNature", "skillPerception", "skillSurvival"],
    features: [{
      name: "Ira",
      description: "Durante il tuo turno, puoi entrare in ira come azione bonus. Mentre sei in ira, ottieni: vantaggio alle prove di Forza e ai tiri salvezza di Forza; bonus al danno in mischia pari al tuo livello da barbaro ( +2 al 1°); resistenza ai danni contundenti, perforanti e taglienti. Non puoi lanciare incantesimi o concentrarti. L'ira dura 1 minuto e termina in anticipo se cadi privo di sensi o se non attacchi una creatura ostile/subisci danno in un round. Hai 2 utilizzi, recuperi dopo un riposo lungo."
    }],
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "ascia bipenne", quantity: 1 }],
          [{ name: "spadone", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di arma secondaria (A o B):",
        options: [
          [{ name: "ascia da battaglia", quantity: 1 }, { name: "scudo", quantity: 1 }],
          [{ name: "ascia da lancio", quantity: 2 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "esploratore zaino", quantity: 1 }, { name: "giavellotto", quantity: 4 }, { name: "strumenti da saccheggiatore", quantity: 1 }],
        ]
      },
    ]
  },
  bard: {
    key: "bard",
    name: "Bardo",
    description: "Un artista e mago che usa la musica e le parole per influenzare il mondo. I bardi sono abili in molte arti e conoscenze.",
    hitDie: 8,
    primaryAbility: ["charisma"],
    savingThrows: ["stDexterity", "stCharisma"],
    armorProficiencies: ["leggera"],
    weaponProficiencies: ["semplici", "spada corta", "spada lunga", "arco corto", "arco lungo"],
    toolProficiencies: ["tre strumenti musicali a scelta"],
    skillPicks: 3,
    skillOptions: ["skillAthletics", "skillAcrobatics", "skillSleightOfHand", "skillStealth", "skillArcana", "skillHistory", "skillInvestigation", "skillNature", "skillReligion", "skillAnimalHandling", "skillInsight", "skillMedicine", "skillPerception", "skillSurvival", "skillDeception", "skillIntimidation", "skillPerformance", "skillPersuasion"],
    features: [{
      name: "Ispirazione Bardica",
      description: "Con un'azione bonus, puoi ispirare una creatura entro 18m da te. La creatura guadagna un dado di Ispirazione Bardica (d6). Una volta nei successivi 10 minuti, può tirare il dado e aggiungere il risultato a una prova caratteristica, un tiro per colpire o un tiro salvezza. Hai un numero di utilizzi pari al tuo modificatore di Carisma (minimo 1). Recuperi dopo un riposo lungo."
    }],
    spellcasting: {
      spellcastingAbility: "charisma",
      cantripsKnown: 2,
      spellsKnown: 4,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "spada lunga", quantity: 1 }],
          [{ name: "stocco", quantity: 1 }, { name: "daga", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di equipaggiamento (A o B):",
        options: [
          [{ name: "zaino diplomatico", quantity: 1 }, { name: "liuto", quantity: 1 }],
          [{ name: "zaino da intrattenitore", quantity: 1 }, { name: "flauto", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "armatura di cuoio", quantity: 1 }, { name: "pugnale", quantity: 1 }],
        ]
      },
    ]
  },
  cleric: {
    key: "cleric",
    name: "Chierico",
    description: "Un servitore della divinità che incanala il potere divino per curare, proteggere e combattere. La fede è la sua arma più potente.",
    hitDie: 8,
    primaryAbility: ["wisdom"],
    savingThrows: ["stWisdom", "stCharisma"],
    armorProficiencies: ["leggera", "media", "scudi"],
    weaponProficiencies: ["semplici"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillHistory", "skillInsight", "skillMedicine", "skillPersuasion", "skillReligion"],
    features: [{
      name: "Incantesimi",
      description: "Puoi lanciare incantesimi divini. Prepari un numero di incantesimi pari al tuo modificatore di Saggezza + il tuo livello da chierico (minimo 1). Puoi lanciare incantesimi usando gli slot incantesimo."
    }, {
      name: "Dominio Divino",
      description: "Scegli un dominio (es. Vita, Guerra, Inganno, Conoscenza, Natura, Tempesta, Luce, Forgia, Tomba). Ottieni capacità speciali determinate dal dominio scelto, inclusi incantesimi di dominio aggiuntivi, competenze nelle armature e nel 1° livello la capacità specifica del dominio."
    }],
    spellcasting: {
      spellcastingAbility: "wisdom",
      cantripsKnown: 3,
      spellsKnown: 0,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "mazza", quantity: 1 }, { name: "scudo", quantity: 1 }],
          [{ name: "martello leggero", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di armatura (A o B):",
        options: [
          [{ name: "armatura a scaglie", quantity: 1 }],
          [{ name: "armatura di cuoio borchiato", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di equipaggiamento (A o B):",
        options: [
          [{ name: "zaino da sacerdote", quantity: 1 }, { name: "balestra leggera", quantity: 1 }, { name: "quadrelli", quantity: 20 }],
          [{ name: "zaino da esploratore", quantity: 1 }, { name: "simbolo sacro", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento aggiuntivo:",
        options: [
          [{ name: "simbolo sacro", quantity: 1 }],
        ]
      },
    ]
  },
  druid: {
    key: "druid",
    name: "Druido",
    description: "Un guardiano della natura che trae potere dal mondo naturale. Può assumere forme animali e lanciare incantesimi legati alla terra.",
    hitDie: 8,
    primaryAbility: ["wisdom"],
    savingThrows: ["stIntelligence", "stWisdom"],
    armorProficiencies: ["leggera", "media", "scudi"],
    weaponProficiencies: ["clava", "daga", "dardo", "giavellotto", "mazza", "randello", "scimitarra", "falce", "fionda", "lancia"],
    toolProficiencies: ["kit da erborista"],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillAnimalHandling", "skillInsight", "skillMedicine", "skillNature", "skillPerception", "skillReligion", "skillSurvival"],
    features: [{
      name: "Druidico",
      description: "Conosci il Druidico, il linguaggio segreto dei druidi. Puoi parlarlo e capirlo. È un linguaggio aggiuntivo."
    }, {
      name: "Incantesimi",
      description: "Puoi lanciare incantesimi druidici. Prepari un numero di incantesimi pari al tuo modificatore di Saggezza + il tuo livello da druido (minimo 1)."
    }],
    spellcasting: {
      spellcastingAbility: "wisdom",
      cantripsKnown: 2,
      spellsKnown: 0,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "scimitarra", quantity: 1 }],
          [{ name: "randello", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di esplorazione (A o B):",
        options: [
          [{ name: "zaino da esploratore", quantity: 1 }],
          [{ name: "zaino da sacerdote", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "armatura di cuoio", quantity: 1 }, { name: "scudo", quantity: 1 }, { name: "pugnale", quantity: 1 }, { name: "focalizzatore druidico", quantity: 1 }],
        ]
      },
    ]
  },
  fighter: {
    key: "fighter",
    name: "Guerriero",
    description: "Un maestro del combattimento armato. I guerrieri sono versatili e letali, specializzati in ogni forma di guerra.",
    hitDie: 10,
    primaryAbility: ["strength", "dexterity"],
    savingThrows: ["stStrength", "stConstitution"],
    armorProficiencies: ["leggera", "media", "pesante", "scudi"],
    weaponProficiencies: ["semplici", "da guerra"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillAcrobatics", "skillAnimalHandling", "skillAthletics", "skillHistory", "skillInsight", "skillIntimidation", "skillPerception", "skillSurvival"],
    features: [{
      name: "Stile di Combattimento",
      description: "Scegli uno stile di combattimento: Arcieria (+2 al tiro per colpire con armi a distanza), Difesa (+1 alla CA con armatura), Combattere con due armi (aggiungi modificatore al danno della seconda arma), Protezione (imporre svantaggio a un attacco contro un alleato adiacente), Combattimento con armi alla mano (impugnare un'arma a due mani con una mano sola), Duello (+2 al danno in mischia con una sola arma)."
    }, {
      name: "Secondo Soffio",
      description: "Una volta per riposo breve o lungo, puoi usare un'azione bonus per recuperare Punti Ferita pari a 1d10 + il tuo livello da guerriero."
    }],
    equipment: [
      {
        label: "Scegli un'opzione di arma principale (A o B):",
        options: [
          [{ name: "spadone", quantity: 1 }],
          [{ name: "spada lunga", quantity: 1 }, { name: "scudo", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di armi secondarie (A o B):",
        options: [
          [{ name: "arco lungo", quantity: 1 }, { name: "frecce", quantity: 20 }],
          [{ name: "ascia da lancio", quantity: 2 }],
        ]
      },
      {
        label: "Scegli un'opzione di armatura (A o B):",
        options: [
          [{ name: "armatura a maglie", quantity: 1 }],
          [{ name: "armatura di cuoio", quantity: 1 }, { name: "arco corto", quantity: 1 }, { name: "frecce", quantity: 20 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "zaino da esploratore", quantity: 1 }, { name: "strumenti da saccheggiatore", quantity: 1 }],
        ]
      },
    ]
  },
  monk: {
    key: "monk",
    name: "Monaco",
    description: "Un maestro delle arti marziali che incanella l'energia vitale (Ki) per compiere imprese sovrumane. La sua arma è il suo corpo.",
    hitDie: 8,
    primaryAbility: ["dexterity", "wisdom"],
    savingThrows: ["stStrength", "stDexterity"],
    armorProficiencies: [],
    weaponProficiencies: ["semplici", "spada corta"],
    toolProficiencies: ["strumenti da artigiano a scelta"],
    skillPicks: 2,
    skillOptions: ["skillAcrobatics", "skillAthletics", "skillHistory", "skillInsight", "skillReligion", "skillStealth"],
    features: [{
      name: "Difesa Senza Armatura",
      description: "Quando non indossi armatura né scudo, la tua CA è pari a 10 + modificatore di Destrezza + modificatore di Saggezza."
    }, {
      name: "Arti Marziali",
      description: "La tua competenza nelle arti marziali ti permette di usare efficacemente i tuoi colpi senz'armi. Il dado di danno dei tuoi colpi senz'armi è 1d4. Puoi fare un attacco senz'armi come azione bonus dopo un'azione di Attacco."
    }, {
      name: "Ki",
      description: "Il tuo addestramento ti permette di incanalare l'energia del Ki. Al 1° livello hai 2 punti Ki (pari al tuo livello da monaco). Puoi usarli per abilità come Raffica di Colpi, Presa Difensiva o Passo del Vento. Recuperi dopo un riposo breve o lungo."
    }],
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "spada corta", quantity: 1 }],
          [{ name: "randello", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di esplorazione (A o B):",
        options: [
          [{ name: "zaino da esploratore", quantity: 1 }],
          [{ name: "zaino da sacerdote", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "pugnale", quantity: 10 }, { name: "dardo", quantity: 10 }],
        ]
      },
    ]
  },
  paladin: {
    key: "paladin",
    name: "Paladino",
    description: "Un guerriero sacro che combatte per la giustizia e la luce. Il suo giuramento gli conferisce poteri divini e una forza incrollabile.",
    hitDie: 10,
    primaryAbility: ["strength", "charisma"],
    savingThrows: ["stWisdom", "stCharisma"],
    armorProficiencies: ["leggera", "media", "pesante", "scudi"],
    weaponProficiencies: ["semplici", "da guerra"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillAthletics", "skillInsight", "skillIntimidation", "skillMedicine", "skillPersuasion", "skillReligion"],
    features: [{
      name: "Percezione del Divino",
      description: "Puoi usare la tua azione per percepire la presenza di creature celesti, infernali o non morte entro 18m. Sei consapevole del tipo di creatura presente. Puoi usare questa caratteristica un numero di volte pari a 1 + modificatore di Carisma. Recuperi dopo un riposo lungo."
    }, {
      name: "Imposizione delle Mani",
      description: "Hai una riserva di potere curativo. Puoi curare una creatura di un numero di PF pari al tuo livello da paladino × 5. Puoi usare questo potere per curare progressivamente. Decidi quanti PF spendere. Puoi anche usare 5 PF per curare una malattia o un veleno."
    }, {
      name: "Stile di Combattimento",
      description: "Scegli uno stile di combattimento: Difesa (+1 CA), Duello (+2 danno con una mano), Combattere con due armi, Protezione, Combattimento con armi alla mano."
    }],
    spellcasting: {
      spellcastingAbility: "charisma",
      cantripsKnown: 0,
      spellsKnown: 0,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma principale (A o B):",
        options: [
          [{ name: "spada lunga", quantity: 1 }, { name: "scudo", quantity: 1 }],
          [{ name: "spadone", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di armi secondarie (A o B):",
        options: [
          [{ name: "giavellotto", quantity: 5 }],
          [{ name: "arma da guerra leggera", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "armatura a maglie", quantity: 1 }, { name: "simbolo sacro", quantity: 1 }, { name: "zaino da sacerdote", quantity: 1 }],
        ]
      },
    ]
  },
  ranger: {
    key: "ranger",
    name: "Ranger",
    description: "Un cacciatore e tracciatore che si muove con naturalezza nella natura selvaggia. È un maestro della sopravvivenza e del tiro con l'arco.",
    hitDie: 10,
    primaryAbility: ["dexterity", "wisdom"],
    savingThrows: ["stStrength", "stDexterity"],
    armorProficiencies: ["leggera", "media", "scudi"],
    weaponProficiencies: ["semplici", "da guerra"],
    toolProficiencies: [],
    skillPicks: 3,
    skillOptions: ["skillAnimalHandling", "skillAthletics", "skillInsight", "skillInvestigation", "skillNature", "skillPerception", "skillStealth", "skillSurvival"],
    features: [{
      name: "Nemico Prescelto",
      description: "Scegli un tipo di nemico: bestie, mostri, umanoidi, vegetali, non morti, ecc. Hai vantaggio alle prove di Saggezza (Sopravvivenza) per tracciare il nemico prescelto e alle prove di Intelligenza per ricordare informazioni su di esso. Inoltre impari una lingua parlata dai nemici prescelti."
    }, {
      name: "Esploratore Natio",
      description: "Scegli un tipo di ambiente naturale come tuo terreno preferito: artico, costa, deserto, foresta, prateria, montagne, palude. Mentre sei in quel terreno, il tuo gruppo ha vantaggio su determinati tipi di viaggio."
    }],
    spellcasting: {
      spellcastingAbility: "wisdom",
      cantripsKnown: 0,
      spellsKnown: 2,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma principale (A o B):",
        options: [
          [{ name: "arco lungo", quantity: 1 }, { name: "frecce", quantity: 20 }],
          [{ name: "spada lunga", quantity: 1 }, { name: "scudo", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di armi secondarie (A o B):",
        options: [
          [{ name: "spada corta", quantity: 1 }, { name: "spada corta", quantity: 1 }],
          [{ name: "arma da guerra leggera", quantity: 2 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "armatura di cuoio borchiato", quantity: 1 }, { name: "zaino da esploratore", quantity: 1 }, { name: "trappola da caccia", quantity: 1 }],
        ]
      },
    ]
  },
  rogue: {
    key: "rogue",
    name: "Ladro",
    description: "Un abile furfante e infiltrato. Il ladro eccelle nell'inganno, nella furtività e nei colpi precisi che sfruttano le debolezze dei nemici.",
    hitDie: 8,
    primaryAbility: ["dexterity"],
    savingThrows: ["stDexterity", "stIntelligence"],
    armorProficiencies: ["leggera"],
    weaponProficiencies: ["semplici", "spada corta", "stocco", "arco corto", "balestra a mano"],
    toolProficiencies: ["strumenti da scasso"],
    skillPicks: 4,
    skillOptions: ["skillAcrobatics", "skillAthletics", "skillDeception", "skillInsight", "skillIntimidation", "skillInvestigation", "skillPerception", "skillPerformance", "skillPersuasion", "skillSleightOfHand", "skillStealth"],
    features: [{
      name: "Attacco Furtivo",
      description: "Una volta per turno, puoi infliggere 1d6 danno extra quando colpisci una creatura con un'arma che ha proprietà di finezza o a distanza, se hai vantaggio al tiro per colpire. Non hai bisogno di vantaggio se un alleato del nemico è entro 1,5m da esso e non è incapacitato."
    }, {
      name: "Gergo Ladresco",
      description: "Durante le tue attività da ladro, puoi lasciare messaggi in codice per altri ladri. Solo un altro ladro può capire il messaggio."
    }, {
      name: "Esperienza Furtiva",
      description: "Scegli un'abilità tra le tue competenze o gli strumenti da scasso. Il tuo bonus di competenza raddoppia per le prove con quella caratteristica o strumento."
    }, {
      name: "Espiazione",
      description: "Se attacchi una creatura che non ti ha ancora visto in combattimento, hai vantaggio al tiro per colpire."
    }],
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "stocco", quantity: 1 }],
          [{ name: "spada corta", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di armi a distanza (A o B):",
        options: [
          [{ name: "arco corto", quantity: 1 }, { name: "frecce", quantity: 20 }],
          [{ name: "stocco", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "zaino da scassinatore", quantity: 1 }, { name: "armatura di cuoio", quantity: 1 }, { name: "pugnale", quantity: 2 }, { name: "strumenti da scasso", quantity: 1 }],
        ]
      },
    ]
  },
  sorcerer: {
    key: "sorcerer",
    name: "Stregone",
    description: "Un incantatore nato con magia innata nelle vene. Il suo potere magico è istintivo e travolgente, spesso legato a un'eredità magica o draconica.",
    hitDie: 6,
    primaryAbility: ["charisma"],
    savingThrows: ["stConstitution", "stCharisma"],
    armorProficiencies: [],
    weaponProficiencies: ["daga", "dardo", "fionda", "randello", "balestra leggera"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillDeception", "skillInsight", "skillIntimidation", "skillPersuasion", "skillReligion"],
    features: [{
      name: "Origine Magica",
      description: "Scegli un'origine magica: Stirpe Draconica (PF extra, caratteristiche draconiche) o Magia Selvaggia (onde di magia caotica). La tua origine determina capacità speciali al 1° e ai livelli successivi."
    }, {
      name: "Incanalare la Magia",
      description: "Puoi usare la tua azione bonus per ottenere punti stregoneria. Al 1° livello non hai ancora la capacità di creare punti stregoneria."
    }],
    spellcasting: {
      spellcastingAbility: "charisma",
      cantripsKnown: 4,
      spellsKnown: 2,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "balestra leggera", quantity: 1 }, { name: "quadrelli", quantity: 20 }],
          [{ name: "randello", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di equipaggiamento (A o B):",
        options: [
          [{ name: "zaino da esploratore", quantity: 1 }],
          [{ name: "zaino da sacerdote", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "pugnale", quantity: 2 }, { name: "focalizzatore arcano", quantity: 1 }],
        ]
      },
    ]
  },
  warlock: {
    key: "warlock",
    name: "Warlock",
    description: "Un ricercatore di conoscenza proibita che ha stretto un patto con un potente essere extraplanare. Il suo potere è un dono — o una maledizione.",
    hitDie: 8,
    primaryAbility: ["charisma"],
    savingThrows: ["stWisdom", "stCharisma"],
    armorProficiencies: ["leggera"],
    weaponProficiencies: ["semplici"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillDeception", "skillHistory", "skillIntimidation", "skillInvestigation", "skillNature", "skillReligion"],
    features: [{
      name: "Patto Oscuro",
      description: "Scegli il tipo di patrono: Arcano (Fiend), Fata (Archfey), Antico (Great Old One), Celestiale, Esadecimale (Hexblade). Ogni patrono fornisce capacità speciali, incluso un incantesimo bonus al 1° livello."
    }, {
      name: "Invocazioni Arcane",
      description: "Al 2° livello, sceglierai invocazioni che modificano i tuoi incantesimi e ti concedono capacità speciali."
    }],
    spellcasting: {
      spellcastingAbility: "charisma",
      cantripsKnown: 2,
      spellsKnown: 2,
      spellSlots: { 1: 1 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "balestra leggera", quantity: 1 }, { name: "quadrelli", quantity: 20 }],
          [{ name: "arma semplice", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di equipaggiamento (A o B):",
        options: [
          [{ name: "zaino da studioso", quantity: 1 }],
          [{ name: "zaino da esploratore", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "armatura di cuoio", quantity: 1 }, { name: "arma semplice", quantity: 1 }, { name: "focalizzatore arcano", quantity: 1 }],
        ]
      },
    ]
  },
  wizard: {
    key: "wizard",
    name: "Mago",
    description: "Uno studioso della magia arcana che ha dedicato la vita allo studio e alla padronanza degli incantesimi. La sua forza è la conoscenza.",
    hitDie: 6,
    primaryAbility: ["intelligence"],
    savingThrows: ["stIntelligence", "stWisdom"],
    armorProficiencies: [],
    weaponProficiencies: ["daga", "dardo", "fionda", "randello", "balestra leggera"],
    toolProficiencies: [],
    skillPicks: 2,
    skillOptions: ["skillArcana", "skillHistory", "skillInsight", "skillInvestigation", "skillMedicine", "skillReligion"],
    features: [{
      name: "Incantesimi",
      description: "Conosci e prepari incantesimi arcani. Puoi preparare un numero di incantesimi pari al tuo livello da mago + il tuo modificatore di Intelligenza. Il tuo libro degli incantesimi contiene 6 incantesimi di 1° livello a tua scelta."
    }, {
      name: "Tradizione Arcana",
      description: "Scegli una tradizione arcana: Abiurazione, Congiurazione, Divinazione, Ammaliamento, Evocazione, Illusione, Necromanzia, Trasmutazione. Ogni tradizione fornisce capacità speciali al 2° livello."
    }, {
      name: "Recupero Arcano",
      description: "Una volta al giorno, dopo un riposo breve, puoi recuperare un numero di slot incantesimo spesi pari alla metà del tuo livello da mago (arrotondato per eccesso)."
    }],
    spellcasting: {
      spellcastingAbility: "intelligence",
      cantripsKnown: 3,
      spellsKnown: 0,
      spellSlots: { 1: 2 },
    },
    equipment: [
      {
        label: "Scegli un'opzione di arma (A o B):",
        options: [
          [{ name: "randello", quantity: 1 }],
          [{ name: "daga", quantity: 1 }],
        ]
      },
      {
        label: "Scegli un'opzione di equipaggiamento (A o B):",
        options: [
          [{ name: "zaino da studioso", quantity: 1 }],
          [{ name: "zaino da esploratore", quantity: 1 }],
        ]
      },
      {
        label: "Equipaggiamento iniziale:",
        options: [
          [{ name: "libro degli incantesimi", quantity: 1 }, { name: "focalizzatore arcano", quantity: 1 }, { name: "balestra leggera", quantity: 1 }, { name: "quadrelli", quantity: 20 }],
        ]
      },
    ]
  },
};

export default classes;

export function getClassData(key: string): ClassData | undefined {
  return classes[key];
}

export function findClassKey(name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  if (classes[lower]) return lower;
  for (const [k, v] of Object.entries(classes)) {
    if (v.name.toLowerCase() === lower) return k;
  }
  return undefined;
}

export const allClassKeys = Object.keys(classes);
