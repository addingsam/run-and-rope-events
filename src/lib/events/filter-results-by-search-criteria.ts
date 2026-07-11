import type {
  EventSearchResultItem,
  ProRodeoSearchResultItem,
  SearchFormat,
  SearchResultEntry,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

export interface SearchCriteriaFilter {
  format: SearchFormat;
  rodeoLevel: SearchRodeoLevel | "";
  disciplines: SubmissionDiscipline[];
  startDate: string;
  endDate: string;
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

export function hasActiveSearchCriteria({
  format,
  rodeoLevel,
  disciplines,
  startDate,
  endDate,
}: SearchCriteriaFilter) {
  return (
    format !== "either" ||
    Boolean(rodeoLevel) ||
    disciplines.length > 0 ||
    Boolean(startDate) ||
    Boolean(endDate)
  );
}

export function searchCriteriaFromFormState(state: {
  format: SearchFormat;
  rodeoLevel: SearchRodeoLevel | "";
  disciplines: SubmissionDiscipline[];
  startDate: string;
  endDate: string;
}): SearchCriteriaFilter {
  return {
    format: state.format,
    rodeoLevel: state.rodeoLevel,
    disciplines: state.disciplines,
    startDate: state.startDate,
    endDate: state.endDate,
  };
}

export function eventMatchesSearchCriteria(
  event: EventSearchResultItem,
  criteria: SearchCriteriaFilter,
) {
  if (!shouldIncludeRegularEvents(criteria.rodeoLevel)) {
    return false;
  }

  const format = event.format?.trim().toLowerCase();

  if (criteria.format === "jackpot" && format !== "jackpot") {
    return false;
  }

  if (criteria.format === "rodeo" && format !== "rodeo") {
    return false;
  }

  if (criteria.rodeoLevel) {
    const level = event.rodeoLevel?.trim().toLowerCase();
    if (level !== criteria.rodeoLevel) {
      return false;
    }
  }

  if (criteria.disciplines.length > 0) {
    const matchesDiscipline = event.disciplines.some((discipline) =>
      criteria.disciplines.includes(discipline as SubmissionDiscipline),
    );

    if (!matchesDiscipline) {
      return false;
    }
  }

  return isWithinDateRange(event.eventDate, criteria.startDate, criteria.endDate);
}

export function proRodeoMatchesSearchCriteria(
  proRodeo: ProRodeoSearchResultItem,
  criteria: SearchCriteriaFilter,
) {
  if (!shouldIncludeProRodeos(criteria.format, criteria.rodeoLevel)) {
    return false;
  }

  return isProRodeoWithinDateRange(
    proRodeo.startDate,
    proRodeo.endDate,
    criteria.startDate,
    criteria.endDate,
  );
}

export function filterEventsBySearchCriteria(
  events: EventSearchResultItem[],
  criteria: SearchCriteriaFilter,
) {
  return events.filter((event) => eventMatchesSearchCriteria(event, criteria));
}

export function filterResultsBySearchCriteria(
  results: SearchResultEntry[],
  criteria: SearchCriteriaFilter,
) {
  return results.filter((entry) => {
    if (entry.kind === "event") {
      return eventMatchesSearchCriteria(entry.item, criteria);
    }

    return proRodeoMatchesSearchCriteria(entry.item, criteria);
  });
}
