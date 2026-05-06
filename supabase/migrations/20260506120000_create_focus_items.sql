create table if not exists public.focus_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('task', 'event', 'note', 'sticky')),
  item_id text not null,
  title text not null default '',
  subtitle text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.focus_items enable row level security;

drop policy if exists "Users can manage their own focus items" on public.focus_items;

create policy "Users can manage their own focus items"
  on public.focus_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists focus_items_user_date_idx on public.focus_items (user_id, date);
