import {
  formatDisciplineDisplayLabels,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import { serializeRodeoLevels } from "@/lib/events/rodeo-levels";
import { resolveSubmissionRodeoLevels } from "@/lib/events/amateur-rodeo-associations";
import { resolveRanchRodeoLevels } from "@/lib/events/ranch-rodeo-level";
import { resolveYouthPlaydayLevels } from "@/lib/events/youth-playday-level";
import { extractNextGenRodeoWebsiteFromText } from "@/lib/events/nextgen-rodeo-website";
import {
  extractSgpEventsWebsiteFromText,
  rewriteSgpEventsWebsite,
} from "@/lib/events/sgp-events-website";
import { extractWebsiteFromText, normalizeWebsiteUrl } from "@/lib/events/normalize-website-url";
import { normalizeEventSubmissionVenue } from "@/lib/events/resolve-venue-name";
import {
  BLOCKED_PRODUCER_ERROR_MESSAGE,
  submissionContainsBlockedProducer,
} from "@/lib/events/blocked-producers";
import { submissionSourceToRecordSource } from "@/lib/events/validate-submission";
import { geocodeCityState } from "@/lib/geocoding/geocode-city-state";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecordInsert } from "@/types/event-record";
import type { EventSubmission } from "@/types/event-submission";

function buildDescription(submission: EventSubmission, rodeoLevels = submission.rodeoLevels) {
  const parts = [
    submission.description.trim(),
    submission.classDivisionInfo.trim() &&
      `Class/Division: ${submission.classDivisionInfo.trim()}`,
    submission.endDate.trim() && `End date: ${submission.endDate.trim()}`,
    submission.entryDeadline.trim() &&
      `Entry deadline: ${submission.entryDeadline.trim()}`,
    `Format: ${getFormatLabel(submission.format)}`,
    submission.format === "rodeo" &&
      rodeoLevels.length > 0 &&
      `Rodeo level${rodeoLevels.length === 1 ? "" : "s"}: ${rodeoLevels.map(getRodeoLevelLabel).join(", ")}`,
    submission.disciplines.length > 0 &&
      `Disciplines: ${formatDisciplineDisplayLabels(submission.disciplines)}`,
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

function resolveSubmissionWebsite(submission: EventSubmission) {
  const sourceTexts = [
    submission.producerWebsite,
    submission.eventName,
    submission.description,
    submission.classDivisionInfo,
    submission.prizePayoutInfo,
    submission.entryFee,
    submission.producerName,
    submission.contactEmail,
    submission.contactPhone,
    submission.venueName,
    submission.streetAddress,
    submission.entryDeadline,
  ];

  const sgpFromField = rewriteSgpEventsWebsite(submission.producerWebsite);
  if (sgpFromField) {
    return sgpFromField;
  }

  const normalizedExisting = normalizeWebsiteUrl(submission.producerWebsite);
  if (normalizedExisting) {
    return rewriteSgpEventsWebsite(normalizedExisting) ?? normalizedExisting;
  }

  const sgpWebsite = extractSgpEventsWebsiteFromText(...sourceTexts);
  if (sgpWebsite) {
    return sgpWebsite;
  }

  const nextGenWebsite = extractNextGenRodeoWebsiteFromText(...sourceTexts);
  if (nextGenWebsite) {
    return nextGenWebsite;
  }

  const websiteFromText = extractWebsiteFromText(...sourceTexts);
  if (websiteFromText) {
    return rewriteSgpEventsWebsite(websiteFromText) ?? websiteFromText;
  }

  return "";
}

export function mapSubmissionToEventRecord(submission: EventSubmission): EventRecordInsert {
  const normalizedSubmission = normalizeEventSubmissionVenue(submission);
  const rodeoLevelTexts = [
    normalizedSubmission.eventName,
    normalizedSubmission.producerName,
    normalizedSubmission.classDivisionInfo,
    normalizedSubmission.description,
    normalizedSubmission.prizePayoutInfo,
  ] as const;
  const rodeoLevels =
    normalizedSubmission.format === "rodeo"
      ? resolveYouthPlaydayLevels(
          resolveRanchRodeoLevels(
            resolveSubmissionRodeoLevels(
              normalizedSubmission.rodeoLevels,
              ...rodeoLevelTexts,
            ),
            ...rodeoLevelTexts,
          ),
          ...rodeoLevelTexts,
        )
      : [];

  return {
    status: "pending",
    event_name: normalizedSubmission.eventName.trim(),
    event_type: normalizedSubmission.disciplines.join(","),
    event_format: normalizedSubmission.format,
    rodeo_level:
      normalizedSubmission.format === "rodeo" ? serializeRodeoLevels(rodeoLevels) : null,
    disciplines: normalizedSubmission.disciplines,
    additional_offerings:
      normalizedSubmission.format === "rodeo"
        ? normalizeAdditionalOfferings(normalizedSubmission.additionalOfferings)
        : null,
    event_date: normalizedSubmission.startDate,
    event_end_date: toNullable(normalizedSubmission.endDate),
    venue_name: normalizedSubmission.venueName.trim(),
    address_street: normalizedSubmission.streetAddress.trim(),
    address_city: normalizedSubmission.city.trim(),
    address_state: normalizedSubmission.state.trim(),
    address_zip: normalizedSubmission.zipCode.trim(),
    latitude: null,
    longitude: null,
    entry_fee: toNullableRaw(normalizedSubmission.entryFee),
    prize_info: toNullable(normalizedSubmission.prizePayoutInfo),
    contact_name: normalizedSubmission.producerName.trim(),
    contact_email: toNullable(normalizedSubmission.contactEmail),
    contact_phone: toNullable(normalizedSubmission.contactPhone),
    website_link: toNullable(resolveSubmissionWebsite(normalizedSubmission)),
    description: buildDescription(normalizedSubmission, rodeoLevels),
    flyer_url: toNullable(normalizedSubmission.flyerUrl),
    submitter_email: toNullable(normalizedSubmission.submitterEmail),
    source: submissionSourceToRecordSource(normalizedSubmission.source ?? "flyer"),
  };
}

export async function saveEventSubmission(submission: EventSubmission) {
  if (submissionContainsBlockedProducer(submission)) {
    throw new Error(BLOCKED_PRODUCER_ERROR_MESSAGE);
  }

  const record = mapSubmissionToEventRecord(submission);

  try {
    const { latitude, longitude } = await geocodeCityState(
      submission.city,
      submission.state,
    );
    record.latitude = latitude;
    record.longitude = longitude;
  } catch (error) {
    console.error("[save-submission] Geocoding failed; saving without coordinates:", error);
  }

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

export async function saveEventSubmissions(submissions: EventSubmission[]) {
  const saved = [];

  for (const submission of submissions) {
    saved.push(await saveEventSubmission(submission));
  }

  return saved;
}
