import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event-record";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

export interface NearbyEventsParams {
  lat: number;
  lng: number;
  radiusMiles: number;
  eventFormat?: string | null;
  rodeoLevel?: string | null;
  disciplines?: string[] | null;
}

export type NearbyEventResult = EventRecord & {
  location: unknown;
  distance_miles: number;
};

export type NearbyProRodeoResult = ProRodeoRecord & {
  location: unknown;
  distance_miles: number;
};

export async function findNearbyEvents({
  lat,
  lng,
  radiusMiles,
  eventFormat = null,
  rodeoLevel = null,
  disciplines = null,
}: NearbyEventsParams) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("nearby_events", {
    search_lat: lat,
    search_lng: lng,
    radius_miles: radiusMiles,
    filter_event_format: eventFormat,
    filter_rodeo_level: rodeoLevel,
    filter_disciplines: disciplines,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NearbyEventResult[];
}

export async function findNearbyProRodeos({
  lat,
  lng,
  radiusMiles,
}: Pick<NearbyEventsParams, "lat" | "lng" | "radiusMiles">) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("nearby_pro_rodeos", {
    search_lat: lat,
    search_lng: lng,
    radius_miles: radiusMiles,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NearbyProRodeoResult[];
}
