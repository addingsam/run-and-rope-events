import { sanitizeFlyerExtractionLocation } from "@/lib/flyer/sanitize-flyer-location";
import {
  disciplineLabelsToValues,
  inferFlyerDisciplinesFromText,
} from "@/lib/flyer/flyer-disciplines";
import { resolveFormatFromDisciplines } from "@/lib/events/submission-options";
import { US_STATES } from "@/lib/us-states";
import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import type {
  EventSubmission,
  RodeoLevel,
  SubmissionFormat,
} from "@/types/event-submission";

const FORMAT_LABEL_TO_VALUE: Record<string, SubmissionFormat> = {
  Jackpot: "jackpot",
  Rodeo: "rodeo",
};

const RODEO_LEVEL_LABEL_TO_VALUE: Record<string, RodeoLevel> = {
  Youth: "youth",
  Amateur: "amateur",
  Open: "open",
};

function normalizeState(value: string | null) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  if (US_STATES.some((state) => state.value === upper)) {
    return upper;
  }

  const byName = US_STATES.find(
    (state) => state.label.toLowerCase() === trimmed.toLowerCase(),
  );

  return byName?.value ?? "";
}

function normalizeStartDate(value: string | null) {
  if (!value) {
    return "";
  }

  const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return "";
}

function buildDescription(extracted: FlyerExtractionResult, existingDescription: string) {
  const parts: string[] = [];

  if (extracted.time) {
    parts.push(`Event time: ${extracted.time}`);
  }

  if (extracted.rodeoLevel === "Pro") {
    parts.push("Rodeo level noted on flyer: Pro");
  }

  if (extracted.date && !normalizeStartDate(extracted.date)) {
    parts.push(`Date from flyer: ${extracted.date}`);
  }

  if (extracted.additionalNotes) {
    parts.push(extracted.additionalNotes);
  }

  if (parts.length === 0) {
    return existingDescription;
  }

  const block = parts.join("\n");
  return existingDescription ? `${existingDescription}\n\n${block}` : block;
}

function parseZipFromAddress(address: string | null) {
  if (!address) {
    return "";
  }

  const match = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  return match?.[1] ?? "";
}

function normalizeOptionalDate(value: string | null) {
  return normalizeStartDate(value);
}

export function applyFlyerExtractionToSubmission(
  current: EventSubmission,
  extracted: FlyerExtractionResult,
): EventSubmission {
  const sanitized = sanitizeFlyerExtractionLocation(extracted);
  const extractedFormat = sanitized.format
    ? FORMAT_LABEL_TO_VALUE[sanitized.format]
    : current.format;
  const extractedDisciplines =
    sanitized.disciplines.length > 0
      ? sanitized.disciplines
      : inferFlyerDisciplinesFromText(
          sanitized.eventName,
          sanitized.classDivisionInfo,
          sanitized.entryFee,
          sanitized.prizePayoutInfo,
          sanitized.additionalNotes,
          sanitized.contactName,
        );
  const extractedDisciplineValues = disciplineLabelsToValues(extractedDisciplines);
  const disciplines =
    extractedDisciplineValues.length > 0 ? extractedDisciplineValues : current.disciplines;
  const format = resolveFormatFromDisciplines(disciplines, extractedFormat);
  const extractedLevel = sanitized.rodeoLevel
    ? RODEO_LEVEL_LABEL_TO_VALUE[sanitized.rodeoLevel] ?? null
    : null;
  const rodeoLevels =
    format === "rodeo"
      ? extractedLevel
        ? [extractedLevel]
        : current.rodeoLevels
      : [];
  const zipFromAddress = parseZipFromAddress(sanitized.address);

  return {
    ...current,
    eventName: sanitized.eventName ?? current.eventName,
    format,
    rodeoLevels,
    disciplines,
    additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
    startDate: normalizeStartDate(sanitized.date) || current.startDate,
    endDate: normalizeOptionalDate(sanitized.endDate) || current.endDate,
    entryDeadline: normalizeOptionalDate(sanitized.entryDeadline) || current.entryDeadline,
    classDivisionInfo: sanitized.classDivisionInfo ?? current.classDivisionInfo,
    venueName: sanitized.venueName ?? "",
    streetAddress: sanitized.address ?? "",
    city: sanitized.city ?? "",
    state: normalizeState(sanitized.state) || "",
    zipCode: sanitized.zipCode ?? zipFromAddress ?? "",
    producerName: sanitized.contactName ?? current.producerName,
    contactEmail: sanitized.contactEmail ?? current.contactEmail,
    contactPhone: sanitized.contactPhone ?? current.contactPhone,
    entryFee: sanitized.entryFee ?? current.entryFee,
    prizePayoutInfo: sanitized.prizePayoutInfo ?? current.prizePayoutInfo,
    description: buildDescription(sanitized, current.description),
  };
}

export function countPopulatedFlyerFields(extracted: FlyerExtractionResult) {
  let count = 0;

  for (const [key, value] of Object.entries(extracted)) {
    if (key === "discipline") {
      continue;
    }

    if (key === "disciplines") {
      if (Array.isArray(value) && value.length > 0) {
        count += 1;
      }
      continue;
    }

    if (value !== null && value !== "") {
      count += 1;
    }
  }

  return count;
}
