"use client";
import { useEffect, useState } from "react";
import type { DmSection } from "@/types/campaign";

type ControlCenterProps = {
  sessionId: string;
  session: any;
  onNavigate: (tab: DmSection) => void;
  onImport: () => void;
  onExport: () => void;
};

export function ControlCenter({ sessionId, session, onNavigate, onImport, onExport }: ControlCenterProps) {
  const [summary, setSummary] = useState({
    partyCount: 0,
    locationName: "—",
    missionTitle: "—",
    npcCount: 0,
    questCount: 0,
    activeQuestCount: 0,
  });
  const [showEchoViewer, setShowEchoViewer] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/state?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/npcs?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/quests?sessionId=${sessionId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([p, s, n, q]) => {
      const quests = q.items || [];
      setSummary({
        partyCount: (p.players || []).length,
        locationName: s.location?.name || s.state?.location_name || "—",
        missionTitle: s.event?.title || "—",
        npcCount: (n.items || []).length,
        questCount: quests.length,
        activeQuestCount: quests.filter((x: any) => x.status === "active").length,
      });
    });
  }, [sessionId]);

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-[0.12em] text-white">
          Control Center
        </h1>
        <p className="mt-2 text-sm text-white/40">
          {session ? `${session.name} — ${session.code}` : "Nessuna campagna attiva"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ActionBtn
          icon="▶"
          label="Continua Sessione"
          desc="Apri la sessione corrente"
          onClick={() => onNavigate("session")}
          accent
        />
        <ActionBtn
          icon="◇"
          label="Apri Campagna"
          desc="Gestisci mondo e lore"
          onClick={() => onNavigate("campaign")}
        />
        <ActionBtn
          icon="◆"
          label="Giocatori"
          desc={`${summary.partyCount} connessi`}
          onClick={() => onNavigate("players")}
        />
        <ActionBtn
          icon="⚔"
          label="Combattimento"
          desc="Gestisci iniziativa e round"
          onClick={() => onNavigate("combat")}
        />
        <ActionBtn
          icon="▤"
          label="Controllo Tavolo"
          desc="Invia schermo, effetti, musica"
          onClick={() => onNavigate("table")}
        />
        <ActionBtn
          icon="⇣"
          label="Importa Session Pack"
          desc="Nuova sessione dal JSON"
          onClick={onImport}
        />
        <ActionBtn
          icon="⇡"
          label="Esporta Report"
          desc="Report fine sessione"
          onClick={onExport}
        />
        <ActionBtn
          icon="○"
          label="NPC"
          desc={`${summary.npcCount} personaggi`}
          onClick={() => onNavigate("npcs")}
        />
        <ActionBtn
          icon="✕"
          label="Pulisci chat"
          desc="Elimina tutti i messaggi di gruppo"
          onClick={async () => {
            if (!window.confirm("Eliminare tutti i messaggi della chat di gruppo?")) return;
            await fetch(`/api/roleplay?sessionId=${sessionId}`, { method: "DELETE" });
          }}
        />
        <ActionBtn
          icon="ℹ"
          label="Visiona echi"
          desc="Vedi e gestisci le notifiche inviate"
          onClick={() => setShowEchoViewer(true)}
        />
      </div>

      {showEchoViewer && (
        <EchoViewer sessionId={sessionId} onClose={() => setShowEchoViewer(false)} />
      )}
    </div>
  );
}

function EchoViewer({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/notifications?sessionId=${sessionId}`).then(r => r.json()).then(d => setNotifications(d.items || []));
  }, [sessionId]);

  async function del(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function clearAll() {
    if (!window.confirm("Eliminare tutte le notifiche (echi)?")) return;
    await Promise.all(notifications.map(n => fetch(`/api/notifications?id=${n.id}`, { method: "DELETE" })));
    setNotifications([]);
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-veil-gold">Echi inviati ({notifications.length})</h2>
        <div className="flex gap-2">
          <button onClick={clearAll} className="rounded-lg border border-red-500/20 bg-red-900/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/30">Elimina tutti</button>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white">Chiudi</button>
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {notifications.length === 0 && <p className="text-sm text-white/40">Nessun echo inviato.</p>}
        {notifications.map(n => (
          <div key={n.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-veil-gold/60">{n.title}</span>
                {n.player_id && <span className="text-[10px] text-white/30">→ {n.player_id?.slice(0, 8)}...</span>}
              </div>
              <p className="text-sm text-white/70 mt-0.5">{n.content}</p>
              <p className="text-[10px] text-white/20 mt-1">{new Date(n.created_at).toLocaleString("it-IT")}</p>
            </div>
            <button onClick={() => del(n.id)} className="shrink-0 text-xs text-white/30 hover:text-red-300">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, desc, onClick, accent }: {
  icon: string; label: string; desc: string; onClick: () => void; accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
        accent
          ? "border-veil-gold/25 bg-[linear-gradient(135deg,rgba(201,164,76,0.08),rgba(201,164,76,0.02))] hover:border-veil-gold/50 hover:bg-[linear-gradient(135deg,rgba(201,164,76,0.14),rgba(201,164,76,0.05))]"
          : "border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.03]"
      }`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
        accent ? "bg-veil-gold/12 text-veil-gold" : "bg-white/[0.04] text-white/50"
      }`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${accent ? "text-veil-gold" : "text-white"}`}>{label}</p>
        <p className="mt-0.5 text-xs text-white/40">{desc}</p>
      </div>
    </button>
  );
}
