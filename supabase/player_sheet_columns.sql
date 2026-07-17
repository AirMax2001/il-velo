-- The Veil - aggiorna la tabella players per salvare la scheda giocatore.
-- Esegui questo file nel SQL Editor di Supabase se i campi scheda non vengono salvati.

alter table players
  add column if not exists password_hash text,
  add column if not exists race text,
  add column if not exists class text,
  add column if not exists background text,
  add column if not exists goals text,
  add column if not exists fear text,
  add column if not exists level int default 1,
  add column if not exists hp_current int,
  add column if not exists hp_max int,
  add column if not exists dm_private_notes text,
  add column if not exists personality text,
  add column if not exists history text,
  add column if not exists age text,
  add column if not exists important_person text,
  add column if not exists secret text,
  add column if not exists xp int default 0,
  add column if not exists temp_hp int default 0,
  add column if not exists coins int default 0,
  add column if not exists conditions text default '[]'::text;

create unique index if not exists players_unique_name_per_session on players (session_id, lower(character_name));
