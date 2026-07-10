-- Route corridor search: events and pro rodeos along a driving route.

create or replace function public.make_geography_route(
  route_lats double precision[],
  route_lngs double precision[]
)
returns geography
language sql
immutable
as $$
  select case
    when route_lats is null
      or route_lngs is null
      or cardinality(route_lats) < 2
      or cardinality(route_lngs) < 2
      or cardinality(route_lats) <> cardinality(route_lngs)
    then null::geography
    else ST_MakeLine(
      array(
        select ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geometry
        from unnest(route_lngs, route_lats) as u(lng, lat)
      )
    )::geography
  end;
$$;

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
    (
      ST_LineLocatePoint(route_geom.geom, e.location::geometry)
      * ST_Length(route_geom.geog)
    ) / 1609.344 as distance_along_route_miles
  from public.events e
  cross join route_geom
  where e.location is not null
    and e.status = 'approved'
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

create or replace function public.pro_rodeos_along_route(
  route_lats double precision[],
  route_lngs double precision[],
  buffer_miles double precision
)
returns table (
  id uuid,
  created_at timestamptz,
  rodeo_name text,
  sanctioning_body text,
  city text,
  state text,
  start_date date,
  end_date date,
  latitude numeric,
  longitude numeric,
  external_link text,
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
    p.id,
    p.created_at,
    p.rodeo_name,
    p.sanctioning_body,
    p.city,
    p.state,
    p.start_date,
    p.end_date,
    p.latitude,
    p.longitude,
    p.external_link,
    p.location,
    (
      ST_LineLocatePoint(route_geom.geom, p.location::geometry)
      * ST_Length(route_geom.geog)
    ) / 1609.344 as distance_along_route_miles
  from public.pro_rodeos p
  cross join route_geom
  where p.location is not null
    and ST_DWithin(p.location, route_geom.geog, buffer_miles * 1609.344)
  order by distance_along_route_miles asc;
$$;

grant execute on function public.make_geography_route(double precision[], double precision[]) to service_role;
grant execute on function public.events_along_route(
  double precision[],
  double precision[],
  double precision,
  text,
  text,
  text[]
) to service_role;
grant execute on function public.pro_rodeos_along_route(
  double precision[],
  double precision[],
  double precision
) to service_role;
