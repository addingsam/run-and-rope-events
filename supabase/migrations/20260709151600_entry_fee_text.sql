-- Ensure entry_fee can store multi-line free text. No drops, no row loss.

alter table public.events
  alter column entry_fee type text using entry_fee::text;
