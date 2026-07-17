"use client";
import { useEffect, useState } from "react";
import { DmSidebar } from "@/components/dm/DmSidebar";
import { LiveAssistant } from "@/components/dm/LiveAssistant";
import { ControlCenter } from "@/components/dm/ControlCenter";
import { SessionWorkspace } from "@/components/dm/SessionWorkspace";
import { PlayerCards } from "@/components/dm/PlayerCards";
import { CombatCards } from "@/components/dm/CombatCards";
import { TableWorkspace } from "@/components/dm/TableWorkspace";
import { ImportCenter } from "@/components/dm/ImportCenter";
import { ExportSystem, generateSessionReport } from "@/lib/mythos/exporter";
import { NpcModule } from "@/components/dm/modules/NpcModule";
import { LocationModule } from "@/components/dm/modules/LocationModule";
import { ObjectsModule } from "@/components/dm/modules/ObjectsModule";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { GameEngineProvider, useGameEngine } from "@/lib/mythos/GameEngineContext";
import type { DmSection } from "@/types/campaign";

export default function DMPanel() {
  return (
    <GameEngineProvider>
      <DMPanelInner />
    </GameEngineProvider>
  );
}

function DMPanelInner() {
  const [authorized, setAuthorized] = useState(false);
  const [dmPassword, setDmPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<DmSection>("home");
  const [session, setSession] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [noteContent, setNoteContent] = useState("");
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { engine } = useGameEngine();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === "Escape") {
        setShowGlobalSearch(false);
        setShowImportModal(false);
        setShowExportModal(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const authed = localStorage.getItem("veil_dm_authenticated") === "true";
    setAuthorized(authed);
    if (authed) loadData();
    const saved = localStorage.getItem("veil_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  async function loadData() {
    const d = await fetch("/api/session?list=1").then(r => r.json());
    if (d.sessions) setCampaigns(d.sessions);
    const stored = localStorage.getItem("veil_session");
    if (stored) {
      try { setSession(JSON.parse(stored)); } catch {}
    }
  }

  async function loginDM() {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "verify_dm", dmPassword })
    });
    if (res.ok) {
      localStorage.setItem("veil_dm_authenticated", "true");
      setAuthorized(true);
      loadData();
    } else {
      try { setError((await res.json()).error || "Password errata"); } catch { setError("Password errata"); }
    }
  }

  function logout() {
    localStorage.removeItem("veil_dm_authenticated");
    localStorage.removeItem("veil_session");
    setAuthorized(false);
    setSession(null);
  }

  useEffect(() => {
    if (!session?.id) return;
    const key = `veil-notes-${session.id}`;
    const saved = localStorage.getItem(key);
    if (saved) setNoteContent(saved);
  }, [session?.id]);

  useEffect(() => {
    if (!session?.id) return;
    const key = `veil-notes-${session.id}`;
    localStorage.setItem(key, noteContent);
  }, [session?.id, noteContent]);

  if (!authorized) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-veil-gold/60">Portale riservato</p>
          <h1 className="text-3xl font-semibold tracking-[0.15em] text-white">DM Access</h1>
          <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white" type="password" placeholder="Password DM" value={dmPassword} onChange={e => setDmPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && loginDM()} autoFocus />
          <button className="w-full rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-4 py-3 text-sm text-veil-gold hover:bg-veil-gold/20" onClick={loginDM}>Accedi</button>
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </main>
    );
  }

  const sessionId = session?.id || "";

  return (
    <main className="flex h-screen bg-[#0b0c10] text-white">
      <DmSidebar activeTab={tab} onTabChange={setTab} onLogout={logout} onSearch={() => setShowGlobalSearch(true)} />

      <section className="flex-1 overflow-y-auto p-6">
        <div className={tab === "home" ? "" : "hidden"}>
          <ControlCenter
            sessionId={sessionId}
            session={session}
            onNavigate={setTab}
            onImport={() => setShowImportModal(true)}
            onExport={() => setShowExportModal(true)}
          />
        </div>
        <div className={tab === "campaign" ? "" : "hidden"}><CampaignWorkspace session={session} campaigns={campaigns} onSelect={(s: any) => { localStorage.setItem("veil_session", JSON.stringify(s)); setSession(s); }} /></div>
        <div className={tab === "session" ? "" : "hidden"}><SessionWorkspace sessionId={sessionId} /></div>
        <div className={tab === "players" ? "" : "hidden"}><PlayerCards sessionId={sessionId} /></div>
        <div className={tab === "npcs" ? "" : "hidden"}><NpcModule sessionId={sessionId} /></div>
        <div className={tab === "locations" ? "" : "hidden"}><LocationModule sessionId={sessionId} /></div>
        <div className={tab === "combat" ? "" : "hidden"}><CombatCards sessionId={sessionId} /></div>
        <div className={tab === "table" ? "" : "hidden"}><TableWorkspace sessionId={sessionId} /></div>
        <div className={tab === "assets" ? "" : "hidden"}><ObjectsModule sessionId={sessionId} /></div>
        <div className={tab === "settings" ? "" : "hidden"}><SettingsPlaceholder /></div>
      </section>

      <LiveAssistant />

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-12 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/[0.06] bg-[#0b0c10] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowImportModal(false)} className="absolute right-4 top-4 text-white/30 hover:text-white">&times;</button>
            <ImportCenter sessionId={sessionId} onImport={() => { setShowImportModal(false); loadData(); }} onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-12 backdrop-blur-sm" onClick={() => setShowExportModal(false)}>
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.06] bg-[#0b0c10] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowExportModal(false)} className="absolute right-4 top-4 text-white/30 hover:text-white">&times;</button>
            <ExportPanel sessionId={sessionId} noteContent={noteContent} />
          </div>
        </div>
      )}

      {showGlobalSearch && (
        <GlobalSearch
          sessionId={sessionId}
          onSelect={(type, id) => {
            const sectionMap: Record<string, DmSection> = {
              npc: "npcs", quest: "campaign", location: "locations",
              relic: "campaign", faction: "campaign", event: "campaign",
              timeline: "campaign", clue: "campaign", note: "campaign",
              player: "players"
            };
            setTab(sectionMap[type] || "home");
            setShowGlobalSearch(false);
          }}
          onClose={() => setShowGlobalSearch(false)}
        />
      )}
    </main>
  );
}

