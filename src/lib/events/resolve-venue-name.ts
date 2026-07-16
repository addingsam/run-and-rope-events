import type { BatchEventEntry, EventSubmission } from "@/types/event-submission";

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStateToken(state: string | null | undefined) {
  if (!state) {
    return "";
  }

  const trimmed = state.trim();
  if (trimmed.length === 2) {
    return trimmed.toLowerCase();
  }

  return normalizeForCompare(trimmed);
}

export function isCityOnlyVenueLabel(
  venueName: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
): boolean {
  if (!venueName?.trim()) {
    return false;
  }

  const normalized = normalizeForCompare(venueName);
  const cityNorm = city?.trim() ? normalizeForCompare(city) : "";
  const stateNorm = normalizeStateToken(state);

  if (cityNorm && normalized === cityNorm) {
    return true;
  }

  if (!cityNorm) {
    return false;
  }

  const variants = new Set<string>([cityNorm]);

  if (stateNorm) {
    variants.add(`${cityNorm} ${stateNorm}`);
    variants.add(`${cityNorm}, ${stateNorm}`);
  }

  return variants.has(normalized);
}

const ARENA_VENUE_PATTERN = /\b([A-Za-z0-9][A-Za-z0-9\s&'.-]{0,80})\s+[Aa]rena\b/;
const ROUNDUP_CLUB_PATTERN = /\bround[\s-]?up\s+club\b/i;
const RUC_PATTERN = /\bRUC\b/;

export function inferVenueFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const arenaMatch = trimmed.match(ARENA_VENUE_PATTERN);
  if (arenaMatch) {
    return arenaMatch[0].replace(/\s+/g, " ").trim();
  }

  const roundupMatch = trimmed.match(ROUNDUP_CLUB_PATTERN);
  if (roundupMatch) {
    return roundupMatch[0].replace(/\s+/g, " ").trim();
  }

  if (RUC_PATTERN.test(trimmed)) {
    return "RUC";
  }

  return null;
}

export function resolveVenueName({
  venueName,
  city,
  state = null,
  textSources = [],
}: {
  venueName?: string | null;
  city?: string | null;
  state?: string | null;
  textSources?: Array<string | null | undefined>;
}): string {
  const cityTrimmed = city?.trim() ?? "";
  let venue = venueName?.trim() ?? "";

  if (venue && isCityOnlyVenueLabel(venue, city, state)) {
    venue = "";
  }

  if (!venue) {
    const combined = textSources.filter(Boolean).join("\n");
    venue = inferVenueFromText(combined) ?? "";
  }

  if (!venue && cityTrimmed) {
    venue = cityTrimmed;
  }

  return venue;
}

export function normalizeEventSubmissionVenue(
  submission: EventSubmission,
): EventSubmission {
  return {
    ...submission,
    venueName: resolveVenueName({
      venueName: submission.venueName,
      city: submission.city,
      state: submission.state,
      textSources: [
        submission.venueName,
        submission.eventName,
        submission.description,
        submission.classDivisionInfo,
      ],
    }),
  };
}

export function normalizeBatchEventVenue(
  event: BatchEventEntry,
  context?: { eventName?: string },
): BatchEventEntry {
  return {
    ...event,
    venueName: resolveVenueName({
      venueName: event.venueName,
      city: event.city,
      state: event.state,
      textSources: [
        event.venueName,
        context?.eventName,
        event.city,
        event.state,
      ],
    }),
  };
}

export function normalizeBatchEventsVenue(
  events: BatchEventEntry[],
  context?: { eventName?: string },
): BatchEventEntry[] {
  return events.map((event) => normalizeBatchEventVenue(event, context));
}
