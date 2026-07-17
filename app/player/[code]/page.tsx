"use client";
import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { subscribeToTable } from "@/lib/supabaseClient";
import type { PlayerTab } from "@/types/campaign";
import { CharacterSheet } from "@/components/player/CharacterSheet";
import { CharacterWizard, isWizardDone, markWizardDone } from "@/components/player/CharacterWizard";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { RulesBrowser } from "@/components/shared/RulesBrowser";

type NotificationItem = {
  id: string; title: string; content: string; type: string;
  should_vibrate: boolean; is_read: boolean; created_at: string;
};

function PlayerView() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const sessionId = search.get("sessionId") || "";
  const token = params.code as string;

  const [player, setPlayer] = useState<any>(null);
  const [tab, setTab] = useState<PlayerTab>("inventory");
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetch(`/api/players?token=${token}`).then(async r => {
      const d = await r.json();
      if (!d.player) {
        localStorage.removeItem("veil_player");
        localStorage.removeItem("veil_player_code");
        localStorage.removeItem("veil_player_email");
        router.push("/");
        return;
      }
      setPlayer(d.player);
      if (d.player.character_data && Object.keys(d.player.character_data).length > 0) {
        markWizardDone();
      }
      if (!isWizardDone()) {
        setTab("sheet");
        setShowWizard(true);
      }
    });
  }, [token, router]);

  useEffect(() => {
    if (!sessionId || !player?.id) return;
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
      fetch(`/api/notifications?sessionId=${sessionId}&playerId=${player.id}`)
        .then(r => r.json())
        .then(d => {
          setUnreadCount((d.items || []).filter((n: NotificationItem) => !n.is_read).length);
        });
    }, 10000);
    const onVisible = () => { if (!document.hidden) setRefreshKey(k => k + 1); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [sessionId, player?.id]);

  useEffect(() => {
    fetch(`/api/players?token=${token}`).then(async r => {
      const d = await r.json();
      if (!d.player) {
        localStorage.removeItem("veil_player");
        localStorage.removeItem("veil_player_code");
        localStorage.removeItem("veil_player_email");
        router.push("/");
        return;
      }
      setPlayer(d.player);
    });
  }, [token, router]);

  useEffect(() => {
    const saved = localStorage.getItem("veil_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  if (!player) return <main className="min-h-screen p-6">Caricamento...</main>;

  const tabs = [
    { id: "inventory" as const, label: "Inventario" },
    { id: "home" as const, label: "Home" },
    { id: "sheet" as const, label: "Scheda" },
    { id: "diary" as const, label: "Diario" },
    { id: "rules" as const, label: "Regole" },
    { id: "notifications" as const, label: `Notifiche${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ];

  return (
    <main className="min-h-screen p-4 sm:p-6">
      {showWizard && (
        <CharacterWizard
          player={player}
          onComplete={(p) => { setPlayer(p); setShowWizard(false); }}
          onClose={() => { markWizardDone(); setShowWizard(false); }}
        />
      )}

      <div className="mb-5 rounded-[1.4rem] border border-veil-gold/20 bg-[linear-gradient(120deg,rgba(140,92,30,0.2),rgba(0,0,0,0.38))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <PlayerAvatar url={player.avatar_url} name={player.character_name} size="xl" />
            <div>
            <p className="veil-kicker">Il Velo</p>
            <h1 className="mt-2 text-2xl tracking-[0.24em] text-veil-gold">{player.character_name}</h1>
            <p className="mt-2 text-sm text-white/60">
              {player.race || "Personaggio"} · {player.class || "Classe da definire"}
              {player.level && <span> · Liv. {player.level}</span>}
            </p>
          </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { localStorage.removeItem("veil_player"); localStorage.removeItem("veil_player_code"); router.push("/"); }}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 hover:border-red-300/30 hover:text-red-300 transition"
              title="Esci e torna alla home"
            >
              Esci
            </button>
            <div className="veil-panel rounded-lg p-3 text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">HP</p>
              <p className="mt-1 text-white">{player.hp_current ?? "?"}/{player.hp_max ?? "?"}</p>
            </div>
            <div className="veil-panel rounded-lg p-3 text-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">XP</p>
              <p className="mt-1 text-white">{player.xp ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "sheet" && !isWizardDone()) setShowWizard(true); }}
            className={`rounded-full px-3 py-2 text-sm veil-fable-card ${tab === t.id ? "border border-veil-gold text-veil-gold" : "text-white/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inventory" && <InventoryView sessionId={sessionId} playerId={player.id} refreshKey={refreshKey} />}
      {tab === "home" && <PlayerHome sessionId={sessionId} player={player} />}
      {tab === "sheet" && <CharacterSheet player={player} onUpdate={setPlayer} />}
      {tab === "diary" && <DiaryHub sessionId={sessionId} player={player} />}
      {tab === "rules" && (
        <div className="mx-auto max-w-3xl veil-premium-card p-5">
          <h2 className="text-lg text-veil-gold mb-4">Regole D&D</h2>
          <div className="max-h-[70vh] overflow-y-auto">
            <RulesBrowser />
          </div>
        </div>
      )}
      {tab === "notifications" && <NotificationsView sessionId={sessionId} playerId={player.id} />}
    </main>
  );
}

// ---------- HOME (flexible) ----------
function PlayerHome({ sessionId, player }: { sessionId: string; player: any }) {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="veil-premium-card p-4">
        <h2 className="text-sm text-veil-gold">Personaggio</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="veil-surface rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Obiettivo</p>
            <p className="mt-1 text-sm text-white/70">{player.goals || "non definito"}</p>
          </div>
          <div className="veil-surface rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Paura</p>
            <p className="mt-1 text-sm text-white/70">{player.fear || "non definita"}</p>
          </div>
          <div className="veil-surface rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Monete</p>
            <p className="mt-1 text-sm text-veil-gold">{player.coins ?? 0}</p>
          </div>
          <div className="veil-surface rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Condizioni</p>
            <p className="mt-1 text-sm text-white/70">{(parseConditions(player.conditions) || []).join(", ") || "nessuna"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseConditions(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") try { return JSON.parse(raw); } catch { return []; }
  return [];
}

// ---------- INVENTORY (DM-assigned only) ----------
function InventoryView({ sessionId, playerId, refreshKey }: { sessionId: string; playerId: string; refreshKey: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  async function load() {
    const d = await fetch(`/api/inventory?sessionId=${sessionId}&playerId=${playerId}`).then(r => r.json());
    setItems(d.items || []);
  }
  useEffect(() => { if (sessionId && playerId) load(); }, [sessionId, playerId, refreshKey]);

  const categoryIcons: Record<string, string> = { general: "📦", weapon: "⚔", armor: "🛡", potion: "🧪", tool: "🔧", quest: "📜", relic: "💎" };

  const rarityColors: Record<string, string> = {
    common: "text-gray-400", rare: "text-emerald-400", epic: "text-purple-400",
    legendary: "text-yellow-400", artifact: "text-red-400", relic: "text-blue-400"
  };

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter || (filter === "relics" && i.is_relic));

  return (
    <div className="veil-premium-card p-4 max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <select className="veil-input text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tutti</option>
          <option value="weapon">Armi</option>
          <option value="armor">Armature</option>
          <option value="potion">Pozioni</option>
          <option value="tool">Attrezzi</option>
          <option value="relics">Reliquie</option>
          <option value="general">Generale</option>
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map(i => (
          <div key={i.id} className="relative rounded-lg border border-white/10 bg-black/20 p-3 text-center hover:border-veil-gold/30 transition group">
            <span className="text-3xl">{categoryIcons[i.category] || "📦"}</span>
            <p className={`mt-2 text-sm truncate ${rarityColors[i.rarity] || "text-white"}`}>{i.name}</p>
            {i.quantity > 1 && <span className="text-xs text-white/50">×{i.quantity}</span>}
            {i.rarity && <p className="text-[10px] text-white/30 capitalize">{i.rarity}</p>}
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-white/40 text-center py-8">Nessun oggetto assegnato dal DM.</p>}
    </div>
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
function NotificationsView({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = useCallback(() => {
    if (!sessionId || !playerId) return;
    fetch(`/api/notifications?sessionId=${sessionId}&playerId=${playerId}`)
      .then(r => r.json())
      .then(d => setNotifications(d.items || []));
  }, [sessionId, playerId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const typeIcons: Record<string, string> = {
    message: "💬", whisper: "🤫", vision: "🔮", memory: "🧠",
    combat: "⚔", quest: "📜", system: "⚙"
  };

  return (
    <div className="max-w-2xl">
      <div className="veil-premium-card p-5">
        <h2 className="text-lg text-veil-gold">Notifiche</h2>
        <div className="mt-4 space-y-2">
          {notifications.length === 0 && <p className="text-sm text-white/40">Nessuna notifica.</p>}
          {notifications.map(n => (
            <div key={n.id} className={`rounded-lg border p-4 transition ${n.is_read ? "border-white/5 bg-black/10 opacity-60" : "border-veil-gold/30 bg-veil-gold/5"}`}
              onClick={() => !n.is_read && markRead(n.id)}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{typeIcons[n.type] || "💬"}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-white/70">{n.content}</p>
                  <p className="mt-1 text-[10px] text-white/30">{new Date(n.created_at).toLocaleString("it-IT")}</p>
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-veil-gold" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerView />
    </Suspense>
  );
}
