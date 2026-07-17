-- Veil - Location hierarchy + Item rarity schema extension
-- Esegui nel SQL Editor di Supabase dopo lo schema base e campaign_os_schema.sql

-- Location hierarchy: parent_id permette albero mondo > nazioni > regioni > città/luoghi
alter table locations add column if not exists parent_id uuid references locations(id) on delete set null;
alter table locations add column if not exists location_type text default 'location' check (location_type in ('world','nation','region','city','forest','swamp','dungeon','tavern','shop','temple','ruins','harbor','other','location'));

-- NPC: supporto stato morto
alter table npcs add column if not exists is_dead boolean default false;

-- Items: unifica inventory_items con rarità colorate
alter table inventory_items add column if not exists rarity text default 'common' check (rarity in ('common','rare','epic','legendary','artifact','relic'));
alter table inventory_items add column if not exists item_type text default 'other' check (item_type in ('weapon','armor','consumable','key','lore','tool','other'));

-- External ID columns per risolvere ID stringa JSON ↔ UUID del DB
alter table locations add column if not exists external_id text;
alter table factions add column if not exists external_id text;
alter table scene_tree add column if not exists external_id text;
alter table scene_tree add column if not exists combat_id uuid references combat_encounters(id) on delete set null;
alter table scene_tree add column if not exists location_id uuid references locations(id) on delete set null;
