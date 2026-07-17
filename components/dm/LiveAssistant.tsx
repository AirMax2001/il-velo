"use client";
import { useState, useEffect, useRef } from "react";
import { useGameEngine } from "@/lib/mythos/GameEngineContext";
import { RulesBrowser } from "@/components/shared/RulesBrowser";

type LiveAssistantProps = {
  sessionId?: string;
  session?: any;
  noteContent?: string;
  onNoteChange?: (v: string) => void;
};

export function LiveAssistant({ sessionId: _sid, session: _session, noteContent: _nc, onNoteChange: _onc }: LiveAssistantProps) {
  const { engine, state } = useGameEngine();
  const [localNote, setLocalNote] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rulesTab, setRulesTab] = useState<"note" | "rules">("note");

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    const saved = localStorage.getItem("veil-quick-notes");
    if (saved) setLocalNote(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("veil-quick-notes", localNote);
  }, [localNote]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const worldVariables = state.save.worldVariables || {};

  return (
    <aside className="flex w-80 flex-col border-l border-white/[0.06] bg-black/20">
      <div className="flex items-center border-b border-white/[0.06]">
        <button
          onClick={() => setRulesTab("note")}
          className={`flex-1 px-4 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors ${
            rulesTab === "note" ? "text-veil-gold/70 border-b border-veil-gold/30" : "text-white/30 hover:text-white/50"
          }`}
        >
          Note
        </button>
        <button
          onClick={() => setRulesTab("rules")}
          className={`flex-1 px-4 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors ${
            rulesTab === "rules" ? "text-veil-gold/70 border-b border-veil-gold/30" : "text-white/30 hover:text-white/50"
          }`}
        >
          Regole
        </button>
      </div>

      {rulesTab === "note" ? (
        <div className="flex-1 overflow-y-auto space-y-5 p-4">
          {/* Quick Notes */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Note rapide</p>
            <textarea
              className="w-full rounded-xl border border-white/[0.06] bg-black/30 p-3 text-sm text-white/70 placeholder-white/20 resize-none focus:border-veil-gold/30 focus:outline-none"
              rows={5}
              placeholder="Scrivi note di sessione in tempo reale..."
              value={localNote}
              onChange={e => setLocalNote(e.target.value)}
            />
            <button
              onClick={() => { engine.addNote(localNote); setLocalNote(""); }}
              className="mt-2 w-full rounded-xl border border-veil-gold/20 bg-veil-gold/8 px-3 py-1.5 text-xs text-veil-gold/70 hover:bg-veil-gold/15"
            >
              Salva nota
            </button>
          </div>

          {/* Timer */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Timer</p>
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
              <span className="text-xl font-mono text-veil-gold">{formatTime(timer)}</span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`ml-auto rounded-lg px-3 py-1 text-xs ${
                  timerRunning ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"
                }`}
              >
                {timerRunning ? "Stop" : "Start"}
              </button>
              <button onClick={() => { setTimerRunning(false); setTimer(0); }} className="rounded-lg bg-white/8 px-3 py-1 text-xs text-white/40">Reset</button>
            </div>
          </div>

          {/* Variables */}
          {Object.keys(worldVariables).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Variabili</p>
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 space-y-1.5">
                {Object.entries(worldVariables).filter(([k]) => k !== "chapter" && k !== "session").map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-white/40 capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="text-veil-gold">{String(val)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs border-t border-white/[0.04] pt-1.5">
                  <span className="text-white/40">Veil Integrity</span>
                  <span className="text-veil-gold">{state.save.veilIntegrity}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Memory Progress</span>
                  <span className="text-veil-gold">{state.save.memoryProgress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Notes */}
          {state.save.notes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Note recenti</p>
              <div className="space-y-1">
                {state.save.notes.slice(-3).reverse().map((n, i) => (
                  <p key={i} className="rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-white/50">{n}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <RulesBrowser />
        </div>
      )}
    </aside>
  );
}
