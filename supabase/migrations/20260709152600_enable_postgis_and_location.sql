-- Enable PostGIS and add geography location columns for radius search.
-- No table drops, no row loss.

create extension if not exists postgis;

alter table public.events
  add column if not exists location geography(point, 4326);

alter table public.pro_rodeos
  add column if not exists location geography(point, 4326);

create or replace function public.make_geography_point(
  lat double precision,
  lng double precision
)
returns geography
language sql
immutable
as $$
  select case
    when lat is null or lng is null then null::geography
    else ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  end;
$$;

create or replace function public.sync_event_location()
returns trigger
language plpgsql
as $$
begin
  new.location := public.make_geography_point(new.latitude::double precision, new.longitude::double precision);
  return new;
end;
$$;

create or replace function public.sync_pro_rodeo_location()
returns trigger
language plpgsql
as $$
begin
  new.location := public.make_geography_point(new.latitude::double precision, new.longitude::double precision);
  return new;
end;
$$;

drop trigger if exists events_sync_location on public.events;
create trigger events_sync_location
  before insert or update of latitude, longitude
  on public.events
  for each row
  execute function public.sync_event_location();

drop trigger if exists pro_rodeos_sync_location on public.pro_rodeos;
create trigger pro_rodeos_sync_location
  before insert or update of latitude, longitude
  on public.pro_rodeos
  for each row
  execute function public.sync_pro_rodeo_location();

update public.events
set location = public.make_geography_point(latitude::double precision, longitude::double precision)
where latitude is not null
  and longitude is not null
  and location is null;

update public.pro_rodeos
set location = public.make_geography_point(latitude::double precision, longitude::double precision)
where latitude is not null
  and longitude is not null
  and location is null;

create index if not exists events_location_idx
  on public.events
  using gist (location);

create index if not exists pro_rodeos_location_idx
  on public.pro_rodeos
  using gist (location);

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

create or replace function public.nearby_pro_rodeos(
  search_lat double precision,
  search_lng double precision,
  radius_miles double precision
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
  distance_miles double precision
)
language sql
stable
as $$
  with search_point as (
    select public.make_geography_point(search_lat, search_lng) as point
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
    ST_Distance(p.location, search_point.point) / 1609.344 as distance_miles
  from public.pro_rodeos p
  cross join search_point
  where p.location is not null
    and search_point.point is not null
    and ST_DWithin(p.location, search_point.point, radius_miles * 1609.344)
  order by distance_miles asc;
$$;

grant execute on function public.make_geography_point(double precision, double precision) to service_role;
grant execute on function public.nearby_events(
  double precision,
  double precision,
  double precision,
  text,
  text,
  text[]
) to service_role;
grant execute on function public.nearby_pro_rodeos(
  double precision,
  double precision,
  double precision
) to service_role;
