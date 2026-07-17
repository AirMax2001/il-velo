-- The Veil - Row Level Security Policies
-- Esegui questo SQL nel SQL Editor Supabase DOPO aver creato tutte le tabelle

-- Abilita RLS su tutte le tabelle (se non già fatto)
alter table if exists sessions enable row level security;
alter table if exists players enable row level security;
alter table if exists npcs enable row level security;
alter table if exists locations enable row level security;
alter table if exists events enable row level security;
alter table if exists factions enable row level security;
alter table if exists quests enable row level security;
alter table if exists relics enable row level security;
alter table if exists clues enable row level security;
alter table if exists timeline_events enable row level security;
alter table if exists secrets enable row level security;
alter table if exists echo_messages enable row level security;
alter table if exists world_state enable row level security;
alter table if exists veil_anomalies enable row level security;
alter table if exists inventory_items enable row level security;
alter table if exists memory_entries enable row level security;
alter table if exists roleplay_messages enable row level security;
alter table if exists dm_notes enable row level security;
alter table if exists campaign_packs enable row level security;
alter table if exists session_packs enable row level security;
alter table if exists scene_tree enable row level security;
alter table if exists combat_encounters enable row level security;
alter table if exists combatants enable row level security;
alter table if exists notifications enable row level security;
alter table if exists session_reports enable row level security;
alter table if exists rule_assistant enable row level security;
alter table if exists dm_tutorial enable row level security;
alter table if exists player_diary_entries enable row level security;
alter table if exists player_thoughts enable row level security;
alter table if exists entity_links enable row level security;
alter table if exists clue_visibility enable row level security;
alter table if exists admin_log enable row level security;
alter table if exists campaign_metrics enable row level security;
alter table if exists campaign_status_config enable row level security;

-- Policy: service_role ha accesso completo (usato dalle API)
-- Queste policy permettono al backend di funzionare con supabaseAdmin()
do $$
declare
  tbl text;
begin
  for tbl in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists service_role_all on %I', tbl);
    execute format('create policy service_role_all on %I for all using (true) with check (true)', tbl);
  end loop;
end $$;
