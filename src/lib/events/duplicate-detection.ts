import { formatEventDate } from "@/lib/events/format-date";
import type { EventRecord } from "@/types/event-record";
import type { EventSubmission } from "@/types/event-submission";

export interface PendingEventReview {
  event: EventRecord;
  duplicates: EventRecord[];
}

export interface SubmissionDuplicateMatch {
  id: string;
  eventName: string;
  startDate: string;
  location: string;
  status: EventRecord["status"];
}

export interface SubmissionDuplicateWarning {
  eventName: string;
  startDate: string;
  matches: SubmissionDuplicateMatch[];
}

const DUPLICATE_CHECK_STATUSES = ["pending", "approved", "published", "archived"] as const;

export function getEventDuplicateKey(
  event: Pick<EventRecord, "event_name" | "event_format" | "event_date">,
) {
  const name = event.event_name.trim().toLowerCase().replace(/\s+/g, " ");
  const format = (event.event_format ?? "").trim().toLowerCase();
  const date = event.event_date;
  return `${name}|${format}|${date}`;
}

export function findDuplicateMatches(
  pendingEvent: EventRecord,
  candidates: EventRecord[],
  excludeIds: string[] = [],
) {
  const key = getEventDuplicateKey(pendingEvent);
  const excluded = new Set(excludeIds);

  return candidates.filter(
    (candidate) =>
      candidate.id !== pendingEvent.id &&
      !excluded.has(candidate.id) &&
      getEventDuplicateKey(candidate) === key,
  );
}

function formatEventLocation(event: Pick<EventRecord, "venue_name" | "address_city" | "address_state">) {
  const cityLine = [event.address_city, event.address_state].filter(Boolean).join(", ");
  if (event.venue_name) {
    return `${event.venue_name} · ${cityLine}`;
  }
  return cityLine || "Location unavailable";
}

function toSubmissionDuplicateMatch(event: EventRecord): SubmissionDuplicateMatch {
  return {
    id: event.id,
    eventName: event.event_name,
    startDate: event.event_date,
    location: formatEventLocation(event),
    status: event.status,
  };
}

export function findSubmissionDuplicateMatches(
  submission: Pick<EventSubmission, "eventName" | "format" | "startDate">,
  candidates: EventRecord[],
): EventRecord[] {
  const key = getEventDuplicateKey({
    event_name: submission.eventName,
    event_format: submission.format,
    event_date: submission.startDate,
  });

  return candidates.filter((candidate) => getEventDuplicateKey(candidate) === key);
}

export interface ScheduleDuplicateWarning {
  index: number;
  startDate: string;
  location: string;
  matches: SubmissionDuplicateMatch[];
}

export function getScheduleLocationDuplicateKey(
  submission: Pick<EventSubmission, "venueName" | "city" | "state" | "startDate">,
) {
  const venue = submission.venueName.trim().toLowerCase().replace(/\s+/g, " ");
  const city = submission.city.trim().toLowerCase();
  const state = submission.state.trim().toUpperCase();
  const date = submission.startDate.trim();
  return `${venue}|${city}|${state}|${date}`;
}

export function findScheduleLocationDuplicateMatches(
  submission: Pick<EventSubmission, "venueName" | "city" | "state" | "startDate">,
  candidates: EventRecord[],
): EventRecord[] {
  if (!submission.startDate.trim()) {
    return [];
  }

  const key = getScheduleLocationDuplicateKey(submission);

  return candidates.filter((candidate) => {
    const candidateKey = getScheduleLocationDuplicateKey({
      venueName: candidate.venue_name ?? "",
      city: candidate.address_city ?? "",
      state: candidate.address_state ?? "",
      startDate: candidate.event_date,
    });

    return candidateKey === key;
  });
}

export function findScheduleLocationDuplicateWarningsForCandidates(
  submissions: EventSubmission[],
  candidates: EventRecord[],
): ScheduleDuplicateWarning[] {
  const warnings: ScheduleDuplicateWarning[] = [];

  submissions.forEach((submission, index) => {
    const matches = findScheduleLocationDuplicateMatches(submission, candidates);
    if (matches.length === 0) {
      return;
    }

    warnings.push({
      index,
      startDate: submission.startDate,
      location: formatEventLocation({
        venue_name: submission.venueName,
        address_city: submission.city,
        address_state: submission.state,
      }),
      matches: matches.map(toSubmissionDuplicateMatch),
    });
  });

  return warnings;
}

export function findSubmissionDuplicateWarnings(
  submissions: EventSubmission[],
  candidates: EventRecord[],
): SubmissionDuplicateWarning[] {
  const warnings: SubmissionDuplicateWarning[] = [];

  for (const submission of submissions) {
    const matches = findSubmissionDuplicateMatches(submission, candidates);
    if (matches.length === 0) {
      continue;
    }

    warnings.push({
      eventName: submission.eventName.trim(),
      startDate: submission.startDate,
      matches: matches.map(toSubmissionDuplicateMatch),
    });
  }

  return warnings;
}

export function getSubmissionDuplicateStatusLabel(status: EventRecord["status"]) {
  switch (status) {
    case "approved":
      return "Approved";
    case "published":
      return "Published";
    case "pending":
      return "Pending review";
    case "archived":
      return "Archived";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export function formatSubmissionDuplicateSummary(warning: SubmissionDuplicateWarning) {
  const formattedDate = formatEventDate(warning.startDate);
  const matchSummary = warning.matches
    .map(
      (match) =>
        `${match.eventName} on ${formatEventDate(match.startDate)} at ${match.location} (${getSubmissionDuplicateStatusLabel(match.status)})`,
    )
    .join("; ");

  return `${warning.eventName} on ${formattedDate}: ${matchSummary}`;
}

export function buildPendingEventReviews(
  pendingEvents: EventRecord[],
  candidates: EventRecord[],
) {
  return pendingEvents.map((event) => ({
    event,
    duplicates: findDuplicateMatches(event, candidates),
  }));
}

export { DUPLICATE_CHECK_STATUSES };
