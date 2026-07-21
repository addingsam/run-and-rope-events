import type { BatchEventEntry, EventSubmission } from "@/types/event-submission";

const LIMITS = {
  eventName: 500,
  description: 20_000,
  entryFee: 15_000,
  prizePayoutInfo: 15_000,
  classDivisionInfo: 15_000,
  producerWebsite: 500,
  streetAddress: 500,
  venueName: 300,
  producerName: 300,
  contactEmail: 320,
  contactPhone: 50,
  submitterEmail: 320,
  zipCode: 20,
  flyerUrl: 2_000,
  additionalOffering: 500,
  batchClassDivisionInfo: 10_000,
} as const;

function truncateField(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return trimmed.slice(0, max);
}

export function slimEventSubmissionForTransport(submission: EventSubmission): EventSubmission {
  return {
    ...submission,
    eventName: truncateField(submission.eventName, LIMITS.eventName),
    description: truncateField(submission.description, LIMITS.description),
    entryFee: truncateField(submission.entryFee, LIMITS.entryFee),
    prizePayoutInfo: truncateField(submission.prizePayoutInfo, LIMITS.prizePayoutInfo),
    classDivisionInfo: truncateField(submission.classDivisionInfo, LIMITS.classDivisionInfo),
    venueName: truncateField(submission.venueName, LIMITS.venueName),
    streetAddress: truncateField(submission.streetAddress, LIMITS.streetAddress),
    city: truncateField(submission.city, 200),
    producerName: truncateField(submission.producerName, LIMITS.producerName),
    producerWebsite: truncateField(submission.producerWebsite, LIMITS.producerWebsite),
    contactEmail: truncateField(submission.contactEmail, LIMITS.contactEmail),
    contactPhone: truncateField(submission.contactPhone, LIMITS.contactPhone),
    submitterEmail: truncateField(submission.submitterEmail, LIMITS.submitterEmail),
    zipCode: truncateField(submission.zipCode, LIMITS.zipCode),
    flyerUrl: truncateField(submission.flyerUrl, LIMITS.flyerUrl),
    additionalOfferings: submission.additionalOfferings
      .map((offering) => truncateField(offering, LIMITS.additionalOffering))
      .filter(Boolean),
  };
}

export function slimBatchEventsForTransport(events: BatchEventEntry[]): BatchEventEntry[] {
  return events.map((event) => ({
    ...event,
    venueName: truncateField(event.venueName, LIMITS.venueName),
    streetAddress: truncateField(event.streetAddress, LIMITS.streetAddress),
    city: truncateField(event.city, 200),
    zipCode: truncateField(event.zipCode, LIMITS.zipCode),
    classDivisionInfo: truncateField(
      event.classDivisionInfo,
      LIMITS.batchClassDivisionInfo,
    ),
  }));
}

/** Vercel rejects bodies above ~4.5 MB before they reach route handlers. */
export const VERCEL_REQUEST_BODY_LIMIT_BYTES = 4_000_000;

export function estimateSubmissionPayloadBytes(
  submission: EventSubmission,
  options?: {
    batchEventDates?: string[];
    batchEvents?: BatchEventEntry[];
    featurePlacement?: string;
  },
) {
  return JSON.stringify({
    ...submission,
    eventDates: options?.batchEventDates ?? [],
    batchEvents: options?.batchEvents ?? [],
    featurePlacement: options?.featurePlacement ?? "none",
  }).length;
}
