import { getAppUrl } from "@/lib/env/app-url";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { getIsSubscriber } from "@/lib/subscription/status";
import { runSavedSearch } from "@/lib/saved-searches/run-saved-search";
import {
  getProfileEmail,
  updateSavedSearchKnownEvents,
} from "@/lib/saved-searches/repository";
import { savedSearchToQueryString } from "@/lib/saved-searches/run-saved-search";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEventPassedEmail, sendSavedSearchAlertEmail } from "@/lib/email/saved-notifications";
import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";

const APP_URL = getAppUrl();

function getCurrentEventIds(params: SavedSearchParams, mapOverlay?: SavedMapOverlay | null) {
  return runSavedSearch(params, mapOverlay).then((response) =>
    response.results
      .filter((entry) => entry.kind === "event")
      .map((entry) => entry.item.id),
  );
}

export async function processSavedSearchAlerts() {
  const supabase = getSupabaseAdminClient();
  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("id, user_id, name, search_params, map_overlay, known_event_ids, alerts_enabled")
    .eq("alerts_enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;

  for (const search of searches ?? []) {
    const params = search.search_params as SavedSearchParams;
    const mapOverlay = (search.map_overlay as SavedMapOverlay | null) ?? null;
    const knownIds = new Set((search.known_event_ids ?? []) as string[]);
    const response = await runSavedSearch(params, mapOverlay);
    const currentEventIds = response.results
      .filter((entry) => entry.kind === "event")
      .map((entry) => entry.item.id);
    const newEventIds = currentEventIds.filter((id) => !knownIds.has(id));

    if (newEventIds.length === 0) {
      continue;
    }

    const email = await getProfileEmail(search.user_id);
    if (!email) {
      continue;
    }

    const newEvents = response.results.filter(
      (entry) => entry.kind === "event" && newEventIds.includes(entry.item.id),
    );

    await sendSavedSearchAlertEmail({
      to: email,
      searchName: search.name,
      eventNames: newEvents.map((entry) =>
        entry.kind === "event" ? entry.item.title : "",
      ),
      searchUrl: `${APP_URL}/events?${savedSearchToQueryString(params)}`,
    });

    await updateSavedSearchKnownEvents(search.id, currentEventIds);
    sent += 1;
  }

  return { sent };
}

export async function processArchivedEventNotifications() {
  const supabase = getSupabaseAdminClient();
  const { data: savedRows, error } = await supabase
    .from("saved_events")
    .select("id, user_id, event_id, archive_notified_at, events(event_name, event_date, address_city, address_state, status)")
    .is("archive_notified_at", null);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  const inactiveStatuses = new Set(["rejected", "pending", "archived"]);

  for (const row of savedRows ?? []) {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    if (!event || !inactiveStatuses.has(event.status)) {
      continue;
    }

    const email = await getProfileEmail(row.user_id);
    if (!email) {
      continue;
    }

    await sendEventPassedEmail({
      to: email,
      eventName: event.event_name,
      eventDate: event.event_date,
      location: `${event.address_city}, ${event.address_state}`,
    });

    await supabase.from("saved_events").delete().eq("id", row.id);

    sent += 1;
  }

  return { sent };
}

export async function baselineSavedSearchKnownEvents(
  searchId: string,
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
) {
  const currentEventIds = await getCurrentEventIds(params, mapOverlay);
  await updateSavedSearchKnownEvents(searchId, currentEventIds);
  return currentEventIds;
}

export async function requireAuthenticatedUser() {
  const profile = await getAuthUserProfile();
  if (!profile) {
    throw new Error("Authentication required.");
  }
  return profile;
}

export async function requireSubscriberUser() {
  const profile = await requireAuthenticatedUser();
  const isSubscriber = await getIsSubscriber();
  if (!isSubscriber) {
    throw new Error("Subscription required.");
  }
  return profile;
}
