export type BackgroundData = {
  key: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: string[];
  feature: { name: string; description: string };
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
};

const backgrounds: Record<string, BackgroundData> = {
  acolyte: {
    key: "acolyte",
    name: "Accolito",
    description: "Hai passato la vita al servizio di un tempio, imparando i rituali e i dogmi di una divinità specifica.",
    skillProficiencies: ["skillInsight", "skillReligion"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["simbolo sacro", "libro di preghiere", "5 bastoncini d'incenso", "paramenti", "vestiti comuni", "15 mo"],
    feature: {
      name: "Rifugio del Fedele",
      description: "Tu e i tuoi compagni potete ricevere assistenza gratuita presso i templi e le comunità religiose. Puoi officiare cerimonie religiose e ricevere cure mediche senza pagare."
    },
    personalityTraits: ["Sono venerato dai fedeli per la mia devozione.", "Tratto ogni persona come un'anima da salvare.", "Passo ore in meditazione e preghiera.", "Vedo segni divini in ogni evento."],
    ideals: ["Fede. Mi fido della mia divinità e seguo i suoi insegnamenti.", "Altruismo. Vivo per aiutare gli altri.", "Potere. La religione è il vero potere nel mondo.", "Tradizione. Gli antichi riti devono essere preservati."],
    bonds: ["Devo proteggere il tempio e i suoi fedeli.", "Un eretico ha profanato il nostro luogo sacro e deve essere fermato.", "Conservo una reliquia sacra della mia fede."],
    flaws: ["Giudico severamente chi non segue la mia fede.", "A volte la mia devozione mi porta a essere intollerante.", "Faccio fatica ad accettare le altre divinità."]
  },
  criminal: {
    key: "criminal",
    name: "Criminale",
    description: "Hai una storia di attività illegali. Che tu sia un ladro, un contrabbandiere o un sicario, vivi al di fuori della legge.",
    skillProficiencies: ["skillDeception", "skillStealth"],
    toolProficiencies: ["strumenti da scasso", "strumenti da gioco a scelta"],
    languages: 0,
    equipment: ["piede di porco", "vestiti scuri comuni", "cappuccio", "15 mo"],
    feature: {
      name: "Contatti Criminali",
      description: "Conosci e mantieni contatti con altre figure del mondo criminale. Puoi inviare e ricevere messaggi attraverso la rete criminale locale."
    },
    personalityTraits: ["Ho sempre un piano di fuga.", "Mi fido solo di me stesso.", "Non lascio mai tracce.", "Colleziono informazioni su tutti."],
    ideals: ["Libertà. Le leggi sono gabbie per gli stupidi.", "Ambizione. Prenderò tutto ciò che posso.", "Onore. Anche tra ladri esiste un codice.", "Anarchia. L'ordine è un'illusione."],
    bonds: ["Proteggo il mio vecchio compagno di cella.", "Devo ripagare un debito con qualcuno.", "Nascondo un bottino molto importante."],
    flaws: ["Se c'è un'opportunità, la prendo.", "Diffido di chiunque.", "Il denaro è la mia unica lealtà."]
  },
  folk_hero: {
    key: "folk_hero",
    name: "Eroe del Popolo",
    description: "Vieni da una modesta estrazione sociale ma hai compiuto un'impresa eroica che ti ha reso un simbolo per la gente comune.",
    skillProficiencies: ["skillAnimalHandling", "skillSurvival"],
    toolProficiencies: ["strumenti da artigiano a scelta", "veicoli (terrestri)"],
    languages: 0,
    equipment: ["strumenti da artigiano", "pala", "pentola di ferro", "vestiti comuni", "10 mo"],
    feature: {
      name: "Rusticità",
      description: "Puoi trovare rifugio presso contadini e gente comune. La gente del popolo ti riconosce e ti offre riparo."
    },
    personalityTraits: ["Giudico le persone dalle loro azioni, non dalle parole.", "Se qualcuno è in pericolo, intervengo sempre.", "Racconto storie del mio passato eroico.", "Lavoro sodo e mangio altrettanto."],
    ideals: ["Giustizia. I potenti devono proteggere i deboli.", "Coraggio. Non scappo mai di fronte al pericolo.", "Carità. Condivido ciò che ho con chi non ha nulla.", "Semplicità. La vita semplice è la migliore."],
    bonds: ["La mia famiglia è la cosa più importante.", "Il mio villaggio natale conta su di me.", "Ho una promessa da mantenere con un alleato caduto."],
    flaws: ["A volte mi fido delle persone sbagliate.", "Sono impulsivo e agisco senza pensare.", "Ho difficoltà a rifiutare una sfida."]
  },
  noble: {
    key: "noble",
    name: "Nobile",
    description: "Appartieni a una famiglia nobile, ricca e influente. Hai ricevuto un'educazione privilegiata e conosci le regole dell'aristocrazia.",
    skillProficiencies: ["skillHistory", "skillPersuasion"],
    toolProficiencies: ["strumenti da gioco a scelta"],
    languages: 1,
    equipment: ["vestiti pregiati", "sigillo nobiliare", "documenti genealogici", "borse da 25 mo"],
    feature: {
      name: "Posizione di Privilegio",
      description: "Grazie al tuo titolo nobiliare, puoi ottenere udienza presso altri nobili e figure influenti. Sei considerato parte dell'alta società."
    },
    personalityTraits: ["Mi offendo facilmente se non vengo trattato con il rispetto che merito.", "Tengo alla mia immagine e al mio aspetto.", "Conosco le regole del galateo e le seguo.", "Mi aspetto che gli altri mi servano."],
    ideals: ["Onore. Il nome della mia famiglia è tutto.", "Potere. L'influenza è la vera valuta.", "Responsabilità. Il privilegio comporta doveri.", "Tradizione. La nobiltà ha un codice da rispettare."],
    bonds: ["Difenderò l'onore della mia famiglia con ogni mezzo.", "Ho un rivale che devo superare.", "Il mio sangue mi obbliga a proteggere i miei sudditi."],
    flaws: ["Disprezzo chiunque sia di rango inferiore.", "Sono terribile con il denaro.", "Nascondo un segreto che potrebbe rovinare la mia famiglia."]
  },
  sage: {
    key: "sage",
    name: "Saggio",
    description: "Hai dedicato la vita allo studio e alla conoscenza. Sei un ricercatore, un bibliotecario o uno studioso che cerca la verità.",
    skillProficiencies: ["skillArcana", "skillHistory"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["boccetta d'inchiostro", "penna d'oca", "coltello da carta", "lettera da un collega defunto", "vestiti comuni", "10 mo"],
    feature: {
      name: "Ricercatore",
      description: "Se non conosci una informazione, sai dove trovarla. Puoi accedere a biblioteche, archivi e università per condurre ricerche."
    },
    personalityTraits: ["Faccio domande su tutto.", "Spesso mi perdo nei miei pensieri.", "Correggo gli errori altrui con precisione.", "Leggo ogni cosa su cui metto le mani."],
    ideals: ["Conoscenza. La verità è il bene più prezioso.", "Logica. Ogni problema ha una soluzione razionale.", "Scoperta. Il mondo è pieno di meraviglie da scoprire.", "Insegnamento. La conoscenza va condivisa."],
    bonds: ["Il mio mentore era un grande saggio; voglio essere all'altezza.", "Sto cercando un'antica conoscenza perduta.", "Un collega è scomparso misteriosamente."],
    flaws: ["A volte la mia logica mi rende insensibile.", "Sono distratto e dimentico le cose pratiche.", "Sottovaluto chi ha meno istruzione di me."]
  },
  soldier: {
    key: "soldier",
    name: "Soldato",
    description: "Hai servito in un esercito o in una milizia. Conosci la disciplina militare, le tattiche di gruppo e la realtà della guerra.",
    skillProficiencies: ["skillAthletics", "skillIntimidation"],
    toolProficiencies: ["strumenti da gioco a scelta", "veicoli (terrestri)"],
    languages: 0,
    equipment: ["uniforme", "emblema di grado", "strumenti da gioco", "5 mo"],
    feature: {
      name: "Grado Militare",
      description: "Il tuo passato militare ti dà autorità presso altri soldati. Puoi ottenere assistenza presso guarnigioni e avamposti militari."
    },
    personalityTraits: ["Sono sempre in allerta.", "Seguo gli ordini senza discutere.", "Pretendo disciplina dagli altri.", "Racconto storie di guerra."],
    ideals: ["Dovere. La mia parola è il mio vincolo.", "Onore. Non abbandono mai i miei compagni.", "Forza. La violenza risolve molti problemi.", "Patria. Ho giurato di proteggere il mio popolo."],
    bonds: ["I miei compagni d'arme sono la mia famiglia.", "Devo onorare la memoria di un caduto.", "Un ufficiale mi ha salvato la vita."],
    flaws: ["A volte risolvo i problemi troppo bruscamente.", "Ho difficoltà ad adattarmi alla vita civile.", "Porto rancore a lungo."]
  },
  urchin: {
    key: "urchin",
    name: "Monello",
    description: "Sei cresciuto per strada, sopravvivendo con l'astuzia e l'ingegno. Conosci ogni vicolo e nascondiglio della città.",
    skillProficiencies: ["skillSleightOfHand", "skillStealth"],
    toolProficiencies: ["strumenti da scasso"],
    languages: 0,
    equipment: ["piedi di porco", "corda", "cibo per topi", "carte della città", "pettine", "10 mo"],
    feature: {
      name: "Strada Maestra",
      description: "Puoi muoverti in città due volte più velocemente. Conosci la disposizione della città e i suoi nascondigli segreti."
    },
    personalityTraits: ["Conosco tutti i modi per sparire in una città.", "Colleziono cianfrusaglie e le considero tesori.", "Diffido degli sconosciuti.", "Dormo con un occhio aperto."],
    ideals: ["Sopravvivenza. Farò tutto ciò che serve per vivere.", "Comunità. I senzatetto sono la mia vera famiglia.", "Giustizia. I ricchi opprimono i poveri.", "Libertà. Nessuno mi dirà cosa fare."],
    bonds: ["Proteggo gli altri ragazzi di strada.", "Devo qualcosa a chi mi ha aiutato da piccolo.", "Un giorno vivrò in una casa vera."],
    flaws: ["Rubo senza pensarci.", "A volte esagero con le bugie per sopravvivere.", "Non chiedo mai aiuto, anche quando ne avrei bisogno."]
  },
  entertainer: {
    key: "entertainer",
    name: "Intrattenitore",
    description: "Vivi per il palcoscenico. Musica, danza, teatro o acrobazie: il tuo talento intrattiene e ispira.",
    skillProficiencies: ["skillAcrobatics", "skillPerformance"],
    toolProficiencies: ["strumento musicale a scelta", "kit da travestimento"],
    languages: 0,
    equipment: ["strumento musicale", "costume", "specchietto", "profumo", "vestiti", "15 mo"],
    feature: {
      name: "Pubblico Voglioso",
      description: "Puoi sempre trovare un luogo dove esibirti e guadagnare vitto e alloggio. Il tuo talento ti fa ricevere un trattamento speciale."
    },
    personalityTraits: ["Attiro l'attenzione ovunque vada.", "Trasformo ogni situazione in uno spettacolo.", "Parlo con gesti teatrali.", "Mi arrabbio se non sono al centro dell'attenzione."],
    ideals: ["Arte. La bellezza è l'unica cosa che conta.", "Fama. Il mio nome deve essere ricordato.", "Libertà. L'arte non ha regole.", "Gioia. Portare sorrisi è la mia missione."],
    bonds: ["Il mio strumento è la mia anima.", "Un rivale cerca di rovinare la mia reputazione.", "Devo tutto al mio vecchio mentore."],
    flaws: ["Esagero sempre per fare colpo.", "Spendo ogni moneta che guadagno.", "Non so stare in silenzio."]
  },
  guild_artisan: {
    key: "guild_artisan",
    name: "Artigiano di Gilda",
    description: "Fai parte di una gilda di artigiani o mercanti. La tua abilità in un mestiere specifico ti garantisce rispetto e una rete di contatti.",
    skillProficiencies: ["skillInsight", "skillPersuasion"],
    toolProficiencies: ["strumenti da artigiano a scelta"],
    languages: 1,
    equipment: ["strumenti da artigiano", "lettera di presentazione della gilda", "vestiti da viaggio", "15 mo"],
    feature: {
      name: "Appartenenza alla Gilda",
      description: "Come membro della gilda, puoi ottenere assistenza presso altre sedi della gilda. Hai accesso a strutture e informazioni riservate."
    },
    personalityTraits: ["Credo nel lavoro ben fatto.", "Conosco il valore di ogni cosa.", "Sono orgoglioso del mio mestiere.", "Tratto ogni transazione con serietà."],
    ideals: ["Artigianato. La qualità parla da sé.", "Commercio. Il denaro muove il mondo.", "Comunità. La gilda protegge i suoi membri.", "Innovazione. Bisogna sempre migliorare."],
    bonds: ["La mia gilda è la mia famiglia.", "Un rivale ha rubato i miei progetti.", "Devo completare un capolavoro per la gilda."],
    flaws: ["Valuto tutto in termini di denaro.", "Sono testardo e non cambio idea facilmente.", "Disprezzo il lavoro altrui."]
  },
  outlander: {
    key: "outlander",
    name: "Forestiero",
    description: "Sei cresciuto in terre selvagge, lontano dalla civiltà. Conosci le vie della natura e sopravvivi dove altri morirebbero.",
    skillProficiencies: ["skillAthletics", "skillSurvival"],
    toolProficiencies: ["strumento musicale a scelta"],
    languages: 1,
    equipment: ["bastone", "trappola da caccia", "trofeo animale", "vestiti da viaggio", "10 mo"],
    feature: {
      name: "Esploratore",
      description: "Hai un'ottima memoria per le mappe e la geografia. Puoi sempre ricordare la posizione generale di luoghi, fonti d'acqua e pericoli naturali."
    },
    personalityTraits: ["Parlo poco ma osservo tutto.", "Preferisco dormire sotto le stelle.", "Sono a disagio tra la folla.", "Seguo il cibo e le stagioni."],
    ideals: ["Natura. La natura è pura, la civiltà corrompe.", "Libertà. Non ci sono catene nella natura selvaggia.", "Sopravvivenza. I forti sopravvivono, i deboli no.", "Scoperta. L'orizzonte è sempre oltre."],
    bonds: ["La mia terra natale è minacciata.", "Proteggo un'area selvaggia sacra.", "Cerco una creatura leggendaria."],
    flaws: ["Diffido della civiltà e delle sue regole.", "A volte sono troppo diretto e scortese.", "Ho un nemico tra i cacciatori di taglie."]
  },
  hermit: {
    key: "hermit",
    name: "Eremita",
    description: "Hai vissuto in isolamento per anni, dedicandoti alla contemplazione, alla preghiera o alla ricerca di conoscenza.",
    skillProficiencies: ["skillMedicine", "skillReligion"],
    toolProficiencies: ["kit da erborista"],
    languages: 1,
    equipment: ["coperta", "kit da erborista", "diario", "candela", "vestiti comuni", "5 mo"],
    feature: {
      name: "Rivelazione",
      description: "Durante il tuo isolamento hai avuto una rivelazione o scoperto una verità importante. Puoi usare questo per orientare le tue azioni."
    },
    personalityTraits: ["Parlo raramente e solo quando necessario.", "Spesso rifletto ad alta voce.", "Non capisco le usanze sociali.", "Vedo connessioni che altri non vedono."],
    ideals: ["Conoscenza. La verità interiore è la più importante.", "Pace. Il silenzio è la più grande ricchezza.", "Illuminazione. Cerco uno stato superiore di coscienza.", "Protezione. Devo condividere ciò che ho scoperto."],
    bonds: ["La mia rivelazione deve essere protetta.", "Cerco un allievo a cui insegnare.", "Un segreto mi è stato affidato."],
    flaws: ["A volte dico verità scomode.", "Non capisco il sarcasmo o le battute.", "Sono ipersensibile al rumore e al caos."]
  },
  sailor: {
    key: "sailor",
    name: "Marinaio",
    description: "Hai navigato i mari, conosci le tempeste e le calme. La vita sul mare ti ha reso robusto e pratico.",
    skillProficiencies: ["skillAthletics", "skillPerception"],
    toolProficiencies: ["veicoli (marini)", "strumenti da navigatore"],
    languages: 0,
    equipment: ["corda", "canna da pesca", "trofeo marino", "vestiti comuni", "10 mo"],
    feature: {
      name: "Passaggio Gratuito",
      description: "Puoi sempre trovare un passaggio su una nave mercantile o da pesca in cambio di lavoro. Puoi navigare gratuitamente."
    },
    personalityTraits: ["Mi adatto a qualsiasi situazione.", "Racconto storie incredibili di viaggi.", "Soffro di vertigini quando sono a terra.", "Ho una maledizione o superstizione preferita."],
    ideals: ["Avventura. Ogni porto è una nuova opportunità.", "Equipaggio. La nave è la tua casa, l'equipaggio la famiglia.", "Libertà. Il mare non ha confini né catene.", "Esplorazione. Oltre l'orizzonte c'è sempre qualcosa."],
    bonds: ["La mia nave era la mia vera casa.", "Devo qualcosa a un vecchio capitano.", "Un tesoro è nascosto in un'isola lontana."],
    flaws: ["Spesso bevo troppo.", "Non so stare fermo per molto.", "Ho un nemico in ogni porto."]
  },
};

export default backgrounds;

export function getBackgroundData(key: string): BackgroundData | undefined {
  return backgrounds[key];
}

export function findBackgroundKey(name: string): string | undefined {
  const lower = name.toLowerCase().trim();
  if (backgrounds[lower]) return lower;
  for (const [k, v] of Object.entries(backgrounds)) {
    if (v.name.toLowerCase() === lower) return k;
  }
  return undefined;
}
