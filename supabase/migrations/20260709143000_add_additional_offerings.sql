-- Add optional additional offerings for rodeo listings. No drops, no recreation, no row loss.

alter table public.events
  add column if not exists additional_offerings text[];
