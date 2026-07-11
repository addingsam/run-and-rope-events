-- Saved search digest frequency (daily / weekly) and last-sent tracking.

alter table public.saved_searches
  add column if not exists alert_frequency text not null default 'off'
    check (alert_frequency in ('off', 'daily', 'weekly'));

alter table public.saved_searches
  add column if not exists last_alert_sent_at timestamptz;

update public.saved_searches
set alert_frequency = 'daily'
where alerts_enabled = true
  and alert_frequency = 'off';

create index if not exists saved_searches_alert_frequency_idx
  on public.saved_searches (alert_frequency)
  where alert_frequency in ('daily', 'weekly');
