import type { EventRecord } from "@/types/event-record";
import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";

interface ParsedDescription {
  classDivisionInfo: string | null;
  entryDeadline: string | null;
  endDate: string | null;
}

export function parseEventDescription(description: string | null): ParsedDescription {
  const result: ParsedDescription = {
    classDivisionInfo: null,
    entryDeadline: null,
    endDate: null,
  };

  if (!description) {
    return result;
  }

  for (const part of description.split("\n\n")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("Class/Division: ")) {
      result.classDivisionInfo = trimmed.slice("Class/Division: ".length).trim();
      continue;
    }

    if (trimmed.startsWith("Entry deadline: ")) {
      result.entryDeadline = trimmed.slice("Entry deadline: ".length).trim();
      continue;
    }

    if (trimmed.startsWith("End date: ")) {
      result.endDate = trimmed.slice("End date: ".length).trim();
    }
  }

  return result;
}

export function mapEventRecordToFlyerLightbox(record: EventRecord): FlyerLightboxEvent {
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
  };
}

export function formatFlyerAddress(event: FlyerLightboxEvent) {
  const street = event.streetAddress?.trim();
  const cityLine = [event.city, event.state].filter(Boolean).join(", ");
  const zip = event.zipCode?.trim();

  if (street) {
    return [street, [cityLine, zip].filter(Boolean).join(" ")].filter(Boolean).join("\n");
  }

  return [cityLine, zip].filter(Boolean).join(" ");
}
