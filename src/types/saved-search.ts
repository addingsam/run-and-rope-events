import type {
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

export interface SavedSearchParams {
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
}

export interface SavedMapOverlay {
  pinRadius: { lng: number; lat: number; radiusMiles: number } | null;
  shapes: {
    type: "Polygon";
    coordinates: number[][][];
  }[];
}

export interface SavedSearchRecord {
  id: string;
  user_id: string;
  name: string;
  search_params: SavedSearchParams;
  map_overlay: SavedMapOverlay | null;
  alerts_enabled: boolean;
  known_event_ids: string[];
  created_at: string;
  updated_at: string;
}
