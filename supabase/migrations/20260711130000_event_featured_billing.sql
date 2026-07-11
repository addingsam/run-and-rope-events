-- Track recurring featured placement billing on events.

alter table public.events
  add column if not exists featured_billing_type text,
  add column if not exists featured_stripe_subscription_id text;
