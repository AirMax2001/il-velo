"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { subscribeToTable } from "@/lib/supabaseClient";
import { WorldMap } from "@/components/WorldMap/WorldMap";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type EffectConfig = {
  showFog: boolean; fogOpacity: number;
  showRain: boolean; rainIntensity: number;
  showStorm: boolean; stormIntensity: number;
  countdown: number | null;
  glitchIntensity: number;
  title: string;
  subtitle: string;
};

function TableView() {
  const search = useSearchParams();
  const sessionId = search.get("sessionId") || "";
  const [location, setLocation] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [effects, setEffects] = useState<EffectConfig>({
    showFog: false, fogOpacity: 0.3,
    showRain: false, rainIntensity: 0.5,
    showStorm: false, stormIntensity: 0.5,
    countdown: null, glitchIntensity: 0,
    title: "", subtitle: ""
  });
  const [displayConfig, setDisplayConfig] = useState<{
    backgroundImageUrl: string; sceneImageUrl: string; soundUrl: string;
    mapUrl: string; combatActive?: boolean; combatTitle?: string; currentTurn?: string; round?: number;
  }>({
    backgroundImageUrl: "", sceneImageUrl: "", soundUrl: "",
    mapUrl: ""
  });
  const [locations, setLocations] = useState<any[]>([]);
  const [activeCombat, setActiveCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const [mapSelectedName, setMapSelectedName] = useState<string | null>(null);

  async function loadCombat() {
    try {
      const combats = await fetch(`/api/combat?sessionId=${sessionId}&active=true`).then(r => r.json());
      const combat = Array.isArray(combats) ? combats.find((c: any) => c.is_active) : null;
      setActiveCombat(combat);
      if (combat) {
        const cs = await fetch(`/api/combatants?combatId=${combat.id}`).then(r => r.json());
        setCombatants(Array.isArray(cs) ? cs : []);
      } else {
        setCombatants([]);
      }
    } catch {
      setActiveCombat(null);
      setCombatants([]);
    }
  }

  function load() {
    fetch(`/api/state?sessionId=${sessionId}`).then(r => r.json()).then(d => {
      setLocation(d.location);
      setEvent(d.event);
      setState(d.state);
      setAnomalies(d.anomalies || []);
    });
    fetch(`/api/locations?sessionId=${sessionId}`).then(r => r.json()).then(d => {
      setLocations(d.locations || []);
    });
  }

  useEffect(() => {
    if (!sessionId) return;
    function sync() {
      const raw = localStorage.getItem(`veil-table-display:${sessionId}`);
      if (raw) setDisplayConfig(prev => ({ ...prev, ...JSON.parse(raw) }));
      const effRaw = localStorage.getItem(`veil-table-effects:${sessionId}`);
      if (effRaw) setEffects(prev => ({ ...prev, ...JSON.parse(effRaw) }));
    }
    function syncCombat() {
      const raw = localStorage.getItem(`veil-table-display:${sessionId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.combatActive === false) { setActiveCombat(null); setCombatants([]); }
        if (parsed.combatActive) loadCombat();
      }
    }
    sync();
    syncCombat();
    load();
    window.addEventListener("storage", sync);
    window.addEventListener("storage", syncCombat);
    const unsub1 = subscribeToTable("world_state", sessionId, load);
    const unsub2 = subscribeToTable("locations", sessionId, load);
    const unsub3 = subscribeToTable("veil_anomalies", sessionId, load);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("storage", syncCombat);
      unsub1(); unsub2(); unsub3();
    };
  }, [sessionId]);

  // Poll combat from API
  useEffect(() => {
    if (!sessionId) return;
    loadCombat();
    const interval = setInterval(loadCombat, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !displayConfig.soundUrl) return;
    const audio = new Audio(displayConfig.soundUrl);
    audio.loop = true;
    audio.volume = 0.25;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.currentTime = 0; };
  }, [sessionId, displayConfig.soundUrl]);

  // Countdown timer
  const [countdownDisplay, setCountdownDisplay] = useState<string | null>(null);
  useEffect(() => {
    if (effects.countdown === null || effects.countdown <= 0) { setCountdownDisplay(null); return; }
    let remaining = effects.countdown;
    const interval = setInterval(() => {
      remaining--;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setCountdownDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      if (remaining <= 0) { clearInterval(interval); setCountdownDisplay("00:00"); }
    }, 1000);
    return () => clearInterval(interval);
  }, [effects.countdown]);

  function updateConfig(partial: Partial<typeof displayConfig>) {
    setDisplayConfig(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(next));
      return next;
    });
  }

  function updateEffects(partial: Partial<EffectConfig>) {
    setEffects(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(`veil-table-effects:${sessionId}`, JSON.stringify(next));
      return next;
    });
  }

  const atmosphere = location?.atmosphere || "calm";
  const stability = state?.stability || "stable";
  const weather = state?.weather || "clear";
  const phase = state?.campaign_phase || "";
  const atmosphereClass = atmosphere === "glitch" ? "veil-glitch" : atmosphere === "disturbed" ? "veil-disturbed" : "";
  const backgroundStyle = displayConfig.backgroundImageUrl ? {
    backgroundImage: `url(${displayConfig.backgroundImageUrl})`,
    backgroundSize: "cover", backgroundPosition: "center"
  } : undefined;

  return (
    <>
    <main className={`relative min-h-screen p-6 text-center sm:p-10 ${atmosphereClass}`} style={backgroundStyle}>
      {/* Stability Overlay */}
      {stability !== "stable" && (
        <div className={`pointer-events-none absolute inset-0 ${stability === "broken" ? "veil-overlay-broken" : "veil-overlay-unstable"}`} />
      )}

      {/* Fog Effect */}
      {effects.showFog && (
        <div className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(200,200,220,${effects.fogOpacity}) 100%)`,
          animation: "veil-fog 8s ease-in-out infinite alternate"
        }} />
      )}

      {/* Rain Effect */}
      {effects.showRain && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: Math.floor(60 * effects.rainIntensity) }).map((_, i) => (
            <div key={i} className="absolute h-16 w-px bg-white/10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `veil-rain ${0.5 + Math.random() * 0.5}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4
              }} />
          ))}
        </div>
      )}

      {/* Storm Effect */}
      {effects.showStorm && (
        <div className="pointer-events-none absolute inset-0"
          style={{
            animation: `veil-flash ${3 - effects.stormIntensity * 2}s infinite`,
            background: "rgba(255,255,255,0.03)"
          }} />
      )}

      {/* Glitch Effect */}
      {effects.glitchIntensity > 0 && (
        <div className="pointer-events-none absolute inset-0" style={{
          background: `repeating-linear-gradient(0deg, rgba(138,43,226,${effects.glitchIntensity * 0.08}) 0px, transparent 2px, transparent ${4 - effects.glitchIntensity * 2}px)`,
          animation: `veil-shift ${0.2 + (1 - effects.glitchIntensity) * 0.3}s infinite`
        }} />
      )}

      {/* Controls */}
      <div className="absolute right-4 top-4 z-40 flex flex-wrap gap-2">
        <button
          className="rounded border border-veil-gold/20 bg-black/35 px-3 py-2 text-xs text-veil-gold backdrop-blur hover:bg-black/50"
          onClick={() => setShowMap(true)}
        >
          Mostra mappa
        </button>
      </div>

      {/* Full-bleed scene background */}
      {(() => {
        const bgSrc = displayConfig.sceneImageUrl || (location || mapSelectedName ? `/locations/${slugify(location?.name || mapSelectedName || "")}.png` : null);
        return bgSrc ? (
          <img
            src={bgSrc}
            alt=""
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : null;
      })()}

      {/* Combat overlay */}
      {activeCombat && !showMap && (
        <div className="absolute inset-x-0 top-0 z-30">
          <div className="bg-gradient-to-b from-red-950/80 via-red-950/50 to-transparent px-6 pb-8 pt-4">
            <div className="mx-auto flex max-w-3xl items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="animate-pulse text-lg">⚔</span>
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Combattimento in corso</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/60">
                <span>Round {activeCombat.round || 1}</span>
                <span className="text-white/80">Turno: <span className="text-red-300 font-medium">{displayConfig.currentTurn || "—"}</span></span>
              </div>
            </div>
            <div className="mx-auto mt-3 flex max-w-3xl flex-wrap gap-2">
              {combatants.filter(c => !c.is_dead).sort((a: any, b: any) => b.initiative - a.initiative).map((c: any) => (
                <div key={c.id} className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                  c.type === "player"
                    ? "bg-blue-900/40 text-blue-200 border border-blue-500/20"
                    : "bg-red-900/40 text-red-200 border border-red-500/20"
                }`}>
                  <span>{c.type === "player" ? "🧑" : c.type === "boss" ? "⚔" : "○"}</span>
                  <span>{c.name}</span>
                  <span className="opacity-60">HP {c.hp_current}/{c.hp_max}</span>
                  {displayConfig.currentTurn === c.name && <span className="ml-1 text-yellow-300">▶</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showMap ? (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center">
          {/* Countdown */}
          {countdownDisplay && (
            <div className="mb-8 text-6xl font-bold tracking-[0.1em] text-veil-gold/80">
              {countdownDisplay}
            </div>
          )}

          {/* Title */}
          {effects.title && (
            <h2 className="mb-2 text-3xl tracking-[0.2em] text-white/90">{effects.title}</h2>
          )}
          {effects.subtitle && (
            <p className="mb-6 text-lg text-white/50">{effects.subtitle}</p>
          )}



          {/* Anomalies */}
          {anomalies.filter((a: any) => a.active).length > 0 && (
            <div className="mt-8 flex flex-col gap-2">
              {anomalies.filter((a: any) => a.active).map((a: any) => (
                <p key={a.id} className="text-xs uppercase tracking-[0.24em] text-veil-accent/80">
                  ⚠ {a.title}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </main>
    {showMap && (
      <WorldMap
        sessionId={sessionId}
        onExitMap={(mapLoc) => {
          setShowMap(false);
          setMapSelectedName(mapLoc?.name || null);
          if (!mapLoc?.name) load();
        }}
      />
    )}
    </>
  );
}

// Keyframes for rain, fog, flash (injected via style tag)
function EffectStyles() {
  return (
    <style>{`
      @keyframes veil-rain {
        0% { transform: translateY(-100vh); }
        100% { transform: translateY(100vh); }
      }
      @keyframes veil-fog {
        0% { opacity: 0.6; transform: scale(1); }
        100% { opacity: 1; transform: scale(1.05); }
      }
      @keyframes veil-flash {
        0%, 95%, 100% { opacity: 0; }
        96% { opacity: 0.3; }
      }
    `}</style>
  );
}

export default function TablePage() {
  return (
    <Suspense>
      <EffectStyles />
      <TableView />
    </Suspense>
  );
}
