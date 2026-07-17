ALTER TABLE players ADD COLUMN IF NOT EXISTS character_data JSONB DEFAULT '{}'::jsonb;
