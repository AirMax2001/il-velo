"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { subscribeToTable } from "@/lib/supabaseClient";
import { WorldMap } from "@/components/WorldMap/WorldMap";
import { readTableDisplay, writeTableDisplay, type TableDisplayConfig } from "@/lib/tableDisplay";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function TableView() {
  const search = useSearchParams();
  const sessionId = search.get("sessionId") || "";
  const [location, setLocation] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [displayConfig, setDisplayConfig] = useState<TableDisplayConfig>(readTableDisplay(sessionId));
  const [locations, setLocations] = useState<any[]>([]);
  const [activeCombat, setActiveCombat] = useState<any>(null);
  const [combatants, setCombatants] = useState<any[]>([]);
  const tableCombatActive = useRef(false);
  const [playersBy, setPlayersBy] = useState<Record<string, any>>({});
  const [mapSelectedName, setMapSelectedName] = useState<string | null>(null);

  async function loadCombat() {
    try {
      const combats = await fetch(`/api/combat?sessionId=${sessionId}&active=true`).then(r => r.json());
      const list = Array.isArray(combats) ? combats : (combats?.items || []);
      const combat = list.find((c: any) => c.is_active) || null;
      if (combat && !tableCombatActive.current) return;
      setActiveCombat(combat);
      if (combat) {
        const cs = await fetch(`/api/combatants?combatId=${combat.id}`).then(r => r.json());
        setCombatants(Array.isArray(cs) ? cs : (cs?.items || []));
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
      setDisplayConfig(readTableDisplay(sessionId));
    }
    function syncCombat() {
      const parsed = readTableDisplay(sessionId);
      if (parsed.combatActive === true) {
        tableCombatActive.current = true;
        loadCombat();
      }
      if (parsed.combatActive === false) {
        tableCombatActive.current = false;
        setActiveCombat(null);
        setCombatants([]);
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

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/players?sessionId=${sessionId}`).then(r => r.json()).then(d => {
      const map: Record<string, any> = {};
      (d.players || []).forEach((p: any) => { map[p.character_name] = p; });
      setPlayersBy(map);
    });
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
    if (displayConfig.countdown === null || displayConfig.countdown <= 0) { setCountdownDisplay(null); return; }
    let remaining = displayConfig.countdown;
    const interval = setInterval(() => {
      remaining--;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setCountdownDisplay(`${mins}:${secs.toString().padStart(2, '0')}`);
      if (remaining <= 0) { clearInterval(interval); setCountdownDisplay("00:00"); }
    }, 1000);
    return () => clearInterval(interval);
  }, [displayConfig.countdown]);

  function updateConfig(partial: Partial<TableDisplayConfig>) {
    setDisplayConfig(writeTableDisplay(sessionId, partial));
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

  const combatEnemies = combatants.filter((c: any) => c.type !== "player" && !c.is_dead);
  const combatPlayers = combatants.filter((c: any) => c.type === "player" && !c.is_dead);
  const isPlayerTurn = (name: string) => displayConfig.currentTurn === name;
  const playerActions = ["⚔ Attacco", "✨ Incantesimo", "💨 Scatto", "🛡 Disimpegno", "🕊 Schiva", "🙈 Nasconditi", "📦 Usa oggetto", "🤝 Aiuto"];
  const playerData = (name: string) => playersBy[name]?.character_data || {};

  return (
    <>
    <main className={`relative min-h-screen p-6 text-center sm:p-10 ${atmosphereClass}`} style={backgroundStyle}>
      {/* Stability Overlay */}
      {stability !== "stable" && (
        <div className={`pointer-events-none absolute inset-0 ${stability === "broken" ? "veil-overlay-broken" : "veil-overlay-unstable"}`} />
      )}

      {/* Fog Effect */}
      {displayConfig.effect === "fog" && (
        <div className="pointer-events-none absolute inset-0" style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(200,200,220,${displayConfig.intensity}) 100%)`,
          animation: "veil-fog 8s ease-in-out infinite alternate"
        }} />
      )}

      {/* Rain Effect */}
      {displayConfig.effect === "rain" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: Math.floor(60 * displayConfig.intensity) }).map((_, i) => (
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
      {displayConfig.effect === "storm" && (
        <div className="pointer-events-none absolute inset-0"
          style={{
            animation: `veil-flash ${3 - displayConfig.intensity * 2}s infinite`,
            background: "rgba(255,255,255,0.03)"
          }} />
      )}

      {/* Glitch Effect */}
      {displayConfig.effect === "glitch" && (
        <div className="pointer-events-none absolute inset-0" style={{
          background: `repeating-linear-gradient(0deg, rgba(138,43,226,${displayConfig.intensity * 0.08}) 0px, transparent 2px, transparent ${4 - displayConfig.intensity * 2}px)`,
          animation: `veil-shift ${0.2 + (1 - displayConfig.intensity) * 0.3}s infinite`
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

      {/* COMBAT FULL SCREEN */}
      {activeCombat && !showMap && (
        <div className="absolute inset-0 z-10 flex flex-col bg-black">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-red-500/15 bg-black/60 px-8 py-4">
            <div className="flex items-center gap-3">
              <span className="animate-pulse text-2xl">⚔</span>
              <div className="text-left">
                <p className="text-lg font-bold uppercase tracking-[0.2em] text-red-300">Combattimento in corso</p>
                <p className="text-sm text-white/40">{activeCombat.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-base text-white/70">
              <span className="flex items-center gap-2">Round
                <b className="rounded-lg bg-red-500/20 px-3 py-1 text-2xl text-red-200">{activeCombat.round || 1}</b>
              </span>
              <span className="flex items-center gap-2">Turno
                <b className="rounded-lg bg-white/10 px-3 py-1 text-2xl text-white">{displayConfig.currentTurn || "—"}</b>
              </span>
            </div>
          </div>

          {/* Enemies (top) */}
          <div className="flex-1 overflow-y-auto px-8 pb-4 pt-6">
            <p className="mb-3 text-left text-[11px] uppercase tracking-[0.25em] text-red-400/70">Nemici</p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {combatEnemies.length === 0 && (
                <p className="col-span-full text-left text-sm text-white/20">Nessun nemico ancora inserito.</p>
              )}
              {combatEnemies.map(c => (
                <div key={c.id} className="rounded-2xl border-2 border-red-500/25 bg-gradient-to-b from-red-950/50 to-black p-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl text-red-300">{c.type === "boss" ? "⚔" : "○"}</span>
                    <span className="truncate text-xl font-bold text-white">{c.name}</span>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-4xl font-black text-red-200">{c.hp_current}</span>
                    <span className="text-xl text-white/40">/{c.hp_max}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-red-950">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, (c.hp_current / Math.max(1, c.hp_max)) * 100))}%` }} />
                  </div>
                  <div className="mt-2 text-center text-xs text-white/40">CA {c.armor_class}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Players (bottom) */}
          <div className="shrink-0 border-t border-white/10 bg-black/50 px-6 py-5">
            <p className="mb-3 text-left text-[11px] uppercase tracking-[0.25em] text-blue-400/70">Giocatori</p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {combatPlayers.length === 0 && (
                <p className="col-span-full text-left text-sm text-white/20">Nessun giocatore nel combattimento.</p>
              )}
              {combatPlayers.map(c => {
                const cd = playerData(c.name);
                const attacks = Array.isArray(cd.attacks) ? cd.attacks : [];
                const myTurn = isPlayerTurn(c.name);
                return (
                  <div key={c.id} className={`rounded-2xl border-2 p-4 ${myTurn ? "border-blue-400/70 bg-blue-950/30 shadow-[0_0_40px_rgba(59,130,246,0.25)]" : "border-blue-500/20 bg-black/40"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧑</span>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-xl font-bold text-white">{c.name}</p>
                        <p className="text-xs text-white/40">CA {c.armor_class} · Init {c.initiative}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-3xl font-black text-white">{c.hp_current}</p>
                        <p className="text-xs text-white/40">/{c.hp_max}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-blue-950/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-300 transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, (c.hp_current / Math.max(1, c.hp_max)) * 100))}%` }} />
                    </div>
                    {myTurn ? (
                      <div className="mt-3 text-left">
                        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-yellow-300">🎯 Il tuo turno</p>
                        <div className="flex flex-wrap gap-1.5">
                          {playerActions.map(a => (
                            <span key={a} className="rounded-lg border border-blue-400/30 bg-black/40 px-2.5 py-1.5 text-xs text-blue-100">{a}</span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-white/40">🏃 Movimento: {cd.speed ?? 30}</p>
                        {attacks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {attacks.map(atk => (
                              <p key={atk.name} className="rounded-lg bg-black/40 px-2.5 py-1.5 text-xs text-emerald-200">
                                ⚔ {atk.name} · {atk.bonus} · {atk.damage}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-center text-xs text-white/30">In attesa del tuo turno…</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showMap && !activeCombat ? (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center">
          {/* Countdown */}
          {countdownDisplay && (
            <div className="mb-8 text-6xl font-bold tracking-[0.1em] text-veil-gold/80">
              {countdownDisplay}
            </div>
          )}

          {/* Title */}
          {displayConfig.title && (
            <h2 className="mb-2 text-3xl tracking-[0.2em] text-white/90">{displayConfig.title}</h2>
          )}
          {displayConfig.subtitle && (
            <p className="mb-6 text-lg text-white/50">{displayConfig.subtitle}</p>
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
