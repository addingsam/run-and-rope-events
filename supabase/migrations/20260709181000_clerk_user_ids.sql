-- Migrate profiles and saved tables from Supabase Auth UUIDs to Clerk user IDs (text).

alter table public.saved_events drop constraint if exists saved_events_user_id_fkey;
alter table public.saved_searches drop constraint if exists saved_searches_user_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;

alter table public.profiles alter column id type text using id::text;
alter table public.saved_searches alter column user_id type text using user_id::text;
alter table public.saved_events alter column user_id type text using user_id::text;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
