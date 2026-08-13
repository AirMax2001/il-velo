"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CharacterSheet } from "@/components/player/CharacterSheet";
import { CharacterWizard, isWizardDone, markWizardDone } from "@/components/player/CharacterWizard";
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
    localStorage.setItem("veil_player", JSON.stringify({ ...d.player, access_token: token, session_id: sessionId }));
    const hasData = d.player.character_data && Object.keys(d.player.character_data).length > 0;
    if (hasData) markWizardDone(d.player.id);
    if (!hasData && !isWizardDone(d.player.id)) {
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
            onClick={() => { localStorage.removeItem("veil_player_code"); localStorage.removeItem("veil_player_email"); router.push("/"); }}
            className="shrink-0 rounded-xl border border-veil-gold/25 bg-veil-gold/[0.06] px-3 py-2 text-xs text-veil-gold/80 hover:border-red-300/40 hover:bg-red-900/20 hover:text-red-300 transition"
            title="Esci e torna alla home (l'ultimo login resta salvato)">
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

      <CharacterSheet
        player={player}
        onUpdate={setPlayer}
        onSaveStateChange={setSaveState}
        sessionId={sessionId}
        onExit={() => {
          localStorage.removeItem("veil_player_code");
          localStorage.removeItem("veil_player_email");
          router.push("/");
        }}
      />
    </main>
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
