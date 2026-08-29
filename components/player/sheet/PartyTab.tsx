"use client";
import { useEffect, useState } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import type { SheetCtx } from "./types";

type View = "party" | "diary";

export function PartyTab({ ctx, sessionId }: { ctx: SheetCtx; sessionId?: string; onExit?: () => void; }) {
  const [view, setView] = useState<View>("party");
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [diaryText, setDiaryText] = useState("");

  const playerId = ctx.form?.id;
  const characterName = ctx.form?.character_name || "Io";
  const personalDiary = (ctx.cd as any)?.personalDiary || [];

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/players?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => setPlayers(d.players || []));
  }, [sessionId]);

  function loadMessages() {
    if (!sessionId) return;
    fetch(`/api/roleplay?sessionId=${sessionId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []));
  }

  useEffect(() => {
    if (!sessionId) return;
    loadMessages();
    return subscribeToTable("roleplay_messages", sessionId, loadMessages);
  }, [sessionId]);

  async function sendParty() {
    if (!text.trim() || !sessionId) return;
    await fetch("/api/roleplay", {
      method: "POST",
      body: JSON.stringify({ sessionId, playerId, characterName, content: text }),
    });
    setText("");
    loadMessages();
  }

  function sendDiary() {
    if (!diaryText.trim()) return;
    const newEntry = {
      id: Date.now().toString(),
      content: diaryText,
      character_name: characterName,
      created_at: new Date().toISOString(),
    };
    const updated = [...personalDiary, newEntry];
    ctx.updCd("personalDiary", updated);
    ctx.save({ personalDiary: updated });
    setDiaryText("");
  }

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setView("party")}
          className={`rounded-xl border p-2.5 text-center transition ${view === "party"
            ? "border-veil-gold/50 bg-veil-gold/10 text-veil-gold"
            : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"}`}>
          <span className="text-lg leading-none block mb-0.5">💬</span>
          <span className="text-[11px] font-medium">Chat Party</span>
        </button>
        <button onClick={() => setView("diary")}
          className={`rounded-xl border p-2.5 text-center transition ${view === "diary"
            ? "border-veil-gold/50 bg-veil-gold/10 text-veil-gold"
            : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60"}`}>
          <span className="text-lg leading-none block mb-0.5">📔</span>
          <span className="text-[11px] font-medium">Diario Personale</span>
        </button>
      </div>

      {/* Chat del Party */}
      {view === "party" && (
        <div className="veil-panel p-3">
          <div className="flex flex-col gap-3">
            {/* Elenco compatto partecipanti */}
            <div className="flex flex-wrap gap-1.5">
              {players.map(p => (
                <div key={p.id}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${p.id === playerId ? "border-veil-gold/50 bg-veil-gold/[0.08] text-veil-gold" : "border-white/[0.08] bg-white/[0.02] text-white/60"}`}>
                  <PlayerAvatar url={p.avatar_url} name={p.character_name || p.player_name} size="sm" />
                  <span className="font-medium truncate max-w-[100px]">{p.character_name || p.player_name}</span>
                </div>
              ))}
            </div>

            {/* Chat */}
            <div className="flex flex-col h-72">
              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-2">
                {messages.map(m => (
                  <div key={m.id} className={m.player_id === playerId ? "text-right" : ""}>
                    <span className="text-[10px] text-veil-gold/70">{m.character_name}</span>
                    <p className={`text-xs inline-block px-2.5 py-1 rounded-lg ${m.player_id === playerId ? "bg-veil-gold/10 border border-veil-gold/20 text-white/80" : "bg-black/30 border border-white/[0.06] text-white/70"}`}>{m.content}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-[11px] text-white/25 text-center py-4">Nessun messaggio ancora.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input className="veil-input flex-1 text-xs" placeholder="Scrivi..." value={text}
                  onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendParty()} />
                <button className="veil-btn px-2.5 text-xs" onClick={sendParty}>Invia</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diario Personale */}
      {view === "diary" && (
        <div className="veil-panel p-3">
          <div className="flex flex-col h-72">
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-2">
              {personalDiary.map((entry: any) => (
                <div key={entry.id} className="rounded-lg bg-black/20 border border-white/[0.06] px-2.5 py-2">
                  <p className="text-xs text-white/80">{entry.content}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">
                    {new Date(entry.created_at).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
              {personalDiary.length === 0 && (
                <p className="text-[11px] text-white/25 text-center py-4">Il tuo diario è vuoto.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input className="veil-input flex-1 text-xs" placeholder="Scrivi nel diario..." value={diaryText}
                onChange={e => setDiaryText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendDiary()} />
              <button className="veil-btn px-2.5 text-xs" onClick={sendDiary}>Scrivi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
