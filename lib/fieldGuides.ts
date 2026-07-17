export type FieldGuideEntry = {
  key: string;
  label: string;
  guide: string;
  placeholder?: string;
};

export const abilityGuides: FieldGuideEntry[] = [
  { key: "strength", label: "Forza (FOR)", guide: "Misura la potenza fisica, l'allenamento e la capacità di sollevare pesi. Usata per colpire in mischia, atletica, sfondare porte.", placeholder: "10" },
  { key: "dexterity", label: "Destrezza (DES)", guide: "Misura agilità, riflessi e coordinazione. Usata per iniziativa, CA, acrobazia, furtività, armi a distanza.", placeholder: "10" },
  { key: "constitution", label: "Costituzione (COS)", guide: "Misura salute e resistenza. Determina i PF bonus per livello, resistenza a veleni e concentrazione.", placeholder: "10" },
  { key: "intelligence", label: "Intelligenza (INT)", guide: "Misura memoria e ragionamento. Usata per indagare, arcano, storia, natura, religione. Chiave per maghi.", placeholder: "10" },
  { key: "wisdom", label: "Saggezza (SAG)", guide: "Misura percezione, intuizione e volontà. Usata per percepire trappole, intuire bugie, sopravvivenza. Chiave per chierici.", placeholder: "10" },
  { key: "charisma", label: "Carisma (CAR)", guide: "Misura forza di personalità. Usata per persuadere, ingannare, intimidire. Chiave per bardi e warlock.", placeholder: "10" },
];

export const savingThrowGuides: FieldGuideEntry[] = [
  { key: "stStrength", label: "FOR", guide: "Tiro salvezza di Forza — usato per resistere a spintoni, cadute, effetti che ti trattengono fisicamente." },
  { key: "stDexterity", label: "DES", guide: "Tiro salvezza di Destrezza — usato per schivare esplosioni, soffi di drago, trappole." },
  { key: "stConstitution", label: "COS", guide: "Tiro salvezza di Costituzione — usato per resistere a veleni, malattie, concentrazione magica." },
  { key: "stIntelligence", label: "INT", guide: "Tiro salvezza di Intelligenza — usato per resistere a illusioni mentali e attacchi psionici." },
  { key: "stWisdom", label: "SAG", guide: "Tiro salvezza di Saggezza — usato per resistere a incantesimi di controllo, paura, fascinazione." },
  { key: "stCharisma", label: "CAR", guide: "Tiro salvezza di Carisma — usato per resistere a esilio, possessione, effetti planari." },
];

export const skillGuides: FieldGuideEntry[] = [
  { key: "skillAthletics", label: "Atletica (FOR)", guide: "Arrampicarsi, saltare, nuotare, lottare, spingere." },
  { key: "skillAcrobatics", label: "Acrobazia (DES)", guide: "Mantenere l'equilibrio, fare capriole, cadere con grazia." },
  { key: "skillSleightOfHand", label: "Rapidità di Mano (DES)", guide: "Scassinare serrature, borseggiare, nascondere oggetti addosso." },
  { key: "skillStealth", label: "Furtività (DES)", guide: "Muoversi in silenzio, nascondersi, evitare di essere notati." },
  { key: "skillArcana", label: "Arcano (INT)", guide: "Conoscenza di magia, incantesimi, oggetti magici, rune." },
  { key: "skillHistory", label: "Storia (INT)", guide: "Conoscenza di eventi passati, regni antichi, leggende." },
  { key: "skillInvestigation", label: "Indagare (INT)", guide: "Cercare indizi, trovare trappole nascoste, analizzare dettagli." },
  { key: "skillNature", label: "Natura (INT)", guide: "Conoscenza di animali, piante, clima, geografia." },
  { key: "skillReligion", label: "Religione (INT)", guide: "Conoscenza di divinità, culti, simboli sacri, piani divini." },
  { key: "skillAnimalHandling", label: "Addestrare Animali (SAG)", guide: "Calmare animali, cavalcare, convincere una bestia a collaborare." },
  { key: "skillInsight", label: "Intuizione (SAG)", guide: "Capire le intenzioni di qualcuno, percepire bugie, leggere le emozioni." },
  { key: "skillMedicine", label: "Medicina (SAG)", guide: "Stabilizzare morenti, diagnosticare malattie, preparare rimedi." },
  { key: "skillPerception", label: "Percezione (SAG)", guide: "Notare cose nascoste, sentire rumori lontani, vedere nel buio." },
  { key: "skillSurvival", label: "Sopravvivenza (SAG)", guide: "Seguire tracce, accamparsi, trovare cibo, orientarsi." },
  { key: "skillDeception", label: "Inganno (CAR)", guide: "Mentire, travestirsi, nascondere le proprie vere intenzioni." },
  { key: "skillIntimidation", label: "Intimidire (CAR)", guide: "Minacciare, fare pressione, incutere timore." },
  { key: "skillPerformance", label: "Intrattenere (CAR)", guide: "Suonare, cantare, recitare, intrattenere un pubblico." },
  { key: "skillPersuasion", label: "Persuasione (CAR)", guide: "Convincere qualcuno con argomenti logici o fascino." },
];

