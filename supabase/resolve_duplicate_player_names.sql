-- Risolvi i duplicati del nome personaggio per sessione prima di creare l'indice unico.
-- Se il database contiene più righe con lo stesso nome nella stessa sessione,
-- Postgres non può creare l'indice unico.

-- 1) Individua i duplicati esistenti.
SELECT
  session_id,
  lower(character_name) AS normalized_name,
  count(*) AS count
FROM players
GROUP BY session_id, lower(character_name)
HAVING count(*) > 1;

-- 2) Se vuoi gestire automaticamente i duplicati, rinomina le occorrenze secondarie.
--    Questo mantiene la prima riga così com'è e aggiunge un suffisso alle altre.
WITH ranked AS (
  SELECT
    id,
    session_id,
    character_name,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, lower(character_name)
      ORDER BY created_at, id
    ) AS rn
  FROM players
)
UPDATE players p
SET character_name = p.character_name || ' (' || (ranked.rn - 1) || ')'
FROM ranked
WHERE p.id = ranked.id
  AND ranked.rn > 1;

-- 3) Verifica di nuovo che non ci siano duplicati.
SELECT
  session_id,
  lower(character_name) AS normalized_name,
  count(*) AS count
FROM players
GROUP BY session_id, lower(character_name)
HAVING count(*) > 1;

-- 4) Dopo aver risolto i duplicati, puoi ricreare l'indice unico.
-- create unique index if not exists players_unique_name_per_session on players (session_id, lower(character_name));
