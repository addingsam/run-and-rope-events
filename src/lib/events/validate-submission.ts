import type { EventSubmission, SubmissionSource } from "@/types/event-submission";
import { isJackpotOnlyDiscipline } from "@/lib/events/submission-options";

export type SubmissionValidationErrors = Record<string, string>;

export function validateEventSubmission(
  data: EventSubmission,
  source: SubmissionSource = data.source ?? "flyer",
): SubmissionValidationErrors {
  const errors: SubmissionValidationErrors = {};

  if (!data.flyerUrl.trim()) {
    errors.flyer = "A flyer is required.";
  }

  if (!data.eventName.trim()) errors.eventName = "Event name is required.";
  if (!data.format) errors.format = "Format is required.";
  if (data.format === "rodeo" && data.rodeoLevels.length === 0) {
    errors.rodeoLevels = "Select at least one rodeo level.";
  }
  if (data.disciplines.length === 0) {
    errors.disciplines = "Select at least one discipline.";
  }
  if (
    data.format === "rodeo" &&
    data.disciplines.some((discipline) => isJackpotOnlyDiscipline(discipline))
  ) {
    errors.format =
      "Cowboy Mounted Shooting, Ranch Horse, and Obstacle & Trail events use Jackpot format.";
  }
  if (!data.startDate) errors.startDate = "Start date is required.";
  else {
    const today = new Date().toISOString().slice(0, 10);
    if (data.startDate < today) {
      errors.startDate = "Start date must be today or in the future.";
    }
  }

  if (!data.venueName.trim()) {
    errors.venueName = "Venue or arena name is required.";
  }

  if (!data.city.trim()) errors.city = "City is required.";
  if (!data.state) errors.state = "State is required.";
  if (!data.producerName.trim()) errors.producerName = "Producer name is required.";

  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    errors.endDate = "End date must be on or after the start date.";
  }

  if (!data.entryDeadline.trim()) {
    errors.entryDeadline = "Entry deadline is required.";
  }

  if (data.entryDeadline && data.startDate && data.entryDeadline > data.startDate) {
    errors.entryDeadline = "Entry deadline should be before the event start date.";
  }

  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = "Enter a valid email address.";
  }

  if (data.submitterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.submitterEmail)) {
    errors.submitterEmail = "Enter a valid email address.";
  }

  if (data.producerWebsite && !/^https?:\/\/.+/i.test(data.producerWebsite)) {
    errors.producerWebsite = "Enter a valid URL starting with http:// or https://.";
  }

  return errors;
}

export function submissionSourceToRecordSource(source: SubmissionSource): string {
  return source === "scrape" ? "scrape" : "submission";
}

export function submissionRequiresAdminReview(source: SubmissionSource): boolean {
  return source === "scrape";
}