export const combatGuides: FieldGuideEntry[] = [
  { key: "armorClass", label: "CA (Classe Armatura)", guide: "Quanto è difficile colpirti. Si calcola da armatura + DES (+ scudo). Più alto è, meglio è.", placeholder: "10" },
  { key: "initiative", label: "Iniziativa", guide: "Chi agisce prima in combattimento. = d20 + DES. Modificatori esterni possono aggiungere bonus.", placeholder: "0" },
  { key: "speed", label: "Velocità", guide: "Quanti piedi puoi muovere in un turno. Umano 30ft, Nano 25ft, Elfo 30ft.", placeholder: "30" },
  { key: "proficiencyBonus", label: "Bonus Competenza", guide: "Bonus che aggiungi a tutto ciò in cui sei competente. Liv 1-4: +2, 5-8: +3, 9-12: +4.", placeholder: "2" },
  { key: "inspiration", label: "Ispirazione", guide: "Il DM te la concede quando fai qualcosa di eroico o in linea col tuo personaggio. Dà vantaggio su un tiro." },
];

export const hpGuides: FieldGuideEntry[] = [
  { key: "hp_max", label: "PF Massimi", guide: "Punti Ferita massimi. Dipende da classe, livello e COS.", placeholder: "10" },
  { key: "hp_current", label: "PF Correnti", guide: "Punti Ferita attuali. Se arrivano a 0, il personaggio è privo di sensi." },
  { key: "temp_hp", label: "PF Temporanei", guide: "PF extra temporanei (da incantesimi o abilità). Non si cumulano, si prendono i più alti." },
  { key: "hitDiceTotal", label: "Dadi Vita", guide: "Dadi usati per recuperare PF durante un riposo. Es: Guerriero lv3 = 3d10.", placeholder: "1d8" },
  { key: "deathSaveSuccesses", label: "Tiri Morte - Successi", guide: "Quando sei a 0 PF, tiri d20 ogni turno. 3 successi = stabile. 10+ = successo." },
  { key: "deathSaveFailures", label: "Tiri Morte - Fallimenti", guide: "3 fallimenti = morte. 1 naturale = 2 fallimenti. 20 naturale = 1 PF." },
];

export const attackGuides: FieldGuideEntry[] = [
  { key: "attack_name", label: "Nome", guide: "Nome dell'arma o dell'incantesimo che usi per attaccare." },
  { key: "attack_bonus", label: "Bonus per colpire", guide: "d20 + modificatore caratteristica + bonus competenza (se competente)." },
  { key: "attack_damage", label: "Danno/Tipo", guide: "Dadi di danno + modificatore. Es: 1d8+3 tagliente." },
];

export const spellGuides: FieldGuideEntry[] = [
  { key: "spellcastingAbility", label: "Caratteristica Incantatore", guide: "La caratteristica usata per lanciare incantesimi. INT (Mago), SAG (Chierico), CAR (Bardo/Warlock)." },
  { key: "spellSaveDC", label: "CD Tiro Salvezza", guide: "CD che i nemici devono superare contro i tuoi incantesimi. = 8 + bonus competenza + modificatore." },
  { key: "spellAttackBonus", label: "Bonus Attacco Incantesimi", guide: "Bonus per colpire con incantesimi a distanza. = bonus competenza + modificatore caratteristica." },
];

export const personalityGuides: FieldGuideEntry[] = [
  { key: "personalityTraits", label: "Tratti Personalità", guide: "Cosa rende unico il tuo personaggio? Abitudini, modi di fare, frasi tipiche." },
  { key: "ideals", label: "Ideali", guide: "Cosa è più importante per il tuo personaggio? Giustizia, libertà, potere, conoscenza?" },
  { key: "bonds", label: "Legami", guide: "A chi o a cosa è legato il tuo personaggio? Famiglia, amici, patria, divinità." },
  { key: "flaws", label: "Difetti", guide: "Qual è la più grande debolezza del tuo personaggio? Paura, vizio, segreto, orgoglio." },
  { key: "history", label: "Storia", guide: "Il passato del tuo personaggio. Da dove viene? Cosa ha vissuto prima di diventare un avventuriero?" },
];

