/* ── D&D 5e Leveling data (PHB) ─────────────────────────────────────
   Tabella XP, slot incantesimi, incantesimi conosciuti, trucchetti,
   livelli ASI e feature per livello delle 12 classi del PHB.
*/

export type ClassFeature = { level: number; name: string; description: string };

/* XP necessaria per raggiungere il livello (indice 0 = livello 1) */
export const XP_TABLE: number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

export function xpForLevel(level: number): number {
  return XP_TABLE[Math.max(0, Math.min(19, level - 1))] ?? 0;
}

export function levelFromXp(xp: number): number {
  let lv = 1;
  for (let i = 0; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) lv = i + 1;
  }
  return lv;
}

/* Slot incantesimi per livello di classe.
   FULL = bardo, chierico, druido, stregone, mago
   HALF = paladino, ranger
   WARLOCK = warlock (slot sempre di livello massimo)
*/
export const SPELL_SLOTS_FULL: Record<number, number[]> = {
  1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
  6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1], 15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1], 17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1], 19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

export const SPELL_SLOTS_HALF: Record<number, number[]> = {
  1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2], 6: [4, 2], 7: [4, 3], 8: [4, 3],
  9: [4, 3, 2], 10: [4, 3, 2], 11: [4, 3, 3], 12: [4, 3, 3], 13: [4, 3, 3, 1],
  14: [4, 3, 3, 1], 15: [4, 3, 3, 2], 16: [4, 3, 3, 2], 17: [4, 3, 3, 3],
  18: [4, 3, 3, 3], 19: [4, 3, 3, 3], 20: [4, 3, 3, 3, 1],
};

export const SPELL_SLOTS_WARLOCK: Record<number, number[]> = {
  1: [1], 2: [2], 3: [2], 4: [2], 5: [2], 6: [2], 7: [2], 8: [2], 9: [2], 10: [2],
  11: [3], 12: [3], 13: [3], 14: [3], 15: [3], 16: [3], 17: [4], 18: [4], 19: [4], 20: [4],
};

export const WARLOCK_SLOT_LEVEL: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5,
  11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5,
};

/* Trucchetti conosciuti per livello (indice = livello-1) */
export const CANTRIPS_KNOWN: Record<string, number[]> = {
  bard: [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
};

/* Incantesimi conosciuti per livello (indice = livello-1).
   Chierico/Druido/Paladino/Mago preparano: limiti = mod caratteristica + livello. */
export const SPELLS_KNOWN: Record<string, number[]> = {
  bard: [4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16],
  ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
};

/* Livelli in cui si ottiene ASI (o talento) */
export const ASI_LEVELS: Record<string, number[]> = {
  fighter: [4, 6, 8, 12, 14, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19],
  default: [4, 8, 12, 16, 19],
};

export function getAsiLevels(classKey: string): number[] {
  return ASI_LEVELS[classKey] || ASI_LEVELS.default;
}

export function getSpellSlotsAtLevel(classKey: string, level: number): Record<number, number> {
  const out: Record<number, number> = {};
  if (classKey === "warlock") {
    const count = SPELL_SLOTS_WARLOCK[level]?.[0] || 0;
    if (count > 0) out[WARLOCK_SLOT_LEVEL[level] || 1] = count;
    return out;
  }
  let arr: number[] = [];
  if (["paladin", "ranger"].includes(classKey)) arr = SPELL_SLOTS_HALF[level] || [];
  else if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(classKey)) arr = SPELL_SLOTS_FULL[level] || [];
  arr.forEach((n, i) => { if (n > 0) out[i + 1] = n; });
  return out;
}

export function getCantripsKnown(classKey: string, level: number): number {
  return CANTRIPS_KNOWN[classKey]?.[Math.max(0, level - 1)] ?? 0;
}

export function getSpellsKnownLimit(classKey: string, level: number): number {
  return SPELLS_KNOWN[classKey]?.[Math.max(0, level - 1)] ?? 0;
}

/* ── Feature per livello (PHB, concise) ─────────────────────────── */

