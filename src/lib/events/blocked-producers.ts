import type { BatchEventEntry, EventSubmission } from "@/types/event-submission";
import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import type { EventRecord } from "@/types/event-record";

export const BLOCKED_PRODUCER_CONTACT_EMAIL = "jackpotandrodeoevents@gmail.com";

export const BLOCKED_PRODUCER_ERROR_MESSAGE =
  `Thank you for your submission. This particular event cannot be accepted. Please reach out to us at ${BLOCKED_PRODUCER_CONTACT_EMAIL} if you have further questions.`;

const BLOCKED_PRODUCER_NAMES = [
  "Go Fast Productions",
  "Mitzi Angelle",
  "Angelle Barrel Productions, Inc.",
  "Angelle Barrel Productions",
] as const;

const NORMALIZED_BLOCKED_PRODUCER_NAMES = BLOCKED_PRODUCER_NAMES.map(normalizeBlockedProducerText);

export function normalizeBlockedProducerText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function textContainsBlockedProducer(text: string | null | undefined): boolean {
  const normalized = normalizeBlockedProducerText(text ?? "");
  if (!normalized) {
    return false;
  }

  return NORMALIZED_BLOCKED_PRODUCER_NAMES.some((blockedName) =>
    normalized.includes(blockedName),
  );
}

export function textsContainBlockedProducer(
  ...texts: Array<string | null | undefined>
): boolean {
  return texts.some((text) => textContainsBlockedProducer(text));
}

function collectSubmissionScanTexts(
  submission: EventSubmission,
  batchEvents: BatchEventEntry[] = [],
): string[] {
  const texts = [
    submission.producerName,
    submission.eventName,
    submission.description,
    submission.classDivisionInfo,
    submission.entryFee,
    submission.prizePayoutInfo,
    submission.producerWebsite,
    submission.contactEmail,
    submission.contactPhone,
    submission.venueName,
    submission.streetAddress,
  ];

  for (const event of batchEvents) {
    texts.push(
      event.classDivisionInfo,
      event.venueName,
      event.streetAddress,
      event.city,
    );
  }

  return texts;
}

export function collectFlyerExtractionScanTexts(
  extracted: FlyerExtractionResult,
): Array<string | null | undefined> {
  const texts = [
    extracted.contactName,
    extracted.eventName,
    extracted.classDivisionInfo,
    extracted.entryFee,
    extracted.prizePayoutInfo,
    extracted.producerWebsite,
    extracted.additionalNotes,
    extracted.venueName,
    extracted.address,
    extracted.time,
    extracted.entryDeadline,
  ];

  for (const event of extracted.events ?? []) {
    texts.push(event.classDivisionInfo, event.venueName, event.address, event.city);
  }

  return texts;
}

export function submissionContainsBlockedProducer(
  submission: EventSubmission,
  options?: { batchEvents?: BatchEventEntry[] },
): boolean {
  return textsContainBlockedProducer(
    ...collectSubmissionScanTexts(submission, options?.batchEvents ?? []),
  );
}

export function flyerExtractionContainsBlockedProducer(
  extracted: FlyerExtractionResult,
): boolean {
  return textsContainBlockedProducer(...collectFlyerExtractionScanTexts(extracted));
}

export function eventRecordContainsBlockedProducer(record: EventRecord): boolean {
  return textsContainBlockedProducer(
    record.contact_name,
    record.event_name,
    record.description,
    record.prize_info,
    record.entry_fee,
    record.website_link,
    record.contact_email,
    record.contact_phone,
    record.venue_name,
    record.address_street,
  );
}

export function appendBlockedProducerValidationErrors(
  submission: EventSubmission,
  errors: Record<string, string>,
  options?: { batchEvents?: BatchEventEntry[] },
): void {
  if (submissionContainsBlockedProducer(submission, options)) {
    errors.blockedProducer = BLOCKED_PRODUCER_ERROR_MESSAGE;
  }
}
