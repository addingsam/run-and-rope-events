import {
  mapSubmissionToEventRecord,
} from "@/lib/events/save-submission";
import { geocodeCityState } from "@/lib/geocoding/geocode-city-state";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecord, EventRecordStatus } from "@/types/event-record";
import type { EventSubmission } from "@/types/event-submission";

const APPROVED_STATUSES: EventRecordStatus[] = ["approved", "published"];

export async function listEventsByStatus(status: EventRecordStatus | EventRecordStatus[]) {
  const supabase = getSupabaseAdminClient();
  const statuses = Array.isArray(status) ? status : [status];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", statuses)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EventRecord[];
}

export async function getEventByIdForAdmin(eventId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventRecord;
}

export async function updateEventStatus(
  eventId: string,
  status: Extract<EventRecordStatus, "approved" | "rejected">,
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventRecord;
}

export async function updateEventFromSubmission(eventId: string, submission: EventSubmission) {
  const mapped = mapSubmissionToEventRecord(submission);
  const { status: _status, source: _source, ...updateFields } = mapped;

  const { latitude, longitude } = await geocodeCityState(
    submission.city,
    submission.state,
  );

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      ...updateFields,
      latitude,
      longitude,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventRecord;
}

export async function countEventsByStatus(status: EventRecordStatus | EventRecordStatus[]) {
  const supabase = getSupabaseAdminClient();
  const statuses = Array.isArray(status) ? status : [status];

  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .in("status", statuses);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export { APPROVED_STATUSES };
