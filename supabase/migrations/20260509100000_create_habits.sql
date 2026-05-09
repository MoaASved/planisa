-- habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#9674cc',
  created_at timestamptz not null default now()
);
alter table public.habits enable row level security;
drop policy if exists "Users can manage their own habits" on public.habits;
create policy "Users can manage their own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habit_completions table
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null default now(),
  unique(user_id, habit_id, date)
);
alter table public.habit_completions enable row level security;
drop policy if exists "Users can manage their own habit completions" on public.habit_completions;
create policy "Users can manage their own habit completions" on public.habit_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists habits_user_idx on public.habits (user_id, created_at);
create index if not exists habit_completions_user_week_idx on public.habit_completions (user_id, date);
