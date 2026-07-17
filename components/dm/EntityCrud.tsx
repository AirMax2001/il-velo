"use client";

import { useState, useMemo } from "react";
import { useCrud } from "@/hooks/useCrud";
import { CrudLayout } from "@/components/shared/CrudLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ListSkeleton } from "@/components/shared/Skeleton";
import { ReferencedBy } from "@/components/shared/ReferencedBy";

type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "checkbox" | "color";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
};

type EntityCrudProps = {
  sessionId: string;
  title: string;
  apiBase: string;
  table: string;
  entityType: string;
  fields: FieldConfig[];
  defaultForm: Record<string, any>;
  searchFields: string[];
  sortOptions?: { value: string; label: string }[];
  renderListItem: (item: any, isSelected: boolean) => React.ReactNode;
  onItemCreated?: (item: any) => void;
};

export function EntityCrud({
  sessionId,
  title,
  apiBase,
  table,
  entityType,
  fields,
  defaultForm,
  searchFields,
  sortOptions,
  renderListItem,
  onItemCreated
}: EntityCrudProps) {
  const { items, loading, error, load, create, update, remove } = useCrud<any>({ sessionId, table, apiBase });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortOptions?.[0]?.value || "name");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => items.find(i => i.id === selectedId), [items, selectedId]);

  const filtered = useMemo(() => {
    let result = [...items];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        searchFields.some(f => String(item[f] || "").toLowerCase().includes(q))
      );
    }
    if (sort === "name") result.sort((a, b) => (a.name || a.title || "").localeCompare(b.name || b.title || ""));
    if (sort === "newest") result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    if (sort === "oldest") result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    return result;
  }, [items, search, sort, searchFields]);

  function resetForm() {
    setForm(defaultForm);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    if (editing && selectedId) {
      await update(selectedId, form);
    } else {
      const item = await create({ session_id: sessionId, ...form });
      if (item) {
        setSelectedId(item.id);
        if (onItemCreated) onItemCreated(item);
      }
    }
    resetForm();
    setSaving(false);
  }

  function handleEdit(item: any) {
    setForm({ ...defaultForm, ...item });
    setSelectedId(item.id);
    setEditing(true);
  }

  function handleNew() {
    resetForm();
    setSelectedId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget);
    if (selectedId === deleteTarget) {
      setSelectedId(null);
      resetForm();
    }
    setDeleteTarget(null);
  }

  const renderField = (field: FieldConfig) => {
    const value = form[field.key] ?? "";
    const setValue = (v: any) => setForm({ ...form, [field.key]: v });

    if (field.type === "textarea") {
      return (
        <textarea
          key={field.key}
          className={`veil-input w-full ${field.className || ""}`}
          placeholder={field.placeholder}
          rows={3}
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          key={field.key}
          className={`veil-input w-full ${field.className || ""}`}
          value={value}
          onChange={e => setValue(e.target.value)}
        >
          {(field.options || []).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="flex items-center gap-2 text-sm text-white/60">
          <input type="checkbox" checked={!!value} onChange={e => setValue(e.target.checked)} />
          {field.label}
        </label>
      );
    }
    if (field.type === "number") {
      return (
        <input
          key={field.key}
          className={`veil-input w-full ${field.className || ""}`}
          type="number"
          placeholder={field.placeholder}
          value={value}
          onChange={e => setValue(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    }
    return (
      <input
        key={field.key}
        className={`veil-input w-full ${field.className || ""}`}
        placeholder={field.placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    );
  };

  return (
    <>
      <CrudLayout
        title={title}
        searchValue={search}
        onSearchChange={setSearch}
        sortValue={sort}
        onSortChange={setSort}
        sortOptions={sortOptions || [{ value: "name", label: "Nome" }, { value: "newest", label: "Più recenti" }, { value: "oldest", label: "Più vecchi" }]}
        onNew={handleNew}
        newLabel={title}
        list={
          loading ? <ListSkeleton /> :
          error ? <ErrorState message={error} onRetry={load} /> :
          filtered.length === 0 ? <EmptyState title={`Nessun ${title.toLowerCase()}`} description={search ? "Prova a modificare la ricerca" : `Crea il primo ${title.toLowerCase()} usando il pulsante +`} /> :
          <div className="space-y-1">
            {filtered.map(item => (
              <div key={item.id} className="relative">
                <button
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    selectedId === item.id
                      ? "border-veil-gold/40 bg-veil-gold/10"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                  onClick={() => handleEdit(item)}
                >
                  {renderListItem(item, selectedId === item.id)}
                </button>
                <button
                  className="absolute right-2 top-2 text-xs text-white/25 hover:text-red-300"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.id); }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        }
        editor={
          <div className="veil-premium-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg text-veil-gold">
                {editing ? `Modifica ${title}` : `Nuovo ${title}`}
              </h3>
            </div>
            <div className="space-y-3">
              {fields.map(f => f.type !== "checkbox" && (
                <div key={f.key}>
                  <label className="mb-1 block text-xs text-white/50">{f.label}</label>
                  {renderField(f)}
                </div>
              ))}
              {fields.filter(f => f.type === "checkbox").map(renderField)}
            </div>

            <div className="mt-5 flex gap-3">
              <button className="veil-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Salvataggio..." : editing ? "Aggiorna" : "Crea"}
              </button>
              {editing && (
                <button className="veil-btn-secondary" onClick={handleNew}>
                  Annulla
                </button>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            {selected && (
              <ReferencedBy
                sessionId={sessionId}
                entityType={entityType}
                entityId={selected.id}
              />
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Elimina ${title}`}
        message={`Sei sicuro di voler eliminare questo ${title.toLowerCase()}? Operazione irreversibile.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
