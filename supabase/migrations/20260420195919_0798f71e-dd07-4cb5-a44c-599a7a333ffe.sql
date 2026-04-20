
-- Generic updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. calendar_categories
CREATE TABLE public.calendar_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own calendar_categories select" ON public.calendar_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own calendar_categories insert" ON public.calendar_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own calendar_categories update" ON public.calendar_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own calendar_categories delete" ON public.calendar_categories FOR DELETE USING (auth.uid() = user_id);

-- 2. events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  category_id UUID REFERENCES public.calendar_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own events select" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own events insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own events update" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own events delete" ON public.events FOR DELETE USING (auth.uid() = user_id);

-- 3. task_lists
CREATE TABLE public.task_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own task_lists select" ON public.task_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own task_lists insert" ON public.task_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own task_lists update" ON public.task_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own task_lists delete" ON public.task_lists FOR DELETE USING (auth.uid() = user_id);

-- 4. tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT,
  due_date TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  note TEXT,
  list_id UUID REFERENCES public.task_lists(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own tasks select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own tasks insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own tasks update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own tasks delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- 5. note_folders
CREATE TABLE public.note_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own note_folders select" ON public.note_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own note_folders insert" ON public.note_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own note_folders update" ON public.note_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own note_folders delete" ON public.note_folders FOR DELETE USING (auth.uid() = user_id);

-- 6. notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT,
  color TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  folder_id UUID REFERENCES public.note_folders(id) ON DELETE SET NULL,
  show_in_calendar BOOLEAN NOT NULL DEFAULT false,
  event_date TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hide_date BOOLEAN NOT NULL DEFAULT false,
  is_sticky BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notes select" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own notes insert" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notes update" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own notes delete" ON public.notes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. notebooks
CREATE TABLE public.notebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notebooks select" ON public.notebooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own notebooks insert" ON public.notebooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notebooks update" ON public.notebooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own notebooks delete" ON public.notebooks FOR DELETE USING (auth.uid() = user_id);

-- 8. notebook_pages
CREATE TABLE public.notebook_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  show_in_calendar BOOLEAN NOT NULL DEFAULT false,
  event_date TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hide_date BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notebook_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notebook_pages select" ON public.notebook_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own notebook_pages insert" ON public.notebook_pages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notebook_pages update" ON public.notebook_pages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own notebook_pages delete" ON public.notebook_pages FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_notebook_pages_updated_at BEFORE UPDATE ON public.notebook_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for FK lookups
CREATE INDEX idx_events_user ON public.events(user_id);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_tasks_list ON public.tasks(list_id);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX idx_notes_user ON public.notes(user_id);
CREATE INDEX idx_notebook_pages_notebook ON public.notebook_pages(notebook_id);
