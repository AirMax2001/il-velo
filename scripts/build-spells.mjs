import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srd = JSON.parse(fs.readFileSync(path.join(__dirname, "srd/spells.json"), "utf8"));

const SCHOOLS = {
  abjuration: "Abiurazione",
  conjuration: "Evocazione",
  divination: "Divinazione",
  enchantment: "Ammaliamento",
  evocation: "Invocazione",
  illusion: "Illusione",
  necromancy: "Necromanzia",
  transmutation: "Trasmutazione",
};

const FEET_TO_M = { 5: "1,5 m", 10: "3 m", 15: "4,5 m", 20: "6 m", 30: "9 m", 40: "12 m", 60: "18 m", 90: "27 m", 100: "30 m", 120: "36 m", 150: "45 m", 300: "90 m", 500: "150 m", 600: "180 m", 1000: "300 m" };

function translateRange(r) {
  if (r === "Self") return "Sé";
  if (r === "Touch") return "Tocco";
  if (r === "Sight") return "A vista";
  if (r === "Special") return "Speciale";
  if (r === "Unlimited") return "Illimitata";
  if (r === "1 mile") return "1,5 km";
  if (r === "500 miles") return "800 km";
  let m = r.match(/^Self \(([\d ]+)-(foot) (cone|cube|radius|sphere|hemisphere|line)\)$/);
  if (m) {
    const shape = { cone: "cono", cube: "cubo", radius: "raggio", sphere: "sfera", hemisphere: "emisfero", line: "linea" }[m[3]];
    return `Sé (${shape} di ${FEET_TO_M[m[1]]})`;
  }
  if (r.includes("(30-foot radius" )) return "Sé (raggio di 9 m)";
  const ft = r.match(/^([\d ]+) feet$/);
  if (ft) return FEET_TO_M[ft[1]] ?? r;
  return r;
}

function translateDuration(d) {
  return d
    .replace(/^Concentration, up to /, "Concentrazione, fino a ")
    .replace(/^Instantaneous$/, "Istantanea")
    .replace(/^Instantaneous or 1 hour \(see below\)$/, "Istantanea o 1 ora (vedi sotto)")
    .replace(/^Until dispelled$/, "Finché non viene dissolta")
    .replace(/^Until dispelled or triggered$/, "Finché non viene dissolta o innescata")
    .replace(/^Up to 8 hours$/, "Fino a 8 ore")
    .replace(/^Up to 1 hour$/, "Fino a 1 ora")
    .replace(/^Up to 1 minute$/, "Fino a 1 minuto")
    .replace(/^1 round$/, "1 round")
    .replace(/^1 minute$/, "1 minuto")
    .replace(/^10 minutes$/, "10 minuti")
    .replace(/^1 hour$/, "1 ora")
    .replace(/^8 hours$/, "8 ore")
    .replace(/^24 hours$/, "24 ore")
    .replace(/^1 day$/, "1 giorno")
    .replace(/^7 days$/, "7 giorni")
    .replace(/^10 days$/, "10 giorni")
    .replace(/^30 days$/, "30 giorni")
    .replace(/^Special$/, "Speciale");
}

function translateTime(t) {
  const map = {
    "1 action": "1 azione",
    "1 bonus action": "1 azione bonus",
    "1 action or 8 hours": "1 azione o 8 ore",
    "1 minute": "1 minuto",
    "10 minutes": "10 minuti",
    "1 hour": "1 ora",
    "8 hours": "8 ore",
    "12 hours": "12 ore",
    "24 hours": "24 ore",
    "1 reaction, which you take when you are hit by an attack or targeted by the magic missile spell":
      "1 reazione, quando vieni colpito da un attacco o bersagliato da proiettile magico",
    "1 reaction, which you take in response to being damaged by a creature within 60 feet of you that you can see.":
      "1 reazione, in risposta a un danno subito da una creatura entro 18 m che puoi vedere",
    "1 reaction, which you take when you or a creature within 60 feet of you falls":
      "1 reazione, quando tu o una creatura entro 18 m da te cadete",
    "1 reaction, which you take when you see a creature within 60 feet of you casting a spell.":
      "1 reazione, quando vedi una creatura entro 18 m da te lanciare un incantesimo",
    "1 reaction, which you take when you take acid, cold, fire, lightning, or thunder damage":
      "1 reazione, quando subisci danno da acido, freddo, fuoco, fulmine o tuono",
  };
  return map[t] ?? t;
}

function componentsOf(c) {
  const parts = [];
  if (c.verbal) parts.push("V");
  if (c.somatic) parts.push("S");
  if (c.material) parts.push("M");
  return parts.join(", ");
}

const itFiles = fs.readdirSync(path.join(__dirname, "spells-it")).filter(f => f.endsWith(".json"));
const itMap = {};
for (const f of itFiles) Object.assign(itMap, JSON.parse(fs.readFileSync(path.join(__dirname, "spells-it", f), "utf8")));

const entries = [];
for (const s of srd) {
  const lvl = String(s.level).toLowerCase() === "cantrip" ? 0 : Number(s.level);
  const it = itMap[s.name];
  if (!it) {
    console.error(`MISSING IT ENTRY: ${s.name}`);
    process.exitCode = 1;
    continue;
  }
  entries.push({
    name: it.name,
    level: lvl,
    school: SCHOOLS[s.school] ?? s.school,
    castingTime: translateTime(s.casting_time),
    range: translateRange(s.range),
    components: componentsOf(s.components),
    duration: translateDuration(s.duration),
    description: it.description,
    classes: [...s.classes],
  });
}

for (const [enName, it] of Object.entries(itMap)) {
  if (!srd.some(s => s.name === enName)) {
    if (it.level === undefined) console.error(`UNKNOWN KEY IN MAP: ${enName}`);
  }
  if (it.level !== undefined) {
    entries.push({
      name: it.name,
      level: it.level,
      school: it.school,
      castingTime: it.castingTime,
      range: it.range,
      components: it.components,
      duration: it.duration,
      description: it.description,
      classes: it.classes,
    });
  }
}

entries.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "it"));

const out = `export type Spell = {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
};

export const spells: Spell[] = [
${entries.map(e => `  { name: ${JSON.stringify(e.name)}, level: ${e.level}, school: ${JSON.stringify(e.school)}, castingTime: ${JSON.stringify(e.castingTime)}, range: ${JSON.stringify(e.range)}, components: ${JSON.stringify(e.components)}, duration: ${JSON.stringify(e.duration)}, description: ${JSON.stringify(e.description)}, classes: ${JSON.stringify(e.classes)} },`).join("\n")}
];

export function getSpellsForClass(classKey: string, level: number): Spell[] {
  return spells.filter(s => s.level === level && s.classes.includes(classKey));
}

export function getSpellByName(name: string): Spell | undefined {
  return spells.find(s => s.name.toLowerCase() === name.toLowerCase());
}
`;

fs.writeFileSync(path.join(__dirname, "../lib/data/spells.ts"), out);
console.log(`Wrote ${entries.length} spells to lib/data/spells.ts`);