import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SavedEventWithDetails } from "@/types/saved-event";

export async function listSavedEvents(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_events")
    .select(
      "id, user_id, event_id, saved_at, archive_notified_at, events(event_name, event_date, address_city, address_state, event_format, status)",
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    return {
      id: row.id,
      user_id: row.user_id,
      event_id: row.event_id,
      saved_at: row.saved_at,
      archive_notified_at: row.archive_notified_at,
      event_name: event?.event_name ?? "Event",
      event_date: event?.event_date ?? "",
      address_city: event?.address_city ?? "",
      address_state: event?.address_state ?? "",
      event_format: event?.event_format ?? null,
      status: event?.status ?? "unknown",
    } satisfies SavedEventWithDetails;
  });
}

export async function getSavedEventIds(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_events")
    .select("event_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.event_id as string);
}

export async function saveEventForUser(userId: string, eventId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_events")
    .upsert({ user_id: userId, event_id: eventId }, { onConflict: "user_id,event_id" })
    .select("event_id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.event_id as string;
}

export async function removeSavedEventForUser(userId: string, eventId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_events")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}
