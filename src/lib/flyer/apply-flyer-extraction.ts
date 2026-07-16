import { sanitizeFlyerExtractionLocation } from "@/lib/flyer/sanitize-flyer-location";
import {
  disciplineLabelsToValues,
  inferFlyerDisciplinesFromText,
} from "@/lib/flyer/flyer-disciplines";
import {
  normalizeFlyerDate,
  normalizeFlyerDateList,
  resolveFlyerEventDates,
} from "@/lib/flyer/normalize-flyer-date";
import {
  inferAmateurRodeoFromText,
  resolveFlyerRodeoLevelLabel,
} from "@/lib/events/amateur-rodeo-associations";
import { resolveFormatFromDisciplines } from "@/lib/events/submission-options";
import {
  extractWebsiteFromText,
  normalizeWebsiteUrl,
} from "@/lib/events/normalize-website-url";
import { resolveFlyerProducerName } from "@/lib/flyer/resolve-producer-name";
import { US_STATES } from "@/lib/us-states";
import type { FlyerExtractionEventEntry, FlyerExtractionResult } from "@/types/flyer-extraction";
import type {
  BatchEventEntry,
  EventSubmission,
  RodeoLevel,
  SubmissionFormat,
} from "@/types/event-submission";

export type FlyerInferredYearFields = {
  startDate: boolean;
  endDate: boolean;
  entryDeadline: boolean;
};

export const EMPTY_FLYER_INFERRED_YEAR_FIELDS: FlyerInferredYearFields = {
  startDate: false,
  endDate: false,
  entryDeadline: false,
};

export interface ApplyFlyerExtractionResult {
  submission: EventSubmission;
  inferredYearFields: FlyerInferredYearFields;
  batchEventDates: string[];
  batchDatesYearInferred: boolean[];
  batchEvents: BatchEventEntry[];
  batchEventsYearInferred: Array<{ startDate: boolean; endDate: boolean }>;
}

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

