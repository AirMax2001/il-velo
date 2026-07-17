-- Admin / User Management migration
-- Aggiunge colonne per la gestione utenti

alter table players add column if not exists suspended boolean default false;
alter table players add column if not exists last_access timestamptz;
alter table players add column if not exists player_name text;
alter table players add column if not exists email text;

create index if not exists players_suspended_idx on players (suspended);
create index if not exists players_last_access_idx on players (last_access);

-- Admin log table
create table if not exists admin_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table admin_log enable row level security;
drop policy if exists "admin_log all" on admin_log;
create policy "admin_log all" on admin_log for all using (true);
