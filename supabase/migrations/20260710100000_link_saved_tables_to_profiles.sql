-- Link saved tables to Clerk-backed profiles for reliable email lookups.

alter table public.saved_searches
  add constraint saved_searches_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.saved_events
  add constraint saved_events_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
