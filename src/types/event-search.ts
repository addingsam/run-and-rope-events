import type { SubmissionDiscipline } from "@/types/event-submission";
import type { SanctioningBody } from "@/types/pro-rodeo-record";

export type SearchFormat = "jackpot" | "rodeo" | "either";

export type SearchRodeoLevel = "youth" | "open" | "amateur" | "pro";

export type SearchRadiusMiles = 25 | 50 | 100 | 200;

export type SearchBufferMiles = 5 | 10 | 25;

export type SearchMode = "radius" | "route";

export interface EventSearchFilters {
  format: SearchFormat;
  rodeoLevel: SearchRodeoLevel | "";
  disciplines: SubmissionDiscipline[];
  locationLabel: string;
  lat: number | null;
  lng: number | null;
  radiusMiles: SearchRadiusMiles;
  startDate: string;
  endDate: string;
}

export interface EventSearchResultItem {
  id: string;
  title: string;
  format: string | null;
  rodeoLevel: string | null;
  disciplines: string[];
  city: string;
  state: string;
  eventDate: string;
  flyerUrl: string | null;
  distanceMiles: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ProRodeoSearchResultItem {
  id: string;
  rodeoName: string;
  sanctioningBody: SanctioningBody;
  city: string;
  state: string;
  startDate: string;
  endDate: string | null;
  externalLink: string;
  distanceMiles: number;
  latitude?: number | null;
  longitude?: number | null;
}

export type SearchResultEntry =
  | { kind: "event"; item: EventSearchResultItem }
  | { kind: "pro_rodeo"; item: ProRodeoSearchResultItem };

export interface EventSearchResponse {
  results: SearchResultEntry[];
  counts: {
    events: number;
    proRodeos: number;
    total: number;
  };
}

export interface RouteSearchResponse extends EventSearchResponse {
  route: {
    coordinates: [number, number][];
    distanceMiles: number;
    durationMinutes: number;
  };
}

export interface LocationSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  zip: string;
}
