-- Recategorize existing rodeo events that reference playday / play day as youth.

update public.events
set rodeo_level = 'youth'
where event_format = 'rodeo'
  and coalesce(rodeo_level, '') not like '%youth%'
  and (
    event_name ~* '\mplay[\s-]?days?\M'
    or coalesce(description, '') ~* '\mplay[\s-]?days?\M'
  );
