import type { SubmissionFormat } from "@/types/event-submission";

export function isRodeoFormat(format: SubmissionFormat | null | undefined) {
  return format === "rodeo";
}

export function getProducerSectionTitle(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor & Contact" : "Producer & Contact";
}

export function getProducerSectionDescription(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format)
    ? "Producer or stock contractor details are optional. Name is shown on the listing when provided."
    : "Producer details are optional. Name is shown on the listing when provided.";
}

export function getProducerNameLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor Name" : "Producer Name";
}

export function getProducerWebsiteLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor Website" : "Producer Website";
}

export function getProducerNameHint(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format)
    ? "Optional — producer or stock contractor name shown on the listing when provided."
    : "Optional — producer name shown on the listing when provided.";
}

export function getProducerDisplayLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor" : "Producer";
}
