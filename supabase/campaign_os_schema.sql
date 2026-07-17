-- pippetto - Campaign Operating System schema extension
-- Esegui nel SQL Editor di Supabase dopo lo schema base.

create table if not exists factions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  description text,
  ideology text,
  dominant boolean default false,
  created_at timestamptz default now()
);

create table if not exists quests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo','active','completed','failed')),
  quest_type text default 'main',
  created_at timestamptz default now()
);

create table if not exists relics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  name text not null,
  description text,
  history text,
  effects text,
  origin_location_id uuid references locations(id) on delete set null,
  owner_player_id uuid references players(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists clues (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  content text,
  is_secret boolean default true,
  created_at timestamptz default now()
);

create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  content text,
  era text default 'sessions' check (era in ('ancient_lore','previous_events','sessions','future_events')),
  event_date text,
  created_at timestamptz default now()
);

create table if not exists player_diary_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  title text,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists player_thoughts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  echo_message_id uuid references echo_messages(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists entity_links (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relation_type text default 'related',
  notes text,
  created_at timestamptz default now()
);

create table if not exists clue_visibility (
  id uuid primary key default gen_random_uuid(),
  clue_id uuid references clues(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  revealed_at timestamptz default now(),
  unique (clue_id, player_id)
);

alter table npcs add column if not exists role text;
alter table npcs add column if not exists personality text;
alter table npcs add column if not exists knows text;
alter table npcs add column if not exists location_id uuid references locations(id) on delete set null;
alter table npcs add column if not exists faction_id uuid references factions(id) on delete set null;

alter table locations add column if not exists image_url text;
alter table locations add column if not exists music_url text;
alter table locations add column if not exists map_url text;

alter table world_state add column if not exists weather text;
alter table world_state add column if not exists campaign_phase text;
alter table world_state add column if not exists veil_level int default 0 check (veil_level between 0 and 100);
alter table world_state add column if not exists permanent_decisions jsonb default '[]'::jsonb;

alter table echo_messages add column if not exists delivery_mode text default 'vision';
alter table echo_messages add column if not exists should_vibrate boolean default false;
alter table echo_messages add column if not exists visible_to_player_ids uuid[] default '{}';

create index if not exists entity_links_source_idx on entity_links (session_id, source_type, source_id);
create index if not exists entity_links_target_idx on entity_links (session_id, target_type, target_id);
