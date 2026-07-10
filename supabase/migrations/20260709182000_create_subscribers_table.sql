-- Subscribers table linked to Clerk user IDs (source of truth for subscription access).

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  plan_type text check (plan_type in ('monthly', 'annual')),
  stripe_customer_id text,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscribers_clerk_user_id_idx
  on public.subscribers (clerk_user_id);

create index if not exists subscribers_active_expiry_idx
  on public.subscribers (subscription_status, subscription_expires_at)
  where subscription_status = 'active';

alter table public.subscribers enable row level security;

create policy "Service role manages subscribers"
  on public.subscribers
  for all
  to service_role
  using (true)
  with check (true);
