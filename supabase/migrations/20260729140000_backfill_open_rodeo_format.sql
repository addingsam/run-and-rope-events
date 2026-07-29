-- Recategorize open rodeo events stored as jackpot to rodeo/open.
-- Safe to run more than once.

update public.events
set
  event_format = 'rodeo',
  rodeo_level = 'open'
where event_format = 'jackpot'
  and (
    event_name ~* '\mopen rodeos?\M'
    or coalesce(description, '') ~* '\mopen rodeos?\M'
    or event_name ~* '\mopen-rodeo\M'
    or coalesce(description, '') ~* '\mopen-rodeo\M'
  );

-- Set rodeo_level for existing rodeo events that mention open rodeo but lack the level.

update public.events
set rodeo_level = 'open'
where event_format = 'rodeo'
  and coalesce(rodeo_level, '') not like '%open%'
  and (
    event_name ~* '\mopen rodeos?\M'
    or coalesce(description, '') ~* '\mopen rodeos?\M'
    or event_name ~* '\mopen-rodeo\M'
    or coalesce(description, '') ~* '\mopen-rodeo\M'
  );