function CampaignWorkspace({ session, campaigns, onSelect }: { session: any; campaigns: any[]; onSelect: (s: any) => void }) {
  const [sessionPacks, setSessionPacks] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.id) { setSessionPacks([]); return; }
    fetch(`/api/session-packs?sessionId=${session.id}`)
      .then(r => r.json())
      .then(d => setSessionPacks(d.items || []));
  }, [session?.id]);

  async function deleteCampaign(id: string, name: string) {
    if (!window.confirm(`Eliminare la campagna "${name}" e tutti i suoi dati?`)) return;
    setDeleting(id);
    await fetch(`/api/session?id=${id}`, { method: "DELETE" });
    const updated = campaigns.filter(c => c.id !== id);
    if (session?.id === id) {
      const next = updated[0] || null;
      if (next) { localStorage.setItem("veil_session", JSON.stringify(next)); onSelect(next); }
      else { localStorage.removeItem("veil_session"); onSelect({} as any); }
    }
    setDeleting(null);
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Campagne</h2>

      <div className="grid gap-3 md:grid-cols-2">
        {campaigns.map(c => (
          <div key={c.id} className={`group relative rounded-2xl border p-5 transition ${
            session?.id === c.id
              ? "border-veil-gold/30 bg-[linear-gradient(135deg,rgba(201,164,76,0.06),transparent)]"
              : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
          }`}>
            <div className="flex items-start justify-between">
              <button onClick={() => onSelect(c)} className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="mt-0.5 text-xs text-white/40">{c.code}</p>
              </button>
              <button onClick={() => deleteCampaign(c.id, c.name)} disabled={deleting === c.id}
                className="shrink-0 rounded-lg px-2 py-1 text-[10px] text-white/20 hover:text-red-300 hover:bg-red-900/20 transition disabled:opacity-30"
              >{deleting === c.id ? "..." : "Elimina"}</button>
            </div>
            {session?.id === c.id && sessionPacks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-white/30 mr-1">Sessioni:</span>
                {sessionPacks.map((sp: any) => (
                  <span key={sp.id} className="rounded bg-veil-gold/8 px-2 py-0.5 text-[10px] text-veil-gold/70">#{sp.session_number || "?"}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-2 text-center py-8">
            <p className="text-sm text-white/30">Nessuna campagna importata.</p>
            <p className="mt-1 text-xs text-white/20">Vai su Home &rarr; Importa Campaign Pack per iniziare.</p>
          </div>
        )}
      </div>

      {session && (
        <div className="rounded-2xl border border-veil-gold/15 bg-veil-gold/[0.03] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl text-veil-gold">{session.name}</h3>
              <p className="mt-1 text-sm text-white/40">Codice: {session.code}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase">Sessioni importate</p>
              <p className="text-lg text-veil-gold">{sessionPacks.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportPanel({ sessionId, noteContent }: { sessionId: string; noteContent: string }) {
  const [status, setStatus] = useState("");

  async function doExport(type: string) {
    setStatus(`Esportazione ${type}...`);
    let result;
    switch (type) {
      case "campaign":
        result = await ExportSystem.exportCampaign(sessionId);
        if (result.success) ExportSystem.downloadJson(result.data, `campaign-export-${sessionId.slice(0, 8)}.json`);
        break;
      case "session":
        result = await ExportSystem.exportSession(sessionId);
        if (result.success) ExportSystem.downloadJson(result.data, `session-export-${sessionId.slice(0, 8)}.json`);
        break;
      case "players":
        result = await ExportSystem.exportPlayerStates(sessionId);
        if (result.success) ExportSystem.downloadJson(result.data, `players-export-${sessionId.slice(0, 8)}.json`);
        break;
      case "combat":
        result = await ExportSystem.exportCombatLog(sessionId);
        if (result.success) ExportSystem.downloadJson(result.data, `combat-export-${sessionId.slice(0, 8)}.json`);
        break;
      case "report":
        result = await generateSessionReport(sessionId, noteContent);
        if (result.success) ExportSystem.downloadJson(result.data, `session-report-${sessionId.slice(0, 8)}.json`);
        break;
    }
    if (result?.success) {
      setStatus(`${type} esportato con successo!`);
      setTimeout(() => setStatus(""), 3000);
    } else {
      setStatus(`Errore: ${result?.error || "sconosciuto"}`);
    }
  }

  if (!sessionId) return <p className="text-sm text-white/40">Seleziona una campagna per esportare i dati.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Export Center</h2>
      <p className="text-sm text-white/40">Esporta i dati della campagna come JSON pronti per ChatGPT.</p>
      <div className="grid grid-cols-2 gap-3">
        <ExportBtn label="Campagna completa" desc="Tutte le entità e lo stato" onClick={() => doExport("campaign")} />
        <ExportBtn label="Sessione corrente" desc="Scene, combattimenti, quest" onClick={() => doExport("session")} />
        <ExportBtn label="Stato giocatori" desc="HP, XP, inventario, condizioni" onClick={() => doExport("players")} />
        <ExportBtn label="Log combattimenti" desc="Round, turni, iniziativa" onClick={() => doExport("combat")} />
        <div className="col-span-2">
          <ExportBtn label="Report fine sessione" desc="Include le note DM, per ChatGPT" onClick={() => doExport("report")} accent />
        </div>
      </div>
      {status && <p className="text-sm text-emerald-300">{status}</p>}
    </div>
  );
}

function ExportBtn({ label, desc, onClick, accent }: { label: string; desc: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-5 text-left transition ${
      accent
        ? "border-veil-gold/25 bg-[linear-gradient(135deg,rgba(201,164,76,0.08),rgba(201,164,76,0.02))] hover:border-veil-gold/50"
        : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
    }`}>
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-0.5 text-xs text-white/40">{desc}</p>
    </button>
  );
}

function SettingsPlaceholder() {
  const [theme, setTheme] = useState("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("veil_theme") || "default";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    setMounted(true);
  }, []);

  function changeTheme(t: string) {
    setTheme(t);
    localStorage.setItem("veil_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }

  const themes = [
    { id: "default", name: "Default", desc: "Oscuro elegante · pattern linee sottili" },
    { id: "draconic", name: "Draconic", desc: "Rosso drago · pattern scaglie · pulsazione gold" },
    { id: "arcane", name: "Arcane", desc: "Magia viola · pattern stelle · luccichio arcano" },
    { id: "nature", name: "Nature", desc: "Foresta verde · pattern erba · angoli morbidi" },
    { id: "shadowfell", name: "Shadowfell", desc: "Ombra e tenebra · pattern nebbia · spigoli duri" },
    { id: "celestial", name: "Celestial", desc: "Chiaro sacro · bagliore caldo · font serif" },
    { id: "infernal", name: "Infernal", desc: "Inferno rossastro · pattern brace · pulsazione fuoco" },
    { id: "ocean", name: "Ocean", desc: "Abisso marino · pattern onde · bordi liquidi" },
  ];

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white mb-6">Impostazioni</h2>
      <p className="text-sm text-white/40 mb-6">Scegli il tema dell&apos;applicazione.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => changeTheme(t.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              theme === t.id
                ? "border-veil-gold/30 bg-veil-gold/10"
                : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
            }`}
          >
            <span className="text-xs uppercase tracking-wider text-veil-gold/60">{t.name}</span>
            <p className="mt-1 text-sm text-white/50">{t.desc}</p>
            {theme === t.id && <span className="mt-2 inline-block text-xs text-veil-gold">✓ Attivo</span>}
          </button>
        ))}
      </div>
    </div>
  );
}