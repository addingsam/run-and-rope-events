-- Run this in the Supabase SQL editor to create the events table.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending',
  event_name text not null,
  event_type text not null,
  event_date date not null,
  venue_name text not null,
  address_street text not null,
  address_city text not null,
  address_state text not null,
  address_zip text not null,
  latitude numeric,
  longitude numeric,
  entry_fee text,
  prize_info text,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  website_link text,
  description text,
  flyer_url text,
  submitter_email text,
  source text not null default 'submission'
);

create index if not exists events_status_idx on public.events (status);
create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists events_created_at_idx on public.events (created_at desc);

alter table public.events enable row level security;

-- Allow server-side inserts from the submission API using the service role key.
create policy "Service role can manage events"
  on public.events
  for all
  to service_role
  using (true)
  with check (true);
