-- ============ TASKS additions ============
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS section_id uuid,
  ADD COLUMN IF NOT EXISTS category_name text,
  ADD COLUMN IF NOT EXISTS time_text text,
  ADD COLUMN IF NOT EXISTS end_time_text text,
  ADD COLUMN IF NOT EXISTS color text;

-- ============ TASK_LISTS additions ============
ALTER TABLE public.task_lists
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- ============ EVENTS additions ============
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS time_text text,
  ADD COLUMN IF NOT EXISTS end_time_text text,
  ADD COLUMN IF NOT EXISTS category_name text;

-- ============ NOTES additions ============
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hide_from_all_notes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder_name text,
  ADD COLUMN IF NOT EXISTS time_text text,
  ADD COLUMN IF NOT EXISTS end_time_text text;

-- ============ NOTEBOOK_PAGES additions ============
ALTER TABLE public.notebook_pages
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS note_type text NOT NULL DEFAULT 'note',
  ADD COLUMN IF NOT EXISTS time_text text,
  ADD COLUMN IF NOT EXISTS end_time_text text;

-- ============ SUBTASKS table ============
CREATE TABLE IF NOT EXISTS public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own subtasks select" ON public.subtasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own subtasks insert" ON public.subtasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own subtasks update" ON public.subtasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own subtasks delete" ON public.subtasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subtasks_task ON public.subtasks(task_id);

-- ============ TASK_SECTIONS table ============
CREATE TABLE IF NOT EXISTS public.task_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  list_id uuid REFERENCES public.task_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  collapsed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own task_sections select" ON public.task_sections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own task_sections insert" ON public.task_sections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own task_sections update" ON public.task_sections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own task_sections delete" ON public.task_sections
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_task_sections_list ON public.task_sections(list_id);

-- ============ Realtime: ensure full row payloads on UPDATE ============
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_lists REPLICA IDENTITY FULL;
ALTER TABLE public.task_sections REPLICA IDENTITY FULL;
ALTER TABLE public.subtasks REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_categories REPLICA IDENTITY FULL;
ALTER TABLE public.notes REPLICA IDENTITY FULL;
ALTER TABLE public.note_folders REPLICA IDENTITY FULL;
ALTER TABLE public.notebooks REPLICA IDENTITY FULL;
ALTER TABLE public.notebook_pages REPLICA IDENTITY FULL;