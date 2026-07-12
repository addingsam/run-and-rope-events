import { eventMatchesRodeoLevels } from "@/lib/events/rodeo-levels";
import type { EventSearchResultItem } from "@/types/event-search";
import type { RodeoLevel, SubmissionDiscipline } from "@/types/event-submission";

export type UpcomingFormatFilter = "both" | "jackpot" | "rodeo";

export interface UpcomingEventFilterState {
  formatFilter: UpcomingFormatFilter;
  selectedDisciplines: SubmissionDiscipline[];
  selectedRodeoLevels: string[];
}

export const DEFAULT_UPCOMING_EVENT_FILTERS: UpcomingEventFilterState = {
  formatFilter: "both",
  selectedDisciplines: [],
  selectedRodeoLevels: [],
};

export const UPCOMING_FORMAT_FILTER_OPTIONS = [
  { value: "both", label: "Both" },
  { value: "jackpot", label: "Jackpot" },
  { value: "rodeo", label: "Rodeo" },
] as const satisfies readonly { value: UpcomingFormatFilter; label: string }[];

/** Supabase `events.rodeo_level` values. */
export const UPCOMING_RODEO_LEVEL_OPTIONS = [
  { value: "youth", label: "Youth" },
  { value: "open", label: "Open" },
  { value: "amateur", label: "Amateur" },
  { value: "pro", label: "Pro" },
] as const satisfies readonly { value: RodeoLevel | "pro"; label: string }[];

function eventMatchesDisciplines(
  event: EventSearchResultItem,
  selectedDisciplines: SubmissionDiscipline[],
) {
  if (selectedDisciplines.length === 0) {
    return true;
  }

  return event.disciplines.some((discipline) =>
    selectedDisciplines.includes(discipline as SubmissionDiscipline),
  );
}

function eventMatchesRodeoLevelsFilter(
  event: EventSearchResultItem,
  selectedRodeoLevels: string[],
) {
  return eventMatchesRodeoLevels(event.rodeoLevel, selectedRodeoLevels);
}

export function hasActiveUpcomingFilters({
  formatFilter,
  selectedDisciplines,
  selectedRodeoLevels,
}: UpcomingEventFilterState) {
  return (
    formatFilter !== "both" ||
    selectedDisciplines.length > 0 ||
    selectedRodeoLevels.length > 0
  );
}

export function filterUpcomingEvents(
  events: EventSearchResultItem[],
  filters: UpcomingEventFilterState,
): EventSearchResultItem[] {
  const { formatFilter, selectedDisciplines, selectedRodeoLevels } = filters;

  return events.filter((event) => {
    const format = event.format?.trim().toLowerCase();

    if (formatFilter === "jackpot") {
      if (format !== "jackpot") {
        return false;
      }

      return eventMatchesDisciplines(event, selectedDisciplines);
    }

    if (formatFilter === "rodeo") {
      if (format !== "rodeo") {
        return false;
      }

      return eventMatchesRodeoLevelsFilter(event, selectedRodeoLevels);
    }

    if (format === "jackpot") {
      return eventMatchesDisciplines(event, selectedDisciplines);
    }

    if (format === "rodeo") {
      return eventMatchesRodeoLevelsFilter(event, selectedRodeoLevels);
    }

    return false;
  });
}

export function formatUpcomingEventsCount({
  matchCount,
  totalCount,
  hasActiveFilters,
}: {
  matchCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
}) {
  if (totalCount === 0) {
    return "No upcoming listings.";
  }

  if (!hasActiveFilters) {
    return `${matchCount} upcoming listing${matchCount === 1 ? "" : "s"}, sorted by date.`;
  }

  return `${matchCount} matching listing${matchCount === 1 ? "" : "s"} of ${totalCount} upcoming, sorted by date.`;
}
