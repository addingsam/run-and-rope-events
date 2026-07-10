import type { EventRecord } from "@/types/event-record";
import type { EventDetailView } from "@/types/event-detail";
import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";
import { parseEventDescription } from "@/lib/events/flyer-lightbox";

const METADATA_PREFIXES = [
  "Class/Division: ",
  "Entry deadline: ",
  "End date: ",
  "Format: ",
  "Rodeo level: ",
  "Disciplines: ",
];

export function parseFreeformDescription(description: string | null): string | null {
  if (!description) {
    return null;
  }

  const parts = description
    .split("\n\n")
    .map((part) => part.trim())
    .filter(
      (part) =>
        part.length > 0 &&
        !METADATA_PREFIXES.some((prefix) => part.startsWith(prefix)),
    );

  return parts.length > 0 ? parts.join("\n\n") : null;
}

export function mapEventRecordToEventDetail(record: EventRecord): EventDetailView {
  const parsed = parseEventDescription(record.description);

  return {
    id: record.id,
    title: record.event_name,
    format: record.event_format,
    rodeoLevel: record.rodeo_level,
    disciplines: record.disciplines ?? [],
    startDate: record.event_date,
    endDate: record.event_end_date ?? parsed.endDate,
    venue: record.venue_name,
    streetAddress: record.address_street,
    city: record.address_city,
    state: record.address_state,
    zipCode: record.address_zip,
    prizePayoutInfo: record.prize_info,
    classDivisionInfo: parsed.classDivisionInfo,
    entryFee: record.entry_fee,
    entryDeadline: parsed.entryDeadline,
    producerName: record.contact_name,
    contactEmail: record.contact_email,
    contactPhone: record.contact_phone,
    websiteUrl: record.website_link,
    flyerUrl: record.flyer_url,
    additionalOfferings: record.additional_offerings ?? [],
    description: parseFreeformDescription(record.description),
  };
}

export function mapFlyerLightboxToEventDetail(
  event: FlyerLightboxEvent,
  extras?: Partial<Pick<EventDetailView, "additionalOfferings" | "description">>,
): EventDetailView {
  return {
    ...event,
    additionalOfferings: extras?.additionalOfferings ?? [],
    description: extras?.description ?? null,
  };
}
