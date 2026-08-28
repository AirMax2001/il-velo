"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { CharacterSheet } from "@/components/player/CharacterSheet";
import { CharacterWizard, isWizardDone, markWizardDone } from "@/components/player/CharacterWizard";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { SaveBadge } from "@/components/player/sheet/ui";
import { getRaceData, findRaceKey } from "@/lib/data/races";
import { subscribeToTable } from "@/lib/supabaseClient";

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

  // Sync live via Supabase Realtime: le modifiche del DM (condizioni, HP,
  // note) arrivano subito. Il polling resta come rete di sicurezza (30s).
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeToTable("players", sessionId, loadPlayer);
    const t = setInterval(loadPlayer, 30000);
    return () => { unsubscribe(); clearInterval(t); };
  }, [token, sessionId]);

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
