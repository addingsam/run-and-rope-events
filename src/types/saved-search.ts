import type {
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";
import type { UpcomingFormatFilter } from "@/lib/events/filter-upcoming-events";

export type SavedSearchMode = SearchMode | "upcoming";

export interface SavedSearchParams {
  mode: SavedSearchMode;
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
  /** Used when mode is "upcoming" — upcoming events grid filters. */
  upcomingFormatFilter?: UpcomingFormatFilter;
  upcomingDisciplines?: SubmissionDiscipline[];
  upcomingRodeoLevels?: string[];
}

export interface SavedMapOverlay {
  pinRadius: { lng: number; lat: number; radiusMiles: number } | null;
  shapes: {
    type: "Polygon";
    coordinates: number[][][];
  }[];
}

export type SavedSearchAlertFrequency = "off" | "daily" | "weekly";

export interface SavedSearchRecord {
  id: string;
  user_id: string;
  name: string;
  search_params: SavedSearchParams;
  map_overlay: SavedMapOverlay | null;
  alerts_enabled: boolean;
  alert_frequency: SavedSearchAlertFrequency;
  last_alert_sent_at: string | null;
  known_event_ids: string[];
  created_at: string;
  updated_at: string;
}
