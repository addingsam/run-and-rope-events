import type { EventRecord } from "@/types/event-record";
import { parseEventDescription } from "@/lib/events/flyer-lightbox";

export function getEffectiveEventEndDate(record: {
  event_date: string;
  event_end_date?: string | null;
  description?: string | null;
}): string {
  if (record.event_end_date) {
    return record.event_end_date;
  }

  const parsed = parseEventDescription(record.description ?? null);
  if (parsed.endDate) {
    return parsed.endDate;
  }

  return record.event_date;
}

export function isEventPastArchiveThreshold(
  finalEventDate: string,
  now: Date = new Date(),
): boolean {
  const cutoff = new Date(now);
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - 1);

  const finalDate = new Date(`${finalEventDate}T00:00:00.000Z`);
  return finalDate < cutoff;
}
