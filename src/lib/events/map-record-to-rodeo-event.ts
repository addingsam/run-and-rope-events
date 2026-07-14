import { parseFreeformDescription } from "@/lib/events/event-detail";
import type { EventRecord } from "@/types/event-record";
import type { EventDiscipline, EventFormat, RodeoEvent } from "@/types/event";

function isEventFormat(value: string | null): value is EventFormat {
  return value === "jackpot" || value === "rodeo";
}

function isEventDiscipline(value: string): value is EventDiscipline {
  return [
    "bareback_riding",
    "saddle_bronc",
    "bull_riding",
    "ranch_bronc_riding",
    "barrel_racing",
    "team_roping",
    "calf_roping",
    "breakaway_roping",
    "steer_roping",
    "steer_wrestling",
    "cowboy_mounted_shooting",
    "ranch_horse",
    "obstacle_trail",
  ].includes(value);
}

export function isEventCurrentlyFeatured(record: Pick<EventRecord, "featured_until">) {
  if (!record.featured_until) {
    return false;
  }
  return new Date(record.featured_until).getTime() > Date.now();
}

export function mapEventRecordToRodeoEvent(record: EventRecord): RodeoEvent {
  const format = isEventFormat(record.event_format) ? record.event_format : "jackpot";
  const disciplines = (record.disciplines ?? []).filter(isEventDiscipline);

  return {
    id: record.id,
    title: record.event_name,
    format,
    rodeoLevel: record.rodeo_level,
    disciplines,
    additionalOfferings: record.additional_offerings ?? undefined,
    status: "upcoming",
    startDate: record.event_date,
    endDate: record.event_end_date ?? undefined,
    venue: record.venue_name,
    city: record.address_city,
    state: record.address_state,
    entryFee: record.entry_fee ?? undefined,
    description: parseFreeformDescription(record.description) ?? undefined,
    organizerName: record.contact_name,
    websiteUrl: record.website_link ?? undefined,
    featured: isEventCurrentlyFeatured(record),
  };
}
