-- Aggiunge colonna hidden per nascondere/mostrare gli item ai giocatori

alter table inventory_items add column if not exists hidden boolean default false;
