-- Recategorize existing rodeo events that mention ranch rodeo in their text.

update public.events
set rodeo_level = 'ranch'
where event_format = 'rodeo'
  and coalesce(rodeo_level, '') not like '%ranch%'
  and (
    event_name ~* '\mranch rodeos?\M'
    or coalesce(description, '') ~* '\mranch rodeos?\M'
    or coalesce(event_name, '') ~* '\mranch-rodeo\M'
    or coalesce(description, '') ~* '\mranch-rodeo\M'
  );
