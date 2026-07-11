import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { isEventCurrentlyFeatured } from "@/lib/events/map-record-to-rodeo-event";
import type { EventRecord } from "@/types/event-record";

const PUBLISHED_STATUSES = new Set(["approved", "published"]);
const VIEWABLE_STATUSES = new Set(["pending", "approved", "published"]);

export async function getPublishedEventById(id: string): Promise<EventRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !PUBLISHED_STATUSES.has(data.status)) {
    return null;
  }

  return data as EventRecord;
}

export async function getPubliclyViewableEventById(id: string): Promise<EventRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !VIEWABLE_STATUSES.has(data.status)) {
    return null;
  }

  const record = data as EventRecord;

  if (PUBLISHED_STATUSES.has(record.status)) {
    return record;
  }

  if (record.status === "pending" && isEventCurrentlyFeatured(record) && record.featured_paid_at) {
    return record;
  }

  return null;
}
