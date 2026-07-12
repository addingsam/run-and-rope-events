import { US_STATES } from "@/lib/us-states";
import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import type {
  EventSubmission,
  RodeoLevel,
  SubmissionDiscipline,
  SubmissionFormat,
} from "@/types/event-submission";

const DISCIPLINE_LABEL_TO_VALUE: Record<string, SubmissionDiscipline> = {
  "Barrel Racing": "barrel_racing",
  "Team Roping": "team_roping",
  "Calf Roping": "calf_roping",
  "Breakaway Roping": "breakaway_roping",
  "Steer Roping": "steer_roping",
  "Steer Wrestling": "steer_wrestling",
};

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
  const format = extracted.format ? FORMAT_LABEL_TO_VALUE[extracted.format] : current.format;
  const discipline = extracted.discipline
    ? DISCIPLINE_LABEL_TO_VALUE[extracted.discipline]
    : null;
  const extractedLevel = extracted.rodeoLevel
    ? RODEO_LEVEL_LABEL_TO_VALUE[extracted.rodeoLevel] ?? null
    : null;
  const rodeoLevels =
    format === "rodeo"
      ? extractedLevel
        ? [extractedLevel]
        : current.rodeoLevels
      : [];
  const zipFromAddress = parseZipFromAddress(extracted.address);

  return {
    ...current,
    eventName: extracted.eventName ?? current.eventName,
    format,
    rodeoLevels,
    disciplines: discipline ? [discipline] : current.disciplines,
    additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
    startDate: normalizeStartDate(extracted.date) || current.startDate,
    endDate: normalizeOptionalDate(extracted.endDate) || current.endDate,
    entryDeadline: normalizeOptionalDate(extracted.entryDeadline) || current.entryDeadline,
    classDivisionInfo: extracted.classDivisionInfo ?? current.classDivisionInfo,
    venueName: extracted.venueName ?? current.venueName,
    streetAddress: extracted.address ?? current.streetAddress,
    city: extracted.city ?? current.city,
    state: normalizeState(extracted.state) || current.state,
    zipCode: extracted.zipCode ?? (zipFromAddress || current.zipCode),
    producerName: extracted.contactName ?? current.producerName,
    contactEmail: extracted.contactEmail ?? current.contactEmail,
    contactPhone: extracted.contactPhone ?? current.contactPhone,
    entryFee: extracted.entryFee ?? current.entryFee,
    prizePayoutInfo: extracted.prizePayoutInfo ?? current.prizePayoutInfo,
    description: buildDescription(extracted, current.description),
  };
}

export function countPopulatedFlyerFields(extracted: FlyerExtractionResult) {
  return Object.values(extracted).filter((value) => value !== null && value !== "").length;
}
