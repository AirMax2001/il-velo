-- ============================================================
-- pippetto v2 - Full Schema Migration
-- Esegui nel SQL Editor di Supabase dopo lo schema base.
-- ============================================================

-- 1. PLAYER ENHANCEMENTS
alter table players add column if not exists email text unique;
alter table players add column if not exists coins int default 0;
alter table players add column if not exists xp int default 0;
alter table players add column if not exists temp_hp int default 0;
alter table players add column if not exists conditions text[] default '{}';
alter table players add column if not exists campaign_code text;
create index if not exists players_email_idx on players (email);
create index if not exists players_campaign_code_idx on players (campaign_code);

-- 2. INVENTORY ENHANCEMENTS
alter table inventory_items add column if not exists icon text;
alter table inventory_items add column if not exists weight numeric default 0;
alter table inventory_items add column if not exists category text default 'general';
alter table inventory_items add column if not exists equipment_slot text;
alter table inventory_items add column if not exists quantity int default 1;

-- 3. MISSIONS / QUESTS ENHANCEMENTS
alter table quests add column if not exists objectives jsonb default '[]'::jsonb;
alter table quests add column if not exists category text default 'main';

-- 4. CAMPAIGN PACKS
create table if not exists campaign_packs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade unique,
  name text not null,
  version text,
  imported_at timestamptz default now(),
  data jsonb not null
);
alter table campaign_packs enable row level security;
drop policy if exists "campaign_packs all" on campaign_packs;
create policy "campaign_packs all" on campaign_packs for all using (true);

-- 5. SESSION PACKS
create table if not exists session_packs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  title text not null,
  session_number int,
  imported_at timestamptz default now(),
  data jsonb not null
);
alter table session_packs enable row level security;
drop policy if exists "session_packs all" on session_packs;
create policy "session_packs all" on session_packs for all using (true);

-- 6. SCENE TREE
create table if not exists scene_tree (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  session_pack_id uuid references session_packs(id) on delete set null,
  title text not null,
  content text,
  parent_id uuid references scene_tree(id) on delete set null,
  sort_order int default 0,
  node_type text default 'scene' check (node_type in ('start','scene','choice','combat','ending')),
  choices jsonb default '[]'::jsonb,
  npc_ids uuid[] default '{}',
  environment text,
  music_url text,
  tablet_scene text,
  dm_suggestions text,
  rule_reminder text,
  is_active boolean default false,
  created_at timestamptz default now()
);
alter table scene_tree enable row level security;
drop policy if exists "scene_tree all" on scene_tree;
create policy "scene_tree all" on scene_tree for all using (true);
create index if not exists scene_tree_parent_idx on scene_tree (parent_id);
create index if not exists scene_tree_session_idx on scene_tree (session_id);

-- 7. COMBAT ENCOUNTERS
create table if not exists combat_encounters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  scene_id uuid references scene_tree(id) on delete set null,
  title text not null,
  round int default 1,
  turn_index int default 0,
  is_active boolean default false,
  created_at timestamptz default now()
);
alter table combat_encounters enable row level security;
drop policy if exists "combat_encounters all" on combat_encounters;
create policy "combat_encounters all" on combat_encounters for all using (true);

-- 8. COMBATANTS
create table if not exists combatants (
  id uuid primary key default gen_random_uuid(),
  combat_id uuid references combat_encounters(id) on delete cascade,
  name text not null,
  type text default 'enemy' check (type in ('player','ally','enemy','boss')),
  initiative int,
  hp_current int,
  hp_max int,
  armor_class int,
  attack_bonus int,
  damage text,
  conditions text[] default '{}',
  status_effects text[] default '{}',
  is_dead boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table combatants enable row level security;
drop policy if exists "combatants all" on combatants;
create policy "combatants all" on combatants for all using (true);
create index if not exists combatants_combat_idx on combatants (combat_id);

-- 9. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  target_type text default 'single' check (target_type in ('single','multiple','party')),
  target_player_ids uuid[] default '{}',
  title text not null,
  content text not null,
  type text default 'message' check (type in ('message','whisper','vision','memory','combat','quest','system')),
  should_vibrate boolean default false,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
drop policy if exists "notifications all" on notifications;
create policy "notifications all" on notifications for all using (true);
create index if not exists notifications_player_idx on notifications (player_id);
create index if not exists notifications_session_idx on notifications (session_id);

-- 10. SESSION REPORTS
create table if not exists session_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  session_number int,
  title text not null,
  summary text,
  player_decisions jsonb default '[]'::jsonb,
  killed_npcs jsonb default '[]'::jsonb,
  new_npcs jsonb default '[]'::jsonb,
  loot jsonb default '[]'::jsonb,
  found_relics jsonb default '[]'::jsonb,
  story_changes jsonb default '[]'::jsonb,
  campaign_changes jsonb default '[]'::jsonb,
  dm_notes text,
  exported_at timestamptz default now()
);
alter table session_reports enable row level security;
drop policy if exists "session_reports all" on session_reports;
create policy "session_reports all" on session_reports for all using (true);

