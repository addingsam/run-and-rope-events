-- Create the pro_rodeos table for WPRA/PRCA listings.
-- Display-only: name, location, dates, and a link to the official sanctioning body site.

create table if not exists public.pro_rodeos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  rodeo_name text not null,
  sanctioning_body text not null check (sanctioning_body in ('WPRA', 'PRCA')),
  city text not null,
  state text not null,
  start_date date not null,
  end_date date,
  latitude numeric,
  longitude numeric,
  external_link text not null
);

create index if not exists pro_rodeos_start_date_idx on public.pro_rodeos (start_date);
create index if not exists pro_rodeos_state_idx on public.pro_rodeos (state);
create index if not exists pro_rodeos_sanctioning_body_idx on public.pro_rodeos (sanctioning_body);
create index if not exists pro_rodeos_created_at_idx on public.pro_rodeos (created_at desc);

alter table public.pro_rodeos enable row level security;

create policy "Service role can manage pro_rodeos"
  on public.pro_rodeos
  for all
  to service_role
  using (true)
  with check (true);
