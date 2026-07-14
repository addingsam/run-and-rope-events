import type { EventSubmission } from "@/types/event-submission";

export function uniqueSortedEventDates(dates: string[]): string[] {
  return [...new Set(dates.map((date) => date.trim()).filter(Boolean))].sort();
}

export function expandSubmissionToBatch(
  submission: EventSubmission,
  eventDates: string[],
): EventSubmission[] {
  const dates = uniqueSortedEventDates(eventDates);

  return dates.map((date) => ({
    ...submission,
    startDate: date,
    endDate: date,
  }));
}
