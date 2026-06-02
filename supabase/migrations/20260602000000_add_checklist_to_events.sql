ALTER TABLE events ADD COLUMN IF NOT EXISTS checklist jsonb DEFAULT '[]'::jsonb;
