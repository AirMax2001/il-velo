"use client";
import { useEffect, useState } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import type { SheetCtx } from "./types";

export function PartyTab({ ctx, sessionId, onExit }: { ctx: SheetCtx; sessionId?: string; onExit?: () => void; }) {
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
    <div className="space-y-4">
    <div className="veil-panel p-4">
      <h3 className="text-sm text-veil-gold/80 font-medium mb-1">Party</h3>
      <p className="text-[10px] text-white/30 mb-3">
        Diario di gruppo della sessione: chiunque può scrivere, il DM può leggere.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Partecipanti: a sinistra, più stretti */}
        <div className="shrink-0 sm:w-44 flex flex-col gap-3">
          {players.map((p, idx) => (
            <div key={p.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${p.id === playerId ? "border-veil-gold/50 bg-veil-gold/[0.08]" : "border-white/[0.10] bg-black/30"}`}>
              <PlayerAvatar url={p.avatar_url} name={p.character_name || p.player_name} size="md" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white/90 truncate">{p.character_name || p.player_name}</span>
                <span className="block text-[10px] text-white/40 truncate">{p.race || "—"} · {p.class || p.cls || p.class_name || "—"}</span>
                <span className="block text-[10px] text-white/30 truncate">{p.player_name || "—"}</span>
              </div>
              {idx === players.length - 1 && (
                <div className="flex gap-1 shrink-0 ml-auto">
                  <input className="veil-input min-w-[90px] w-28 text-[10px]" placeholder="Scrivi nel diario..." value={text}
                    onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
                  <button className="veil-btn text-[10px] px-2 shrink-0" onClick={send}>Invia</button>
                </div>
              )}
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-xs text-white/25">Nessun altro partecipante.</p>
          )}

        </div>

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
        </div>

      </div>

    </div>

    {/* Note aggiuntive — pannello separato sotto */}
    <div className="veil-panel p-4 mt-4">
      <h4 className="text-sm text-veil-gold/70 font-medium mb-2">Note Aggiuntive</h4>
      <textarea className="veil-input w-full min-h-[100px] text-sm"
        placeholder="Note varie, ricompense, missioni, ecc..."
        value={(ctx.cd as any)?.notes || ""}
        onChange={e => { ctx.updCd("notes", e.target.value); ctx.save({ notes: (ctx.formRef.current?.character_data as any)?.notes }); }}
      />
    </div>

    {onExit && (
      <button onClick={onExit} className="mt-2 w-full rounded-xl border border-red-300/20 bg-red-900/10 px-4 py-2.5 text-sm text-red-300/80 hover:border-red-300/30 hover:bg-red-900/20 hover:text-red-300 transition">⎋ Esci dalla sessione</button>
    )}
    </div>
  );
}