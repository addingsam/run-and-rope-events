import { filterEventItemsByMapOverlay } from "@/lib/events/filter-results-by-map-overlay";
import {
  filterEventsBySearchCriteria,
  searchCriteriaFromFormState,
  type SearchCriteriaFilter,
} from "@/lib/events/filter-results-by-search-criteria";
import {
  filterUpcomingEvents,
  type UpcomingEventFilterState,
} from "@/lib/events/filter-upcoming-events";
import { listUpcomingEvents } from "@/lib/events/list-future-map-events";
import {
  DEFAULT_SEARCH_BUFFER,
  DEFAULT_SEARCH_RADIUS,
} from "@/lib/events/search-options";
import { searchAlongRoute } from "@/lib/events/search-along-route";
import { searchEvents } from "@/lib/events/search-events";
import type { EventSearchResponse } from "@/types/event-search";
import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";
import type {
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

export function createEmptySavedSearchParams(): SavedSearchParams {
  return {
    mode: "radius",
    format: "either",
    rodeoLevel: "",
    disciplines: [],
    locationLabel: "",
    lat: null,
    lng: null,
    radiusMiles: DEFAULT_SEARCH_RADIUS,
    originLabel: "",
    originLat: null,
    originLng: null,
    destinationLabel: "",
    destinationLat: null,
    destinationLng: null,
    bufferMiles: DEFAULT_SEARCH_BUFFER,
    startDate: "",
    endDate: "",
  };
}

export function upcomingFiltersFromSavedParams(
  params: SavedSearchParams,
): UpcomingEventFilterState {
  return {
    formatFilter: params.upcomingFormatFilter ?? "both",
    selectedDisciplines: params.upcomingDisciplines ?? [],
    selectedRodeoLevels: params.upcomingRodeoLevels ?? [],
  };
}

export function savedUpcomingSearchParams(
  filters: UpcomingEventFilterState,
): SavedSearchParams {
  return {
    ...createEmptySavedSearchParams(),
    mode: "upcoming",
    upcomingFormatFilter: filters.formatFilter,
    upcomingDisciplines: filters.selectedDisciplines,
    upcomingRodeoLevels: filters.selectedRodeoLevels,
  };
}

function savedParamsToSearchCriteria(params: SavedSearchParams): SearchCriteriaFilter {
  if (params.mode === "upcoming") {
    const upcoming = upcomingFiltersFromSavedParams(params);
    return {
      format:
        upcoming.formatFilter === "jackpot"
          ? "jackpot"
          : upcoming.formatFilter === "rodeo"
            ? "rodeo"
            : "either",
      rodeoLevel: (upcoming.selectedRodeoLevels[0] as SearchRodeoLevel | undefined) ?? "",
      disciplines: upcoming.selectedDisciplines,
      startDate: "",
      endDate: "",
    };
  }

  return searchCriteriaFromFormState(params);
}

async function runMapAreaSavedSearch(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
): Promise<EventSearchResponse> {
  const events = await listUpcomingEvents();
  const filtered = filterEventsBySearchCriteria(events, savedParamsToSearchCriteria(params));
  const overlayFiltered = filterEventItemsByMapOverlay(
    filtered,
    mapOverlay ?? { pinRadius: null, shapes: [] },
  );

  return {
    results: overlayFiltered.map((item) => ({ kind: "event", item })),
    counts: {
      events: overlayFiltered.length,
      proRodeos: 0,
      total: overlayFiltered.length,
    },
  };
}

async function runUpcomingSavedSearch(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
): Promise<EventSearchResponse> {
  const events = await listUpcomingEvents();
  const filtered = filterUpcomingEvents(events, upcomingFiltersFromSavedParams(params));
  const overlayFiltered = filterEventItemsByMapOverlay(
    filtered,
    mapOverlay ?? { pinRadius: null, shapes: [] },
  );

  return {
    results: overlayFiltered.map((item) => ({ kind: "event", item })),
    counts: {
      events: overlayFiltered.length,
      proRodeos: 0,
      total: overlayFiltered.length,
    },
  };
}

export async function runSavedSearch(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
) {
  if (params.mode === "upcoming") {
    return runUpcomingSavedSearch(params, mapOverlay);
  }

  if (params.mode === "map") {
    return runMapAreaSavedSearch(params, mapOverlay);
  }

  if (params.mode === "route") {
    if (
      params.originLat === null ||
      params.originLng === null ||
      params.destinationLat === null ||
      params.destinationLng === null
    ) {
      throw new Error("Saved route search is missing origin or destination coordinates.");
    }

    return searchAlongRoute({
      origin: { lat: params.originLat, lng: params.originLng },
      destination: { lat: params.destinationLat, lng: params.destinationLng },
      bufferMiles: params.bufferMiles,
      format: params.format,
      rodeoLevel: params.rodeoLevel,
      disciplines: params.disciplines,
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
    });
  }

  if (params.lat === null || params.lng === null) {
    throw new Error("Saved radius search is missing location coordinates.");
  }

  return searchEvents({
    format: params.format,
    rodeoLevel: params.rodeoLevel,
    disciplines: params.disciplines,
    lat: params.lat,
    lng: params.lng,
    radiusMiles: params.radiusMiles,
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
  });
}

export function savedSearchParamsFromFormState(state: {
  mode: SearchMode;
  format: SearchFormat;
  rodeoLevel: SearchRodeoLevel | "";
  disciplines: SubmissionDiscipline[];
  locationLabel: string;
  lat: number | null;
  lng: number | null;
  radiusMiles: SearchRadiusMiles;
  originLabel: string;
  originLat: number | null;
  originLng: number | null;
  destinationLabel: string;
  destinationLat: number | null;
  destinationLng: number | null;
  bufferMiles: SearchBufferMiles;
  startDate: string;
  endDate: string;
}): SavedSearchParams {
  return { ...state };
}

export const PENDING_SAVED_SEARCH_KEY = "jackpot-rodeo:pending-saved-search";
export const SEARCH_RUN_PARAM = "run";
export const SAVED_UPCOMING_PARAM = "savedUpcoming";

interface PendingSavedSearch {
  params: SavedSearchParams;
  mapOverlay?: SavedMapOverlay | null;
}

export function storePendingSavedSearch(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
) {
  const payload: PendingSavedSearch = { params, mapOverlay };
  sessionStorage.setItem(PENDING_SAVED_SEARCH_KEY, JSON.stringify(payload));
}

export function consumePendingSavedSearch(): PendingSavedSearch | null {
  const raw = sessionStorage.getItem(PENDING_SAVED_SEARCH_KEY);
  if (!raw) {
    return null;
  }

  sessionStorage.removeItem(PENDING_SAVED_SEARCH_KEY);

  try {
    return JSON.parse(raw) as PendingSavedSearch;
  } catch {
    return null;
  }
}

export function savedUpcomingSearchToQueryString(params: SavedSearchParams) {
  const search = new URLSearchParams();
  search.set(SAVED_UPCOMING_PARAM, "1");

  if (params.upcomingFormatFilter && params.upcomingFormatFilter !== "both") {
    search.set("upcomingFormat", params.upcomingFormatFilter);
  }

  if (params.upcomingDisciplines && params.upcomingDisciplines.length > 0) {
    search.set("upcomingDisciplines", params.upcomingDisciplines.join(","));
  }

  if (params.upcomingRodeoLevels && params.upcomingRodeoLevels.length > 0) {
    search.set("upcomingLevels", params.upcomingRodeoLevels.join(","));
  }

  return search.toString();
}

export function upcomingFiltersFromQueryString(searchParams: URLSearchParams): UpcomingEventFilterState | null {
  if (searchParams.get(SAVED_UPCOMING_PARAM) !== "1") {
    return null;
  }

  const format = searchParams.get("upcomingFormat");
  const disciplines = searchParams.get("upcomingDisciplines");
  const levels = searchParams.get("upcomingLevels");

  return {
    formatFilter:
      format === "jackpot" || format === "rodeo" || format === "both" ? format : "both",
    selectedDisciplines: disciplines
      ? (disciplines.split(",").map((item) => item.trim()).filter(Boolean) as SubmissionDiscipline[])
      : [],
    selectedRodeoLevels: levels
      ? levels.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

export function savedSearchToQueryString(params: SavedSearchParams) {
  if (params.mode === "upcoming") {
    return savedUpcomingSearchToQueryString(params);
  }

  const search = new URLSearchParams();
  if (params.mode === "map") {
    search.set("mode", "map");
  } else if (params.mode === "route") {
    search.set("mode", "route");
    search.set(SEARCH_RUN_PARAM, "1");
  } else {
    search.set(SEARCH_RUN_PARAM, "1");
  }
  if (params.format !== "either") {
    search.set("format", params.format);
  }
  if (params.rodeoLevel) {
    search.set("rodeoLevel", params.rodeoLevel);
  }
  if (params.disciplines.length > 0) {
    search.set("disciplines", params.disciplines.join(","));
  }
  if (params.mode === "route") {
    if (params.originLabel) search.set("origin", params.originLabel);
    if (params.originLat !== null) search.set("originLat", String(params.originLat));
    if (params.originLng !== null) search.set("originLng", String(params.originLng));
    if (params.destinationLabel) search.set("destination", params.destinationLabel);
    if (params.destinationLat !== null) {
      search.set("destinationLat", String(params.destinationLat));
    }
    if (params.destinationLng !== null) {
      search.set("destinationLng", String(params.destinationLng));
    }
    search.set("buffer", String(params.bufferMiles));
  } else {
    if (params.locationLabel) search.set("location", params.locationLabel);
    if (params.lat !== null) search.set("lat", String(params.lat));
    if (params.lng !== null) search.set("lng", String(params.lng));
    search.set("radius", String(params.radiusMiles));
  }
  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);
  return search.toString();
}

export function isUpcomingSavedSearch(params: SavedSearchParams) {
  return params.mode === "upcoming";
}
