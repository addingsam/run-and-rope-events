-- Ensure Clerk user IDs (text, e.g. user_xxx) fit saved-search ownership columns.
-- Safe to run if 20260709181000_clerk_user_ids.sql was never applied to this database.
-- Does not drop or recreate tables. Only drops/re-adds FK constraints as needed.

-- Remove FKs that block type changes or still point at auth.users(uuid).
alter table public.saved_searches
  drop constraint if exists saved_searches_user_id_profiles_fkey;

alter table public.saved_events
  drop constraint if exists saved_events_user_id_profiles_fkey;

alter table public.saved_searches
  drop constraint if exists saved_searches_user_id_fkey;

alter table public.saved_events
  drop constraint if exists saved_events_user_id_fkey;

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Convert profile + ownership columns from uuid to text.
alter table public.profiles
  alter column id type text using id::text;

alter table public.saved_searches
  alter column user_id type text using user_id::text;

alter table public.saved_events
  alter column user_id type text using user_id::text;

-- Re-link saved tables to Clerk-backed profiles.
alter table public.saved_searches
  drop constraint if exists saved_searches_user_id_profiles_fkey;

alter table public.saved_searches
  add constraint saved_searches_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.saved_events
  drop constraint if exists saved_events_user_id_profiles_fkey;

alter table public.saved_events
  add constraint saved_events_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
