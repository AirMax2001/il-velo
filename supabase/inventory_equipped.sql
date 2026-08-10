-- Inventario: arma equipaggiata (una alla volta, usata per l'attacco in combattimento)
alter table inventory_items add column if not exists equipped boolean default false;