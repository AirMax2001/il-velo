export type ModuleStatus = "live" | "draft" | "future";

export type VeilModule = {
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  surface: "DM" | "Player" | "Tablet" | "System";
  capabilities: string[];
};

export const veilModules: VeilModule[] = [
  {
    id: "campaigns",
    title: "Campagne e Sessioni",
    description: "Centro operativo per creare campagne, rientrare nelle sessioni e coordinare il party.",
    status: "live",
    surface: "DM",
    capabilities: ["codice campagna", "sessione locale", "accesso DM", "accesso giocatori"]
  },
  {
    id: "world",
    title: "Atlante del Mondo",
    description: "Luoghi, scene, mappe e stato narrativo attivo sul display centrale.",
    status: "live",
    surface: "DM",
    capabilities: ["luoghi", "atmosfera", "display tavolo", "stato del Velo"]
  },
  {
    id: "party",
    title: "Party e Segreti",
    description: "Schede giocatore, paure, obiettivi e note private visibili solo al DM.",
    status: "live",
    surface: "Player",
    capabilities: ["scheda", "background", "obiettivo personale", "note DM"]
  },
  {
    id: "veil",
    title: "The Veil",
    description: "Messaggi segreti, visioni, ricordi corrotti e log di ciò che ogni giocatore riceve.",
    status: "live",
    surface: "System",
    capabilities: ["echo privati", "broadcast", "log lettura", "anomalie"]
  },
  {
    id: "story",
    title: "Timeline, Quest e Indizi",
    description: "Struttura narrativa modulare per eventi programmati, quest e traccia delle decisioni.",
    status: "draft",
    surface: "DM",
    capabilities: ["timeline", "quest", "indizi", "decisioni"]
  },
  {
    id: "relics",
    title: "Oggetti e Reliquie",
    description: "Inventario dei personaggi e oggetti chiave collegati al mistero del Velo.",
    status: "live",
    surface: "Player",
    capabilities: ["inventario", "reliquie", "oggetti personali", "descrizioni"]
  },
  {
    id: "immersion",
    title: "Display Immersivo",
    description: "Tablet centrale per luoghi, effetti atmosferici, mappe e rotture del Velo.",
    status: "live",
    surface: "Tablet",
    capabilities: ["scene", "mappa stilizzata", "nebbia/glitch", "evento attivo"]
  },
  {
    id: "future",
    title: "Motore VTT Futuro",
    description: "Spazio architetturale per combattimenti, dadi, audio, fog of war e sincronizzazione live.",
    status: "future",
    surface: "System",
    capabilities: ["combattimento", "dadi", "audio", "AI assistant"]
  }
];

export const narrativePillars = [
  "Regia DM in tempo reale",
  "Informazioni diverse per ogni giocatore",
  "Tablet come scena viva",
  "Log completo degli eventi del Velo",
  "Moduli espandibili senza riscrivere l'app"
];
