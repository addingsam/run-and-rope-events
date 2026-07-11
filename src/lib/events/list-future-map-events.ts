import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventSearchResultItem, SearchResultEntry } from "@/types/event-search";

const PUBLISHED_STATUSES = ["approved", "published"] as const;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

const EVENT_LIST_FIELDS =
  "id, event_name, event_format, rodeo_level, disciplines, address_city, address_state, event_date, flyer_url, latitude, longitude";

type EventListRecord = {
  id: string;
  event_name: string;
  event_format: string | null;
  rodeo_level: string | null;
  disciplines: string[] | null;
  address_city: string;
  address_state: string;
  event_date: string;
  flyer_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

function mapRecordToSearchItem(record: EventListRecord): EventSearchResultItem {
  return {
    id: record.id,
    title: record.event_name,
    format: record.event_format,
    rodeoLevel: record.rodeo_level,
    disciplines: record.disciplines ?? [],
    city: record.address_city,
    state: record.address_state,
    eventDate: record.event_date,
    flyerUrl: record.flyer_url,
    distanceMiles: 0,
    latitude: record.latitude != null ? Number(record.latitude) : null,
    longitude: record.longitude != null ? Number(record.longitude) : null,
  };
}

function mapRecordToSearchEntry(record: EventListRecord): SearchResultEntry | null {
  if (record.latitude == null || record.longitude == null) {
    return null;
  }

  return { kind: "event", item: mapRecordToSearchItem(record) };
}

export async function listUpcomingEvents(): Promise<EventSearchResultItem[]> {
  const supabase = getSupabaseAdminClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_FIELDS)
    .in("status", [...PUBLISHED_STATUSES])
    .gte("event_date", today)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((record) => mapRecordToSearchItem(record));
}

export async function listFutureMapEvents(): Promise<SearchResultEntry[]> {
  const supabase = getSupabaseAdminClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_LIST_FIELDS)
    .in("status", [...PUBLISHED_STATUSES])
    .gte("event_date", today)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("event_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((record) => mapRecordToSearchEntry(record))
    .filter((entry): entry is SearchResultEntry => entry !== null);
}
