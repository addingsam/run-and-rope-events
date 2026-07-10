import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event-record";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface AlongRouteParams {
  route: RoutePoint[];
  bufferMiles: number;
  eventFormat?: string | null;
  rodeoLevel?: string | null;
  disciplines?: string[] | null;
}

export type EventAlongRouteResult = EventRecord & {
  location: unknown;
  distance_along_route_miles: number;
};

export type ProRodeoAlongRouteResult = ProRodeoRecord & {
  location: unknown;
  distance_along_route_miles: number;
};

function splitRouteCoordinates(route: RoutePoint[]) {
  return {
    route_lats: route.map((point) => point.lat),
    route_lngs: route.map((point) => point.lng),
  };
}

/** Mapbox Directions coordinates are [lng, lat]. */
export function mapboxCoordinatesToRoute(
  coordinates: [number, number][],
): RoutePoint[] {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export async function findEventsAlongRoute({
  route,
  bufferMiles,
  eventFormat = null,
  rodeoLevel = null,
  disciplines = null,
}: AlongRouteParams) {
  const supabase = getSupabaseAdminClient();
  const { route_lats, route_lngs } = splitRouteCoordinates(route);

  const { data, error } = await supabase.rpc("events_along_route", {
    route_lats,
    route_lngs,
    buffer_miles: bufferMiles,
    filter_event_format: eventFormat,
    filter_rodeo_level: rodeoLevel,
    filter_disciplines: disciplines,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventAlongRouteResult[];
}

export async function findProRodeosAlongRoute({
  route,
  bufferMiles,
}: Pick<AlongRouteParams, "route" | "bufferMiles">) {
  const supabase = getSupabaseAdminClient();
  const { route_lats, route_lngs } = splitRouteCoordinates(route);

  const { data, error } = await supabase.rpc("pro_rodeos_along_route", {
    route_lats,
    route_lngs,
    buffer_miles: bufferMiles,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProRodeoAlongRouteResult[];
}
