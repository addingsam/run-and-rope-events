import {
  normalizeFlyerDate,
} from "@/lib/flyer/normalize-flyer-date";
import type { FlyerExtractionEventEntry, FlyerExtractionResult } from "@/types/flyer-extraction";

const ENTRY_DEADLINE_PHRASES = [
  /\bentry deadline\b/i,
  /\bentries close\b/i,
  /\bentries must be\b/i,
  /\bcall in by\b/i,
  /\bcall-in by\b/i,
  /\bcall entries\b/i,
  /\bregister by\b/i,
  /\bsign up by\b/i,
  /\bsign-up by\b/i,
  /\bdue by\b/i,
  /\bpostmarked by\b/i,
  /\bentries due\b/i,
  /\bentry close\b/i,
  /\bclose entries\b/i,
  /\blast day to enter\b/i,
  /\benter by\b/i,
];

function looksLikeTimeOrAge(value: string) {
  const trimmed = value.trim();
  return (
    /\b\d{1,2}\s*(?:am|pm)\b/i.test(trimmed) ||
    /^\d{1,2}:\d{2}/.test(trimmed) ||
    /^\d+$/.test(trimmed) ||
    /\b\d+\s*y(?:r|ear)s?\b/i.test(trimmed)
  );
}

export function collectFlyerExtractionSearchText(extracted: FlyerExtractionResult) {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(extracted)) {
    if (key === "events" || key === "eventDates" || key === "disciplines") {
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      parts.push(value.trim());
    }
  }

  for (const event of extracted.events ?? []) {
    for (const value of Object.values(event)) {
      if (typeof value === "string" && value.trim()) {
        parts.push(value.trim());
      }
    }
  }

  return parts.join("\n");
}

export function flyerTextMentionsEntryDeadline(text: string) {
  return ENTRY_DEADLINE_PHRASES.some((pattern) => pattern.test(text));
}

function rawDateAppearsInFlyerText(rawValue: string, searchText: string) {
  const trimmed = rawValue.trim();
  if (!trimmed || !searchText) {
    return false;
  }

  if (searchText.includes(trimmed)) {
    return true;
  }

  const normalized = normalizeFlyerDate(trimmed).date;
  if (!normalized) {
    return false;
  }

  const [year, month, day] = normalized.split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  const variants = new Set([
    normalized,
    `${monthNumber}/${dayNumber}/${year}`,
    `${monthNumber}/${dayNumber}/${year.slice(-2)}`,
    `${monthNumber}-${dayNumber}-${year}`,
    `${monthNumber}-${dayNumber}`,
    `${monthNumber}/${dayNumber}`,
  ]);

  return [...variants].some((variant) => searchText.includes(variant));
}

export function sanitizeFlyerEntryDeadline(
  rawValue: string | null,
  options: {
    searchText: string;
    eventStartDate?: string | null;
    eventDates?: Set<string>;
    referenceDate?: Date;
  },
): string | null {
  if (!rawValue?.trim() || looksLikeTimeOrAge(rawValue)) {
    return null;
  }

  const trimmed = rawValue.trim();
  const referenceDate = options.referenceDate ?? new Date();
  const normalized = normalizeFlyerDate(trimmed, referenceDate).date;

  if (!normalized) {
    return null;
  }

  if (options.eventDates?.has(normalized)) {
    return null;
  }

  if (options.eventStartDate && normalized === options.eventStartDate) {
    return null;
  }

  const mentionsDeadline = flyerTextMentionsEntryDeadline(options.searchText);
  const appearsOnFlyer = rawDateAppearsInFlyerText(trimmed, options.searchText);

  if (!mentionsDeadline || !appearsOnFlyer) {
    return null;
  }

  return trimmed;
}

function collectEventDates(
  extracted: FlyerExtractionResult,
  referenceDate: Date,
): Set<string> {
  const dates = new Set<string>();

  for (const value of [
    extracted.date,
    extracted.endDate,
    ...(extracted.eventDates ?? []),
  ]) {
    const normalized = value ? normalizeFlyerDate(value, referenceDate).date : "";
    if (normalized) {
      dates.add(normalized);
    }
  }

  for (const event of extracted.events ?? []) {
    for (const value of [event.date, event.endDate]) {
      const normalized = value ? normalizeFlyerDate(value, referenceDate).date : "";
      if (normalized) {
        dates.add(normalized);
      }
    }
  }

  return dates;
}

export function sanitizeFlyerExtractionEntryDeadlines(
  extracted: FlyerExtractionResult,
  referenceDate: Date = new Date(),
): FlyerExtractionResult {
  const searchText = collectFlyerExtractionSearchText(extracted);
  const eventDates = collectEventDates(extracted, referenceDate);
  const eventStartDate = extracted.date
    ? normalizeFlyerDate(extracted.date, referenceDate).date
    : null;

  const entryDeadline = sanitizeFlyerEntryDeadline(extracted.entryDeadline, {
    searchText,
    eventStartDate,
    eventDates,
    referenceDate,
  });

  const events = (extracted.events ?? []).map((event) =>
    sanitizeFlyerExtractionEventEntryDeadline(event, searchText, eventDates, referenceDate),
  );

  return {
    ...extracted,
    entryDeadline,
    events,
  };
}

function sanitizeFlyerExtractionEventEntryDeadline(
  event: FlyerExtractionEventEntry,
  searchText: string,
  eventDates: Set<string>,
  referenceDate: Date,
): FlyerExtractionEventEntry {
  const eventStartDate = event.date
    ? normalizeFlyerDate(event.date, referenceDate).date
    : null;

  return {
    ...event,
    entryDeadline: sanitizeFlyerEntryDeadline(event.entryDeadline, {
      searchText,
      eventStartDate,
      eventDates,
      referenceDate,
    }),
  };
}
