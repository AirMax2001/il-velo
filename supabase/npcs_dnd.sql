-- Dettagli D&D per NPC (caratteristiche, PF, resistenze, background, ecc.)
alter table npcs add column if not exists data jsonb default '{}';

-- Per sicurezza, anche per oggetti se serve estensione futura
-- inventory_items ha già molte colonne, ma aggiungiamo un campo generico per proprietà D&D extra
alter table inventory_items add column if not exists data jsonb default '{}';
