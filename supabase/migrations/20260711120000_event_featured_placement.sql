-- Paid homepage featuring for producer events.

alter table public.events
  add column if not exists featured_until timestamptz,
  add column if not exists featured_paid_at timestamptz,
  add column if not exists featured_stripe_checkout_session_id text;

create index if not exists events_featured_until_idx
  on public.events (featured_until desc)
  where featured_until is not null;
