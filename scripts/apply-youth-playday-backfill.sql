-- Recategorize rodeo events whose text references a playday as youth rodeo.
-- Safe to run more than once.

update public.events
set rodeo_level = 'youth'
where event_format = 'rodeo'
  and coalesce(rodeo_level, '') not like '%youth%'
  and (
    event_name ~* '\mplay[\s-]?days?\M'
    or coalesce(description, '') ~* '\mplay[\s-]?days?\M'
  );
