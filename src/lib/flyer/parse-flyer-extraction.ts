import {
  inferFlyerDisciplinesFromText,
  normalizeFlyerDiscipline,
  normalizeFlyerDisciplines,
} from "@/lib/flyer/flyer-disciplines";
import {
  FLYER_EXTRACTION_FORMAT_LABELS,
  FLYER_EXTRACTION_RODEO_LEVEL_LABELS,
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

export function stripJsonCodeFences(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export function parseFlyerExtractionResponse(text: string): FlyerExtractionResult {
  const cleaned = stripJsonCodeFences(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Claude returned a response that was not valid JSON.");
  }

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

  return {
    eventName: nullableString(parsed.eventName),
    date: nullableString(parsed.date),
    endDate: nullableString(parsed.endDate),
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
