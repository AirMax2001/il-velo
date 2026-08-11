"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { subscribeToTable } from "@/lib/supabaseClient";
import type { PlayerTab } from "@/types/campaign";
import { CharacterSheet } from "@/components/player/CharacterSheet";
import { CharacterWizard, isWizardDone, markWizardDone } from "@/components/player/CharacterWizard";
import { RulesBrowser } from "@/components/shared/RulesBrowser";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { SaveBadge } from "@/components/player/sheet/ui";
import { getRaceData, findRaceKey } from "@/lib/data/races";

function PlayerView() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const sessionId = search.get("sessionId") || "";
  const token = params.code as string;

  const [player, setPlayer] = useState<any>(null);
  const [tab, setTab] = useState<PlayerTab>("sheet");
  const [showWizard, setShowWizard] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function loadPlayer() {
    const r = await fetch(`/api/players?token=${token}`);
    const d = await r.json();
    if (!d.player) {
      localStorage.removeItem("veil_player");
      localStorage.removeItem("veil_player_code");
      localStorage.removeItem("veil_player_email");
      router.push("/");
      return;
    }
    setPlayer(d.player);
    const hasData = d.player.character_data && Object.keys(d.player.character_data).length > 0;
    if (hasData) markWizardDone(d.player.id);
    if (!hasData && !isWizardDone(d.player.id)) {
      setTab("sheet");
      setShowWizard(true);
    }
  }

  useEffect(() => {
    loadPlayer();
  }, [token, router]);

  // Sync live: mentre la pagina è aperta, ricarica il personaggio ogni 5s
  // così le modifiche del DM (tiri morte, condizioni, HP) arrivano in diretta.
  useEffect(() => {
    const t = setInterval(loadPlayer, 5000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    const saved = localStorage.getItem("veil_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  if (!player) return <main className="min-h-screen p-6">Caricamento...</main>;

  const tabs = [
    { id: "sheet" as const, label: "Scheda" },
    { id: "diary" as const, label: "Diario" },
    { id: "rules" as const, label: "Regole" },
  ];

  const cd = player?.character_data || {};
  const hpPct = player?.hp_max ? (player?.hp_current || 0) / player.hp_max : 0;
  const raceKey = findRaceKey(player?.race || "");
  const raceData = raceKey ? getRaceData(raceKey) : null;
  const fmtXp = (n: any) => Number(n || 0).toLocaleString("it-IT");

  return (
    <main className="min-h-screen p-4 sm:p-6">
      {showWizard && (
        <CharacterWizard
          player={player}
          onComplete={(p) => { setPlayer(p); markWizardDone(p.id); setShowWizard(false); }}
          onClose={() => { markWizardDone(player.id); setShowWizard(false); }}
        />
      )}

      {/* Barra sticky: sopra a tutto (avatar, stat rapide, Esci) */}
      <div className="sticky top-0 z-30 -mx-1.5 mb-4 rounded-2xl border border-veil-gold/15 bg-[#12161f]/95 px-2.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded-full bg-gradient-to-br from-veil-gold/70 via-veil-gold/20 to-transparent p-[2px]">
            <PlayerAvatar url={player.avatar_url} name={player.character_name} size="md" />
          </div>
          <div className={`flex-1 grid gap-1.5 grid-cols-3 sm:grid-cols-4`}>
            <div className="flex min-w-0 flex-col items-center rounded-xl border border-emerald-400/15 bg-emerald-900/10 px-1 py-1.5">
              <span className="flex items-center gap-1 text-[11px] leading-none text-emerald-300/70">❤️ <span className="text-[7px] uppercase tracking-wider text-emerald-300/50">PF</span></span>
              <p className={`mt-0.5 text-xs font-bold truncate ${hpPct > 0.5 ? "text-emerald-300" : hpPct > 0.25 ? "text-yellow-300" : "text-red-300"}`}>
                {player?.hp_current ?? "?"}<span className="text-white/30 font-normal">/{player?.hp_max ?? "?"}</span>
              </p>
            </div>
            <div className="flex min-w-0 flex-col items-center rounded-xl border border-white/[0.07] bg-white/[0.04] px-1 py-1.5">
              <span className="flex items-center gap-1 text-[11px] leading-none text-veil-gold/70">🛡️ <span className="text-[7px] uppercase tracking-wider text-white/35">CA</span></span>
              <p className="mt-0.5 text-xs font-bold truncate text-white">{cd.armorClass || "—"}</p>
            </div>
            <div className="flex min-w-0 flex-col items-center rounded-xl border border-white/[0.07] bg-white/[0.04] px-1 py-1.5">
              <span className="flex items-center gap-1 text-[11px] leading-none text-veil-gold/70">👢 <span className="text-[7px] uppercase tracking-wider text-white/35">Vel.</span></span>
              <p className="mt-0.5 text-xs font-bold truncate text-white">{cd.speed || raceData?.speed || "—"}</p>
            </div>
            <div className="flex min-w-0 flex-col items-center rounded-xl border border-veil-gold/20 bg-veil-gold/[0.06] px-1 py-1.5">
              <span className="flex items-center gap-1 text-[11px] leading-none text-veil-gold/80">⭐ <span className="text-[7px] uppercase tracking-wider text-veil-gold/50">XP</span></span>
              <p className="mt-0.5 text-xs font-bold truncate text-veil-gold">{fmtXp(player?.xp)}</p>
            </div>
          </div>
          <div className="hidden sm:block"><SaveBadge state={saveState} /></div>
          <button
            onClick={() => { localStorage.removeItem("veil_player"); localStorage.removeItem("veil_player_code"); localStorage.removeItem("veil_player_email"); router.push("/"); }}
            className="shrink-0 rounded-xl border border-veil-gold/25 bg-veil-gold/[0.06] px-3 py-2 text-xs text-veil-gold/80 hover:border-red-300/40 hover:bg-red-900/20 hover:text-red-300 transition"
            title="Esci e torna alla home">
            Esci
          </button>
        </div>
        {player?.hp_max && player.hp_max > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className={`h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)] transition-all duration-300 ${hpPct > 0.5 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : hpPct > 0.25 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : "bg-gradient-to-r from-red-600 to-red-400"}`}
              style={{ width: `${Math.max(0, Math.min(100, hpPct * 100))}%` }} />
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => {
            setTab(t.id);
            if (t.id === "sheet") {
              const hasData = player.character_data && Object.keys(player.character_data).length > 0;
              if (!hasData && !isWizardDone(player.id)) setShowWizard(true);
            }
          }}
            className={`rounded-full px-3 py-2 text-sm veil-fable-card ${tab === t.id ? "border border-veil-gold text-veil-gold" : "text-white/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sheet" && (
        <CharacterSheet
          player={player}
          onUpdate={setPlayer}
          onSaveStateChange={setSaveState}
          onExit={() => {
            localStorage.removeItem("veil_player");
            localStorage.removeItem("veil_player_code");
            localStorage.removeItem("veil_player_email");
            router.push("/");
          }}
        />
      )}
      {tab === "diary" && <DiaryHub sessionId={sessionId} player={player} />}
      {tab === "rules" && (
        <div className="mx-auto max-w-3xl veil-premium-card p-5">
          <h2 className="text-lg text-veil-gold mb-4">Regole D&D</h2>
          <div className="max-h-[70vh] overflow-y-auto">
            <RulesBrowser />
          </div>
        </div>
      )}
    </main>
  );
}

// ---------- DIARY HUB (personal + group chat) ----------
function DiaryHub({ sessionId, player }: { sessionId: string; player: any }) {
  const [view, setView] = useState<"personal" | "group">("personal");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["personal", "Appunti personali"],
          ["group", "Diario di gruppo"]
        ].map(([id, label]) => (
          <button key={id} className={`veil-btn-secondary ${view === id ? "border-veil-gold" : ""}`} onClick={() => setView(id as any)}>
            {label}
          </button>
        ))}
      </div>
      {view === "personal" && <PersonalDiary sessionId={sessionId} playerId={player.id} />}
      {view === "group" && <GroupDiary sessionId={sessionId} playerId={player.id} characterName={player.character_name} />}
    </div>
  );
}

function PersonalDiary({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (!sessionId || !playerId) return;
    fetch(`/api/diary?sessionId=${sessionId}&playerId=${playerId}`).then(r => r.json()).then(d => setEntries(d.items || []));
  }, [sessionId, playerId]);

  async function addEntry() {
    await fetch("/api/diary", { method: "POST", body: JSON.stringify({ session_id: sessionId, player_id: playerId, ...form }) });
    setForm({ title: "", content: "" });
    const d = await fetch(`/api/diary?sessionId=${sessionId}&playerId=${playerId}`).then(r => r.json());
    setEntries(d.items || []);
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/diary?id=${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="veil-panel p-4">
      <h2 className="text-lg text-veil-gold">Diario personale</h2>
      <p className="mt-1 text-xs text-white/40">Privato. Visibile solo a te. Il DM non può leggere queste note.</p>
      <div className="mt-4 space-y-3">
        {entries.map(e => (
          <div key={e.id} className="rounded border border-white/10 bg-black/10 p-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{e.title || "Senza titolo"}</p>
              <button className="text-xs text-white/30 hover:text-red-300" onClick={() => deleteEntry(e.id)}>×</button>
            </div>
            <p className="mt-1 text-sm text-white/70 whitespace-pre-wrap">{e.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
        <input className="veil-input w-full" placeholder="Titolo (opzionale)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea className="veil-input w-full min-h-24" placeholder="Scrivi i tuoi pensieri..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
        <button className="veil-btn" onClick={addEntry}>Salva nel diario</button>
      </div>
    </div>
  );
}

// ---------- GROUP DIARY (shared chat) ----------
function GroupDiary({ sessionId, playerId, characterName }: { sessionId: string; playerId: string; characterName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  function load() {
    fetch(`/api/roleplay?sessionId=${sessionId}`).then(r => r.json()).then(d => setMessages(d.messages || []));
  }
  useEffect(() => {
    if (!sessionId) return;
    load();
    return subscribeToTable("roleplay_messages", sessionId, load);
  }, [sessionId]);

  async function send() {
    if (!text.trim()) return;
    await fetch("/api/roleplay", { method: "POST", body: JSON.stringify({ sessionId, playerId, characterName, content: text }) });
    setText("");
    load();
  }

  return (
    <div className="veil-panel p-4 flex flex-col h-96">
      <p className="text-xs text-white/40 mb-2">Tutti i giocatori possono scrivere qui. Il DM può leggere.</p>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-2">
        {messages.map(m => (
          <div key={m.id} className={m.player_id === playerId ? "text-right" : ""}>
            <span className="text-xs text-veil-gold">{m.character_name}</span>
            <p className="text-sm veil-panel inline-block px-3 py-1">{m.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="veil-input flex-1" placeholder="Scrivi nel diario di gruppo..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button className="veil-btn" onClick={send}>Invia</button>
      </div>
    </div>
  );
}

// ---------- ROLEPLAY CHAT ----------
function Roleplay({ sessionId, playerId, characterName }: { sessionId: string; playerId: string; characterName: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  function load() {
    fetch(`/api/roleplay?sessionId=${sessionId}`).then(r => r.json()).then(d => setMessages(d.messages || []));
  }
  useEffect(() => {
    if (!sessionId) return;
    load();
    return subscribeToTable("roleplay_messages", sessionId, load);
  }, [sessionId]);

  async function send() {
    if (!text.trim()) return;
    await fetch("/api/roleplay", { method: "POST", body: JSON.stringify({ sessionId, playerId, characterName, content: text }) });
    setText("");
  }

  return (
    <div className="veil-panel p-4 max-w-lg flex flex-col h-96">
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-2">
        {messages.map(m => (
          <div key={m.id} className={m.player_id === playerId ? "text-right" : ""}>
            <span className="text-xs text-veil-gold">{m.character_name}</span>
            <p className="text-sm veil-panel inline-block px-3 py-1">{m.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="veil-input flex-1" placeholder="Scrivi in scena..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button className="veil-btn" onClick={send}>Invia</button>
      </div>
    </div>
  );
}

// ---------- NOTIFICATIONS VIEW ----------
export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerView />
    </Suspense>
  );
}
