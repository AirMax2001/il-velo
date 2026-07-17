"use client";
import { useEffect, useState } from "react";

type SessionReviewProps = { sessionId: string };

export function SessionReview({ sessionId }: SessionReviewProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "", summary: "", player_decisions: "", killed_npcs: "", new_npcs: "",
    loot: "", found_relics: "", story_changes: "", campaign_changes: "", dm_notes: ""
  });
  const [selected, setSelected] = useState<any>(null);

  async function load() {
    if (!sessionId) return;
    const d = await fetch(`/api/session-reports?sessionId=${sessionId}`).then(r => r.json());
    setReports(d.items || []);
  }
  useEffect(() => { load(); }, [sessionId]);

  async function saveReport() {
    if (!sessionId) return;
    await fetch("/api/session-reports", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        session_number: reports.length + 1,
        title: form.title || `Report Sessione ${reports.length + 1}`,
        summary: form.summary,
        player_decisions: form.player_decisions.split("\n").filter(Boolean),
        killed_npcs: form.killed_npcs.split("\n").filter(Boolean),
        new_npcs: form.new_npcs.split("\n").filter(Boolean),
        loot: form.loot.split("\n").filter(Boolean),
        found_relics: form.found_relics.split("\n").filter(Boolean),
        story_changes: form.story_changes.split("\n").filter(Boolean),
        campaign_changes: form.campaign_changes.split("\n").filter(Boolean),
        dm_notes: form.dm_notes
      })
    });
    setForm({ title: "", summary: "", player_decisions: "", killed_npcs: "", new_npcs: "", loot: "", found_relics: "", story_changes: "", campaign_changes: "", dm_notes: "" });
    load();
  }

  function exportReport(r: any) {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${r.session_number || r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!sessionId) {
    return <p className="text-sm text-white/40">Seleziona una campagna per gestire i report.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h2 className="text-2xl font-semibold tracking-[0.1em] text-white">Report Sessione</h2>
      <p className="text-sm text-white/50">Compila il report a fine sessione. Sarà usato da ChatGPT per generare il prossimo Session Pack.</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* New report */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg text-veil-gold">Nuovo report</h3>
          <input className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" placeholder="Titolo (es. Sessione 3 - La foresta)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Riassunto" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Decisioni giocatori (una per riga)" value={form.player_decisions} onChange={e => setForm({ ...form, player_decisions: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="NPC uccisi" value={form.killed_npcs} onChange={e => setForm({ ...form, killed_npcs: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Nuovi NPC" value={form.new_npcs} onChange={e => setForm({ ...form, new_npcs: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Loot" value={form.loot} onChange={e => setForm({ ...form, loot: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Reliquie trovate" value={form.found_relics} onChange={e => setForm({ ...form, found_relics: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Cambiamenti storia" value={form.story_changes} onChange={e => setForm({ ...form, story_changes: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={2} placeholder="Cambiamenti campagna" value={form.campaign_changes} onChange={e => setForm({ ...form, campaign_changes: e.target.value })} />
          <textarea className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80" rows={4} placeholder="Note DM (esportate per ChatGPT)" value={form.dm_notes} onChange={e => setForm({ ...form, dm_notes: e.target.value })} />
          <button className="rounded-xl border border-veil-gold/30 bg-veil-gold/10 px-6 py-2 text-sm text-veil-gold hover:bg-veil-gold/20" onClick={saveReport}>Salva report</button>
        </div>

        {/* Reports list */}
        <div className="space-y-3">
          <h3 className="text-lg text-veil-gold">Report salvati</h3>
          {reports.length === 0 && <p className="text-sm text-white/40">Nessun report ancora salvato.</p>}
          {reports.map(r => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{r.title || `Sessione #${r.session_number}`}</p>
                  {r.summary && <p className="mt-1 text-xs text-white/50">{r.summary.slice(0, 80)}...</p>}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-white/20" onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                    {selected?.id === r.id ? "Chiudi" : "Vedi"}
                  </button>
                  <button className="rounded-lg border border-veil-gold/20 px-3 py-1 text-xs text-veil-gold/60 hover:bg-veil-gold/10" onClick={() => exportReport(r)}>
                    Export
                  </button>
                </div>
              </div>
              {selected?.id === r.id && (
                <div className="mt-4 border-t border-white/10 pt-4 space-y-2 text-xs text-white/60">
                  <p><strong className="text-white">Decisioni:</strong> {(r.player_decisions || []).join(", ") || "Nessuna"}</p>
                  <p><strong className="text-white">NPC uccisi:</strong> {(r.killed_npcs || []).join(", ") || "Nessuno"}</p>
                  <p><strong className="text-white">Nuovi NPC:</strong> {(r.new_npcs || []).join(", ") || "Nessuno"}</p>
                  <p><strong className="text-white">Loot:</strong> {(r.loot || []).join(", ") || "Nessuno"}</p>
                  <p><strong className="text-white">Reliquie:</strong> {(r.found_relics || []).join(", ") || "Nessuna"}</p>
                  <p><strong className="text-white">Storia:</strong> {(r.story_changes || []).join(", ") || "Nessuno"}</p>
                  <p><strong className="text-white">Campagna:</strong> {(r.campaign_changes || []).join(", ") || "Nessuno"}</p>
                  {r.dm_notes && <p className="pt-2 border-t border-white/10"><strong className="text-white">Note DM:</strong><br/>{r.dm_notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