export const CLASS_FEATURES: Record<string, ClassFeature[]> = {
  barbarian: [
    { level: 1, name: "Ira", description: "Entri in ira per 1 minuto: vantaggio su prove di FOR e tiri di forza, +2 danni in mischia, resistenza a contundente/perforante/tagliente. 2 usi per riposo lungo." },
    { level: 1, name: "Difesa Senza Armatura", description: "CA = 10 + mod DES + mod COS mentre non indossi armatura." },
    { level: 2, name: "Attacco Avventato", description: "Durante la tua Ira puoi ottenere vantaggio sugli attacchi in mischia, ma i nemici hanno vantaggio su di te." },
    { level: 2, name: "Percezione del Pericolo", description: "Vantaggio sui tiri salvezza di DES contro effetti visibili (trappole, incantesimi)." },
    { level: 3, name: "Privilegio del Selvaggio", description: "Scegli un percorso primitivo (archetipo) che ti dà nuove abilità." },
    { level: 5, name: "Attacco Extra", description: "Puoi attaccare due volte quando usi l'Azione di Attacco." },
    { level: 5, name: "Movimento Veloce", description: "La tua velocità aumenta di 3m mentre non indossi armatura pesante." },
    { level: 7, name: "Istinto Selvaggio", description: "Vantaggio sull'iniziativa e puoi entrare in Ira nel primo turno di combattimento." },
    { level: 9, name: "Critico Brutale", description: "Tiri un dado danno extra quando ottieni un colpo critico." },
    { level: 11, name: "Ira Incessante", description: "Se scendi a 0 PF durante l'Ira, puoi fare un tiro salvezza di COS DC 10 per restare a 1 PF." },
    { level: 14, name: "Ira Persistente", description: "La tua Ira termina solo se sei incosciente o se termini volontariamente." },
    { level: 15, name: "Critico Brutale (migliorato)", description: "Tiri due dadi danno extra sui colpi critici." },
    { level: 18, name: "Istinto Indomabile", description: "Se il risultato di una prova di FOR è inferiore al tuo punteggio di FOR, usi il tuo punteggio." },
    { level: 20, name: "Campione Primordiale", description: "+4 FOR e +4 COS (max 24)." },
  ],
  bard: [
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando CAR come caratteristica da incantatore." },
    { level: 1, name: "Ispirazione Bardica (d6)", description: "Azione bonus: concedi a un alleato un d6 da aggiungere a una prova, tiro salvezza o attacco entro 10 minuti." },
    { level: 2, name: "Padronanza", description: "Aggiungi metà del bonus di competenza (arrotondato per difetto) a tutte le prove con abilità in cui non sei competente." },
    { level: 2, name: "Canto del Riposo", description: "Durante un riposo breve puoi suonare per alleati: ciascuno può tirare un dado extra (d6) per recuperare PF." },
    { level: 3, name: "Collegio Bardico", description: "Scegli un collegio (archetipo) che ti dà nuove capacità." },
    { level: 5, name: "Ispirazione Bardica (d8)", description: "Il tuo dado ispirazione diventa d8." },
    { level: 5, name: "Fonte di Ispirazione", description: "Recuperi tutti i dadi di ispirazione usati dopo un riposo breve o lungo." },
    { level: 6, name: "Controincantesimo", description: "Puoi usare la tua reazione per fare una prova di CAR (CD 10 + livello incantesimo) per annullare un incantesimo avversario." },
    { level: 6, name: "Segreti Magici", description: "Scegli due incantesimi da qualsiasi classe e li aggiungi alla tua lista." },
    { level: 9, name: "Ispirazione Bardica (d10)", description: "Il tuo dado ispirazione diventa d10." },
    { level: 10, name: "Padronanza Migliorata", description: "Padronanza vale ora anche per iniziativa e tiri salvezza non competenti." },
    { level: 10, name: "Segreti Magici (2)", description: "Scegli altri due incantesimi da qualsiasi classe." },
    { level: 14, name: "Segreti Magici (3)", description: "Scegli altri due incantesimi da qualsiasi classe." },
    { level: 15, name: "Ispirazione Bardica (d12)", description: "Il tuo dado ispirazione diventa d12." },
    { level: 18, name: "Segreti Magici (4)", description: "Scegli altri due incantesimi da qualsiasi classe." },
    { level: 20, name: "Ispirazione Superiore", description: "Quando tiri iniziativa e non hai usi di ispirazione, ne ottieni uno gratis." },
  ],
  cleric: [
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando SAG come caratteristica da incantatore. Prepari un numero di incantesimi pari a SAG mod + livello." },
    { level: 1, name: "Dominio Divino", description: "Scegli un dominio (archetipo): ottieni competenze e incantesimi del dominio." },
    { level: 2, name: "Incanalare Divinità (1)", description: "Puoi incanalare il potere divino della tua divinità per usare l'effetto del tuo dominio. 1 uso per riposo breve/lungo." },
    { level: 3, name: "Destruggi Non-Morti", description: "Usando Incanalare Divinità, i non-morti con CR 1/2 o inferiore entro 9m vengono distrutti." },
    { level: 5, name: "Distruzione (CR 1/2)", description: "Il limite del tuo Destruggi Non-Morti sale a CR 1/2." },
    { level: 6, name: "Incanalare Divinità (2)", description: "Ottieni un secondo uso di Incanalare Divinità per riposo." },
    { level: 8, name: "Distruzione (CR 1)", description: "Il limite del tuo Destruggi Non-Morti sale a CR 1." },
    { level: 10, name: "Intervento Divino (10%)", description: "Chiedi alla tua divinità di intervenire: 10% di probabilità che l'effetto si verifichi." },
    { level: 11, name: "Distruzione (CR 2)", description: "Il limite del tuo Destruggi Non-Morti sale a CR 2." },
    { level: 13, name: "Incanalare Divinità (3)", description: "Ottieni un terzo uso di Incanalare Divinità per riposo." },
    { level: 14, name: "Distruzione (CR 3)", description: "Il limite del tuo Destruggi Non-Morti sale a CR 3." },
    { level: 17, name: "Incanalare Divinità (4)", description: "Ottieni un quarto uso di Incanalare Divinità per riposo." },
    { level: 18, name: "Intervento Divino (migliorato)", description: "La probabilità di intervento sale al 100%." },
    { level: 20, name: "Intervento Divino (garantito)", description: "Una volta ogni 7 giorni, la tua divinità risponde sempre." },
  ],
  druid: [
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando SAG come caratteristica da incantatore. Prepari un numero pari a SAG mod + livello." },
    { level: 1, name: "Druidico", description: "Parli la lingua druidica e capisci i segni dei druidi." },
    { level: 2, name: "Forma Selvatica (CR 1/4)", description: "Azione bonus: ti trasformi in una bestia con CR 1/4 o inferiore senza volo. 2 usi per riposo breve/lungo." },
    { level: 2, name: "Cerchio Druidico", description: "Scegli un cerchio (archetipo) che ti dà nuove capacità." },
    { level: 4, name: "Forma Selvatica (CR 1/2)", description: "Puoi trasformarti in bestie con CR 1/2, inclusi nuotatori." },
    { level: 6, name: "Forma Selvatica (CR 1)", description: "Puoi trasformarti in bestie con CR 1 o inferiore." },
    { level: 8, name: "Forma Selvatica (migliorata)", description: "Puoi trasformarti in bestie con CR 1 e senza le restrizioni sul volo." },
    { level: 10, name: "Forma Elementale", description: "Puoi spendere 2 usi per trasformarti in un elementale." },
    { level: 18, name: "Forme Innumerovoli", description: "Puoi trasformarti in un nuovo animale ogni volta che vuoi senza consumare usi, finché hai PF." },
    { level: 20, name: "Archidruido", description: "Forma Selvatica non ha limiti di uso e puoi ignorare le componenti materiali incantatorie." },
  ],
  fighter: [
    { level: 1, name: "Stile di Combattimento", description: "Scegli uno stile: Combattimento con Armi (ripeti 1-2 sui dadi), Difesa (+1 CA), Duello (+2 danni a una mano) o altri." },
    { level: 1, name: "Secondo Soffio", description: "Azione bonus: recuperi 1d10 + livello PF. 1 uso per riposo breve/lungo." },
    { level: 2, name: "Azione Impetuosa", description: "Una volta per riposo breve/lungo puoi compiere un'azione extra nel tuo turno." },
    { level: 3, name: "Archetipo Combattente", description: "Scegli un archetipo (arciere, cavaliere, maestro d'armi...) che ti dà nuove capacità." },
    { level: 5, name: "Attacco Extra", description: "Puoi attaccare due volte quando usi l'Azione di Attacco." },
    { level: 9, name: "Indomito (1)", description: "Ritiri un tiro salvezza fallito. 1 uso per riposo lungo." },
    { level: 11, name: "Attacco Extra (2)", description: "Puoi attaccare tre volte quando usi l'Azione di Attacco." },
    { level: 13, name: "Indomito (2)", description: "Ottieni un secondo uso di Indomito per riposo lungo." },
    { level: 17, name: "Attacco Extra (3)", description: "Puoi attaccare quattro volte quando usi l'Azione di Attacco." },
    { level: 17, name: "Azione Impetuosa (2)", description: "Ottieni un secondo uso di Azione Impetuosa per riposo." },
    { level: 18, name: "Indomito (3)", description: "Ottieni un terzo uso di Indomito per riposo lungo." },
  ],
  monk: [
    { level: 1, name: "Arti Marziali", description: "Puoi usare DES per attacchi in mischia e il danno non armato diventa 1d4. Attacco senz'armi come azione bonus." },
    { level: 2, name: "Ki", description: "Ottieni punti Ki pari al livello. Usi: attacco extra (1), schivata pazza (1), passo del vento (1) ecc." },
    { level: 2, name: "Movimento Senza Armatura", description: "La tua velocità aumenta di 3m finché non indossi armatura." },
    { level: 3, name: "Tradizione Monastica", description: "Scegli una tradizione (archetipo) che ti dà nuove capacità." },
    { level: 3, name: "Deflessione Missili", description: "Reazione: riduci il danno di un proiettile di 1d10 + DES mod + livello." },
    { level: 4, name: "Caduta Lenta", description: "Riduci i danni da caduta usando la tua reazione." },
    { level: 5, name: "Attacco Extra", description: "Puoi attaccare due volte quando usi l'Azione di Attacco." },
    { level: 5, name: "Colpo Stordente", description: "Spendi 1 Ki dopo un colpo per forzare il nemico a un TS di COS o essere stordito." },
    { level: 7, name: "Evasione", description: "Un TS di DES riuscito = nessun danno; fallito = metà danno." },
    { level: 7, name: "Tranquillità Interiore", description: "Con un'azione puoi terminare un effetto che ti rende affascinato o spaventato." },
    { level: 9, name: "Miglioramento Arti Marziali", description: "Il danno delle arti marziali aumenta a 1d6." },
    { level: 10, name: "Purezza del Corpo", description: "Immune a malattia e avvelenamento." },
    { level: 13, name: "Lingua del Sole e della Luna", description: "Comprendi tutte le lingue parlate e ogni creatura comprende le tue." },
    { level: 14, name: "Anima di Diamante", description: "Competenza in tutti i tiri salvezza." },
    { level: 15, name: "Corpo Senza Tempo", description: "Non soffri gli effetti dell'invecchiamento e non servi cibo né acqua." },
    { level: 18, name: "Vuoto Interiore", description: "Immune a danni contundenti/perforanti/taglianti." },
    { level: 20, name: "Perfezione Corporea", description: "+4 DES e +4 SAG (max 24)." },
  ],
  paladin: [
    { level: 1, name: "Senso Divino", description: "Percepisci celesti, infernali e non-morti entro 9m: ne conosci numero e posizione." },
    { level: 1, name: "Imposizione delle Mani", description: "Guarisci PF pari a 5 × livello con un tocco. Puoi spendere 5 PF per curare una malattia o un veleno." },
    { level: 2, name: "Stile di Combattimento", description: "Scegli uno stile: Difesa (+1 CA), Duello (+2 danni), Protezione o altri." },
    { level: 2, name: "Incantesimi", description: "Lanci incantesimi usando CAR. Prepari un numero pari a CAR mod + metà livello." },
    { level: 2, name: "Colpo Divino", description: "Quando colpisci con un'arma, aggiungi 2d8 radianti al danno." },
    { level: 2, name: "Guarigione Divina", description: "Con 25 PF di Imposizione delle Mani puoi ripristinare uno stato alterato." },
    { level: 3, name: "Salute Divina", description: "Immune a tutte le malattie." },
    { level: 3, name: "Giuramento Sacro", description: "Scegli un giuramento (archetipo): determina i tuoi principi e le tue capacità." },
    { level: 5, name: "Attacco Extra", description: "Puoi attaccare due volte quando usi l'Azione di Attacco." },
    { level: 6, name: "Aura di Protezione", description: "Tu e alleati entro 3m aggiungete il tuo mod CAR ai tiri salvezza." },
    { level: 9, name: "Colpo Divino (3d8)", description: "Il Colpo Divino infligge 3d8." },
    { level: 10, name: "Aura di Coraggio", description: "Tu e alleati entro 3m non potete essere atterriti." },
    { level: 11, name: "Colpo Divino (4d8)", description: "Il Colpo Divino infligge 4d8." },
    { level: 14, name: "Aura di Protezione (migliorata)", description: "L'aura di protezione si estende a 9m." },
    { level: 15, name: "Colpo Divino (5d8)", description: "Il Colpo Divino infligge 5d8." },
    { level: 18, name: "Aura di Coraggio (migliorata)", description: "L'aura di coraggio si estende a 9m." },
    { level: 20, name: "Colpo Divino (6d8)", description: "Il Colpo Divino infligge 6d8 e applica l'effetto del tuo giuramento." },
  ],
  ranger: [
    { level: 1, name: "Nemico Prescelto", description: "Scegli un tipo di nemico: vantaggio su SAG e prove per ricordare informazioni su di lui, +2 danni." },
    { level: 1, name: "Esploratore Nativo", description: "Scegli un terreno: vantaggio su iniziativa e alcune prove mentre ci viaggi." },
    { level: 2, name: "Stile di Combattimento", description: "Scegli uno stile: Tiro con l'Arco, Duello, Combattimento con Due Armi o altri." },
    { level: 2, name: "Incantesimi", description: "Lanci incantesimi usando SAG. Conosci un numero di incantesimi secondo la tabella." },
    { level: 3, name: "Conoscenze del Ranger", description: "Scegli un'archetipo (cacciatore, maestro delle bestie...) che ti dà nuove capacità." },
    { level: 5, name: "Attacco Extra", description: "Puoi attaccare due volte quando usi l'Azione di Attacco." },
    { level: 6, name: "Nemico Prescelto (migliorato)", description: "Scegli un secondo tipo di nemico. I danni aggiuntivi diventano +4." },
    { level: 8, name: "Terreno Nativo (migliorato)", description: "La velocità di viaggio raddoppia nel tuo terreno e non puoi perderti." },
    { level: 10, name: "Invisibilità in Natura", description: "Nel tuo terreno preferito, puoi nasconderti anche se solo parzialmente coperto." },
    { level: 11, name: "Capacità Archetipo", description: "La tua archetipo ti concede una nuova capacità offensiva." },
    { level: 14, name: "Nemico Prescelto (4)", description: "Scegli un quarto tipo di nemico." },
    { level: 20, name: "Nemico Prescelto (5)", description: "Scegli un quinto tipo di nemico. I danni aggiuntivi diventano +6." },
  ],
  rogue: [
    { level: 1, name: "Competenza", description: "Scegli due abilità in cui sei competente: il tuo bonus raddoppia su di esse." },
    { level: 1, name: "Attacco Furtivo (1d6)", description: "Una volta per turno, se hai vantaggio o un alleato è entro 1,5m, aggiungi 1d6 al danno." },
    { level: 1, name: "Gergo dei Ladri", description: "Conosci il gergo dei ladri e i segni per riconoscere altri ladri." },
    { level: 2, name: "Azione Furba", description: "Azione bonus per Disimpegno, Nascondersi o Scatto." },
    { level: 3, name: "Archetipo Ladresco", description: "Scegli un'archetipo (assassino, truffatore arcano...) che ti dà nuove capacità." },
    { level: 5, name: "Attacco Furtivo (3d6)", description: "Il tuo Attacco Furtivo infligge 3d6." },
    { level: 5, name: "Caduta Controllata", description: "Usi la tua reazione per dimezzare i danni da caduta." },
    { level: 6, name: "Competenza (2)", description: "Scegli altre due abilità in cui raddoppiare il bonus." },
    { level: 7, name: "Evasione", description: "Un TS di DES riuscito = nessun danno; fallito = metà danno." },
    { level: 9, name: "Attacco Furtivo (5d6)", description: "Il tuo Attacco Furtivo infligge 5d6." },
    { level: 11, name: "Tiratore Scelto", description: "Ogni d20 inferiore a 10 nelle prove con abilità competenti conta come 10." },
    { level: 13, name: "Attacco Furtivo (7d6)", description: "Il tuo Attacco Furtivo infligge 7d6." },
    { level: 14, name: "Sensi Acuti", description: "Percepisci la posizione di creature invisibili entro 3m che non siano in piena copertura." },
    { level: 15, name: "Mente Sfuggente", description: "Competenza nei tiri salvezza di SAG." },
    { level: 17, name: "Attacco Furtivo (9d6)", description: "Il tuo Attacco Furtivo infligge 9d6." },
    { level: 18, name: "Evasione Suprema", description: "Il TS di DES fallito conta come riuscito (nessun danno)." },
    { level: 20, name: "Colpo Fortunato", description: "Se manchi un attacco, lo trasformi automaticamente in un colpo critico." },
  ],
  sorcerer: [
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando CAR. Conosci un numero fisso di incantesimi." },
    { level: 1, name: "Origine Magica", description: "Scegli un'origine (archetipo): definisce la fonte dei tuoi poteri e ti dà capacità extra." },
    { level: 2, name: "Punti Stregoneria", description: "Ottieni punti stregoneria pari al livello. Usali per creare slot o per la metamagia." },
    { level: 2, name: "Metamagia (2)", description: "Scegli due opzioni di metamagia (es. Incantesimo Ritardato, Duplicazione...)." },
    { level: 3, name: "Metamagia (3)", description: "Ottieni una terza opzione di metamagia." },
    { level: 10, name: "Metamagia (4)", description: "Ottieni una quarta opzione di metamagia." },
    { level: 17, name: "Metamagia (5)", description: "Ottieni una quinta opzione di metamagia." },
    { level: 20, name: "Recupero Stregoneria", description: "Recuperi 4 punti stregoneria dopo un riposo breve." },
  ],
  warlock: [
    { level: 1, name: "Patrono", description: "Stringi un patto con un patrono (archetipo): ti dà capacità e incantesimi del patrono." },
    { level: 1, name: "Magia del Patrono", description: "Incantesimi speciali che conosci sempre, senza contare nel totale." },
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando CAR. I tuoi slot sono sempre del livello massimo indicato." },
    { level: 2, name: "Invocazioni Mistiche (2)", description: "Scegli due invocazioni che ti danno capacità o incantesimi permanenti." },
    { level: 3, name: "Invocazioni Mistiche (3)", description: "Ottieni una terza invocazione." },
    { level: 5, name: "Invocazioni Mistiche (4)", description: "Ottieni una quarta invocazione." },
    { level: 7, name: "Invocazioni Mistiche (5)", description: "Ottieni una quinta invocazione." },
    { level: 9, name: "Invocazioni Mistiche (6)", description: "Ottieni una sesta invocazione." },
    { level: 11, name: "Invocazioni Mistiche (7)", description: "Ottieni una settima invocazione." },
    { level: 12, name: "Invocazioni Mistiche (8)", description: "Ottieni un'ottava invocazione." },
    { level: 15, name: "Invocazioni Mistiche (9)", description: "Ottieni una nona invocazione." },
    { level: 18, name: "Invocazioni Mistiche (10)", description: "Ottieni una decima invocazione." },
    { level: 20, name: "Maestro del Patrono", description: "Puoi invocare il tuo patrono per 10 minuti: recuperi tutti gli slot e hai vantaggio su una caratteristica." },
  ],
  wizard: [
    { level: 1, name: "Incantesimi", description: "Lanci incantesimi usando INT. Nel libro degli incantesimi hai 6 incantesimi di 1° livello e i trucchetti." },
    { level: 1, name: "Recupero Arcano", description: "Una volta al giorno, dopo un riposo breve, recuperi slot per un totale pari alla metà del livello." },
    { level: 1, name: "Scuola Magica", description: "Scegli una scuola (archetipo): ottieni capacità speciali della scuola." },
    { level: 2, name: "Tradizione Arcana", description: "Ottieni la prima capacità della tua scuola (es. Evocazione: scolpire gli incantesimi)." },
    { level: 6, name: "Capacità di Scuola (2)", description: "Ottieni la seconda capacità della tua scuola." },
    { level: 10, name: "Capacità di Scuola (3)", description: "Ottieni la terza capacità della tua scuola." },
    { level: 14, name: "Capacità di Scuola (4)", description: "Ottieni la quarta capacità della tua scuola." },
    { level: 18, name: "Padronanza degli Incantesimi", description: "Scegli un incantesimo di 1° e uno di 2° livello: puoi lanciarli senza consumare slot." },
    { level: 20, name: "Incantesimi Firmati", description: "Scegli due incantesimi di 3° livello: li conosci sempre e puoi lanciarli al livello massimo senza consumare slot." },
  ],
};

export function getFeaturesAtLevel(classKey: string, level: number): ClassFeature[] {
  return (CLASS_FEATURES[classKey] || []).filter(f => f.level === level);
}

export function getFeaturesUpTo(classKey: string, level: number): ClassFeature[] {
  return (CLASS_FEATURES[classKey] || []).filter(f => f.level <= level);
}
