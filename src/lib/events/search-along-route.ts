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
  rodeoLevel?: SearchRodeoLevel | "";
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

export async function searchAlongRoute(
  input: SearchAlongRouteInput,
): Promise<RouteSearchResponse> {
  const {
    origin,
    destination,
    bufferMiles,
    format,
    rodeoLevel = "",
    disciplines = [],
    startDate,
    endDate,
  } = input;

  const drivingRoute = await getDrivingRoute(origin, destination);
  const route = mapboxCoordinatesToRoute(drivingRoute.coordinates);

  const eventFormatFilter = format === "either" ? null : format;
  const rodeoLevelFilter = rodeoLevel && rodeoLevel !== "pro" ? rodeoLevel : null;
  const disciplineFilter = disciplines.length > 0 ? disciplines : null;

  const entries: SearchResultEntry[] = [];

  if (shouldIncludeRegularEvents(rodeoLevel)) {
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

      entries.push({
        kind: "event",
        item: mapEventResult(event),
      });
    }
  }

  if (shouldIncludeProRodeos(format, rodeoLevel)) {
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
