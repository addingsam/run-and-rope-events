-- Event end dates and archival support.

alter table public.events
  add column if not exists event_end_date date;

-- Backfill end dates from legacy description metadata.
update public.events
set event_end_date = to_date(
  trim(both from substring(description from 'End date: ([0-9]{4}-[0-9]{2}-[0-9]{2})')),
  'YYYY-MM-DD'
)
where event_end_date is null
  and description ~ 'End date: [0-9]{4}-[0-9]{2}-[0-9]{2}';

create index if not exists events_status_final_date_idx
  on public.events (status, (coalesce(event_end_date, event_date)));

-- Exclude archived events from radius search.
create or replace function public.nearby_events(
  search_lat double precision,
  search_lng double precision,
  radius_miles double precision,
  filter_event_format text default null,
  filter_rodeo_level text default null,
  filter_disciplines text[] default null
)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  event_name text,
  event_type text,
  event_format text,
  rodeo_level text,
  disciplines text[],
  additional_offerings text[],
  event_date date,
  event_end_date date,
  venue_name text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  latitude numeric,
  longitude numeric,
  entry_fee text,
  prize_info text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website_link text,
  description text,
  flyer_url text,
  submitter_email text,
  source text,
  location geography,
  distance_miles double precision
)
language sql
stable
as $$
  with search_point as (
    select public.make_geography_point(search_lat, search_lng) as point
  )
  select
    e.id,
    e.created_at,
    e.status,
    e.event_name,
    e.event_type,
    e.event_format,
    e.rodeo_level,
    e.disciplines,
    e.additional_offerings,
    e.event_date,
    e.event_end_date,
    e.venue_name,
    e.address_street,
    e.address_city,
    e.address_state,
    e.address_zip,
    e.latitude,
    e.longitude,
    e.entry_fee,
    e.prize_info,
    e.contact_name,
    e.contact_email,
    e.contact_phone,
    e.website_link,
    e.description,
    e.flyer_url,
    e.submitter_email,
    e.source,
    e.location,
    ST_Distance(e.location, search_point.point) / 1609.344 as distance_miles
  from public.events e
  cross join search_point
  where e.location is not null
    and search_point.point is not null
    and e.status in ('approved', 'published')
    and ST_DWithin(e.location, search_point.point, radius_miles * 1609.344)
    and (filter_event_format is null or e.event_format = filter_event_format)
    and (filter_rodeo_level is null or e.rodeo_level = filter_rodeo_level)
    and (
      filter_disciplines is null
      or cardinality(filter_disciplines) = 0
      or e.disciplines && filter_disciplines
    )
  order by distance_miles asc;
$$;

-- Exclude archived events from route search.
create or replace function public.events_along_route(
  route_lats double precision[],
  route_lngs double precision[],
  buffer_miles double precision,
  filter_event_format text default null,
  filter_rodeo_level text default null,
  filter_disciplines text[] default null
)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  event_name text,
  event_type text,
  event_format text,
  rodeo_level text,
  disciplines text[],
  additional_offerings text[],
  event_date date,
  event_end_date date,
  venue_name text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  latitude numeric,
  longitude numeric,
  entry_fee text,
  prize_info text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website_link text,
  description text,
  flyer_url text,
  submitter_email text,
  source text,
  location geography,
  distance_along_route_miles double precision
)
language sql
stable
as $$
  with route as (
    select public.make_geography_route(route_lats, route_lngs) as line
  ),
  route_geom as (
    select line::geometry as geom, line as geog
    from route
    where line is not null
  )
  select
    e.id,
    e.created_at,
    e.status,
    e.event_name,
    e.event_type,
    e.event_format,
    e.rodeo_level,
    e.disciplines,
    e.additional_offerings,
    e.event_date,
    e.event_end_date,
    e.venue_name,
    e.address_street,
    e.address_city,
    e.address_state,
    e.address_zip,
    e.latitude,
    e.longitude,
    e.entry_fee,
    e.prize_info,
    e.contact_name,
    e.contact_email,
    e.contact_phone,
    e.website_link,
    e.description,
    e.flyer_url,
    e.submitter_email,
    e.source,
    e.location,
    ST_LineLocatePoint(route_geom.geom, e.location::geometry)
      * ST_Length(route_geom.geog)
      / 1609.344 as distance_along_route_miles
  from public.events e
  cross join route_geom
  where e.location is not null
    and e.status in ('approved', 'published')
    and ST_DWithin(e.location, route_geom.geog, buffer_miles * 1609.344)
    and (filter_event_format is null or e.event_format = filter_event_format)
    and (filter_rodeo_level is null or e.rodeo_level = filter_rodeo_level)
    and (
      filter_disciplines is null
      or cardinality(filter_disciplines) = 0
      or e.disciplines && filter_disciplines
    )
  order by distance_along_route_miles asc;
$$;
