create table if not exists public.brain_dump_items (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now()
);

alter table public.brain_dump_items enable row level security;

drop policy if exists "Users can manage their own brain dump items" on public.brain_dump_items;

create policy "Users can manage their own brain dump items"
  on public.brain_dump_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists brain_dump_items_user_idx on public.brain_dump_items (user_id, created_at desc);
