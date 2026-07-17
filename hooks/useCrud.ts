import { useState, useEffect, useCallback } from "react";
import { subscribeToTable } from "@/lib/supabaseClient";

type CrudConfig = {
  sessionId: string;
  table: string;
  apiBase: string;
  orderField?: string;
  orderDirection?: "asc" | "desc";
};

export function useCrud<T extends { id: string }>({ sessionId, table, apiBase, orderField = "created_at", orderDirection = "desc" }: CrudConfig) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/${apiBase}?sessionId=${sessionId}`);
      const data = await res.json();
      const list = data.items || data.locations || data.players || data.messages || [];
      setItems(list);
    } catch (e: any) {
      setError(e.message || "Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, [sessionId, apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeToTable(table, sessionId, load);
  }, [sessionId, table, load]);

  const create = useCallback(async (payload: any) => {
    setError("");
    try {
      const res = await fetch(`/api/${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
      return data.item;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [apiBase, load]);

  const update = useCallback(async (id: string, fields: any) => {
    setError("");
    try {
      const res = await fetch(`/api/${apiBase}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...fields } : item));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, [apiBase]);

  const remove = useCallback(async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/api/${apiBase}?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, [apiBase]);

  return { items, loading, error, load, create, update, remove };
}
