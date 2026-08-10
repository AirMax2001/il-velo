-- Inventario: valore in monete d'oro per gli oggetti (peso e quantità già presenti dal full_schema_v2)
alter table inventory_items add column if not exists value numeric default 0;