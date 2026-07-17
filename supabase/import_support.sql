-- The Veil - Supporto per Campaign Import / Session Import / Session Review

-- Aggiunge campi per tracciare import
alter table sessions add column if not exists campaign_imported boolean default false;
alter table sessions add column if not exists campaign_pack_id uuid references campaign_packs(id) on delete set null;
alter table sessions add column if not exists current_session_id uuid references session_packs(id) on delete set null;
alter table sessions add column if not exists campaign_status text default 'imported' check (campaign_status in ('imported','active','completed','archived'));
alter table sessions add column if not exists veil_integrity int default 100 check (veil_integrity >= 0 and veil_integrity <= 100);
alter table sessions add column if not exists memory_progress int default 0 check (memory_progress >= 0 and memory_progress <= 100);

-- Indici
create index if not exists sessions_campaign_imported_idx on sessions (campaign_imported);
create index if not exists sessions_campaign_status_idx on sessions (campaign_status);

-- Aggiunge campi a campaign_packs
alter table campaign_packs add column if not exists imported_at timestamptz default now();
alter table campaign_packs add column if not exists world_json jsonb default '{}';
alter table campaign_packs add column if not exists lore_json jsonb default '{}';
alter table campaign_packs add column if not exists cities_json jsonb default '{}';
alter table campaign_packs add column if not exists npcs_json jsonb default '[]';
alter table campaign_packs add column if not exists factions_json jsonb default '[]';
alter table campaign_packs add column if not exists relics_json jsonb default '[]';
alter table campaign_packs add column if not exists timeline_json jsonb default '[]';
alter table campaign_packs add column if not exists secrets_json jsonb default '[]';
alter table campaign_packs add column if not exists player_backgrounds_json jsonb default '[]';
alter table campaign_packs add column if not exists relationships_json jsonb default '[]';
alter table campaign_packs add column if not exists glossary_json jsonb default '[]';
alter table campaign_packs add column if not exists ancient_history_json jsonb default '[]';
alter table campaign_packs add column if not exists final_endings_json jsonb default '[]';

-- Aggiunge campi a session_packs
alter table session_packs add column if not exists imported_at timestamptz default now();
alter table session_packs add column if not exists scenes_json jsonb default '[]';
alter table session_packs add column if not exists narration_json jsonb default '[]';
alter table session_packs add column if not exists npcs_json jsonb default '[]';
alter table session_packs add column if not exists combat_json jsonb default '[]';
alter table session_packs add column if not exists rules_json jsonb default '[]';
alter table session_packs add column if not exists choices_json jsonb default '[]';
alter table session_packs add column if not exists suggestions_json jsonb default '[]';
alter table session_packs add column if not exists loot_json jsonb default '[]';
alter table session_packs add column if not exists updates_json jsonb default '{}';
alter table session_packs add column if not exists timeline_changes_json jsonb default '[]';
alter table session_packs add column if not exists notes_json jsonb default '[]';
alter table session_packs add column if not exists mission_updates_json jsonb default '[]';

-- Tabella per il Campaign Status tracking
create table if not exists campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  veil_integrity int default 100 check (veil_integrity >= 0 and veil_integrity <= 100),
  memory_progress int default 0 check (memory_progress >= 0 and memory_progress <= 100),
  relics_found int default 0,
  custodian_activity int default 0 check (custodian_activity >= 0 and custodian_activity <= 100),
  character_story_progress int default 0 check (character_story_progress >= 0 and character_story_progress <= 100),
  main_quest_progress int default 0 check (main_quest_progress >= 0 and main_quest_progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists campaign_metrics_session_idx on campaign_metrics (session_id);

-- Tabella per il Campaign Status config
create table if not exists campaign_status_config (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  metrics jsonb default '{}',
  pillars jsonb default '[]',
  created_at timestamptz default now()
);

create unique index if not exists campaign_status_config_session_idx on campaign_status_config (session_id);

-- RLS
alter table campaign_metrics enable row level security;
alter table campaign_status_config enable row level security;

-- Policy per service role (usato dalle API)
create policy "service_role_all_campaign_metrics" on campaign_metrics for all using (true) with check (true);
create policy "service_role_all_campaign_status_config" on campaign_status_config for all using (true) with check (true);

-- Update trigger per campaign_metrics
create or replace function update_campaign_metrics_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger campaign_metrics_updated_at
  before update on campaign_metrics
  for each row execute function update_campaign_metrics_timestamp();
