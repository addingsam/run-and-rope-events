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

function normalizeSavedSearchParams(params: SavedSearchParams): SavedSearchParams {
  const legacyRodeoLevel = (params as { rodeoLevel?: SearchRodeoLevel | "" }).rodeoLevel;
  const rodeoLevels =
    params.rodeoLevels ??
    (legacyRodeoLevel ? [legacyRodeoLevel as SearchRodeoLevel] : []);

  return {
    ...params,
    rodeoLevels,
  };
}

export function createEmptySavedSearchParams(): SavedSearchParams {
  return {
    mode: "radius",
    format: "either",
    rodeoLevels: [],
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
  const normalized = normalizeSavedSearchParams(params);

  if (normalized.mode === "upcoming") {
    const upcoming = upcomingFiltersFromSavedParams(normalized);
    return {
      format:
        upcoming.formatFilter === "jackpot"
          ? "jackpot"
          : upcoming.formatFilter === "rodeo"
            ? "rodeo"
            : "either",
      rodeoLevels: upcoming.selectedRodeoLevels as SearchRodeoLevel[],
      disciplines: upcoming.selectedDisciplines,
      startDate: "",
      endDate: "",
    };
  }

  return searchCriteriaFromFormState(normalized);
}

async function runMapAreaSavedSearch(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
): Promise<EventSearchResponse> {
  const normalized = normalizeSavedSearchParams(params);
  const events = await listUpcomingEvents();
  const filtered = filterEventsBySearchCriteria(events, savedParamsToSearchCriteria(normalized));
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
  const normalized = normalizeSavedSearchParams(params);
  const events = await listUpcomingEvents();
  const filtered = filterUpcomingEvents(events, upcomingFiltersFromSavedParams(normalized));
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
  const normalized = normalizeSavedSearchParams(params);

  if (normalized.mode === "upcoming") {
    return runUpcomingSavedSearch(normalized, mapOverlay);
  }

  if (normalized.mode === "map") {
    return runMapAreaSavedSearch(normalized, mapOverlay);
  }

  if (normalized.mode === "route") {
    if (
      normalized.originLat === null ||
      normalized.originLng === null ||
      normalized.destinationLat === null ||
      normalized.destinationLng === null
    ) {
      throw new Error("Saved route search is missing origin or destination coordinates.");
    }

    return searchAlongRoute({
      origin: { lat: normalized.originLat, lng: normalized.originLng },
      destination: { lat: normalized.destinationLat, lng: normalized.destinationLng },
      bufferMiles: normalized.bufferMiles,
      format: normalized.format,
      rodeoLevels: normalized.rodeoLevels,
      disciplines: normalized.disciplines,
      startDate: normalized.startDate || undefined,
      endDate: normalized.endDate || undefined,
    });
  }

  if (normalized.lat === null || normalized.lng === null) {
    throw new Error("Saved radius search is missing location coordinates.");
  }

  return searchEvents({
    format: normalized.format,
    rodeoLevels: normalized.rodeoLevels,
    disciplines: normalized.disciplines,
    lat: normalized.lat,
    lng: normalized.lng,
    radiusMiles: normalized.radiusMiles,
    startDate: normalized.startDate || undefined,
    endDate: normalized.endDate || undefined,
  });
}

export function savedSearchParamsFromFormState(state: {
  mode: SearchMode;
  format: SearchFormat;
  rodeoLevels: SearchRodeoLevel[];
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
    const parsed = JSON.parse(raw) as PendingSavedSearch;
    return {
      ...parsed,
      params: normalizeSavedSearchParams(parsed.params),
    };
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
  const normalized = normalizeSavedSearchParams(params);

  if (normalized.mode === "upcoming") {
    return savedUpcomingSearchToQueryString(normalized);
  }

  const search = new URLSearchParams();
  if (normalized.mode === "map") {
    search.set("mode", "map");
  } else if (normalized.mode === "route") {
    search.set("mode", "route");
    search.set(SEARCH_RUN_PARAM, "1");
  } else {
    search.set(SEARCH_RUN_PARAM, "1");
  }
  if (normalized.format !== "either") {
    search.set("format", normalized.format);
  }
  if (normalized.rodeoLevels.length > 0) {
    search.set("rodeoLevels", normalized.rodeoLevels.join(","));
  }
  if (normalized.disciplines.length > 0) {
    search.set("disciplines", normalized.disciplines.join(","));
  }
  if (normalized.mode === "route") {
    if (normalized.originLabel) search.set("origin", normalized.originLabel);
    if (normalized.originLat !== null) search.set("originLat", String(normalized.originLat));
    if (normalized.originLng !== null) search.set("originLng", String(normalized.originLng));
    if (normalized.destinationLabel) search.set("destination", normalized.destinationLabel);
    if (normalized.destinationLat !== null) {
      search.set("destinationLat", String(normalized.destinationLat));
    }
    if (normalized.destinationLng !== null) {
      search.set("destinationLng", String(normalized.destinationLng));
    }
    search.set("buffer", String(normalized.bufferMiles));
  } else {
    if (normalized.locationLabel) search.set("location", normalized.locationLabel);
    if (normalized.lat !== null) search.set("lat", String(normalized.lat));
    if (normalized.lng !== null) search.set("lng", String(normalized.lng));
    search.set("radius", String(normalized.radiusMiles));
  }
  if (normalized.startDate) search.set("startDate", normalized.startDate);
  if (normalized.endDate) search.set("endDate", normalized.endDate);
  return search.toString();
}

export function isUpcomingSavedSearch(params: SavedSearchParams) {
  return params.mode === "upcoming";
}