export const appearanceGuides: FieldGuideEntry[] = [
  { key: "age", label: "Età", guide: "Quanti anni ha il personaggio. Dipende dalla razza (elfi 100+ anni, umani 20-40).", placeholder: "25" },
  { key: "height", label: "Altezza", guide: "Quanto è alto il personaggio. Es: 170cm o 5'8\"." },
  { key: "weight", label: "Peso", guide: "Quanto pesa il personaggio in kg o libbre." },
  { key: "eyes", label: "Occhi", guide: "Colore e forma degli occhi. Blu, verdi, ambrati, luminosi..." },
  { key: "skin", label: "Pelle", guide: "Colore e texture della pelle. Chiara, scura, bronzea, squamosa..." },
  { key: "hair", label: "Capelli", guide: "Colore, lunghezza e stile dei capelli." },
];

export const extraGuides: FieldGuideEntry[] = [
  { key: "languages", label: "Linguaggi", guide: "Quali lingue conosce il tuo personaggio? Comune, Elfico, Nano, Draconico, ecc." },
  { key: "otherProficiencies", label: "Altre Competenze", guide: "Armi, armature, strumenti, veicoli in cui sei competente." },
  { key: "allies", label: "Alleati e Organizzazioni", guide: "Persone, fazioni o gruppi amici del personaggio." },
  { key: "treasure", label: "Tesoro", guide: "Oggetti di valore o tesori speciali trovati durante le avventure." },
];

export const wizardSteps = [
  {
    id: "info-base",
    title: "Info Base",
    desc: "Iniziamo con le informazioni fondamentali del tuo personaggio.",
    fields: ["character_name", "race", "class", "level", "background", "alignment", "xp"],
    guide: "Queste sono le basi: chi è il tuo personaggio, cosa sa fare, da dove viene e come si comporta moralmente."
  },
  {
    id: "abilita",
    title: "Caratteristiche",
    desc: "I 6 punteggi che definiscono il tuo personaggio.",
    fields: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
    guide: "Ogni caratteristica ha un punteggio (3-20) e un modificatore. Il modificatore si usa per la maggior parte dei tiri."
  },
  {
    id: "tiri-salvezza",
    title: "Tiri Salvezza",
    desc: "Segna in quali tiri salvezza sei competente (dipende dalla classe).",
    fields: ["stStrength", "stDexterity", "stConstitution", "stIntelligence", "stWisdom", "stCharisma"],
    guide: "La tua classe ti dà competenza in 2 tiri salvezza. Se sei competente, aggiungi il bonus competenza."
  },
  {
    id: "skills",
    title: "Abilità",
    desc: "Segna in quali abilità sei competente (dipende da classe e background).",
    fields: ["skillAthletics", "skillAcrobatics", "skillSleightOfHand", "skillStealth", "skillArcana", "skillHistory", "skillInvestigation", "skillNature", "skillReligion", "skillAnimalHandling", "skillInsight", "skillMedicine", "skillPerception", "skillSurvival", "skillDeception", "skillIntimidation", "skillPerformance", "skillPersuasion"],
    guide: "Scegli le abilità in cui sei competente. Il numero dipende dalla classe e dal background."
  },
  {
    id: "combattimento",
    title: "Combattimento",
    desc: "CA, Iniziativa, Velocità e bonus vari.",
    fields: ["armorClass", "initiative", "speed", "proficiencyBonus"],
    guide: "La CA (Classe Armatura) protegge dai colpi. L'iniziativa decide l'ordine di turno. La velocità è quanto puoi muovere."
  },
  {
    id: "hp",
    title: "Punti Ferita",
    desc: "Salute, dadi vita e tiri salvezza contro la morte.",
    fields: ["hp_max", "hp_current", "temp_hp", "hitDiceTotal"],
    guide: "I PF (Punti Ferita) rappresentano la tua salute. I Dadi Vita servono per recuperare durante i riposi."
  },
  {
    id: "attacchi",
    title: "Attacchi",
    desc: "Le armi e gli incantesimi che usi in combattimento.",
    fields: ["attacks"],
    guide: "Registra le tue armi principali con bonus per colpire e danno. Se lanci incantesimi, registra anche i dati di incantatore."
  },
  {
    id: "personalita",
    title: "Personalità",
    desc: "Cosa rende unico il tuo personaggio.",
    fields: ["personalityTraits", "ideals", "bonds", "flaws"],
    guide: "Tratti, ideali, legami e difetti danno profondità al personaggio e aiutano il DM a creare storie coinvolgenti."
  },
  {
    id: "aspetto",
    title: "Aspetto",
    desc: "Come appare fisicamente il tuo personaggio.",
    fields: ["age", "height", "weight", "eyes", "skin", "hair"],
    guide: "Descrivi l'aspetto fisico del tuo personaggio. Non serve essere troppo dettagliati, basta dargli un'immagine."
  },
  {
    id: "extra",
    title: "Extra",
    desc: "Linguaggi, competenze extra e note finali.",
    fields: ["languages", "otherProficiencies", "allies", "treasure"],
    guide: "Linguaggi, competenze extra, alleati e tesori completano il quadro del tuo personaggio."
  }
];

