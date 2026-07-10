-- User profiles, saved searches, and saved events.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro', 'organizer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  search_params jsonb not null,
  map_overlay jsonb,
  alerts_enabled boolean not null default false,
  known_event_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  saved_at timestamptz not null default now(),
  archive_notified_at timestamptz,
  unique (user_id, event_id)
);

create index if not exists saved_searches_user_id_idx on public.saved_searches (user_id);
create index if not exists saved_events_user_id_idx on public.saved_events (user_id);
create index if not exists saved_events_event_id_idx on public.saved_events (event_id);
create index if not exists saved_searches_alerts_enabled_idx
  on public.saved_searches (alerts_enabled)
  where alerts_enabled = true;

alter table public.profiles enable row level security;
alter table public.saved_searches enable row level security;
alter table public.saved_events enable row level security;

create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own saved searches"
  on public.saved_searches
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own saved events"
  on public.saved_events
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role manages profiles"
  on public.profiles for all to service_role using (true) with check (true);

create policy "Service role manages saved searches"
  on public.saved_searches for all to service_role using (true) with check (true);

create policy "Service role manages saved events"
  on public.saved_events for all to service_role using (true) with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, subscription_tier)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
