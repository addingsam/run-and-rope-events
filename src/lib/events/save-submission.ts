import {
  formatDisciplineLabels,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import { geocodeCityState } from "@/lib/geocoding/geocode-city-state";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecordInsert } from "@/types/event-record";
import type { EventSubmission } from "@/types/event-submission";

function buildDescription(submission: EventSubmission) {
  const parts = [
    submission.description.trim(),
    submission.classDivisionInfo.trim() &&
      `Class/Division: ${submission.classDivisionInfo.trim()}`,
    submission.endDate.trim() && `End date: ${submission.endDate.trim()}`,
    submission.entryDeadline.trim() &&
      `Entry deadline: ${submission.entryDeadline.trim()}`,
    `Format: ${getFormatLabel(submission.format)}`,
    submission.format === "rodeo" &&
      submission.rodeoLevel &&
      `Rodeo level: ${getRodeoLevelLabel(submission.rodeoLevel)}`,
    submission.disciplines.length > 0 &&
      `Disciplines: ${formatDisciplineLabels(submission.disciplines)}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("\n\n") : null;
}

function toNullableRaw(value: string) {
  return value.length > 0 ? value : null;
}

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAdditionalOfferings(offerings: string[]) {
  const normalized = offerings.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

export function mapSubmissionToEventRecord(submission: EventSubmission): EventRecordInsert {
  return {
    status: "pending",
    event_name: submission.eventName.trim(),
    event_type: submission.disciplines.join(","),
    event_format: submission.format,
    rodeo_level: submission.format === "rodeo" ? submission.rodeoLevel : null,
    disciplines: submission.disciplines,
    additional_offerings:
      submission.format === "rodeo"
        ? normalizeAdditionalOfferings(submission.additionalOfferings)
        : null,
    event_date: submission.startDate,
    event_end_date: toNullable(submission.endDate),
    venue_name: submission.venueName.trim(),
    address_street: submission.streetAddress.trim(),
    address_city: submission.city.trim(),
    address_state: submission.state.trim(),
    address_zip: submission.zipCode.trim(),
    latitude: null,
    longitude: null,
    entry_fee: toNullableRaw(submission.entryFee),
    prize_info: toNullable(submission.prizePayoutInfo),
    contact_name: submission.producerName.trim(),
    contact_email: toNullable(submission.contactEmail),
    contact_phone: toNullable(submission.contactPhone),
    website_link: toNullable(submission.producerWebsite),
    description: buildDescription(submission),
    flyer_url: toNullable(submission.flyerUrl),
    submitter_email: toNullable(submission.submitterEmail),
    source: "submission",
  };
}

export async function saveEventSubmission(submission: EventSubmission) {
  const record = mapSubmissionToEventRecord(submission);

  const { latitude, longitude } = await geocodeCityState(
    submission.city,
    submission.state,
  );
  record.latitude = latitude;
  record.longitude = longitude;

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .insert(record)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
