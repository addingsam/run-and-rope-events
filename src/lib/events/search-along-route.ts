import type {
  EventSearchResponse,
  EventSearchResultItem,
  ProRodeoSearchResultItem,
  SearchBufferMiles,
  SearchFormat,
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
import {
  findEventsAlongRoute,
  findProRodeosAlongRoute,
  mapboxCoordinatesToRoute,
  type RoutePoint,
} from "@/lib/supabase/along-route";
import type {
  EventAlongRouteResult,
  ProRodeoAlongRouteResult,
} from "@/lib/supabase/along-route";
import { getDrivingRoute } from "@/lib/mapbox/directions";

const PUBLISHED_STATUSES = new Set(["approved", "published"]);

export interface SearchAlongRouteInput {
  origin: RoutePoint;
  destination: RoutePoint;
  bufferMiles: SearchBufferMiles;
  format: SearchFormat;
  rodeoLevels?: SearchRodeoLevel[];
  disciplines?: SubmissionDiscipline[];
  startDate?: string;
  endDate?: string;
}

export interface RouteSearchResponse extends EventSearchResponse {
  route: {
    coordinates: [number, number][];
    distanceMiles: number;
    durationMinutes: number;
  };
}

function isWithinDateRange(eventDate: string, startDate?: string, endDate?: string) {
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

function mapEventResult(event: EventAlongRouteResult): EventSearchResultItem {
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
    distanceMiles: event.distance_along_route_miles,
    latitude: event.latitude ? Number(event.latitude) : null,
    longitude: event.longitude ? Number(event.longitude) : null,
  };
}

function mapProRodeoResult(proRodeo: ProRodeoAlongRouteResult): ProRodeoSearchResultItem {
  return {
    id: proRodeo.id,
    rodeoName: proRodeo.rodeo_name,
    sanctioningBody: proRodeo.sanctioning_body,
    city: proRodeo.city,
    state: proRodeo.state,
    startDate: proRodeo.start_date,
    endDate: proRodeo.end_date,
    externalLink: proRodeo.external_link,
    distanceMiles: proRodeo.distance_along_route_miles,
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

export async function searchAlongRoute(
  input: SearchAlongRouteInput,
): Promise<RouteSearchResponse> {
  const {
    origin,
    destination,
    bufferMiles,
    format,
    rodeoLevels = [],
    disciplines = [],
    startDate,
    endDate,
  } = input;

  const drivingRoute = await getDrivingRoute(origin, destination);
  const route = mapboxCoordinatesToRoute(drivingRoute.coordinates);

  const eventFormatFilter = format === "either" ? null : format;
  const matchingLevels = regularRodeoLevelsForMatching(rodeoLevels);
  const rodeoLevelFilter =
    matchingLevels.length === 1 ? matchingLevels[0] : null;
  const disciplineFilter = disciplines.length > 0 ? disciplines : null;

  const entries: SearchResultEntry[] = [];

  if (shouldIncludeRegularRodeoEvents(rodeoLevels)) {
    const alongRouteEvents = await findEventsAlongRoute({
      route,
      bufferMiles,
      eventFormat: eventFormatFilter,
      rodeoLevel: rodeoLevelFilter,
      disciplines: disciplineFilter,
    });

    for (const event of alongRouteEvents) {
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
    const alongRouteProRodeos = await findProRodeosAlongRoute({
      route,
      bufferMiles,
    });

    for (const proRodeo of alongRouteProRodeos) {
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
    route: {
      coordinates: drivingRoute.coordinates,
      distanceMiles: drivingRoute.distanceMiles,
      durationMinutes: drivingRoute.durationMinutes,
    },
  };
}
