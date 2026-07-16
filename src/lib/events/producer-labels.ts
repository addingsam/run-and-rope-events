import type { SubmissionFormat } from "@/types/event-submission";

export function isRodeoFormat(format: SubmissionFormat | null | undefined) {
  return format === "rodeo";
}

export function getProducerSectionTitle(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor & Contact" : "Producer & Contact";
}

export function getProducerSectionDescription(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format)
    ? "Producer or stock contractor name appears on every listing so riders know who's running the event."
    : "Producer name appears on every listing so riders know who's running the event.";
}

export function getProducerNameLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor Name" : "Producer Name";
}

export function getProducerWebsiteLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor Website" : "Producer Website";
}

export function getProducerNameRequiredMessage(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format)
    ? "Producer or stock contractor name is required."
    : "Producer name is required.";
}

export function getProducerDisplayLabel(format: SubmissionFormat | null | undefined) {
  return isRodeoFormat(format) ? "Producer / Stock Contractor" : "Producer";
}
