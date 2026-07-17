-- DM Notes enhancements
alter table dm_notes add column if not exists tags text[] default '{}';
alter table dm_notes add column if not exists "references" jsonb default '[]'::jsonb;
alter table dm_notes add column if not exists checklist jsonb default '[]'::jsonb;

-- Indexes for performance
create index if not exists dm_notes_tags_idx on dm_notes using gin(tags);
create index if not exists npcs_location_id_idx on npcs (location_id);
create index if not exists npcs_faction_id_idx on npcs (faction_id);
create index if not exists relics_origin_location_idx on relics (origin_location_id);
create index if not exists relics_owner_player_idx on relics (owner_player_id);
create index if not exists sessions_code_idx on sessions (code);
create index if not exists players_token_idx on players (access_token);

-- RLS policies for new tables
alter table factions enable row level security;
drop policy if exists "public read factions" on factions;
create policy "public read factions" on factions for select using (true);

alter table quests enable row level security;
drop policy if exists "public read quests" on quests;
create policy "public read quests" on quests for select using (true);

alter table relics enable row level security;
drop policy if exists "public read relics" on relics;
create policy "public read relics" on relics for select using (true);

alter table clues enable row level security;
drop policy if exists "public read clues" on clues;
create policy "public read clues" on clues for select using (true);

alter table timeline_events enable row level security;
drop policy if exists "public read timeline_events" on timeline_events;
create policy "public read timeline_events" on timeline_events for select using (true);

alter table entity_links enable row level security;
drop policy if exists "public read entity_links" on entity_links;
create policy "public read entity_links" on entity_links for select using (true);

alter table player_diary_entries enable row level security;
drop policy if exists "public read player_diary_entries" on player_diary_entries;
create policy "public read player_diary_entries" on player_diary_entries for select using (true);

alter table player_thoughts enable row level security;
drop policy if exists "public read player_thoughts" on player_thoughts;
create policy "public read player_thoughts" on player_thoughts for select using (true);
