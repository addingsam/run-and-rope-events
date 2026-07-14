import type { BatchEventEntry, EventSubmission } from "@/types/event-submission";

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

export function expandSubmissionToMultiEventBatch(
  submission: EventSubmission,
  events: BatchEventEntry[],
): EventSubmission[] {
  return events.map((event) => ({
    ...submission,
    startDate: event.startDate.trim(),
    endDate: event.endDate.trim() || event.startDate.trim(),
    entryDeadline: event.entryDeadline.trim(),
    venueName: event.venueName.trim(),
    streetAddress: event.streetAddress.trim(),
    city: event.city.trim(),
    state: event.state.trim(),
    zipCode: event.zipCode.trim(),
  }));
}
