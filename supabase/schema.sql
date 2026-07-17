-- THE VEIL - schema database V1 completo (Supabase / Postgres)

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  character_name text not null,
  access_token text unique not null,
  password_hash text,
  race text,
  class text,
  background text,
  goals text,
  fear text,
  level int default 1,
  hp_current int,
  hp_max int,
  dm_private_notes text,
  created_at timestamptz default now()
);

create unique index if not exists players_unique_name_per_session on players (session_id, lower(character_name));

create table if not exists npcs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  description text,
  hidden_truth text,
  image_url text,
  behavior text default 'passive' check (behavior in ('passive','active','glitch')),
  memory_state text default 'stable' check (memory_state in ('stable','corrupted')),
  triggers text,
  created_at timestamptz default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  ambient_description text,
  map_image_url text,
  atmosphere text default 'calm' check (atmosphere in ('calm','disturbed','glitch')),
  is_current boolean default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean default true,
  trigger_type text default 'manual' check (trigger_type in ('manual','automatic')),
  image_url text,
  created_at timestamptz default now()
);

create table if not exists secrets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  title text not null,
  content text not null,
  revealed boolean default false,
  created_at timestamptz default now()
);

create table if not exists echo_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade, -- null = broadcast a tutti
  content text not null,
  type text default 'vision', -- vision | memory | whisper | corruption
  image_url text,
  created_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists world_state (
  session_id uuid primary key references sessions(id) on delete cascade,
  current_location_id uuid references locations(id),
  current_event_id uuid references events(id),
  stability text default 'stable' check (stability in ('stable','unstable','broken')),
  instability_meter int default 0 check (instability_meter between 0 and 100),
  updated_at timestamptz default now()
);

create table if not exists veil_anomalies (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  description text,
  severity int default 1 check (severity between 1 and 5),
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  name text not null,
  description text,
  is_relic boolean default false,
  created_at timestamptz default now()
);

create table if not exists memory_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade, -- null = log condiviso di gruppo
  title text not null,
  content text,
  entry_type text default 'memory' check (entry_type in ('quest','memory','fragment')),
  created_at timestamptz default now()
);

create table if not exists roleplay_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete set null, -- null = messaggio del DM/narratore
  character_name text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists dm_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table sessions enable row level security;
alter table players enable row level security;
alter table npcs enable row level security;
alter table locations enable row level security;
alter table events enable row level security;
alter table secrets enable row level security;
alter table echo_messages enable row level security;
alter table world_state enable row level security;
alter table veil_anomalies enable row level security;
alter table inventory_items enable row level security;
alter table memory_entries enable row level security;
alter table roleplay_messages enable row level security;
alter table dm_notes enable row level security;

-- Policy di lettura pubblica per contenuti non sensibili (necessarie anche per Supabase Realtime).
-- Scrittura/lettura sensibile passa sempre dalle API route lato server con service role key.
-- (drop + create rende lo script ri-eseguibile senza errori "policy already exists")
drop policy if exists "public read locations" on locations;
create policy "public read locations" on locations for select using (true);

drop policy if exists "public read public events" on events;
create policy "public read public events" on events for select using (is_public = true);

drop policy if exists "public read active anomalies" on veil_anomalies;
create policy "public read active anomalies" on veil_anomalies for select using (active = true);

drop policy if exists "public read world_state" on world_state;
create policy "public read world_state" on world_state for select using (true);

drop policy if exists "public read echo_messages" on echo_messages;
create policy "public read echo_messages" on echo_messages for select using (true);

drop policy if exists "public read roleplay_messages" on roleplay_messages;
create policy "public read roleplay_messages" on roleplay_messages for select using (true);

drop policy if exists "public read inventory_items" on inventory_items;
create policy "public read inventory_items" on inventory_items for select using (true);

drop policy if exists "public read memory_entries" on memory_entries;
create policy "public read memory_entries" on memory_entries for select using (true);

-- NOTA SICUREZZA: le policy "public read" sopra si basano sulla segretezza degli UUID
-- (session_id, player_id) nell'URL, non su un vero controllo di identità. Va bene per
-- una campagna privata tra amici (MVP). Per un uso più robusto, sostituire con Supabase
-- Auth reale e policy basate su auth.uid().
