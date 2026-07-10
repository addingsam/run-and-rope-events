import type {
  SearchBufferMiles,
  SearchFormat,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";

export const SEARCH_FORMAT_OPTIONS = [
  { value: "either", label: "Either" },
  { value: "jackpot", label: "Jackpot" },
  { value: "rodeo", label: "Rodeo" },
] as const satisfies readonly { value: SearchFormat; label: string }[];

export const SEARCH_RODEO_LEVEL_OPTIONS = [
  { value: "youth", label: "Youth" },
  { value: "open", label: "Open" },
  { value: "amateur", label: "Amateur" },
  { value: "pro", label: "Pro" },
] as const satisfies readonly { value: SearchRodeoLevel; label: string }[];

export const SEARCH_RADIUS_OPTIONS = [
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "200", label: "200 miles" },
] as const satisfies readonly { value: `${SearchRadiusMiles}`; label: string }[];

export const DEFAULT_SEARCH_RADIUS: SearchRadiusMiles = 50;

export const SEARCH_BUFFER_OPTIONS = [
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
] as const satisfies readonly { value: `${SearchBufferMiles}`; label: string }[];

export const DEFAULT_SEARCH_BUFFER: SearchBufferMiles = 10;
