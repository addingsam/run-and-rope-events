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
import {
  eventMatchesRodeoLevels,
  regularRodeoLevelsForMatching,
  shouldIncludeProRodeos,
  shouldIncludeRegularRodeoEvents,
} from "@/lib/events/rodeo-levels";
import { findNearbyEvents, findNearbyProRodeos } from "@/lib/supabase/nearby";
import type { NearbyEventResult, NearbyProRodeoResult } from "@/lib/supabase/nearby";

const PUBLISHED_STATUSES = new Set(["approved", "published"]);

export interface SearchEventsInput {
  format: SearchFormat;
  rodeoLevels?: SearchRodeoLevel[];
  disciplines?: SubmissionDiscipline[];
  lat: number;
  lng: number;
  radiusMiles: SearchRadiusMiles;
  startDate?: string;
  endDate?: string;
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

function eventMatchesRodeoLevelFilter(
  event: EventSearchResultItem,
  format: SearchFormat,
  rodeoLevels: SearchRodeoLevel[],
) {
  const eventFormat = event.format?.trim().toLowerCase();

  if (eventFormat !== "rodeo") {
    return format !== "rodeo";
  }

  if (rodeoLevels.length === 0) {
    return true;
  }

  return eventMatchesRodeoLevels(
    event.rodeoLevel,
    regularRodeoLevelsForMatching(rodeoLevels),
  );
}

export async function searchEvents(input: SearchEventsInput): Promise<EventSearchResponse> {
  const {
    format,
    rodeoLevels = [],
    disciplines = [],
    lat,
    lng,
    radiusMiles,
    startDate,
    endDate,
  } = input;

  const eventFormatFilter = format === "either" ? null : format;
  const matchingLevels = regularRodeoLevelsForMatching(rodeoLevels);
  const rodeoLevelFilter =
    matchingLevels.length === 1 ? matchingLevels[0] : null;
  const disciplineFilter = disciplines.length > 0 ? disciplines : null;

  const entries: SearchResultEntry[] = [];

  if (shouldIncludeRegularRodeoEvents(rodeoLevels)) {
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

      const mapped = mapEventResult(event);
      if (!eventMatchesRodeoLevelFilter(mapped, format, rodeoLevels)) {
        continue;
      }

      entries.push({
        kind: "event",
        item: mapped,
      });
    }
  }

  if (shouldIncludeProRodeos(format, rodeoLevels)) {
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
