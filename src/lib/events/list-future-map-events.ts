import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  EventSearchResultItem,
  ProRodeoSearchResultItem,
  SearchResultEntry,
} from "@/types/event-search";
import type { ProRodeoRecord } from "@/types/pro-rodeo-record";

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

function mapProRodeoRecordToSearchEntry(record: ProRodeoRecord): SearchResultEntry | null {
  if (record.latitude == null || record.longitude == null) {
    return null;
  }

  const item: ProRodeoSearchResultItem = {
    id: record.id,
    rodeoName: record.rodeo_name,
    sanctioningBody: record.sanctioning_body,
    city: record.city,
    state: record.state,
    startDate: record.start_date,
    endDate: record.end_date,
    externalLink: record.external_link,
    distanceMiles: 0,
    latitude: Number(record.latitude),
    longitude: Number(record.longitude),
  };

  return { kind: "pro_rodeo", item };
}

async function listFutureProRodeoEntries(): Promise<SearchResultEntry[]> {
  const supabase = getSupabaseAdminClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("pro_rodeos")
    .select(
      "id, rodeo_name, sanctioning_body, city, state, start_date, end_date, latitude, longitude, external_link",
    )
    .gte("start_date", today)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((record) => mapProRodeoRecordToSearchEntry(record as ProRodeoRecord))
    .filter((entry): entry is SearchResultEntry => entry !== null);
}

export async function listFutureMapEvents(): Promise<SearchResultEntry[]> {
  const [events, proRodeos] = await Promise.all([
    listFutureEventEntries(),
    listFutureProRodeoEntries(),
  ]);

  return [...events, ...proRodeos];
}

async function listFutureEventEntries(): Promise<SearchResultEntry[]> {
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
