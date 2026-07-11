-- Combined featured placement columns for events table.
-- Safe to run multiple times.

alter table public.events
  add column if not exists featured_until timestamptz,
  add column if not exists featured_paid_at timestamptz,
  add column if not exists featured_stripe_checkout_session_id text,
  add column if not exists featured_billing_type text,
  add column if not exists featured_stripe_subscription_id text;

create index if not exists events_featured_until_idx
  on public.events (featured_until desc)
  where featured_until is not null;