function buildDescription(extracted: FlyerExtractionResult, existingDescription: string) {
  const parts: string[] = [];

  if (extracted.time) {
    parts.push(`Event time: ${extracted.time}`);
  }

  if (extracted.rodeoLevel === "Pro") {
    parts.push("Rodeo level noted on flyer: Pro");
  }

  if (extracted.date && !normalizeFlyerDate(extracted.date).date) {
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

function resolveProducerWebsite(extracted: FlyerExtractionResult) {
  if (extracted.producerWebsite) {
    const normalized = normalizeWebsiteUrl(extracted.producerWebsite);
    if (normalized) {
      return normalized;
    }
  }

  return (
    extractWebsiteFromText(
      extracted.producerWebsite,
      extracted.additionalNotes,
      extracted.classDivisionInfo,
      extracted.prizePayoutInfo,
      extracted.contactName,
      extracted.eventName,
      extracted.entryFee,
    ) ?? ""
  );
}

function parseZipFromAddress(address: string | null) {
  if (!address) {
    return "";
  }

  const match = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  return match?.[1] ?? "";
}

function mapExtractedEventToBatchEntry(
  entry: FlyerExtractionEventEntry,
  referenceDate: Date,
): {
  batchEvent: BatchEventEntry;
  yearInferred: { startDate: boolean; endDate: boolean };
} {
  const sanitized = sanitizeFlyerExtractionLocation({
    eventName: null,
    date: entry.date,
    eventDates: [],
    events: [],
    endDate: entry.endDate,
    entryDeadline: null,
    time: null,
    venueName: entry.venueName,
    address: entry.address,
    city: entry.city,
    state: entry.state,
    zipCode: entry.zipCode,
    discipline: null,
    disciplines: [],
    format: null,
    rodeoLevel: null,
    entryFee: null,
    prizePayoutInfo: null,
    classDivisionInfo: null,
    contactName: null,
    contactPhone: null,
    contactEmail: null,
    producerWebsite: null,
    additionalNotes: null,
  });

  const resolvedDates = resolveFlyerEventDates(
    sanitized.date,
    sanitized.endDate,
    "",
    "",
    referenceDate,
  );
  const entryDeadline = normalizeFlyerDate(entry.entryDeadline, referenceDate);
  const zipFromAddress = parseZipFromAddress(sanitized.address);

  return {
    batchEvent: {
      startDate: resolvedDates.startDate,
      endDate: resolvedDates.endDate,
      entryDeadline: entry.entryDeadline ? entryDeadline.date : "",
      venueName: sanitized.venueName ?? "",
      streetAddress: sanitized.address ?? "",
      city: sanitized.city ?? "",
      state: normalizeState(sanitized.state) || "",
      zipCode: sanitized.zipCode ?? zipFromAddress ?? "",
    },
    yearInferred: {
      startDate: resolvedDates.startYearInferred,
      endDate: resolvedDates.endYearInferred,
    },
  };
}

export function applyFlyerExtractionToSubmission(
  current: EventSubmission,
  extracted: FlyerExtractionResult,
  referenceDate: Date = new Date(),
): ApplyFlyerExtractionResult {
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
  const resolvedRodeoLevelLabel = resolveFlyerRodeoLevelLabel(
    sanitized.rodeoLevel,
    sanitized.eventName,
    sanitized.contactName,
    sanitized.classDivisionInfo,
    sanitized.prizePayoutInfo,
    sanitized.additionalNotes,
    sanitized.entryFee,
  );
  const extractedLevel = resolvedRodeoLevelLabel
    ? RODEO_LEVEL_LABEL_TO_VALUE[resolvedRodeoLevelLabel] ?? null
    : inferAmateurRodeoFromText(
          sanitized.eventName,
          sanitized.contactName,
          sanitized.classDivisionInfo,
          sanitized.prizePayoutInfo,
          sanitized.additionalNotes,
          sanitized.entryFee,
        )
      ? "amateur"
      : null;
  const rodeoLevels =
    format === "rodeo"
      ? extractedLevel
        ? [extractedLevel]
        : current.rodeoLevels
      : [];
  const zipFromAddress = parseZipFromAddress(sanitized.address);
  const entryDeadline = normalizeFlyerDate(sanitized.entryDeadline, referenceDate);
  const resolvedDates = resolveFlyerEventDates(
    sanitized.date,
    sanitized.endDate,
    current.startDate,
    current.endDate,
    referenceDate,
  );
  const extractedBatchDates =
    sanitized.eventDates.length > 0
      ? sanitized.eventDates
      : sanitized.date
        ? [sanitized.date]
        : [];
  const normalizedBatch = normalizeFlyerDateList(extractedBatchDates, referenceDate);
  const batchEventDates =
    normalizedBatch.dates.length >= 2 ? normalizedBatch.dates : [];
  const useBatchDates = batchEventDates.length >= 2;

  const mappedBatchEvents = sanitized.events.map((entry) =>
    mapExtractedEventToBatchEntry(entry, referenceDate),
  );
  const batchEvents =
    mappedBatchEvents.length >= 2 ? mappedBatchEvents.map((item) => item.batchEvent) : [];
  const useBatchEvents = batchEvents.length >= 2;
  const singleMappedEvent = mappedBatchEvents.length === 1 ? mappedBatchEvents[0] : null;
  const firstBatchEvent = batchEvents[0] ?? singleMappedEvent?.batchEvent;

  return {
    submission: {
      ...current,
      eventName: sanitized.eventName ?? current.eventName,
      format,
      rodeoLevels,
      disciplines,
      additionalOfferings: format === "rodeo" ? current.additionalOfferings : [],
      startDate: useBatchEvents
        ? firstBatchEvent!.startDate
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.startDate
          : useBatchDates
            ? batchEventDates[0]
            : resolvedDates.startDate,
      endDate: useBatchEvents
        ? firstBatchEvent!.endDate
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.endDate
          : useBatchDates
            ? batchEventDates[0]
            : resolvedDates.endDate,
      entryDeadline: sanitized.entryDeadline ? entryDeadline.date : "",
      classDivisionInfo: sanitized.classDivisionInfo ?? current.classDivisionInfo,
      venueName: useBatchEvents
        ? firstBatchEvent!.venueName
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.venueName
          : sanitized.venueName ?? "",
      streetAddress: useBatchEvents
        ? firstBatchEvent!.streetAddress
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.streetAddress
          : sanitized.address ?? "",
      city: useBatchEvents
        ? firstBatchEvent!.city
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.city
          : sanitized.city ?? "",
      state: useBatchEvents
        ? firstBatchEvent!.state
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.state
          : normalizeState(sanitized.state) || "",
      zipCode: useBatchEvents
        ? firstBatchEvent!.zipCode
        : singleMappedEvent
          ? singleMappedEvent.batchEvent.zipCode
          : sanitized.zipCode ?? zipFromAddress ?? "",
      producerName:
        resolveFlyerProducerName({ ...sanitized, format: format === "rodeo" ? "Rodeo" : sanitized.format }) ??
        current.producerName,
      producerWebsite: resolveProducerWebsite(sanitized) || current.producerWebsite,
      contactEmail: sanitized.contactEmail ?? current.contactEmail,
      contactPhone: sanitized.contactPhone ?? current.contactPhone,
      entryFee: sanitized.entryFee ?? current.entryFee,
      prizePayoutInfo: sanitized.prizePayoutInfo ?? current.prizePayoutInfo,
      description: buildDescription(sanitized, current.description),
    },
    inferredYearFields: {
      startDate: useBatchEvents
        ? mappedBatchEvents[0]?.yearInferred.startDate ?? false
        : singleMappedEvent
          ? singleMappedEvent.yearInferred.startDate
          : useBatchDates
            ? normalizedBatch.yearInferred.some(Boolean)
            : resolvedDates.startYearInferred,
      endDate: useBatchEvents
        ? mappedBatchEvents[0]?.yearInferred.endDate ?? false
        : singleMappedEvent
          ? singleMappedEvent.yearInferred.endDate
          : useBatchDates
            ? false
            : resolvedDates.endYearInferred,
      entryDeadline: Boolean(
        sanitized.entryDeadline && entryDeadline.yearInferred && entryDeadline.date,
      ),
    },
    batchEventDates: useBatchEvents ? [] : batchEventDates,
    batchDatesYearInferred: useBatchDates ? normalizedBatch.yearInferred : [],
    batchEvents,
    batchEventsYearInferred: useBatchEvents
      ? mappedBatchEvents.map((item) => item.yearInferred)
      : [],
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

    if (key === "eventDates") {
      if (Array.isArray(value) && value.length > 0) {
        count += 1;
      }
      continue;
    }

    if (key === "events") {
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
