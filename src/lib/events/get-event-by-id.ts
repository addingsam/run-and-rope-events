import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event-record";

const PUBLISHED_STATUSES = new Set(["approved", "published"]);

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
