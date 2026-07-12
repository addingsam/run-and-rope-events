import { parseEventDescription } from "@/lib/events/flyer-lightbox";
import { parseStoredRodeoLevels } from "@/lib/events/rodeo-levels";
import type { EventRecord } from "@/types/event-record";
import type {
  EventSubmission,
  RodeoLevel,
  SubmissionDiscipline,
  SubmissionFormat,
} from "@/types/event-submission";

function extractUserDescription(description: string | null) {
  if (!description) {
    return "";
  }

  return description
    .split("\n\n")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part.length > 0 &&
        !part.startsWith("Class/Division: ") &&
        !part.startsWith("Entry deadline: ") &&
        !part.startsWith("End date: ") &&
        !part.startsWith("Format: ") &&
        !part.startsWith("Rodeo level") &&
        !part.startsWith("Disciplines: "),
    )
    .join("\n\n");
}

export function mapEventRecordToSubmission(record: EventRecord): EventSubmission {
  const parsed = parseEventDescription(record.description);

  return {
    eventName: record.event_name,
    format: (record.event_format as SubmissionFormat) ?? "jackpot",
    rodeoLevels: parseStoredRodeoLevels(record.rodeo_level).filter((level): level is RodeoLevel =>
      level === "youth" || level === "open" || level === "amateur",
    ),
    disciplines: (record.disciplines ?? []) as SubmissionDiscipline[],
    additionalOfferings: record.additional_offerings ?? [],
    startDate: record.event_date,
    endDate: record.event_end_date ?? parsed.endDate ?? "",
    entryDeadline: parsed.entryDeadline ?? "",
    classDivisionInfo: parsed.classDivisionInfo ?? "",
    venueName: record.venue_name,
    streetAddress: record.address_street,
    city: record.address_city,
    state: record.address_state,
    zipCode: record.address_zip,
    producerName: record.contact_name,
    producerWebsite: record.website_link ?? "",
    contactEmail: record.contact_email ?? "",
    contactPhone: record.contact_phone ?? "",
    entryFee: record.entry_fee ?? "",
    prizePayoutInfo: record.prize_info ?? "",
    description: extractUserDescription(record.description),
    submitterEmail: record.submitter_email ?? "",
    flyerUrl: record.flyer_url ?? "",
  };
}
