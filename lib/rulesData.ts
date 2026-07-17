export type RuleChapter = {
  id: string;
  title: string;
  content: string;
};

export type RuleVolume = {
  id: string;
  title: string;
  desc: string;
  chapters: RuleChapter[];
};

export const rulesData: RuleVolume[] = [
  {
    id: "volume-1",
    title: "Volume 1 — Le basi",
    desc: "Per chi non ha mai fatto il DM.",
    chapters: [
      {
        id: "cos-e-dnd",
        title: "Cos'è D&D",
        content: `Dungeons & Dragons (D&D) è un gioco di ruolo fantasy in cui un gruppo di giocatori interpreta personaggi eroici (avventurieri) mentre un Dungeon Master (DM) descrive il mondo e arbitra le regole.

Non c'è un vincitore — l'obiettivo è creare una storia collaborativa. Si usano dadi (specialmente il d20) per determinare se le azioni riescono o falliscono.`
      },
      {
        id: "come-funziona-una-sessione",
        title: "Come funziona una sessione",
        content: `Una sessione si svolge in tre fasi alternate:

1. **Il DM descrive** — ciò che i personaggi vedono, sentono, odorano
2. **I giocatori reagiscono** — dichiarano cosa fanno i loro personaggi
3. **Il DM arbitra** — decide se serve un tiro dado e stabilisce l'esito

La sessione alterna momenti di interpretazione (roleplay), esplorazione e combattimento.`
      },
      {
        id: "ruolo-dm",
        title: "Il ruolo del Dungeon Master",
        content: `Il DM è il narratore e arbitro del gioco. I suoi compiti:

• Descrivere l'ambiente e i personaggi non giocanti (NPC)
• Decidere quando far tirare i dadi e quale difficoltà (CD)
• Interpretare tutti gli NPC e i mostri
• Guidare la narrazione e tenere il ritmo
• Assicurarsi che tutti i giocatori si divertano

Il DM NON è contro i giocatori — è il loro più grande fan.`
      },
      {
        id: "ruolo-giocatori",
        title: "Il ruolo dei giocatori",
        content: `Ogni giocatore controlla un personaggio (PG). I giocatori:

• Decidono cosa fa il loro personaggio in ogni situazione
• Interpretano il personaggio (voce, scelte, personalità)
• Tengono traccia di statistiche, equipaggiamento e abilità
• Collaborano col gruppo per superare le sfide

I giocatori non devono conoscere tutte le regole — basta che sappiano cosa vogliono fare.`
      },
      {
        id: "caratteristiche",
        title: "Le caratteristiche",
        content: `Ogni personaggio ha 6 punteggi caratteristica (da 3 a 20):

**FOR (Forza)** — Potenza fisica, sport, sollevare pesi
**DES (Destrezza)** — Agilità, furtività, mira, iniziativa
**COS (Costituzione)** — Resistenza fisica, HP, concentrazione
**INT (Intelligenza)** — Conoscenza, logica, magia arcana
**SAG (Saggezza)** — Percezione, intuizione, volontà
**CAR (Carisma)** — Persuasione, inganno, presenza scenica

I punteggi generano un modificatore che si applica ai tiri.`
      },
      {
        id: "modificatori",
        title: "I modificatori",
        content: `Il modificatore si calcola: (punteggio - 10) / 2, arrotondato per difetto.

| Punteggio | Modificatore |
|-----------|-------------|
| 1 | -5 |
| 2-3 | -4 |
| 4-5 | -3 |
| 6-7 | -2 |
| 8-9 | -1 |
| 10-11 | 0 |
| 12-13 | +1 |
| 14-15 | +2 |
| 16-17 | +3 |
| 18-19 | +4 |
| 20 | +5 |

Il modificatore si applica a qualsiasi tiro che coinvolge quella caratteristica.`
      },
      {
        id: "competenza",
        title: "Competenza e bonus",
        content: `La competenza rappresenta l'addestramento in una specifica abilità o strumento.

Il bonus di competenza dipende dal livello:
• Livello 1-4: +2
• Livello 5-8: +3
• Livello 9-12: +4
• Livello 13-16: +5
• Livello 17-20: +6

Se sei competente in un'abilità, aggiungi il bonus al tiro. Se non lo sei, aggiungi solo il modificatore di caratteristica.`
      },
      {
        id: "abilita",
        title: "Le abilità",
        content: `Ogni abilità è associata a una caratteristica:

**FOR:** Atletica
**DES:** Acrobazia, Furtività, Rapidità di mano
**INT:** Arcano, Indagare, Natura, Religione, Storia
**SAG:** Addestrare animali, Intuizione, Medicina, Percezione, Sopravvivenza
**CAR:** Aggirare, Inganno, Intimidire, Intrattenere, Persuasione

Quando un giocatore dice "voglio cercare trappole", chiedi un tiro di Percezione (SAG). Se dice "voglio scalare il muro", chiedi Atletica (FOR).`
      },
      {
        id: "dadi",
        title: "I dadi",
        content: `D&D usa dadi poliedrici:

• **d4** — tetraedro (1-4) — pugnali, trucchetti
• **d6** — cubo (1-6) — spade, furtività
• **d8** — ottaedro (1-8) — archi, incantesimi
• **d10** — decaedro (1-10) — danni, percentuali
• **d12** — dodecaedro (1-12) — armi grandi
• **d20** — icosaedro (1-20) — **tiro principale** per ogni azione
• **d100** — due d10 (decine e unità) — tabelle casuali

Il d20 è il dado più importante: decide successo o fallimento.`
      },
      {
        id: "cd",
        title: "Come decidere una CD",
        content: `La CD (Classe Difficoltà) è il numero da raggiungere per avere successo.

**CD di riferimento:**
• 5 — Molto facile
• 10 — Facile
• 15 — Medio
• 20 — Difficile
• 25 — Molto difficile
• 30 — Quasi impossibile

**Come scegliere:**
• Se l'azione è banale e non c'è pressione →非 c'è bisogno di tirare
• Se c'è una conseguenza per il fallimento → fai tirare
• Se l'idea è buona e ben descritta → abbassa la CD di 2-5
• Se è estremamente difficile → alza la CD a 20-25

Regola d'oro: se non sai che CD usare, **15** funziona sempre.`
      },
      {
        id: "esempi-tiri",
        title: "Esempi pratici di tiri",
        content: `**Esempio 1: Scassinare una serratura**
Giocatore: "Voglio aprire la serratura con i miei arnesi da scasso."
DM: "è una serratura mediocre. Fai una prova di Rapidità di Mano con CD 13."
Il giocatore tira d20, aggiunge DES e competenza. Se fa 13+, la serratura si apre.

**Esempio 2: Intimidire una guardia**
Giocatore: "La minaccio dicendo che so dove abita sua madre."
DM: "La guardia sembra coraggiosa ma titubante. CD 17."
Se il tiro di Intimidire è 17+, la guardia cede.

**Esempio 3: Ricordare un'informazione**
Giocatore: "Ho studiato queste rovine, mi ricordo qualcosa?"
DM: "Tira Storia (INT) CD 12."
Se fa 12+, ricorda un dettaglio utile. Se fallisce, sa solo che sono molto antiche.`
      },
    ]
  },
  {
    id: "volume-2",
    title: "Volume 2 — Combattimento",
    desc: "Corso completo di combattimento.",
    chapters: [
      {
        id: "iniziativa",
        title: "Iniziativa",
        content: `All'inizio del combattimento, ogni partecipante tira Iniziativa (d20 + DES).

L'ordine dal più alto al più basso determina la sequenza dei turni.

In caso di parità, il DM decide chi agisce primo tra i pari.

**A turno esterno:** il DM può far agire tutti i mostri dello stesso tipo nello stesso momento per velocizzare.`
      },
      {
        id: "turno",
        title: "Il turno",
        content: `Ogni turno si compone di:

1. **Azione** — attaccare, lanciare un incantesimo, scassinare, usare un oggetto
2. **Azione bonus** — azione rapida (incantesimi bonus, attacco con arma leggera in seconda mano)
3. **Movimento** — fino a 30 piedi (9 metri) per la maggior parte delle razze
4. **Interazione gratuita** — aprire una porta, sguainare un'arma

Si può anche:
• **Reazione** — 1 per round (attacco di opportunità, incantesimi di reazione)
• Muoversi prima, durante o dopo l'azione
• Dividere il movimento come si vuole`
      },
      {
        id: "attaccare",
        title: "Attaccare",
        content: `Per attaccare: d20 + modificatore caratteristica + bonus competenza (se competente).

• **Armi da mischia (Forza):** spada, ascia, mazza
• **Armi a distanza (Destrezza):** arco, balestra, pugnale lanciato
• **Armi sottili (Destrezza):** pugnale, spada corta, frusta

Colpisci se il risultato eguaglia o supera la Classe Armatura (CA) del bersaglio.`
      },
      {
        id: "ca",
        title: "Classe Armatura (CA)",
        content: `La CA rappresenta quanto è difficile colpire un bersaglio.

• **Senza armatura:** 10 + DES
• **Armatura leggera:** 11 + DES (cuoio) / 12 + DES (cuoio borchiato)
• **Armatura media:** 13 + DES (max 2) / 14 + DES (max 2) / 15 (maglia di squame)
• **Armatura pesante:** 16 (cotta di maglia) / 17 (piastre) / 18 (armatura completa)
• **Scudo:** +2 alla CA

CA tipiche: contadino 10, guardia 14, cavaliere 18, drago 22.`
      },
      {
        id: "danni-critici",
        title: "Danni e critici",
        content: `Quando colpisci, tira i dadi di danno dell'arma e aggiungi il modificatore.

**Colpo critico:** se il d20 mostra un 20 naturale, l'attacco è un critico.
• Tira i dadi del danno **due volte** e somma tutto
• Se ci sono bonus extra (come dadi di furtività), anche quelli si raddoppiano

**Danno da mischia:** 1d8 + FOR (spada lunga)
**Danno a distanza:** 1d8 + DES (balestra)
**Danno da due mani:** 2d6 + FOR (spada a due mani)`
      },
      {
        id: "copertura",
        title: "Copertura",
        content: `La copertura offre protezione contro gli attacchi a distanza:
    
    • **Copertura parziale (1/2):** +2 alla CA — ostacolo come un muretto
    • **Copertura consistente (3/4):** +5 alla CA — finestra, feritoia
    • **Copertura totale:** non si può essere bersagliati — dietro un muro
    
    Per determinare se un bersaglio ha copertura, traccia una linea dal centro del quadrato dell'attaccante al centro del bersaglio. Se passa attraverso un ostacolo, si applica copertura.`
          },
          {
            id: "azioni-combattimento",
            title: "Azioni in combattimento",
            content: `Oltre ad attaccare, in combattimento puoi fare:
    
    • **Scatto** — muovi fino al doppio della tua velocità
    • **Disimpegno** — il movimento non provoca attacchi di opportunità
    • **Nascondersi** — prova di Furtività vs Percezione dei nemici
    • **Preparare** — scegli un'azione e un trigger ("se il goblin si avvicina, attacco")
    • **Aiutare** — un alleato ha vantaggio sul suo prossimo tiro
    • **Oggetto** — usare un oggetto (pozione, leva, corda)
    • **Intrufolarsi** — muoversi furtivamente (Furtività vs Percezione)
    • **Cercare** — Percezione o Indagare per trovare qualcosa
    • **Lottare** — Atletica vs Atletica o Acrobazia — trattenere un nemico
    • **Spingere** — Atletica vs Atletica o Acrobazia — far cadere o spostare
    • **Disarmare** — tiro contrapposto per far cadere l'arma al nemico
    
    Ricorda: puoi fare UNA azione + UNA azione bonus + movimento + una reazione.`
          },
        ]
      },
      {
        id: "volume-3",
        title: "Volume 3 — Magia e incantesimi",
        desc: "Come funziona la magia.",
        chapters: [
          {
            id: "basi-magia",
            title: "Basi della magia",
            content: `Gli incantesimi sono divisi in 9 livelli (più i trucchetti/cantrips di livello 0).
    
    • **Cantrips** — incantesimi minori che si possono lanciare a volontà (senza consumare slot)
    • **Livelli 1-9** — richiedono slot incantesimo. Ogni classe ha un numero di slot per livello
    • **Preparazione** — chierici, druidi e paladini preparano gli incantesimi ogni giorno. Maghi imparano dal libro. Bardi, stregoni, warlock conoscono incantesimi fissi
    
    Per lanciare: spendi uno slot del livello dell'incantesimo o superiore. L'incantesimo ha effetto. Recuperi gli slot dopo un riposo lungo.`
          },
          {
            id: "scuole-magia",
            title: "Scuole di magia",
            content: `Gli incantesimi sono raggruppati in 8 scuole:
    
    • **Abiurazione** — protezione, barriere, annullamento (Scudo, Cerchio magico)
    • **Ammaliamento** — controllo mentale, fascinazione (Sonno, Amicizia)
    • **Divinazione** — conoscenza, rilevazione (Vedere invisibilità, Individuazione del male)
    • **Evocazione** — creare materia/energia (Palla di fuoco, Guarigione)
    • **Illusione** — inganni sensoriali (Immagine silenziosa, Invisibilità)
    • **Invocazione** — canalizzare energia sacra (Parola sacra, Luce)
    • **Necromanzia** — vita e morte (Alzare morti, Tocco gelido)
    • **Trasmutazione** — cambiare proprietà (Ingrandire, Polimorfo)`
          },
          {
            id: "concentrazione",
            title: "Concentrazione",
            content: `Molti incantesimi richiedono concentrazione per durare nel tempo.
    
    • Puoi mantenere UNA sola concentrazione alla volta
    • Se lanci un altro incantesimo che richiede concentrazione, la prima termina
    • Se subisci danni, fai un Tiro Salvezza di COS (CD 10 o metà danno, il più alto)
    • Se fallisci, perdi la concentrazione e l'incantesimo termina
    • Anche essere incapacitato o morire interrompe la concentrazione
    
    **Suggerimento per DM:** chiedi il tiro concentrazione OGNI volta che il PG subisce danni mentre mantiene un incantesimo.`
          },
          {
            id: "componenti",
            title: "Componenti degli incantesimi",
            content: `Ogni incantesimo richiede componenti:
    
    • **V (Verbale)** — pronunciare parole magiche. Non puoi in silenzio o imbavagliato
    • **S (Somatico)** — gesti con le mani. Non puoi se hai le mani legate
    • **M (Materiale)** — oggetti fisici. Se non hai il focus arcano o il simbolo sacro, devi avere i componenti
    
    **Focus arcano** (bastone, bacchetta, sfera) sostituisce i componenti materiali SENZA costo in oro.
    **Simbolo sacro** fa lo stesso per chierici e paladini.
    
    Per lanciare con entrambe le mani occupate (arma + scudo), servono talenti specifici o un focus incorporato nello scudo.`
          },
          {
            id: "incantatori",
            title: "Classi incantatrici",
            content: `Ogni classe usa la magia in modo diverso:
    
    • **Mago** — INT. Impara incantesimi dal libro. Può imparare nuovi incantesimi dai pergamena. Il più versatile.
    • **Chierico** — SAG. Incanala potere divino. Prepara incantesimi dalla lista completa. Guarigione e supporto.
    • **Bardo** — CAR. Incantesimi basati su ispirazione e performance. Lista limitata ma flessibile.
    • **Stregone** — CAR. Magia innata. Metamagia per potenziare gli incantesimi. Meno incantesimi ma più flessibili.
    • **Warlock** — CAR. Incantesimi di livello fisso (recupera ai riposi brevi). Invocazioni per effetti unici.
    • **Druido** — SAG. Magia naturale. Forme selvatiche. Lista incentrata su natura e guarigione.
    • **Paladino** — SAG/CAR. Metà incantatore. Incantesimi di potenziamento e punizione.
    • **Ranger** — SAG. Metà incantatore. Incantesimi di utilità, sopravvivenza e caccia.
    • **Artificiere** — INT. Metà incantatore. Infonde oggetti con magia.`
          },
          {
            id: "incantesimi-utili",
            title: "Incantesimi utili per DM",
            content: `Incantesimi che i DM dovrebbero conoscere:
    
    • **Individuazione del magico** — i PG vedono tracce magiche
    • **Parlare con i morti** — i PG interrogano un cadavere
    • **Vedere invisibilità** — i PG vedono creature invisibili
    • **Teletrasporto** — i PG bypassano i tuoi piani di viaggio
    • **Ristorare inferiori** — rimuove maledizioni e malattie
    • **Ristorare superiori** — risolve quasi tutto
    • **Sfera prismatica** — rende tutto più complicato
    • **Desiderio (Wish)** — preparati a dire di sì a qualcosa di folle
    
    Regola d'oro: se un incantesimo risolve un problema che volevi durasse un'intera sessione, lascialo fare — ma fanne pagare il prezzo (risorse, tempo, conseguenze).`
          },
        ]
      },
      {
        id: "volume-4",
        title: "Volume 4 — Equipaggiamento e oggetti",
        desc: "Armi, armature, tesori, oggetti magici.",
        chapters: [
          {
            id: "armi",
            title: "Armi",
            content: `Le armi si dividono in semplici e da guerra:
    
    **Armi semplici (competenza base):**
    • Pugnale — 1d4 perforante, leggero, sottile, lancio (20/60)
    • Mazza leggera — 1d4 contundente, leggero
    • Randello — 1d8 contundente, a due mani
    • Balestra leggera — 1d8 perforante, munizioni, carica, a due mani
    • Fionda — 1d4 contundente, munizioni
    
    **Armi da guerra (richiedono competenza):**
    • Spada lunga — 1d8 tagliente (1d10 a due mani)
    • Ascia bipenne — 1d12 tagliente, a due mani, pesante
    • Arco lungo — 1d8 perforante, munizioni, a due mani, pesante
    • Spada a due mani — 2d6 tagliente, a due mani, pesante
    
    **Proprietà:** Leggero (usata in due), Pesante (taglia piccola ha svantaggio), Lancio (gittata), Munizioni (richiede frecce), Sottile (usa DES o FOR), Versatile (si usa a 1 o 2 mani)`
          },
          {
            id: "armature",
            title: "Armature",
            content: `Tre categorie di armatura:
    
    **Leggera:**
    • Imbottita — 11 + DES — svantaggio su Furtività, 5lb
    • Cuoio — 11 + DES — 10lb
    • Cuoio borchiato — 12 + DES — 13lb
    
    **Media:**
    • Pelle — 12 + DES (max +2) — 12lb
    • Cotta di maglia — 13 + DES (max +2) — 20lb
    • Giaco di maglia — 14 + DES (max +2) — 25lb
    • Mezza piastra — 15 + DES (max +2) — svantaggio Furtività, 40lb
    
    **Pesante:**
    • Cotta di maglia completa — 16 — svantaggio Furtività, Forza 13 richiesta, 55lb
    • Piastre — 17 — svantaggio Furtività, Forza 15 richiesta, 65lb
    • Armatura completa — 18 — svantaggio Furtività, Forza 15, 65lb
    
    **Scudo:** +2 alla CA. Richiede una mano.`
          },
          {
            id: "oggetti-magici",
            title: "Oggetti magici — rarità",
            content: `Gli oggetti magici si dividono per rarità (e prezzo indicativo):
    
    • **Comune** — 50-100 mo — Pozione di guarigione, Corda dell'arrampicata
    • **Non comune** — 100-500 mo — Spada +1, Mantello del pipistrello
    • **Raro** — 500-5.000 mo — Spada +2, Armatura +1, Pietra dell'elementale
    • **Molto raro** — 5.000-50.000 mo — Spada +3, Armatura +2, Tappeto volante
    • **Leggendario** — 50.000+ mo — Spada del vampiro, Armatura completa +3, Palla di cristallo
    
    **Attunement:** molti oggetti potenti richiedono di essere "sintonizzati" (ci vuole un riposo breve). Un PG può avere massimo 3 oggetti sintonizzati.
    
    Regola per DM: non dare oggetti magici troppo presto. Livello 1-4: uno o due oggetti comuni. Livello 5-10: alcuni non comuni. Livello 11-16: rari. Livello 17+: molto rari o leggendari.`
          },
          {
            id: "tesori",
            title: "Tesori e ricompense",
            content: `Quanto dare ai giocatori:
    
    **Tesori per livello:**
    • Livello 1-4: 2d6 mo per incontro minore, 10-50 mo per boss
    • Livello 5-10: 10-100 mo per incontro, 100-500 mo per boss
    • Livello 11-16: 50-500 mo per incontro, 500-5.000 mo per boss
    • Livello 17-20: 200-2.000 mo per incontro, 5.000-50.000 mo per boss
    
    **Oltre alle monete, dai:**
    • Pietre preziose (10-500 mo ciascuna)
    • Opere d'arte (25-3.000 mo)
    • Oggetti magici (vedi la rarità)
    • Titoli, terre, proprietà
    • Favori di NPC potenti
    
    **Non serve contare ogni spicciolo.** Dai ricompense significative quando i PG completano missioni. A livelli alti, le monete sono un peso — usate oggetti magici e favori.`
          },
          {
            id: "pozioni",
            title: "Pozioni e consumabili",
            content: `Le pozioni sono oggetti magici monouso — non richiedono attunement:
    
    • **Pozione di guarigione** — recupera 2d4+2 PF (comune)
    • **Pozione di guarigione superiore** — 4d4+4 PF (non comune)
    • **Pozione di guarigione suprema** — 8d4+8 PF (molto rara)
    • **Pozione di forza collina** — +2 FOR, 1 ora (non comune)
    • **Pozione di velocità** — azione extra, +2 CA, vantaggio DES, 1 minuto (molto rara)
    • **Pozione di invisibilità** — invisibile per 1 ora (molto rara)
    • **Pozione di resistenza al fuoco** — resistenza al fuoco 1 ora (non comune)
    
    Bere una pozione richiede un'azione. Come azione bonus (regola opzionale) puoi berla o somministrarla a un alleato.`
          },
        ]
      },
      {
        id: "volume-5",
        title: "Volume 5 — Mostri e incontri",
        desc: "Come creare e gestire gli incontri.",
        chapters: [
          {
            id: "costruire-incontri",
            title: "Costruire incontri",
            content: `Il sistema di SF (Sfida) ti aiuta a bilanciare gli incontri:
    
    La SF di un mostro indica quanto è pericoloso. Un mostro di SF X è una sfida bilanciata per 4 PG di livello X.
    
    **Budget XP per incontro (per 4 PG):**
    • 4 PG lv1: facile 100, medio 200, difficile 300, letale 400
    • 4 PG lv3: facile 300, medio 600, difficile 900, letale 1.200
    • 4 PG lv5: facile 1.100, medio 2.200, difficile 3.400, letale 4.400
    • 4 PG lv10: facile 5.600, medio 11.200, difficile 17.000, letale 22.400
    • 4 PG lv15: facile 13.000, medio 26.000, difficile 39.000, letale 52.000
    • 4 PG lv20: facile 28.000, medio 56.000, difficile 84.000, letale 112.000
    
    **Regola pratica:**
    • 1 mostro di SF = livello del gruppo → medio
    • 2-3 mostri di SF = metà livello → medio
    • 4-6 mostri di SF = un quarto del livello → medio
    • Più di 6 mostri → probabilmente facile (azione economica)`
          },
          {
            id: "mostri-tipi",
            title: "Tipi di mostri",
            content: `I mostri si dividono in categorie:
    
    • **Bestie** — animali normali o giganti (lupo, orso, tigre)
    • **Umanoidi** — creature civilizzate (goblin, orchi, umani)
    • **Non morti** — creature della notte (scheletri, zombie, vampiri)
    • **Draghi** — potenti creature alate (dal drago bianco al drago rosso)
    • **Celestiali** — creature divine (angeli, pegasi)
    • **Demoni** — creature del caos malvagio (diavoli, balor)
    • **Elementali** — creature dei piani elementali
    • **Folletti** — creature fatate (dryadi, spiritelli)
    • **Mostruosità** — creature ibride e strane (manticora, chimera)
    • **Melme** — amebe e muffe
    • **Vegetali** — piante aggressive (miconidi, rampicanti)
    • **Crapi** — aberrazioni (beholder, mind flayer)
    
    Usa il tipo per guidare la narrazione: i non morti temono i chierici, i draghi sono vanitosi, i folletti amano gli scherzi.`
          },
          {
            id: "tattiche",
            title: "Tattiche di mostri",
            content: `I mostri intelligenti combattono in modo intelligente:
    
    **Goblin** — si nascondono, attaccano da lontano, fuggono se in svantaggio
    **Orchi** — caricano frontalmente, attaccano il più vicino
    **Lupi** — accerchiano, attaccano chi è isolato, fuggono se il capo muore
    **Draghi** — usano il soffio, volano, restano fuori portata, attaccano dalla distanza
    **Non morti** — avanzano lentamente, non provano paura, non si arrendono
    **Drow** — usano oscurità magica, veleno, tattiche di guerriglia
    **Mind flayer** — dominano mentalmente, attaccano dalla distanza con poteri psionici
    
    **Ricorda:** un mostro non deve sempre combattere fino alla morte. Se il combattimento volge al peggio, i mostri intelligenti fuggono, si arrendono o trattano.`
          },
          {
            id: "trappole",
            title: "Trappole e sfide ambientali",
            content: `Le trappole aggiungono tensione senza combattimento:
    
    **Trappole semplici (CD 10-12):**
    • Buca coperta da foglie — CD 12 Percezione per notarla, CD 10 DES per afferrarsi
    • Freccia da parete — CD 10 Percezione, CD 12 DES schivare, 1d6 danno
    
    **Trappole pericolose (CD 13-15):**
    • Rete dal soffitto — CD 14 Percezione, CD 13 DES schivare, trattenuto
    • Lancia dal muro — CD 13 Percezione, CD 14 DES, 3d6 danno
    
    **Trappole letali (CD 16-20):**
    • Soffio di fuoco — CD 16 Percezione, CD 15 DES, 7d6 danno
    • Stanza che si riempie d'acqua — CD 18 Percezione, CD 17 Forza per aprire la porta
    
    **Frequenza:** 1 trappola ogni 2-3 ore di gioco è sufficiente. Troppe trappole frustrano i giocatori.`
          },
          {
            id: "riposi",
            title: "Riposi e recupero",
            content: `I personaggi recuperano tra un combattimento e l'altro:
    
    **Riposo breve (1 ora):**
    • Puoi spendere Dadi Vita (tira il dado, aggiungi COS, recupera PF)
    • Warlock e monaci recuperano alcune abilità
    • Puoi fare un riposo breve 2-3 volte al giorno
    
    **Riposo lungo (8 ore):**
    • Recuperi tutti i PF
    • Recuperi metà dei Dadi Vita (minimo 1)
    • Recuperi tutti gli slot incantesimo e abilità di classe
    • Se non mangi/bevi a sufficienza, non recuperi PF
    
    **Regola per DM:** tra un riposo lungo e l'altro, cerca di fare 2-3 incontri medi/difficili + 1-2 riposi brevi. Questo mantiene la pressione sulle risorse.`
          },
          {
            id: "morte",
            title: "Morte e guarigione",
            content: `Quando un PG arriva a 0 PF:
    
    • Cade a terra prono
    • è privo di sensi (incapacitato)
    • Ogni turno fa un Tiro Salvezza contro la Morte (d20):
      - 1-9: fallimento
      - 10-19: successo
      - 20: recupera 1 PF e si rialza
      - 1: 2 fallimenti
    • 3 fallimenti: il personaggio muore
    • 3 successi: stabile (0 PF, non morente, ma privo di sensi)
    
    **Guarire:** se un alleato ti cura (anche 1 PF), riprendi coscienza. La pozione di guarigione funziona anche su un morente se somministrata.
    
    **Morte istantanea:** se il danno da un singolo colpo eccede i tuoi PF massimi, muori all'istante (senza tiri salvezza).`
          },
        ]
      },
      {
        id: "volume-6",
        title: "Volume 6 — Esplorazione e avventure",
        desc: "Viaggi, dungeon, ambientazioni.",
        chapters: [
          {
            id: "esplorazione",
            title: "Viaggi ed esplorazione",
            content: `Quando i PG viaggiano su lunghe distanze:
    
    **Passo normale:** 24 miglia/giorno (3 miglia/ora × 8 ore)
    **Passo svelto:** 30 miglia/giorno (-5 a Percezione passiva)
    **Passo lento:** 18 miglia/giorno (furtivo, percepisce meglio)
    
    **Ogni ora di viaggio, considera:**
    • Il tempo cambia? (pioggia, nebbia, tempesta)
    • C'è un incontro casuale? (1 su 6 con d6, 2 su 8 con d8 su 10)
    • Trovano qualcosa di interessante? (rovine, accampamento, sentiero)
    • Si perdono? (Sopravvivenza CD 15 per mantenere la rotta)
    
    **Tabella incontri casuali:** prepara 6-8 incontri prima della sessione. Mescola combattimenti, incontri neutri e scoperte.`
          },
          {
            id: "dungeon",
            title: "Dungeon design",
            content: `Un buon dungeon ha:
    
    **1. Scopo** — perché esiste? Chi l'ha costruito? Cosa protegge?
    **2. Fazioni** — almeno 2 gruppi con obiettivi diversi (goblin vs orchi, cultisti vs mostri)
    **3. Stanze vuote** — non tutte le stanze devono avere mostri. Usale per descrivere l'atmosfera
    **4. Segrete** — porte nascoste, tesori, passaggi
    **5. Ricompense** — tesoro, oggetti magici, informazioni
    **6. Uscite** — sempre più di un modo per entrare/uscire
    
    **Regola 3×3:** per ogni piano di dungeon, prepara 3 incontri (1 facile, 1 medio, 1 difficile), 3 stanze descrittive, 3 trappole/sfide.
    
    **Illuminazione:** la maggior parte dei dungeon è buia. I PG con scurovisione vedono in bianco e nero fino a 60ft. Chi non ce l'ha ha bisogno di torce (20ft di luce, 40ft di fioca).`
          },
          {
            id: "ambientazioni",
            title: "Ambientazioni fantasy",
            content: `Esempi di ambientazioni per le tue campagne:
    
    **Foresta incantata** — alberi parlanti, fate dispettose, rovine elfiche, animali giganti
    **Palude maledetta** — nebbia tossica, non morti, villaggi isolati, culti oscuri
    **Montagne** — passi pericolosi, miniere abbandonate, draghi, nani, giganti
    **Deserto** — città perdute, tempeste di sabbia, carovane, antichi sigilli
    **Città portuale** — gilde, contrabbando, intrighi politici, vicoli oscuri
    **Piano etereo** — nebbia grigia, edifici fantasma, creature incorporee
    **Sottofondo marino** — città sommerse, abissi, creature marine, rovine
    **Piano infernale** — fiumi di fuoco, fortezze di ossidiana, diavoli burocrati
    
    Prendi un'ambientazione classica e aggiungi un twist: "Foresta incantata dove la gravità è ridotta", "Città portuale dove i ricordi si comprano e vendono".`
          },
          {
            id: "npc",
            title: "Creare NPC memorabili",
            content: `Un buon NPC ha:
    
    • **Un nome** — facile da ricordare (Grimm il Buggre, Zambi il Mezzelfo Tritatimpani)
    • **Un tratto distintivo** — voce roca, tic nervoso, monocolo, pipa sempre spenta
    • **Un obiettivo** — cosa vuole e cosa serve ai PG
    • **Un difetto** — codardo, avido, bugiardo, testardo, goloso
    
    **Template rapido (usa solo 2-3 elementi):**
    • Aspetto: alto/basso, grasso/magro, cicatrice, abbigliamento
    • Voce: sussurrata, tonante, nasale, lenta, rapida
    • Personalità: scontroso, allegro, sospettoso, distratto
    • Segreto: piccolo (deve soldi) o grande (è un traditore)
    
    **Regola d'oro:** dagli un problema che i PG possono risolvere. Così l'NPC diventa un gancio per avventure.`
          },
          {
            id: "ganci",
            title: "Ganci per avventure",
            content: `Come far partire un'avventura:
    
    • Un NPC arriva dal nulla e chiede aiuto disperatamente
    • I PG trovano una mappa o un messaggio cifrato
    • Un evento pubblico (assassinio, rapimento, attacco) avviene davanti a loro
    • Un vecchio contatto li contatta per un favore
    • Trovano un oggetto strano con un mistero
    • Qualcuno li assume per un lavoro semplice che si complica
    • Un sogno/visione li guida verso un luogo
    • Una catastrofe naturale (o magica) cambia la regione
    
    **Struttura base:** introduzione → esplorazione → colpo di scena → climax → conclusione.
    
    **Non pianificare ogni dettaglio.** Lascia spazio ai giocatori di sorprenderti. Prepara situazioni, non sceneggiature.`
          },
        ]
      },
      {
        id: "volume-7",
        title: "Volume 7 — Gestione della sessione",
        desc: "Consigli pratici per il DM.",
        chapters: [
          {
            id: "preparazione",
            title: "Preparare una sessione (30 min)",
            content: `Non serve preparare ore. In 30 minuti puoi preparare una sessione solida:
    
    **Primi 10 min — situazione attuale:**
    • Dove sono i PG? Cosa stanno facendo?
    • Quali sono i loro obiettivi attuali?
    • Chi è il prossimo NPC che incontreranno?
    
    **Secondi 10 min — materiale:**
    • 1-2 incontri (con statistiche base dei mostri)
    • 1 mappa rapida (schizzo a mano, non serve arte)
    • 2-3 tesori/ricompense
    
    **Ultimi 10 min — preparazione mentale:**
    • 3 descrizioni evocative ("l'aria sa di zolfo", "sentite passi lontani")
    • 1 colpo di scena (il mentore è il traditore, il tesoro è falso)
    • 1 finale alternativo se i PG fanno scelte impreviste
    
    **Non preparare dialoghi.** Prepara situazioni e lascia che i PG interagiscano.`
          },
          {
            id: "ritmo",
            title: "Gestire il ritmo",
            content: `Il ritmo è la cosa più importante in una sessione:
    
    **Accelerare quando:**
    • I giocatori sono bloccati da 10+ minuti su un problema
    • Il combattimento è vinto ma ci sono ancora mostri da abbattere
    • Un giocatore è inattivo da troppo tempo
    • La sessione sta finendo e vuoi arrivare a un punto di sosta
    
    **Rallentare quando:**
    • I PG scoprono qualcosa di importante
    • Un giocatore sta facendo un bel roleplay
    • è il momento di descrivere qualcosa di epico
    • I PG hanno appena subito un duro colpo
    
    **Tecniche:**
    • "Fate tutti un tiro di..." (SAG/INT) per dare indizi senza bloccarli
    • Timer reale per azioni in combattimento
    • Chiedere "Cosa fate?" quando il silenzio si prolunga
    • Tagliare scene che non aggiungono nulla alla storia`
          },
          {
            id: "giocatori-difficili",
            title: "Gestire giocatori difficili",
            content: `Ogni DM incontra situazioni complicate:
    
    **Il protagonista** — vuole essere sempre al centro. → Dai spazio agli altri, usa "mentre fai questo, cosa fanno gli altri?"
    
    **Il regolista** — contesta ogni regola. → "Segnati il dubbio, lo controlliamo dopo la sessione." Poi valuta e comunica la decisione.
    
    **Il passivo** — non prende mai iniziativa. → Chiedigli direttamente "Cosa fa il tuo personaggio?" e dagli opzioni semplici.
    
    **L'assenteista** — distratto dal telefono. → Chiamalo in gioco con colpi di scena che coinvolgono il suo personaggio.
    
    **Il caotico** — fa sempre cose a caso. → Chiedi "Perché il tuo personaggio farebbe questo?" e se non ha una risposta, valuta se permetterlo.
    
    **Regola generale:** parla con il giocatore FUORI dalla sessione. La maggior parte dei problemi si risolve con una chiacchierata sincera.`
          },
          {
            id: "regola-doro",
            title: "La regola d'oro del DM",
            content: `Se c'è una sola regola da ricordare, è questa:
    
    **La regola d'oro: ciò che rende il gioco divertente per tutti è più importante di qualsiasi regola scritta.**
    
    • Se non ricordi una regola, inventala sul momento e controlla dopo
    • Se un giocatore propone un'idea fantastica che le regole non prevedono, digli di sì e falla funzionare
    • Se una regola rallenta il gioco, ignorala
    • Se tutti si stanno divertendo, stai facendo bene il tuo lavoro
    
    Il manuale è una guida, non una gabbia. Le regole esistono per servire la storia, non il contrario.
    
    E ricordati: **il DM non è contro i giocatori**. Siete tutti dalla stessa parte: creare una storia epica e memorabile insieme.`
          },
        ]
      },
  {
    id: "volume-8",
    title: "Volume 8 — Background e creazione personaggio",
    desc: "Origini, personalità, talenti, multiclasse.",
    chapters: [
      {
        id: "scelta-background",
        title: "Scegliere un background",
        content: `Il background rappresenta la vita del PG prima di diventare un avventuriero. Ogni background dà:
  • 2 competenze in abilità
  • 2 competenze in strumenti/linguaggi
  • Un tratto di background (abilità speciale)
  • Equipaggiamento iniziale

  **Accolito:** servizio in un tempio. Competenze: Intuizione, Religione. Tratto: "Rifugio del fedele" — ricevi cure e alloggio gratuito nei templi.

  **Criminale:** vita di malaffare. Competenze: Inganno, Furtività. Tratto: "Contatto criminale" — conosci un contato nel sottobosco di qualsiasi città.

  **Eroe del popolo:** origini umili. Competenze: Addestrare animali, Sopravvivenza. Tratto: "Rusticità" — i contadini ti nascondono e proteggono.

  **Saggio:** studioso solitario. Competenze: Arcano, Storia. Tratto: "Ricercatore" — se non conosci un'informazione, sai dove trovarla.

  **Soldato:** esperienza militare. Competenze: Atletica, Intimidire. Tratto: "Rango militare" — i soldati di grado inferiore ti rispettano.

  **Nobile:** sangue blu. Competenze: Persuasione, Storia. Tratto: "Posizione di privilegio" — sei invitato ai circoli alti e la gente comune ti rispetta.

  **Artigiano della gilda:** mercante o artigiano. Competenze: Intuizione, Persuasione. Tratto: "Appartenenza alla gilda" — alloggio presso le sedi della gilda.

  **Selvaggio:** cresciuto nella natura selvaggia. Competenze: Atletica, Sopravvivenza. Tratto: "Perfetto camminatore" — trovi sempre cibo e acqua per te e 5 persone.

  **Intrattenitore:** artista, giullare, musicista. Competenze: Acrobazia, Intrattenere. Tratto: "Pubblico" — puoi sempre trovare un posto dove esibirti e guadagnare vitto.

  **Marinaio:** vita in mare. Competenze: Atletica, Percezione. Tratto: "Passaggio gratuito" — trovi passaggio su una nave in cambio di lavoro.`
      },
      {
        id: "talenti",
        title: "Talenti (Feats)",
        content: `Al livello 4, 8, 12, 16, 19 invece di aumentare le caratteristiche puoi prendere un talento:

  **Combattivi:**
  • **Combattere con due armi:** aggiungi il modificatore anche al secondo attacco
  • **Maestro d'armi da guerra:** +1 FOR, manovre con armi da guerra
  • **Sentinella:** attacco di opportunità ferma il nemico, puoi attaccare chi attacca un alleato
  • **Sparatutto da lontano:** ignori copertura parziale e 3/4, svantaggio a distanza ravvicinata non si applica
  • **Attaccante poderoso:** -5 al tiro per colpire, +10 al danno (con armi da mischia pesanti o a distanza)
  • **Sguainare rapido:** puoi sguainare come interazione gratuita e attaccare come azione bonus
  • **Caricatore:** dopo Scatto puoi fare attacco in mischia come azione bonus

  **Magici:**
  • **Incantatore da guerra:** vantaggio COS concentrazione, gesti somatici con armi/scudi
  • **Maestro degli incantesimi:** +1 CAR/INT/SAG, 2 cantrip, 1 incantesimo 1°lv
  • **Metamagia:** 2 opzioni di metamagia (come stregone), 2 punti stregoneria
  • **Sintonizzazione potenziata:** +1 slot attunement (max 4)

  **Utilità:**
  • **Mobile:** +10ft movimento, Disimpegno gratuito dopo attacco in mischia
  • **Resistente:** competenza in un tiro salvezza a scelta
  • **Furtivo:** +1 DES, non servono svantaggio su Furtività con armatura media
  • **Duro a morire:** max PF aumenta di +1 per livello
  • **Sveglia:** +1 INT/INT, +1 competenza, 3 linguaggi/strumenti

  **Regola:** cerca di abbinare il talento alla storia del PG. Un PG che ha una motivazione per un talento è più memorabile.`
      },
      {
        id: "multiclasse",
        title: "Multiclasse",
        content: `I PG possono prendere livelli in più classi. Regole:

  **Requisiti:** devi avere almeno 13 nella caratteristica primaria della nuova classe (es. 13 FOR per guerriero, 13 INT per mago).

  **Cosa ottieni:**
  • Dadi Vita del nuovo dado (es. se da mago d6 passi a guerriero d10)
  • Competenze dell'armatura della nuova classe
  • Competenze armi della nuova classe
  • Abilità di 1° livello della nuova classe (non quelle di livello superiore)

  **Cosa NON ottieni:**
  • Competenze abilità della nuova classe (solo quelle della prima classe)
  • Tiri salvezza della nuova classe
  • Equipaggiamento iniziale

  **Slot incantesimo (incantatori):** somma i livelli da incantatore (full: bardo/chierico/druido/stregone/mago = livello; metà: paladino/ranger = livello/2; warlock = separato) per determinare gli slot totali.

  **Esempio:** Guerriero 3 / Mago 2 ha slot da incantatore livello 3 (2/2+0/2 = 2). Può lanciare incantesimi di 1° e 2° livello ma conosce solo quelli del suo livello di mago (1° livello).

  **Regola per DM:** il multiclasse è potente ma complesso. Assicurati che il PG abbia una ragione narrativa per cambiare classe.`
      },
      {
        id: "personalita",
        title: "Personalità del personaggio",
        content: `Una buona personalità rende il PG memorabile:

  **Tratti di personalità (2):** come si comporta di solito
  • "Parlo con gli animali anche quando non serve"
  • "Non mi fido di nessuno finché non dimostra il contrario"
  • "Faccio a pugni prima di parlare"

  **Ideale (1):** cosa guida il personaggio
  • "La libertà è il bene più prezioso" (Caotico)
  • "La legge va rispettata sempre" (Legale)
  • "Il potere va usato per aiutare" (Buono)

  **Legame (1):** cosa/cuì è più legato
  • "Devo proteggere il mio villaggio"
  • "Cercherò vendetta per mio padre"
  • "Devo recuperare il cimelio di famiglia"

  **Difetto (1):** cosa lo rende vulnerabile
  • "Bevo troppo quando sono stressato"
  • "Mi fido di chiunque"
  • "Ho paura dell'acqua"

  Usa difetti e legami per creare conflitto. Quando un PG segue il suo difetto, dagli ispirazione.`
      },
    ]
  },
  {
    id: "volume-9",
    title: "Volume 9 — Servizi, spese e gestione risorse",
    desc: "Costi, servizi, trasporti, proprietà.",
    chapters: [
      {
        id: "stili-vita",
        title: "Stili di vita e costi",
        content: `Ogni PG ha uno stile di vita che determina le spese giornaliere:

  • **Miserabile** (2 mo/giorno) — dormi per strada o in fogna. Rischi di contrarre malattie.
  • **Povero** (2 ma/giorno) — locanda economica, cibo scarso. Razioni semplici.
  • **Modesto** (1 mo/giorno) — locanda decente, cibo caldo. La maggior parte dei soldati/sacerdoti vive così.
  • **Agìato** (2 mo/giorno) — buona locanda, tre pasti, stalla per il cavallo. Mercanti e nobili minori.
  • **Ricco** (4 mo/giorno) — locanda di lusso, servitù, vino pregiato. Mercanti ricchi.
  • **Aristocratico** (10+ mo/giorno) — palazzo, chef personale, valletti. Nobili e reali.

  **Regola pratica:** se un PG vuole risparmiare, lo stile di vita non è dettaglio da inseguire — chiedi solo quando conta (es. infiltrarsi in un ballo dell'alta società).`
      },
      {
        id: "servizi",
        title: "Servizi comuni",
        content: `Prezzi per servizi tipici (in monete d'oro):

  **Alloggio:**
  • Locanda modesta: 5 ma (notte)
  • Locanda confortevole: 8 ma (notte)
  • Suite di lusso: 2 mo (notte)
  • Bagno pubblico: 1 ma

  **Cibo e bevande:**
  • Pasto povero: 6 mr
  • Pasto modesto: 3 ma
  • Pasto agiato: 5 ma
  • Banchetto: 10+ ma
  • Boccale di birra: 4 mr
  • Boccale di vino: 1-2 ma
  • Boccale di vino pregiato: 10+ ma

  **Trasporti:**
  • Traghetto (attraversare fiume): 1 ma
  • Noleggio nave: 1 mo/miglio
  • Diligenza (tra città): 3 ma/miglio
  • Noleggio cavallo: 5 ma/giorno
  • Cavalcatura (comprare): 30-75 mo

  **Servizi:**
  • Guarigione in tempio (1° livello): 10 mo
  • Ristorare inferiori: 50 mo
  • Ristorare superiori: 200 mo
  • Scrivano (copia mappa/documento): 2 mo/giorno
  • Messaggero (città): 2 ma
  • Messaggero (regione): 2 mo

  **Intrattenimento:**
  • Taverna con musica: 1-5 ma/coperto
  • Teatro: 1-10 ma
  • Arena: 2-20 ma`
      },
      {
        id: "downtime",
        title: "Attività tra le avventure (Downtime)",
        content: `Tra un'avventura e l'altra, i PG possono fare attività:

  **Allenamento:** dopo aver guadagnato abbastanza XP per salire di livello, servono giorni di allenamento:
  • Livello 2-4: 10 giorni
  • Livello 5-10: 20 giorni
  • Livello 11-17: 30 giorni
  • Livello 18-20: 40 giorni
  Costo: 1 mo/giorno per istruttore se serve.

  **Artigianato:** per creare oggetti, servono materiali pari al 50% del prezzo di vendita. Ogni giorno produci 5 mo di valore (10 mo con strumenti da artigiano).

  **Ricerca in biblioteca:** trovare informazioni rare richiede giorni di ricerca. CD 15 + 1 per ogni giorno consecutivo. Costo: 1-2 mo/giorno per accesso.

  **Guadagno (lavoro):** tira un tiro abilità legato al background. Risultato × 5 = mo guadagnate. Richiede una settimana di lavoro.

  **Fare amicizie:** passa tempo in taverna/corti. Tira CAR (Persuasione/Intrattenere). Risultato 15+: contatto utile. 20+: contatto importante.

  **Creare pozioni:** richiede Kit da erborista, ingredienti (50% prezzo), 1 giorno per pozione comune, 5 per non comune, 20 per rara.`

      },
    ]
  },
  {
    id: "volume-10",
    title: "Volume 10 — Interazione sociale e intrighi",
    desc: "Gestire dialoghi, fazioni, reputazione.",
    chapters: [
      {
        id: "dialogo",
        title: "Condurre dialoghi",
        content: `Il dialogo è il cuore del roleplay. Ecco come gestirlo:

  **Non fare sempre tirare:** se un giocatore fa un'ottima proposta, falla funzionare senza tiro. Se la richiesta è irragionevole, il tiro non serve.

  **Usa gli atteggiamenti:** determina l'atteggiamento dell'NPC verso i PG:
  • **Amichevole:** CD 10 per ottenere un favore, 15 per qualcosa di rischioso
  • **Indifferente:** CD 15 per ottenere aiuto, 20 per qualcosa di rischioso
  • **Ostile:** CD 20 per ottenere informazioni, quasi impossibile per aiuto

  **Conseguenze dei fallimenti:** se un PG fallisce un tiro di Persuasione, l'NPC non cambia idea. Se fallisce male, l'atteggiamento peggiora.

  **Coinvolgi tutti:** non far monopolizzare il dialogo a un solo PG. Chiedi "mentre parli, cosa fanno gli altri?"

  **Domande utili per i giocatori:**
  • Cosa vuoi ottenere da questa conversazione?
  • Come lo chiedi? (tono, gesti, minacce, promesse)
  • Cosa sei disposto a offrire in cambio?`
      },
      {
        id: "fazioni",
        title: "Fazioni e reputazione",
        content: `Le fazioni danno struttura al mondo:

  **Esempi di fazioni:**
  • **Gilda dei ladri** — contrabbando, furti, omicidi su commissione
  • **Cerchio arcano** — maghi che custodiscono conoscenza proibita
  • **Ordine del grifone** — cavalieri che proteggono la regione
  • **Culto dell'occhio** — setta che venera entità oscure
  • **Mercanti dell'aurora** — gilda commerciale che opera in tutte le città
  • **Tribù del nord** — barbari che resistono all'invasione

  **Reputazione:** assegna un punteggio (-10 a +10) per ogni fazione:
  • -10 a -6: Nemici giurati — attaccano a vista
  • -5 a -1: Sospettosi — non si fidano, CD aumentata di 5
  • 0 a 4: Neutri — atteggiamento standard
  • 5 a 9: Amici — sconti, favori, informazioni privilegiate
  • 10: Eroi — accesso a risorse segrete, alleati fedeli

  **Cambiamenti:** ogni azione significativa modifica la reputazione (+1/-1 per azione minore, +3/-3 per azione maggiore). Salvare un membro: +2. Uccidere un membro: -5.`
      },
      {
        id: "intrighi",
        title: "Intrighi e complotti",
        content: `Per campagne politiche o investigative:

  **Triangolo di potere:** crea 3 fazioni/individui con obiettivi contrastanti:
  • Fazione A vuole X
  • Fazione B vuole Y (incompatibile con X)
  • Fazione C vuole Z (può allearsi con A o B)
  • I PG sono nel mezzo e possono spostare gli equilibri

  **Indizi (regola del 3):** per ogni informazione cruciale, prepara 3 indizi in luoghi diversi. Così i PG non si bloccano se ne mancano uno.

  **Sospetti e colpi di scena:**
  • Un NPC fidato tradisce (ma non subito — costruisci la fiducia prima)
  • Un apparente nemico diventa alleato
  • Il vero mandante non è chi sembra
  • L'oggetto della ricerca non è quello che sembra

  **Avanzamento:**
  • Fase 1: i PG scoprono che qualcosa non va
  • Fase 2: raccolgono indizi e identificano le fazioni
  • Fase 3: scelgono uno schieramento (o creano il proprio)
  • Fase 4: confronto finale con conseguenze durature

  **Consiglio:** lascia sempre ai PG la possibilità di cambiare schieramento o trovare una terza via.`
      },
      {
        id: "ricompense-sociali",
        title: "Ricompense sociali",
        content: `Non tutto si paga in oro:

  **Ricompense non monetarie:**
  • Un titolo nobiliare (barone, conte) — apre porte, ma porta responsabilità
  • Una proprietà (casa, torre, magazzino) — base operativa
  • Un favore di un NPC potente — si riscatta al momento giusto
  • Conoscenza proibita — segreti, mappe, incantesimi
  • Addestramento speciale — competenze o talenti
  • Seguito — 1d4 seguaci fedeli
  • Lettere di presentazione — accesso a circoli esclusivi
  • Perdono reale — cancellazione di crimini passati

  **Regola d'oro:** chiedi ai PG cosa desiderano per i loro personaggi. Alcuni vogliono potere, altri influenza, altri una casa. Adatta le ricompense ai desideri dei giocatori.`
      },
    ]
  },
];
