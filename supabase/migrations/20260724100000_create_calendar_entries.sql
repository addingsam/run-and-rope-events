-- Manual personal calendar entries (separate from saved site events).

create table if not exists public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  title text not null,
  entry_date date not null,
  entry_time time,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_entries_user_id_idx on public.calendar_entries (user_id);
create index if not exists calendar_entries_entry_date_idx on public.calendar_entries (entry_date);

alter table public.calendar_entries enable row level security;

create policy "Service role manages calendar entries"
  on public.calendar_entries for all to service_role using (true) with check (true);
