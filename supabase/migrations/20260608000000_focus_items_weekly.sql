alter table public.focus_items
  add column if not exists week_number integer,
  add column if not exists year        integer;

-- Back-fill existing rows from the existing `date` column
update public.focus_items
set
  week_number = (
    -- ISO week number: Monday = start of week
    extract(week from date::date)::integer
  ),
  year = extract(isoyear from date::date)::integer
where week_number is null;

create index if not exists focus_items_user_week_idx
  on public.focus_items (user_id, week_number, year);
