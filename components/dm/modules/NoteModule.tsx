"use client";

import { useState, useCallback } from "react";
import { useCrud } from "@/hooks/useCrud";
import { CrudLayout } from "@/components/shared/CrudLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ListSkeleton } from "@/components/shared/Skeleton";
import { SearchInput } from "@/components/shared/SearchInput";
import { ReferencedBy } from "@/components/shared/ReferencedBy";

export function NoteModule({ sessionId }: { sessionId: string }) {
  const { items, loading, error, load, create, update, remove } = useCrud<any>({ sessionId, table: "dm_notes", apiBase: "notes" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", tagsInput: "" });
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([]);
  const [checklistInput, setChecklistInput] = useState("");

  const selected = items.find(i => i.id === selectedId);

  const filtered = search
    ? items.filter(i => {
        const q = search.toLowerCase();
        return i.title?.toLowerCase().includes(q) || i.content?.toLowerCase().includes(q) ||
          (i.tags || []).some((t: string) => t.toLowerCase().includes(q));
      })
    : items;

  function resetForm() {
    setForm({ title: "", content: "", tagsInput: "" });
    setChecklist([]);
    setEditing(false);
  }

  function handleEdit(item: any) {
    setForm({
      title: item.title || "",
      content: item.content || "",
      tagsInput: (item.tags || []).join(", ")
    });
    setChecklist(item.checklist || []);
    setSelectedId(item.id);
    setEditing(true);
  }

  function handleNew() {
    resetForm();
    setSelectedId(null);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      session_id: sessionId,
      title: form.title,
      content: form.content,
      tags: form.tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean),
      checklist
    };
    if (editing && selectedId) {
      await update(selectedId, payload);
    } else {
      const item = await create(payload);
      if (item) setSelectedId(item.id);
    }
    resetForm();
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget);
    if (selectedId === deleteTarget) { setSelectedId(null); resetForm(); }
    setDeleteTarget(null);
  }

  function addChecklistItem() {
    if (!checklistInput.trim()) return;
    setChecklist(prev => [...prev, { text: checklistInput.trim(), done: false }]);
    setChecklistInput("");
  }

  function toggleChecklist(index: number) {
    setChecklist(prev => prev.map((item, i) => i === index ? { ...item, done: !item.done } : item));
  }

  function removeChecklist(index: number) {
    setChecklist(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <CrudLayout
        title="Note DM"
        searchValue={search}
        onSearchChange={setSearch}
        onNew={handleNew}
        newLabel="Nota"
        list={
          loading ? <ListSkeleton /> :
          error ? <ErrorState message={error} onRetry={load} /> :
          filtered.length === 0 ? <EmptyState title="Nessuna nota" description={search ? "Prova a modificare la ricerca" : "Crea la prima nota con il pulsante +"} /> :
          <div className="space-y-1">
            {filtered.map(item => (
              <div key={item.id} className="relative">
                <button
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    selectedId === item.id ? "border-veil-gold/40 bg-veil-gold/10" : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                  onClick={() => handleEdit(item)}
                >
                  <span className="font-medium text-white">{item.title}</span>
                  {(item.tags || []).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="rounded border border-veil-gold/20 bg-veil-gold/5 px-1.5 py-0.5 text-[10px] text-veil-gold/70">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
                <button className="absolute right-2 top-2 text-xs text-white/25 hover:text-red-300" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id); }}>×</button>
              </div>
            ))}
          </div>
        }
        editor={
          <div className="veil-premium-card p-5">
            <h3 className="mb-5 text-lg text-veil-gold">{editing ? "Modifica nota" : "Nuova nota"}</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-white/50">Titolo</label>
                <input className="veil-input w-full" placeholder="Titolo nota" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Contenuto (Markdown)</label>
                <textarea className="veil-input w-full min-h-32" placeholder="Scrivi le tue note in Markdown..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Tag (separati da virgola)</label>
                <input className="veil-input w-full" placeholder="trama, segreti, NPC" value={form.tagsInput} onChange={e => setForm({ ...form, tagsInput: e.target.value })} />
                {form.tagsInput && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {form.tagsInput.split(",").map((t, i) => t.trim() && (
                      <span key={i} className="rounded border border-veil-gold/20 bg-veil-gold/5 px-2 py-0.5 text-xs text-veil-gold/70">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/50">Checklist</label>
                <div className="space-y-1">
                  {checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="checkbox" checked={item.done} onChange={() => toggleChecklist(index)} className="accent-veil-gold" />
                      <span className={`flex-1 text-sm ${item.done ? "text-white/40 line-through" : "text-white/70"}`}>{item.text}</span>
                      <button className="text-xs text-white/25 hover:text-red-300" onClick={() => removeChecklist(index)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input className="veil-input flex-1 text-sm" placeholder="Nuovo elemento..." value={checklistInput} onChange={e => setChecklistInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addChecklistItem()} />
                  <button className="veil-btn-secondary text-xs !px-2 !py-1" onClick={addChecklistItem}>+</button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button className="veil-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Salvataggio..." : editing ? "Aggiorna" : "Crea"}
              </button>
              {editing && <button className="veil-btn-secondary" onClick={handleNew}>Annulla</button>}
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            {selected && (
              <ReferencedBy sessionId={sessionId} entityType="note" entityId={selected.id} />
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina nota"
        message="Sei sicuro di voler eliminare questa nota? Operazione irreversibile."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
