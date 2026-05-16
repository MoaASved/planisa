ALTER TABLE public.note_folders
  ADD COLUMN IF NOT EXISTS position INTEGER;
