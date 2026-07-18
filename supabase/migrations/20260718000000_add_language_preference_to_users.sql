-- Language switcher Phase 1: store the user's language preference.
-- Does not affect app UI text yet — that's a later phase.
ALTER TABLE public.users
  ADD COLUMN language_preference TEXT NOT NULL DEFAULT 'en'
  CHECK (language_preference IN ('en', 'sv'));
