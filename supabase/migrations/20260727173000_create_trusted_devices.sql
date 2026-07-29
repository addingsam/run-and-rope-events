-- Track Clerk client devices trusted after verification for 30-day windows.

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles (id) on delete cascade,
  client_id text not null,
  first_trusted_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  trusted_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists trusted_devices_user_id_idx
  on public.trusted_devices (user_id);

create index if not exists trusted_devices_trusted_until_idx
  on public.trusted_devices (trusted_until);

alter table public.trusted_devices enable row level security;
