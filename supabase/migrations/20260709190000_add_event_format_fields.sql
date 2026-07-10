-- Alter the existing events table in place. No drops, no table recreation, no row loss.

alter table public.events
  add column if not exists event_format text,
  add column if not exists rodeo_level text,
  add column if not exists disciplines text[] default '{}';

-- If an earlier migration added a `format` column, copy those values across.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'format'
  ) then
    execute $sql$
      update public.events
      set event_format = coalesce(event_format, format)
      where event_format is null
        and format is not null
    $sql$;
  end if;
end $$;

-- Migrate legacy event_type values into disciplines when disciplines are still empty.
update public.events
set disciplines = (
  case
    when event_type = 'barrel-racing' then array['barrel_racing']::text[]
    when event_type = 'team-roping' then array['team_roping']::text[]
    when event_type = 'both' then array['barrel_racing', 'team_roping']::text[]
    when event_type ~ ',' then (
      select coalesce(
        array_agg(replace(trim(value), '-', '_') order by ordinality),
        '{}'::text[]
      )
      from unnest(string_to_array(event_type, ',')) with ordinality as value(value, ordinality)
    )
    else array[replace(event_type, '-', '_')]::text[]
  end
)
where (disciplines is null or disciplines = '{}')
  and event_type is not null
  and btrim(event_type) <> '';

-- Normalize any hyphenated discipline values already stored in disciplines.
update public.events
set disciplines = (
  select coalesce(array_agg(replace(trim(d), '-', '_')), '{}'::text[])
  from unnest(disciplines) as d
)
where exists (
  select 1
  from unnest(disciplines) as d
  where d like '%-%'
);

-- Normalize legacy rodeo level values.
update public.events
set rodeo_level = case rodeo_level
  when 'youth-rodeo' then 'youth'
  when 'open-rodeo' then 'open'
  when 'amateur-rodeo' then 'amateur'
  else rodeo_level
end
where rodeo_level is not null;

-- Default event_format for existing rows.
update public.events
set event_format = 'jackpot'
where event_format is null;

update public.events
set disciplines = '{}'
where disciplines is null;

alter table public.events
  alter column disciplines set default '{}',
  alter column disciplines set not null;

create index if not exists events_event_format_idx on public.events (event_format);
