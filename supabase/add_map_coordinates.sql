-- Add map coordinates and session-level map_url
alter table locations add column if not exists map_x real;
alter table locations add column if not exists map_y real;

alter table sessions add column if not exists map_url text;
