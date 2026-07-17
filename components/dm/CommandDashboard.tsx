"use client";

import { useEffect, useState } from "react";
import { narrativePillars, veilModules, type ModuleStatus } from "@/lib/veilModules";
import type { DmSection } from "@/types/campaign";

type CommandDashboardProps = {
  session: any;
  sessionId: string;
  onOpenSection: (tab: DmSection) => void;
};

const statusLabels: Record<ModuleStatus, string> = {
  live: "Attivo",
  draft: "In progettazione",
  future: "Futuro"
};

const statusClasses: Record<ModuleStatus, string> = {
  live: "border-emerald-400/40 text-emerald-200 bg-emerald-500/10",
  draft: "border-veil-gold/40 text-veil-gold bg-veil-gold/10",
  future: "border-white/15 text-white/55 bg-white/5"
};

export function CommandDashboard({ session, sessionId, onOpenSection }: CommandDashboardProps) {
  const liveModules = veilModules.filter(module => module.status === "live").length;
  const draftModules = veilModules.filter(module => module.status === "draft").length;

  function sectionForModule(moduleId: string): DmSection {
    switch (moduleId) {
      case "campaigns": return "campaign";
      case "world": return "campaign";
      case "party": return "players";
      case "veil": return "session";
      case "relics": return "campaign";
      default: return "home";
    }
  }

  const [summary, setSummary] = useState({
    partyCount: 0,
    location: "Nessun luogo attivo",
    event: "Nessun evento attivo",
    npcCount: 0,
    questCount: 0,
    activeQuestCount: 0,
    anomalyCount: 0,
    locationCount: 0,
    factionCount: 0,
    relicCount: 0,
    noteCount: 0,
    timelineCount: 0,
    notifications: 0,
    latest: [] as string[],
    recentTimeline: [] as { title: string; era: string }[],
    decisionCount: 0
  });

  useEffect(() => {
    if (!sessionId) return;

    Promise.all([
      fetch(`/api/state?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/events?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/quests?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/factions?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/relics?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/notes?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/timeline?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/anomalies?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({}))
    ]).then(([stateData, playersData, eventsData, npcsData, questsData, locationsData, factionsData, relicsData, notesData, timelineData, anomaliesData]) => {
      const events = eventsData.items || [];
      const quests = questsData.items || [];
      const timeline = timelineData.items || [];
      setSummary({
        partyCount: (playersData.players || []).length,
        location: stateData.location?.name || "Nessun luogo attivo",
        event: stateData.event?.title || "Nessun evento attivo",
        npcCount: (npcsData.items || []).length,
        questCount: quests.length,
        activeQuestCount: quests.filter((q: any) => q.status === "active").length,
        anomalyCount: (anomaliesData.items || []).filter((a: any) => a.active).length,
        locationCount: (locationsData.locations || []).length,
        factionCount: (factionsData.items || []).length,
        relicCount: (relicsData.items || []).length,
        noteCount: (notesData.items || []).length,
        timelineCount: timeline.length,
        notifications: (stateData.anomalies || []).length,
        latest: events.slice(0, 4).map((event: any) => event.title),
        recentTimeline: timeline.slice(0, 5).map((t: any) => ({ title: t.title, era: t.era })),
        decisionCount: (stateData.state?.permanent_decisions || []).length
      });
    });
  }, [sessionId]);

  return (
    <section className="space-y-6">
      <div className="veil-hero overflow-hidden p-6 md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.32em] text-veil-gold/80">Premium DM Console</p>
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
              Ogni sessione parte da un centro chiaro e controllato.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
              Gestisci il mondo, invia messaggi, controlla il tavolo e mantieni il filo narrativo senza disperdere il focus del gruppo.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="veil-btn text-base" onClick={() => onOpenSection("session")}>Continua sessione</button>
              <button className="veil-btn-secondary" onClick={() => onOpenSection("locations")}>Scene live</button>
              <button className="veil-btn-secondary" onClick={() => onOpenSection("session")}>Invia Echo</button>
              <button className="veil-btn-secondary" onClick={() => onOpenSection("players")}>Party</button>
              {sessionId && (
                <a className="veil-btn-secondary" href={`/table?sessionId=${sessionId}`} target="_blank" rel="noreferrer">
                  Display tavolo
                </a>
              )}
            </div>
          </div>

          <div className="veil-glass p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-white/45">Campagna attiva</p>
            <h3 className="mt-2 text-2xl text-veil-gold">{session?.name || "Nessuna sessione caricata"}</h3>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Metric value={String(liveModules)} label="moduli attivi" />
              <Metric value={String(draftModules)} label="in arrivo" />
              <Metric value={session?.code || "--"} label="codice" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Sessione corrente" value={summary.event || "Nessun evento attivo"} onOpen={() => onOpenSection("session")} />
        <StatusCard label="Luogo corrente" value={summary.location || "Nessun luogo attivo"} onOpen={() => onOpenSection("locations")} />
        <StatusCard label="Party" value={`${summary.partyCount} personaggi`} onOpen={() => onOpenSection("players")} />
        <StatusCard label="Anomalie attive" value={`${summary.anomalyCount} anomalie`} onOpen={() => onOpenSection("session")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MiniMetric label="NPC" value={summary.npcCount} onClick={() => onOpenSection("npcs")} />
        <MiniMetric label="Quest" value={summary.questCount} sub={`${summary.activeQuestCount} attive`} onClick={() => onOpenSection("campaign")} />
        <MiniMetric label="Luoghi" value={summary.locationCount} onClick={() => onOpenSection("locations")} />
        <MiniMetric label="Fazioni" value={summary.factionCount} onClick={() => onOpenSection("campaign")} />
        <MiniMetric label="Reliquie" value={summary.relicCount} onClick={() => onOpenSection("campaign")} />
      </div>

      <div className="veil-premium-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg text-veil-gold">Session flow</h3>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-200">Live</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <p className="font-semibold text-white">1. Imposta la scena</p>
            <p className="mt-1">Scegli il luogo, attiva l'evento e prepara il mondo state.</p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <p className="font-semibold text-white">2. Gestisci il Velo</p>
            <p className="mt-1">Invia Echo, sogni, visioni e messaggi personali dal pannello The Veil.</p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <p className="font-semibold text-white">3. Mantieni il filo narrativo</p>
            <p className="mt-1">Aggiorna quest, timeline, indizi e note per non perdere continuità.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="veil-premium-card p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg text-veil-gold">Ultimi eventi Timeline</h3>
            <button className="text-xs veil-btn-secondary" onClick={() => onOpenSection("campaign")}>Timeline</button>
          </div>
          <div className="mt-4 space-y-3">
            {summary.recentTimeline.length === 0 && (
              <p className="text-sm text-white/40">Nessun evento registrato nella timeline.</p>
            )}
            {summary.recentTimeline.map((item, i) => (
              <p key={i} className="border-b border-white/10 pb-3 text-sm text-white/70">
                <span className="text-veil-gold/60">◈</span> {item.title}
              </p>
            ))}
          </div>
        </div>

        <div className="veil-premium-card p-5">
          <h3 className="text-lg text-veil-gold">Riepilogo rapido</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
              <span className="text-white/50">Note DM</span>
              <span className="text-white">{summary.noteCount}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
              <span className="text-white/50">Decisioni permanenti</span>
              <span className="text-white">{summary.decisionCount}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
              <span className="text-white/50">Eventi timeline</span>
              <span className="text-white">{summary.timelineCount}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2 text-sm">
              <span className="text-white/50">Quest attive</span>
              <span className="text-veil-gold">{summary.activeQuestCount}/{summary.questCount}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="veil-btn-secondary text-xs" onClick={() => onOpenSection("campaign")}>Note DM</button>
            <button className="veil-btn-secondary text-xs" onClick={() => onOpenSection("campaign")}>World State</button>
            <button className="veil-btn-secondary text-xs" onClick={() => onOpenSection("campaign")}>Indizi</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {veilModules.map(module => (
            <button key={module.id} type="button" onClick={() => onOpenSection(sectionForModule(module.id))} className="text-left veil-premium-card p-5 transition hover:border-veil-gold/45">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">{module.surface}</p>
                  <h3 className="mt-1 text-lg text-white">{module.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${statusClasses[module.status]}`}>
                  {statusLabels[module.status]}
                </span>
              </div>
              <p className="min-h-12 text-sm leading-6 text-white/65">{module.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {module.capabilities.map(capability => (
                  <span key={capability} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/55">
                    {capability}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="veil-premium-card p-5">
            <h3 className="text-lg text-veil-gold">Pilastri del progetto</h3>
            <div className="mt-4 space-y-3">
              {narrativePillars.map((pillar, index) => (
                <div key={pillar} className="flex gap-3 text-sm text-white/75">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-veil-gold/35 text-xs text-veil-gold">
                    {index + 1}
                  </span>
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="veil-premium-card p-5">
            <h3 className="text-lg text-veil-gold">Prossimo strato logico</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Il prossimo blocco naturale è trasformare timeline, quest, indizi e reliquie in tabelle vere, con API dedicate e permessi separati per DM e giocatori.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StatusCard({ label, value, onOpen }: { label: string; value: string; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="text-left veil-premium-card p-4 transition hover:border-veil-gold/40">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-lg text-white">{value}</p>
    </button>
  );
}

function MiniMetric({ label, value, sub, onClick }: { label: string; value: number; sub?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left veil-premium-card p-3 transition hover:border-veil-gold/40">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-1 text-2xl text-veil-gold">{value}</p>
      {sub && <p className="text-[11px] text-white/40">{sub}</p>}
    </button>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/20 p-3">
      <p className="truncate text-xl text-white">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">{label}</p>
    </div>
  );
}
