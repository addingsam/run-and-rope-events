import {
  inferFlyerDisciplinesFromText,
  normalizeFlyerDiscipline,
  normalizeFlyerDisciplines,
} from "@/lib/flyer/flyer-disciplines";
import { normalizeFlyerDate } from "@/lib/flyer/normalize-flyer-date";
import {
  FLYER_EXTRACTION_FORMAT_LABELS,
  FLYER_EXTRACTION_RODEO_LEVEL_LABELS,
  type FlyerExtractionEventEntry,
  type FlyerExtractionResult,
} from "@/types/flyer-extraction";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function enumOrNull<T extends string>(value: unknown, allowed: readonly T[]) {
  const parsed = nullableString(value);
  if (!parsed) {
    return null;
  }

  return allowed.includes(parsed as T) ? (parsed as T) : null;
}

function nullableStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => nullableString(item))
      .filter((item): item is string => Boolean(item));
  }

  const singleValue = nullableString(value);
  return singleValue ? [singleValue] : [];
}

function sanitizeExtractedEventDates(
  startDate: string | null,
  endDate: string | null,
): { date: string | null; endDate: string | null } {
  if (!startDate) {
    return { date: null, endDate: null };
  }

  if (!endDate) {
    return { date: startDate, endDate: null };
  }

  const normalizedStart = normalizeFlyerDate(startDate);
  const normalizedEnd = normalizeFlyerDate(endDate);

  if (
    normalizedStart.date &&
    normalizedEnd.date &&
    normalizedStart.date === normalizedEnd.date
  ) {
    return { date: startDate, endDate: null };
  }

  return { date: startDate, endDate };
}

function parseFlyerExtractionEventEntry(value: unknown): FlyerExtractionEventEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawDate = nullableString(value.date);
  const rawEndDate = nullableString(value.endDate);
  const { date, endDate } = sanitizeExtractedEventDates(rawDate, rawEndDate);

  const entry: FlyerExtractionEventEntry = {
    date,
    endDate,
    entryDeadline: nullableString(value.entryDeadline),
    venueName: nullableString(value.venueName),
    address: nullableString(value.address),
    city: nullableString(value.city),
    state: nullableString(value.state),
    zipCode: nullableString(value.zipCode),
  };

  if (!entry.date && !entry.venueName && !entry.city) {
    return null;
  }

  return entry;
}

function parseFlyerExtractionEvents(value: unknown): FlyerExtractionEventEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => parseFlyerExtractionEventEntry(item))
    .filter((item): item is FlyerExtractionEventEntry => item !== null);
}

export function stripJsonCodeFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractJsonObjectText(text: string) {
  const trimmed = text.trim();
  const fencedBlocks = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
    .map((match) => match[1].trim())
    .filter((block) => block.startsWith("{"));

  if (fencedBlocks.length > 0) {
    return fencedBlocks.sort((left, right) => right.length - left.length)[0];
  }

  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function repairCommonJsonIssues(json: string) {
  return json.replace(/,\s*([}\]])/g, "$1");
}

function parseJsonObject(text: string): unknown {
  const candidates = [
    stripJsonCodeFences(text),
    extractJsonObjectText(text),
    repairCommonJsonIssues(stripJsonCodeFences(text)),
    repairCommonJsonIssues(extractJsonObjectText(text)),
  ];

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    try {
      return JSON.parse(normalized);
    } catch {
      continue;
    }
  }

  throw new Error("Claude returned a response that was not valid JSON.");
}

export function parseFlyerExtractionResponse(text: string): FlyerExtractionResult {
  const parsed = parseJsonObject(text);

  if (!isRecord(parsed)) {
    throw new Error("Claude returned JSON that was not an object.");
  }

  const parsedDisciplines = normalizeFlyerDisciplines(parsed.disciplines);
  const legacyDiscipline = normalizeFlyerDiscipline(parsed.discipline);
  const inferredDisciplines = inferFlyerDisciplinesFromText(
    nullableString(parsed.eventName),
    nullableString(parsed.classDivisionInfo),
    nullableString(parsed.entryFee),
    nullableString(parsed.prizePayoutInfo),
    nullableString(parsed.additionalNotes),
    nullableString(parsed.discipline),
    ...(parsedDisciplines.length > 0
      ? parsedDisciplines
      : legacyDiscipline
        ? [legacyDiscipline]
        : []),
  );
  const disciplines =
    parsedDisciplines.length > 0
      ? parsedDisciplines
      : legacyDiscipline
        ? [legacyDiscipline]
        : inferredDisciplines;

  const rawDate = nullableString(parsed.date);
  const rawEndDate = nullableString(parsed.endDate);
  const { date, endDate } = sanitizeExtractedEventDates(rawDate, rawEndDate);
  const eventDates = nullableStringArray(parsed.eventDates);
  const events = parseFlyerExtractionEvents(parsed.events);

  return {
    eventName: nullableString(parsed.eventName),
    date,
    eventDates: events.length >= 2 ? [] : eventDates,
    events,
    endDate,
    entryDeadline: nullableString(parsed.entryDeadline),
    time: nullableString(parsed.time),
    venueName: nullableString(parsed.venueName),
    address: nullableString(parsed.address),
    city: nullableString(parsed.city),
    state: nullableString(parsed.state),
    zipCode: nullableString(parsed.zipCode),
    discipline: disciplines[0] ?? null,
    disciplines,
    format: enumOrNull(parsed.format, FLYER_EXTRACTION_FORMAT_LABELS),
    rodeoLevel: enumOrNull(parsed.rodeoLevel, FLYER_EXTRACTION_RODEO_LEVEL_LABELS),
    entryFee: nullableString(parsed.entryFee),
    prizePayoutInfo: nullableString(parsed.prizePayoutInfo),
    classDivisionInfo: nullableString(parsed.classDivisionInfo),
    contactName: nullableString(parsed.contactName),
    contactPhone: nullableString(parsed.contactPhone),
    contactEmail: nullableString(parsed.contactEmail),
    additionalNotes: nullableString(parsed.additionalNotes),
  };
}
