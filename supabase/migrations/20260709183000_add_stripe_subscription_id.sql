alter table public.subscribers
  add column if not exists stripe_subscription_id text;

create unique index if not exists subscribers_stripe_subscription_id_idx
  on public.subscribers (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists subscribers_stripe_customer_id_idx
  on public.subscribers (stripe_customer_id)
  where stripe_customer_id is not null;
