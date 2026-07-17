"use client";
import { useEffect, useState } from "react";

type TableWorkspaceProps = { sessionId: string };

export function TableWorkspace({ sessionId }: TableWorkspaceProps) {
  const [config, setConfig] = useState({
    backgroundImageUrl: "",
    sceneImageUrl: "",
    soundUrl: "",
    mapType: "classic" as string,
    mapMarkers: "",
    effect: "" as string,
    title: "",
    subtitle: "",
    countdown: 0,
  });

  useEffect(() => {
    if (!sessionId) return;
    try {
      const raw = localStorage.getItem(`veil-table-display:${sessionId}`);
      if (raw) setConfig(c => ({ ...c, ...JSON.parse(raw) }));
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`veil-table-display:${sessionId}`, JSON.stringify(config));
  }, [sessionId, config]);

  const effects = ["fog", "rain", "storm", "glitch"];

  return (
    <div className="flex h-full gap-6">
      {/* Controls */}
      <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
        <h3 className="text-xs uppercase tracking-[0.2em] text-white/30">Controlli Tavolo</h3>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Background</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" placeholder="URL immagine" value={config.backgroundImageUrl} onChange={e => setConfig({ ...config, backgroundImageUrl: e.target.value })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Scena</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" placeholder="URL immagine scena" value={config.sceneImageUrl} onChange={e => setConfig({ ...config, sceneImageUrl: e.target.value })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Musica / Suono</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" placeholder="URL audio" value={config.soundUrl} onChange={e => setConfig({ ...config, soundUrl: e.target.value })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Effetti</p>
          <div className="flex flex-wrap gap-1">
            {effects.map(eff => (
              <button
                key={eff}
                onClick={() => setConfig({ ...config, effect: config.effect === eff ? "" : eff })}
                className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                  config.effect === eff
                    ? "border-veil-gold/25 bg-veil-gold/10 text-veil-gold"
                    : "border-white/[0.06] bg-black/20 text-white/50 hover:border-white/[0.12]"
                }`}
              >
                {eff}
              </button>
            ))}
            <button onClick={() => setConfig({ ...config, effect: "" })} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-1.5 text-xs text-white/30 hover:border-white/[0.12]">
              × Clear
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Titolo</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" placeholder="Titolo schermo" value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Sottotitolo</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" placeholder="Sottotitolo" value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Countdown (secondi)</p>
          <input className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" type="number" value={config.countdown} onChange={e => setConfig({ ...config, countdown: Number(e.target.value) })} />
        </div>

        <div>
          <p className="text-[10px] text-white/30 mb-1">Mappa</p>
          <select className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" value={config.mapType} onChange={e => setConfig({ ...config, mapType: e.target.value })}>
            <option value="classic">Classica</option>
            <option value="tactical">Tattica</option>
            <option value="region">Regionale</option>
            <option value="nodes">Nodi</option>
          </select>
          <textarea className="mt-2 w-full rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2 text-sm text-white/60 focus:border-veil-gold/30 focus:outline-none" rows={2} placeholder="Marker mappa" value={config.mapMarkers} onChange={e => setConfig({ ...config, mapMarkers: e.target.value })} />
        </div>

        <div className="flex gap-2">
          <a
            href={`/table?sessionId=${sessionId}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl border border-veil-gold/20 bg-veil-gold/8 px-4 py-2.5 text-center text-sm text-veil-gold/80 hover:bg-veil-gold/15"
          >
            Apri schermo
          </a>
          <button
            onClick={() => { localStorage.removeItem(`veil-table-display:${sessionId}`); setConfig({ backgroundImageUrl: "", sceneImageUrl: "", soundUrl: "", mapType: "classic", mapMarkers: "", effect: "", title: "", subtitle: "", countdown: 0 }); }}
            className="rounded-xl border border-white/[0.06] bg-black/20 px-4 py-2.5 text-sm text-white/30 hover:border-white/[0.12]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1">
        <p className="text-xs text-white/30 mb-3">Anteprima tavolo</p>
        <div
          className="relative flex h-[calc(100vh-10rem)] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06]"
          style={{
            background: config.backgroundImageUrl ? `url(${config.backgroundImageUrl}) center/cover no-repeat` : "linear-gradient(135deg, #0a0a0f, #1a1020)",
          }}
        >
          {config.effect === "fog" && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10 animate-pulse" />}
          {config.effect === "rain" && <div className="pointer-events-none absolute inset-0" style={{ background: "repeating-linear-gradient(transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)" }} />}
          {config.effect === "storm" && <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-500/10 via-transparent to-gray-900/30" />}
          {config.effect === "glitch" && <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(138,43,226,0.1) 25%, transparent 50%, rgba(201,164,76,0.1) 75%, transparent 100%)", backgroundSize: "200% 100%", animation: "shift 3s ease infinite" }} />}

          {config.sceneImageUrl && (
            <img src={config.sceneImageUrl} alt="Scene" className="max-h-full max-w-full object-contain" />
          )}

          {config.title && (
            <div className="absolute bottom-12 left-0 right-0 text-center">
              <h2 className="text-4xl font-semibold tracking-[0.2em] text-white drop-shadow-2xl">{config.title}</h2>
              {config.subtitle && <p className="mt-2 text-lg text-white/60 drop-shadow-xl">{config.subtitle}</p>}
            </div>
          )}

          {config.countdown > 0 && (
            <div className="absolute right-6 top-6">
              <CountdownDisplay seconds={config.countdown} />
            </div>
          )}

          {!config.backgroundImageUrl && !config.sceneImageUrl && !config.title && (
            <p className="text-sm text-white/15">Modifica i controlli a sinistra per vedere l'anteprima</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownDisplay({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const interval = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-veil-gold/30 bg-black/50 text-2xl font-bold text-veil-gold">
      {remaining}
    </div>
  );
}
