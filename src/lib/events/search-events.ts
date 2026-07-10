import type {
  EventSearchResponse,
  EventSearchResultItem,
  ProRodeoSearchResultItem,
  SearchFormat,
  SearchRadiusMiles,
  SearchResultEntry,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";
import { findNearbyEvents, findNearbyProRodeos } from "@/lib/supabase/nearby";
import type { NearbyEventResult, NearbyProRodeoResult } from "@/lib/supabase/nearby";

const PUBLISHED_STATUSES = new Set(["approved", "published"]);

export interface SearchEventsInput {
  format: SearchFormat;
  rodeoLevel?: SearchRodeoLevel | "";
  disciplines?: SubmissionDiscipline[];
  lat: number;
  lng: number;
  radiusMiles: SearchRadiusMiles;
  startDate?: string;
  endDate?: string;
}

function shouldIncludeProRodeos(format: SearchFormat, rodeoLevel?: SearchRodeoLevel | "") {
  if (format === "jackpot") {
    return false;
  }

  if (rodeoLevel && rodeoLevel !== "pro") {
    return false;
  }

  return true;
}

function shouldIncludeRegularEvents(rodeoLevel?: SearchRodeoLevel | "") {
  return rodeoLevel !== "pro";
}

function isWithinDateRange(
  eventDate: string,
  startDate?: string,
  endDate?: string,
) {
  if (startDate && eventDate < startDate) {
    return false;
  }

  if (endDate && eventDate > endDate) {
    return false;
  }

  return true;
}

function isProRodeoWithinDateRange(
  startDateValue: string,
  endDateValue: string | null,
  startDate?: string,
  endDate?: string,
) {
  const effectiveEnd = endDateValue ?? startDateValue;

  if (endDate && startDateValue > endDate) {
    return false;
  }

  if (startDate && effectiveEnd < startDate) {
    return false;
  }

  return true;
}

function mapEventResult(event: NearbyEventResult): EventSearchResultItem {
  return {
    id: event.id,
    title: event.event_name,
    format: event.event_format,
    rodeoLevel: event.rodeo_level,
    disciplines: event.disciplines ?? [],
    city: event.address_city,
    state: event.address_state,
    eventDate: event.event_date,
    flyerUrl: event.flyer_url,
    distanceMiles: event.distance_miles,
    latitude: event.latitude ? Number(event.latitude) : null,
    longitude: event.longitude ? Number(event.longitude) : null,
  };
}

function mapProRodeoResult(proRodeo: NearbyProRodeoResult): ProRodeoSearchResultItem {
  return {
    id: proRodeo.id,
    rodeoName: proRodeo.rodeo_name,
    sanctioningBody: proRodeo.sanctioning_body,
    city: proRodeo.city,
    state: proRodeo.state,
    startDate: proRodeo.start_date,
    endDate: proRodeo.end_date,
    externalLink: proRodeo.external_link,
    distanceMiles: proRodeo.distance_miles,
    latitude: proRodeo.latitude ? Number(proRodeo.latitude) : null,
    longitude: proRodeo.longitude ? Number(proRodeo.longitude) : null,
  };
}

export async function searchEvents(input: SearchEventsInput): Promise<EventSearchResponse> {
  const {
    format,
    rodeoLevel = "",
    disciplines = [],
    lat,
    lng,
    radiusMiles,
    startDate,
    endDate,
  } = input;

  const eventFormatFilter = format === "either" ? null : format;
  const rodeoLevelFilter =
    rodeoLevel && rodeoLevel !== "pro" ? rodeoLevel : null;
  const disciplineFilter = disciplines.length > 0 ? disciplines : null;

  const entries: SearchResultEntry[] = [];

  if (shouldIncludeRegularEvents(rodeoLevel)) {
    const nearbyEvents = await findNearbyEvents({
      lat,
      lng,
      radiusMiles,
      eventFormat: eventFormatFilter,
      rodeoLevel: rodeoLevelFilter,
      disciplines: disciplineFilter,
    });

    for (const event of nearbyEvents) {
      if (!PUBLISHED_STATUSES.has(event.status)) {
        continue;
      }

      if (!isWithinDateRange(event.event_date, startDate, endDate)) {
        continue;
      }

      entries.push({
        kind: "event",
        item: mapEventResult(event),
      });
    }
  }

  if (shouldIncludeProRodeos(format, rodeoLevel)) {
    const nearbyProRodeos = await findNearbyProRodeos({
      lat,
      lng,
      radiusMiles,
    });

    for (const proRodeo of nearbyProRodeos) {
      if (!isProRodeoWithinDateRange(proRodeo.start_date, proRodeo.end_date, startDate, endDate)) {
        continue;
      }

      entries.push({
        kind: "pro_rodeo",
        item: mapProRodeoResult(proRodeo),
      });
    }
  }

  entries.sort((left, right) => left.item.distanceMiles - right.item.distanceMiles);

  const events = entries.filter((entry) => entry.kind === "event").length;
  const proRodeos = entries.filter((entry) => entry.kind === "pro_rodeo").length;

  return {
    results: entries,
    counts: {
      events,
      proRodeos,
      total: entries.length,
    },
  };
}
