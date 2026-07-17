"use client";

import { useEffect, useState, useCallback } from "react";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/shared/Skeleton";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";

type PlayerRecord = {
  id: string;
  character_name: string;
  player_name: string;
  race: string;
  class: string;
  email: string;
  avatar_url?: string;
  suspended: boolean;
  last_access: string;
  created_at: string;
  sessions: { name: string; code: string };
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteCascade, setDeleteCascade] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string, variant = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function getToken() {
    return typeof window !== "undefined" ? localStorage.getItem("veil_dm_token") || "" : "";
  }

  function saveToken(token: string) {
    localStorage.setItem("veil_dm_token", token);
  }

  async function login() {
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ action: "create_session", dmPassword: password, name: "_admin_check" })
    });
    if (res.ok) {
      saveToken(password);
      setAuthenticated(true);
    } else {
      const data = await res.json();
      setError(data.error || "Password errata");
    }
  }

  async function loadPlayers() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/admin/players?${params}`, {
        headers: { authorization: `Bearer ${getToken()}` }
      });
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlayers(data.players || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated) loadPlayers();
  }, [authenticated, search, statusFilter]);

  async function updatePlayer(id: string, fields: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ id, ...fields })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("Giocatore aggiornato");
      loadPlayers();
      if (selectedPlayer?.id === id) {
        setSelectedPlayer({ ...selectedPlayer, ...fields });
        setEditForm({ ...editForm, ...fields });
      }
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function deletePlayer(id: string) {
    try {
      const res = await fetch(`/api/admin/players?id=${id}&cascade=${deleteCascade}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(deleteCascade ? "Giocatore e tutti i dati collegati eliminati" : "Giocatore eliminato");
      setDeleteTarget(null);
      setDeleteCascade(false);
      if (selectedPlayer?.id === id) setSelectedPlayer(null);
      loadPlayers();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen px-4 py-20">
        <div className="mx-auto max-w-md">
          <div className="veil-premium-card p-8">
            <p className="veil-kicker">Area riservata</p>
            <h1 className="mt-3 text-2xl text-veil-gold">Amministrazione</h1>
            <p className="mt-3 text-sm text-white/60">Inserisci la password DM per accedere al pannello di amministrazione.</p>
            <input
              className="veil-input mt-5 w-full"
              type="password"
              placeholder="Password DM"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            <button className="veil-btn mt-4 w-full" onClick={login}>Accedi</button>
            <a className="mt-4 block text-center text-xs text-white/40 hover:text-white/60" href="/">Torna alla home</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="veil-kicker">Amministrazione</p>
            <h1 className="mt-1 text-2xl text-veil-gold">Gestione Utenti</h1>
            <p className="mt-1 text-sm text-white/50">{players.length} giocatori trovati</p>
          </div>
          <a className="veil-btn-secondary text-xs" href="/dm">← Pannello DM</a>
          <button
            className="veil-btn-secondary text-xs !border-red-400/30 !text-red-300"
            onClick={() => {
              localStorage.removeItem("veil_dm_authenticated");
              localStorage.removeItem("veil_dm_token");
              window.location.href = "/dm";
            }}
          >
            Logout
          </button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-80 lg:shrink-0">
            <div className="veil-premium-card overflow-hidden">
              <div className="border-b border-white/10 p-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Cerca giocatori..." />
                <select className="veil-input mt-3 w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">Tutti</option>
                  <option value="active">Attivi</option>
                  <option value="suspended">Sospesi</option>
                </select>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <ErrorState message={error} onRetry={loadPlayers} />
                ) : players.length === 0 ? (
                  <EmptyState title="Nessun giocatore" description={search ? "Prova a modificare la ricerca" : "Nessun giocatore registrato"} />
                ) : (
                  <div className="space-y-1">
                    {players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPlayer(p); setEditForm(p); }}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                          selectedPlayer?.id === p.id
                            ? "border-veil-gold/40 bg-veil-gold/10"
                            : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <PlayerAvatar url={p.avatar_url} name={p.character_name} size="sm" initialsClass={p.suspended ? "bg-red-900/40 text-red-300" : "bg-emerald-900/40 text-emerald-300"} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{p.character_name}</p>
                          <p className="truncate text-xs text-white/50">{p.sessions?.name || "—"} · {p.class || "—"}</p>
                        </div>
                        {p.suspended && (
                          <span className="rounded border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">SOSPESO</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {!selectedPlayer ? (
              <div className="veil-premium-card p-8 text-center">
                <p className="text-white/40">Seleziona un giocatore per visualizzare e modificare i dettagli</p>
              </div>
            ) : (
              <div className="veil-premium-card p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl text-white">{selectedPlayer.character_name}</h2>
                    <p className="text-sm text-white/50">ID: {selectedPlayer.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedPlayer.suspended ? (
                      <button
                        className="veil-btn-secondary text-xs"
                        onClick={() => updatePlayer(selectedPlayer.id, { suspended: false })}
                        disabled={saving}
                      >
                        Riattiva
                      </button>
                    ) : (
                      <button
                        className="veil-btn-secondary text-xs !border-red-400/30 !text-red-300"
                        onClick={() => updatePlayer(selectedPlayer.id, { suspended: true })}
                        disabled={saving}
                      >
                        Sospendi
                      </button>
                    )}
                    <button
                      className="veil-btn-secondary text-xs !border-red-400/30 !text-red-300"
                      onClick={() => setDeleteTarget({ id: selectedPlayer.id, name: selectedPlayer.character_name })}
                    >
                      Elimina
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs text-white/40">Nome personaggio</label>
                    <input className="veil-input mt-1 w-full" value={editForm.character_name || ""} onChange={e => setEditForm({ ...editForm, character_name: e.target.value })} onBlur={() => updatePlayer(selectedPlayer.id, { character_name: editForm.character_name })} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Nome giocatore</label>
                    <input className="veil-input mt-1 w-full" value={editForm.player_name || ""} onChange={e => setEditForm({ ...editForm, player_name: e.target.value })} onBlur={() => updatePlayer(selectedPlayer.id, { player_name: editForm.player_name })} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Razza</label>
                    <input className="veil-input mt-1 w-full" value={editForm.race || ""} onChange={e => setEditForm({ ...editForm, race: e.target.value })} onBlur={() => updatePlayer(selectedPlayer.id, { race: editForm.race })} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Classe</label>
                    <input className="veil-input mt-1 w-full" value={editForm.class || ""} onChange={e => setEditForm({ ...editForm, class: e.target.value })} onBlur={() => updatePlayer(selectedPlayer.id, { class: editForm.class })} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Email</label>
                    <input className="veil-input mt-1 w-full" value={editForm.email || ""} onChange={e => setEditForm({ ...editForm, email: e.target.value })} onBlur={() => updatePlayer(selectedPlayer.id, { email: editForm.email })} />
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Ultimo accesso</label>
                    <p className="mt-1 text-sm text-white/70">{selectedPlayer.last_access ? new Date(selectedPlayer.last_access).toLocaleString("it-IT") : "Mai"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Campagna</label>
                    <p className="mt-1 text-sm text-white/70">{selectedPlayer.sessions?.name || "—"} ({selectedPlayer.sessions?.code || "—"})</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40">Registrato il</label>
                    <p className="mt-1 text-sm text-white/70">{new Date(selectedPlayer.created_at).toLocaleString("it-IT")}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-white/40">Stato</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${selectedPlayer.suspended ? "bg-red-400" : "bg-emerald-400"}`} />
                    <span className="text-sm text-white/70">{selectedPlayer.suspended ? "Sospeso" : "Attivo"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Elimina giocatore"
        message={`Sei sicuro di voler eliminare definitivamente "${deleteTarget?.name}"?`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={() => deleteTarget && deletePlayer(deleteTarget.id)}
        onCancel={() => { setDeleteTarget(null); setDeleteCascade(false); }}
      />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur ${
          toast.variant === "success"
            ? "border-emerald-400/30 bg-emerald-900/60 text-emerald-200"
            : "border-red-400/30 bg-red-900/60 text-red-200"
        }`}>
          {toast.message}
        </div>
      )}
    </main>
  );
}
