-- THE VEIL - Battlemap schema extension
-- Esegui nel SQL Editor di Supabase.

create table if not exists battlemap_state (
  session_id uuid primary key references sessions(id) on delete cascade,
  background_type text default 'stone',
  grid_width int default 40,
  grid_height int default 30,
  tiles jsonb default '{}'::jsonb,
  decorations jsonb default '{}'::jsonb,
  tokens jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

-- Estensione world_state per sincronizzazione multidispositivo del display del tavolo
alter table world_state add column if not exists display_mode text default 'scene';

-- Row Level Security
alter table battlemap_state enable row level security;

drop policy if exists "public read battlemap_state" on battlemap_state;
create policy "public read battlemap_state" on battlemap_state for select using (true);

-- Abilita Realtime per questa tabella
alter publication supabase_realtime add table battlemap_state;
