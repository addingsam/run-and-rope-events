import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEventPassedEmail } from "@/lib/email/saved-notifications";
import { getEffectiveEventEndDate, isEventPastArchiveThreshold } from "@/lib/events/event-dates";

interface ExpiredEventRow {
  id: string;
  event_name: string;
  event_date: string;
  event_end_date: string | null;
  address_city: string;
  address_state: string;
  description: string | null;
}

interface SavedEventSubscriber {
  id: string;
  user_id: string;
  profiles: { email: string } | { email: string }[] | null;
}

export async function archiveExpiredApprovedEvents() {
  const supabase = getSupabaseAdminClient();

  const { data: candidates, error } = await supabase
    .from("events")
    .select(
      "id, event_name, event_date, event_end_date, address_city, address_state, description, status",
    )
    .in("status", ["approved", "published"]);

  if (error) {
    throw new Error(error.message);
  }

  const expiredEvents = (candidates ?? []).filter((row) => {
    const finalDate = getEffectiveEventEndDate(row as ExpiredEventRow);
    return isEventPastArchiveThreshold(finalDate);
  }) as ExpiredEventRow[];

  if (expiredEvents.length === 0) {
    return { archived: 0, notificationsSent: 0 };
  }

  const eventIds = expiredEvents.map((event) => event.id);
  const { error: archiveError } = await supabase
    .from("events")
    .update({ status: "archived" })
    .in("id", eventIds);

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  let notificationsSent = 0;

  for (const event of expiredEvents) {
    const sent = await notifyAndRemoveSavedEventBookmarks(event);
    notificationsSent += sent;
  }

  return {
    archived: expiredEvents.length,
    notificationsSent,
  };
}

async function notifyAndRemoveSavedEventBookmarks(event: ExpiredEventRow) {
  const supabase = getSupabaseAdminClient();
  const { data: savedRows, error } = await supabase
    .from("saved_events")
    .select("id, user_id, profiles(email)")
    .eq("event_id", event.id);

  if (error) {
    throw new Error(error.message);
  }

  const finalDate = getEffectiveEventEndDate(event);
  let sent = 0;

  for (const row of (savedRows ?? []) as SavedEventSubscriber[]) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const email = profile?.email;
    if (!email) {
      continue;
    }

    await sendEventPassedEmail({
      to: email,
      eventName: event.event_name,
      eventDate: finalDate,
      location: `${event.address_city}, ${event.address_state}`,
    });
    sent += 1;
  }

  const { error: deleteError } = await supabase
    .from("saved_events")
    .delete()
    .eq("event_id", event.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return sent;
}
