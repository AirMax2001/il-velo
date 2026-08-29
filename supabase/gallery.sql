-- Galleria foto sessioni
create table if not exists session_gallery (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  session_pack_id uuid references session_packs(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

create index if not exists idx_gallery_session on session_gallery(session_id);
create index if not exists idx_gallery_pack on session_gallery(session_pack_id);

alter table session_gallery enable row level security;

drop policy if exists "public read gallery" on session_gallery;
create policy "public read gallery" on session_gallery for select using (true);

-- service_role bypassa RLS per insert/delete via API
