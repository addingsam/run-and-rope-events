import type { EventRecord } from "@/types/event-record";

export interface PendingEventReview {
  event: EventRecord;
  duplicates: EventRecord[];
}

const DUPLICATE_CHECK_STATUSES = ["pending", "approved", "published", "archived"] as const;

export function getEventDuplicateKey(
  event: Pick<EventRecord, "event_name" | "event_format" | "event_date">,
) {
  const name = event.event_name.trim().toLowerCase().replace(/\s+/g, " ");
  const format = (event.event_format ?? "").trim().toLowerCase();
  const date = event.event_date;
  return `${name}|${format}|${date}`;
}

export function findDuplicateMatches(
  pendingEvent: EventRecord,
  candidates: EventRecord[],
) {
  const key = getEventDuplicateKey(pendingEvent);

  return candidates.filter(
    (candidate) =>
      candidate.id !== pendingEvent.id && getEventDuplicateKey(candidate) === key,
  );
}

export function buildPendingEventReviews(
  pendingEvents: EventRecord[],
  candidates: EventRecord[],
) {
  return pendingEvents.map((event) => ({
    event,
    duplicates: findDuplicateMatches(event, candidates),
  }));
}

export { DUPLICATE_CHECK_STATUSES };
