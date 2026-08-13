"use client";
import { useEffect, useState } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import type { SheetCtx } from "./types";

export function PartyTab({ ctx, sessionId }: { ctx: SheetCtx; sessionId?: string }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const playerId = ctx.form?.id;
  const characterName = ctx.form?.character_name || "Io";

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

  async function send() {
    if (!text.trim() || !sessionId) return;
    await fetch("/api/roleplay", {
      method: "POST",
      body: JSON.stringify({ sessionId, playerId, characterName, content: text }),
    });
    setText("");
    loadMessages();
  }

  return (
    <div className="veil-panel p-4">
      <h3 className="text-sm text-veil-gold/80 font-medium mb-1">Party</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Diario di gruppo della sessione: chiunque può scrivere, il DM può leggere.
      </p>

      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Chat di gruppo */}
        <div className="flex-1 flex flex-col h-80">
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-2">
            {messages.map(m => (
              <div key={m.id} className={m.player_id === playerId ? "text-right" : ""}>
                <span className="text-xs text-veil-gold">{m.character_name}</span>
                <p className="text-sm veil-panel inline-block px-3 py-1">{m.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="veil-input flex-1" placeholder="Scrivi nel diario di gruppo..." value={text}
              onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button className="veil-btn" onClick={send}>Invia</button>
          </div>
        </div>

        {/* Partecipanti: a destra su desktop, sopra la chat su mobile */}
        <div className="shrink-0 sm:w-28 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          {players.map(p => (
            <div key={p.id}
              className={`flex items-center gap-2 sm:flex-col sm:gap-1.5 rounded-xl border px-2 py-2 ${p.id === playerId ? "border-veil-gold/30 bg-veil-gold/[0.04]" : "border-white/[0.06] bg-black/20"}`}>
              <PlayerAvatar url={p.avatar_url} name={p.character_name || p.player_name} size="sm" />
              <span className="text-[10px] text-white/50 text-center truncate max-w-[72px] sm:max-w-full w-full">
                {p.character_name || p.player_name}
              </span>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-[10px] text-white/25 sm:text-center">Nessun altro partecipante.</p>
          )}
        </div>
      </div>
    </div>
  );
}