-- 11. RULE ASSISTANT
create table if not exists rule_assistant (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  sort_order int default 0
);
alter table rule_assistant enable row level security;
drop policy if exists "rule_assistant all" on rule_assistant;
create policy "rule_assistant all" on rule_assistant for all using (true);
create index if not exists rule_assistant_category_idx on rule_assistant (category);

-- 12. DM TUTORIAL SUGGESTIONS
create table if not exists dm_tutorial (
  id uuid primary key default gen_random_uuid(),
  trigger_event text not null,
  suggestion text not null,
  category text default 'general',
  sort_order int default 0
);
alter table dm_tutorial enable row level security;
drop policy if exists "dm_tutorial all" on dm_tutorial;
create policy "dm_tutorial all" on dm_tutorial for all using (true);

-- ============================================================
-- SEED DATA: Rule Assistant
-- ============================================================
insert into rule_assistant (category, title, content, sort_order) values
('azioni', 'Azione', 'Puoi compiere un''azione durante il tuo turno: Attacco, Lanciare Incantesimo, Scatto, Disimpegno, Schivata, Aiuto, Ocultarsi, Preparazione, Cercare, Utilizzare Oggetto.', 1),
('azioni', 'Azione Bonus', 'Alcune abilità, incantesimi e caratteristiche richiedono un''azione bonus. Puoi compiere una sola azione bonus per turno.', 2),
('azioni', 'Reazione', 'Puoi compiere una reazione per turno. Si usa per attacchi di opportunità, incantesimi di reazione e alcune abilità di classe.', 3),
('movimento', 'Movimento', 'Puoi muoverti fino alla tua velocità (solitamente 9m/30ft). Puoi dividere il movimento prima e dopo l''azione.', 4),
('movimento', 'Attacco di Opportunità', 'Quando un nemico esce dalla tua portata senza usare l''azione di Disimpegno, puoi fare un attacco in mischia come reazione.', 5),
('combattimento', 'Iniziativa', 'All''inizio del combattimento, ogni partecipante tira un d20 e aggiunge il bonus di destrezza. Il DM gestisce l''ordine.', 6),
('combattimento', 'Turno di Combattimento', 'Ogni turno dura 6 secondi. Un round comprende tutti i turni. Azione + Movimento + eventuale Azione Bonus.', 7),
('condizioni', 'Condizioni Comuni', 'Afferrato, Accecato, Affascinato, Assordato, Atterrato, Affaticato, Invisibile, Paralizzato, Pietrificato, Avvelenato, Prono, Restretto, Spaventato, Stordito, Intralciato.', 8),
('condizioni', 'Vantaggio/Svantaggio', 'Tira due d20 e usa il risultato maggiore (vantaggio) o minore (svantaggio). Non si accumulano ma si annullano a vicenda.', 9),
('incantesimi', 'Slot Incantesimo', 'Gli incantatori hanno un numero limitato di slot per livello. Recuperi gli slot dopo un riposo lungo (o parziale per alcuni classi).', 10),
('incantesimi', 'Concentrazione', 'Alcuni incantesimi richiedono concentrazione. Se subisci danni, supera un tiro salvezza Costituzione CD 10 o metà del danno subito (la più alta).', 11),
('riposo', 'Riposo Breve', 'Almeno 1 ora. Puoi spendere Dadi Vita per recuperare HP. Alcune classi recuperano abilità.', 12),
('riposo', 'Riposo Lungo', 'Almeno 8 ore. Recuperi tutti gli HP, Dadi Vita e slot incantesimo. Se interrotto da combattimento, potrebbe non essere completo.', 13);

-- ============================================================
-- SEED DATA: DM Tutorial
-- ============================================================
insert into dm_tutorial (trigger_event, suggestion, category, sort_order) values
('first_session', 'Spiega le regole base: azione, azione bonus, movimento e reazione. Non dare tutto per scontato.', 'narrazione', 1),
('combat_start', 'Spiega l''iniziativa ai giocatori. Ricorda che possono usare l''azione di Preparazione per agire fuori turno.', 'combattimento', 2),
('npc_introduce', 'Descrivi l''NPC con almeno 3 dettagli fisici prima di far parlare il personaggio. Dai un tono di voce unico.', 'narrazione', 3),
('choice_moment', 'Presenta le scelte in modo chiaro. Ripeti le opzioni se necessario. Dai ai giocatori il tempo di discutere.', 'narrazione', 4),
('exploration', 'Descrivi usando almeno 3 sensi (vista, udito, olfatto). Non limitarti all''aspetto visivo.', 'narrazione', 5),
('roleplay', 'Parla con i tuoi NPC come se fossero reali. I giocatori risponderanno meglio a personaggi vivi che a muri di testo.', 'narrazione', 6),
('loot', 'Distribuisci loot in modo equilibrato. Non dare oggetti troppo potenti ai bassi livelli.', 'gestione', 7),
('player_quiet', 'Coinvolgi i giocatori silenziosi chiedendo direttamente cosa fa il loro personaggio. Non aspettare che parlino.', 'gestione', 8);

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists sessions_name_idx on sessions (name);
create index if not exists players_character_name_idx on players (character_name);
create index if not exists npcs_name_idx on npcs (name);
create index if not exists locations_name_idx on locations (name);
create index if not exists events_title_idx on events (title);
create index if not exists quests_status_idx on quests (status);
