"use client";
import { useEffect, useState } from "react";

type ImportManagerProps = { sessionId: string; onImport: () => void };

export function ImportManager({ sessionId, onImport }: ImportManagerProps) {
  const [mode, setMode] = useState<"campaign" | "session">("campaign");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleImport() {
    setError(""); setStatus("");
    if (!jsonText.trim()) return setError("Incolla il JSON del pack");

    let parsed: any;
    try { parsed = JSON.parse(jsonText); } catch { return setError("JSON non valido"); }

    if (mode === "campaign") {
      if (!parsed.world && !parsed.lore) return setError("Il Campaign Pack deve contenere 'world' o 'lore'");
      setStatus("Importazione Campaign Pack...");

      const createRes = await fetch("/api/session", {
        method: "POST",
        body: JSON.stringify({ action: "create_session", name: parsed.world?.name || parsed.name || "Campagna Importata" })
      });
      const createData = await createRes.json();
      if (createData.error) return setError(createData.error);

      const newSessionId = createData.session.id;
      await fetch("/api/campaign-packs", {
        method: "POST",
        body: JSON.stringify({ session_id: newSessionId, name: parsed.world?.name || parsed.name || "Campagna Importata", version: parsed.version || "1.0", data: parsed })
      });

      if (Array.isArray(parsed.npcs)) for (const npc of parsed.npcs) await fetch("/api/npcs", { method: "POST", body: JSON.stringify({ session_id: newSessionId, ...npc }) }).catch(() => {});
      if (Array.isArray(parsed.factions)) for (const f of parsed.factions) await fetch("/api/factions", { method: "POST", body: JSON.stringify({ session_id: newSessionId, ...f }) }).catch(() => {});
      if (Array.isArray(parsed.relics)) for (const r of parsed.relics) await fetch("/api/relics", { method: "POST", body: JSON.stringify({ session_id: newSessionId, ...r }) }).catch(() => {});
      if (Array.isArray(parsed.timeline)) for (const t of parsed.timeline) await fetch("/api/timeline", { method: "POST", body: JSON.stringify({ session_id: newSessionId, ...t }) }).catch(() => {});
      if (Array.isArray(parsed.cities)) for (const c of parsed.cities) await fetch("/api/locations", { method: "POST", body: JSON.stringify({ session_id: newSessionId, name: c.name || c, ambient_description: c.description || "", atmosphere: "calm" }) }).catch(() => {});

      localStorage.setItem("veil_session", JSON.stringify(createData.session));
      setStatus(`Campaign Pack importato! ${createData.session.name} (${createData.session.code})`);
      onImport();
      setTimeout(() => window.location.reload(), 1500);
    } else {
      if (!sessionId) return setError("Seleziona prima una campagna");
      if (!parsed.scenes && !parsed.narration) return setError("Il Session Pack deve contenere 'scenes' o 'narration'");

      setStatus("Importazione Session Pack...");
      const packsRes = await fetch(`/api/session-packs?sessionId=${sessionId}`);
      const packsData = await packsRes.json();
      const sessionNumber = (packsData.items || []).length + 1;

      await fetch("/api/session-packs", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, title: parsed.title || `Sessione ${sessionNumber}`, session_number: sessionNumber, data: parsed })
      });

      if (Array.isArray(parsed.scenes)) for (const scene of parsed.scenes) await fetch("/api/scenes", { method: "POST", body: JSON.stringify({ session_id: sessionId, ...scene }) }).catch(() => {});
      if (Array.isArray(parsed.combat)) for (const c of parsed.combat) await fetch("/api/combat", { method: "POST", body: JSON.stringify({ session_id: sessionId, ...c }) }).catch(() => {});
      if (Array.isArray(parsed.npcs)) for (const npc of parsed.npcs) await fetch("/api/npcs", { method: "POST", body: JSON.stringify({ session_id: sessionId, ...npc }) }).catch(() => {});

      setStatus(`Session Pack #${sessionNumber} importato!`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Import Pack</h2>
      <p className="text-sm text-white/50">L'applicazione NON crea contenuti. Importa Campaign Pack e Session Pack generati esternamente (ChatGPT).</p>

      <div className="flex gap-2">
        <button className={`rounded-xl border px-4 py-2 text-sm transition ${mode === "campaign" ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold" : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"}`} onClick={() => setMode("campaign")}>Campaign Pack</button>
        <button className={`rounded-xl border px-4 py-2 text-sm transition ${mode === "session" ? "border-veil-gold/40 bg-veil-gold/10 text-veil-gold" : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"}`} onClick={() => setMode("session")}>Session Pack</button>
      </div>

      {mode === "session" && !sessionId && (
        <p className="text-sm text-amber-300">Seleziona prima una campagna dalla sezione Campaign.</p>
      )}

      <textarea
        className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-white/70"
        rows={14}
        placeholder={mode === "campaign" ? '{"world": {"name": "..."}, "npcs": [...], "factions": [...], ...}' : '{"title": "Sessione 1", "scenes": [...], "combat": [...], ...}'}
        value={jsonText}
        onChange={e => setJsonText(e.target.value)}
      />

      <button className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-6 py-3 text-sm text-veil-gold hover:bg-veil-gold/20 disabled:opacity-30" onClick={handleImport} disabled={!jsonText.trim() || (mode === "session" && !sessionId)}>
        Importa {mode === "campaign" ? "Campaign Pack" : "Session Pack"}
      </button>

      {status && <p className="text-sm text-emerald-300">{status}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
