import { sanitizeFlyerExtractionEntryDeadlines } from "@/lib/flyer/sanitize-entry-deadline";
import {
  normalizeFlyerDate,
  normalizeFlyerDateList,
} from "@/lib/flyer/normalize-flyer-date";
import type {
  FlyerExtractionEventEntry,
  FlyerExtractionResult,
} from "@/types/flyer-extraction";

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const start = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function enumerateDateRange(startIso: string, endIso: string): string[] {
  if (!startIso || !endIso || startIso > endIso) {
    return startIso ? [startIso] : [];
  }

  const dates: string[] = [];
  let current = startIso;

  while (current <= endIso) {
    dates.push(current);
    if (current === endIso) {
      break;
    }
    current = addDays(current, 1);
  }

  return dates;
}

function areConsecutiveDates(dates: string[]): boolean {
  if (dates.length < 2) {
    return false;
  }

  const sorted = [...dates].sort();
  for (let index = 1; index < sorted.length; index += 1) {
    if (daysBetween(sorted[index - 1], sorted[index]) !== 1) {
      return false;
    }
  }

  return true;
}

function normalizeOptionalDate(
  value: string | null,
  referenceDate: Date,
): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = normalizeFlyerDate(value, referenceDate).date;
  return normalized || null;
}

function eventIdentityKey(
  entry: FlyerExtractionEventEntry,
  referenceDate: Date,
): string {
  const start = normalizeOptionalDate(entry.date, referenceDate) ?? "";
  const end = normalizeOptionalDate(entry.endDate, referenceDate) ?? "";
  const city = entry.city?.trim().toLowerCase() ?? "";
  const venue = entry.venueName?.trim().toLowerCase() ?? "";
  return `${start}|${end}|${city}|${venue}`;
}

function dedupeEvents(
  events: FlyerExtractionEventEntry[],
  referenceDate: Date,
): FlyerExtractionEventEntry[] {
  const seen = new Set<string>();
  const result: FlyerExtractionEventEntry[] = [];

  for (const event of events) {
    if (!event.date?.trim() && !event.venueName?.trim() && !event.city?.trim()) {
      continue;
    }

    const key = eventIdentityKey(event, referenceDate);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(event);
  }

  return result;
}

function mergeSingleEventIntoTopLevel(
  extracted: FlyerExtractionResult,
  event: FlyerExtractionEventEntry,
): FlyerExtractionResult {
  return {
    ...extracted,
    date: event.date ?? extracted.date,
    endDate: event.endDate ?? extracted.endDate,
    entryDeadline: event.entryDeadline ?? extracted.entryDeadline,
    venueName: event.venueName ?? extracted.venueName,
    address: event.address ?? extracted.address,
    city: event.city ?? extracted.city,
    state: event.state ?? extracted.state,
    zipCode: event.zipCode ?? extracted.zipCode,
    events: [],
  };
}

function collapseConsecutiveDatesToRange(
  dates: string[],
): { startDate: string; endDate: string } | null {
  if (dates.length < 2 || !areConsecutiveDates(dates)) {
    return null;
  }

  const sorted = [...dates].sort();
  return {
    startDate: sorted[0]!,
    endDate: sorted[sorted.length - 1]!,
  };
}

function buildDistinctEventDays(
  extracted: FlyerExtractionResult,
  referenceDate: Date,
  entryDeadlineIso: string | null,
): string[] {
  const rawValues = [
    ...(extracted.date ? [extracted.date] : []),
    ...extracted.eventDates,
  ];
  let dates = normalizeFlyerDateList(rawValues, referenceDate).dates;

  if (entryDeadlineIso) {
    dates = dates.filter((date) => date !== entryDeadlineIso);
  }

  return dates;
}

/**
 * Normalizes flyer/scrape date fields so single-day and multi-day-range flyers
 * are not treated as separate batch listings.
 */
export function sanitizeFlyerExtractionDates(
  extracted: FlyerExtractionResult,
  referenceDate: Date = new Date(),
): FlyerExtractionResult {
  let next: FlyerExtractionResult = sanitizeFlyerExtractionEntryDeadlines(
    extracted,
    referenceDate,
  );

  const dedupedEvents = dedupeEvents(next.events, referenceDate);
  if (dedupedEvents.length === 1) {
    next = mergeSingleEventIntoTopLevel(next, dedupedEvents[0]!);
  } else if (dedupedEvents.length >= 2) {
    return {
      ...next,
      events: dedupedEvents,
      eventDates: [],
      date: null,
      endDate: null,
      venueName: null,
      address: null,
      city: null,
      state: null,
      zipCode: null,
    };
  } else {
    next = { ...next, events: [] };
  }

  const entryDeadlineIso = normalizeOptionalDate(next.entryDeadline, referenceDate);
  const primaryIso = normalizeOptionalDate(next.date, referenceDate);
  const endIso = normalizeOptionalDate(next.endDate, referenceDate);
  let distinctDays = buildDistinctEventDays(next, referenceDate, entryDeadlineIso);

  if (primaryIso && endIso && endIso !== primaryIso) {
    const rangeDays = enumerateDateRange(primaryIso, endIso);
    if (distinctDays.length > 0 && distinctDays.every((date) => rangeDays.includes(date))) {
      return {
        ...next,
        date: primaryIso,
        endDate: endIso,
        eventDates: [],
      };
    }
  }

  if (distinctDays.length >= 2) {
    const consecutiveRange = collapseConsecutiveDatesToRange(distinctDays);
    if (consecutiveRange) {
      return {
        ...next,
        date: consecutiveRange.startDate,
        endDate: consecutiveRange.endDate,
        eventDates: [],
      };
    }

    return {
      ...next,
      date: distinctDays[0] ?? next.date,
      endDate: null,
      eventDates: distinctDays,
    };
  }

  if (primaryIso && endIso && endIso !== primaryIso) {
    return {
      ...next,
      date: primaryIso,
      endDate: endIso,
      eventDates: [],
    };
  }

  const singleDay = distinctDays[0] ?? primaryIso;
  if (singleDay) {
    return {
      ...next,
      date: singleDay,
      endDate: null,
      eventDates: [],
    };
  }

  return {
    ...next,
    eventDates: [],
  };
}