export const baseGuides: FieldGuideEntry[] = [
  { key: "character_name", label: "Nome", guide: "Il nome del tuo personaggio. Scegli un nome che si adatti al mondo di gioco e alla sua cultura d'origine.", placeholder: "Eldrin" },
  { key: "race", label: "Razza", guide: "La razza del tuo personaggio. Influenza caratteristiche, abilità e tratti speciali. Umano, Elfo, Nano, Halfling, ecc.", placeholder: "Elfo" },
  { key: "class", label: "Classe", guide: "La classe determina le capacità principali del personaggio: combattimento, magia, furtività. Scegli in base al ruolo che vuoi interpretare.", placeholder: "Guerriero" },
  { key: "level", label: "Livello", guide: "Il livello del personaggio. Si parte da 1. Ogni livello sblocca nuovi talenti, incantesimi e bonus.", placeholder: "1" },
  { key: "background", label: "Background", guide: "La storia pre-avventura del personaggio. Soldato, Accolito, Criminale, Nobile... Fornisce competenze e tratti di personalità.", placeholder: "Soldato" },
  { key: "alignment", label: "Allineamento", guide: "La bussola morale del personaggio. Legale/Neutrale/Caotico incrociato con Buono/Neutrale/Malvagio. Es: Legale Buono, Caotico Neutrale." },
  { key: "xp", label: "Punti Esperienza", guide: "Accumulati durante le avventure. Servono a salire di livello. Tabella: lv2=300, lv3=900, lv4=2700 XP.", placeholder: "0" },
  { key: "goals", label: "Obiettivo", guide: "Cosa vuole raggiungere il personaggio? Un obiettivo personale che guida le sue azioni durante la campagna." },
  { key: "fear", label: "Paura", guide: "La più grande paura del personaggio. Può essere sfruttata dal DM per creare momenti di tensione narrativa." },
  { key: "important_person", label: "Persona importante", guide: "Qualcuno di significativo nella vita del personaggio: mentore, amico, familiare, amore." },
  { key: "secret", label: "Segreto", guide: "Qualcosa che il personaggio nasconde agli altri. Può emergere durante il gioco." },
  { key: "history", label: "Storia", guide: "Il passato del personaggio. Da dove viene, cosa ha vissuto, cosa l'ha portato a diventare un avventuriero." },
  { key: "age", label: "Età", guide: "Età anagrafica del personaggio. Varia molto in base alla razza: elfi 100+ anni, umani 20-40, nani 50+.", placeholder: "25" },
  { key: "coins", label: "Monete", guide: "Quantità totale di monete in possesso. Il DM potrebbe chiederti di specificare il tipo (PP/GP/PE/SP/CP).", placeholder: "0" },
  { key: "conditions", label: "Condizioni", guide: "Stati alterati del personaggio: Avvelenato, Paralizzato, Spaventato, Accecato, ecc. Gestite dal DM automaticamente." },
  { key: "personality", label: "Personalità", guide: "Note generali sulla personalità del personaggio. Comportamento, atteggiamento, abitudini." },
];

export const getGuide = (key: string): FieldGuideEntry | undefined => {
  const all = [...baseGuides, ...abilityGuides, ...savingThrowGuides, ...skillGuides, ...combatGuides, ...hpGuides, ...attackGuides, ...spellGuides, ...personalityGuides, ...appearanceGuides, ...extraGuides];
  return all.find(g => g.key === key);
};
