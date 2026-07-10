import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";
import type {
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";
import { searchAlongRoute } from "@/lib/events/search-along-route";
import { searchEvents } from "@/lib/events/search-events";

export async function runSavedSearch(params: SavedSearchParams) {
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

export const PENDING_SAVED_SEARCH_KEY = "run-and-rope:pending-saved-search";
export const SEARCH_RUN_PARAM = "run";

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

export function savedSearchToQueryString(params: SavedSearchParams) {
  const search = new URLSearchParams();
  search.set(SEARCH_RUN_PARAM, "1");
  if (params.mode === "route") {
    search.set("mode", "route");
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
