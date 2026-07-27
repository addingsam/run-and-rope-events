import { getAppUrl } from "@/lib/env/app-url";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { getIsSubscriber } from "@/lib/subscription/status";
import { sendSavedSearchConfirmationEmail } from "@/lib/email/saved-notifications";
import { runSavedSearch, savedSearchToQueryString } from "@/lib/saved-searches/run-saved-search";
import {
  getProfileEmail,
  updateSavedSearchKnownEvents,
  updateSavedSearchLastAlertSent,
} from "@/lib/saved-searches/repository";
import { sendEventPassedEmail, sendSavedSearchAlertEmail } from "@/lib/email/saved-notifications";
import type { SearchResultEntry } from "@/types/event-search";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const APP_URL = getAppUrl();
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;

function getCurrentEventIds(params: SavedSearchParams, mapOverlay?: SavedMapOverlay | null) {
  return runSavedSearch(params, mapOverlay).then((response) =>
    response.results
      .filter((entry) => entry.kind === "event")
      .map((entry) => entry.item.id),
  );
}

function isDueForDigest(
  frequency: SavedSearchAlertFrequency,
  lastAlertSentAt: string | null,
  now = Date.now(),
) {
  if (frequency === "off") {
    return false;
  }

  if (frequency === "daily") {
    return true;
  }

  if (!lastAlertSentAt) {
    return true;
  }

  return now - new Date(lastAlertSentAt).getTime() >= WEEKLY_MS;
}

export async function sendSavedSearchSavedConfirmation({
  to,
  searchName,
  searchParams,
  mapOverlay,
  alertFrequency,
  previewResults = [],
}: {
  to: string;
  searchName: string;
  searchParams: SavedSearchParams;
  mapOverlay?: SavedMapOverlay | null;
  alertFrequency: SavedSearchAlertFrequency;
  previewResults?: SearchResultEntry[];
}) {
  const searchUrl = `${APP_URL}/events?${savedSearchToQueryString(searchParams)}`;
  await sendSavedSearchConfirmationEmail({
    to,
    searchName,
    searchParams,
    mapOverlay,
    alertFrequency,
    searchUrl,
    previewResults,
  });
}

export type SavedSearchAlertJobResult = {
  sent: number;
  checked: number;
  skippedNotDue: number;
  skippedNoNewEvents: number;
  skippedNoEmail: number;
  errors: Array<{ searchId: string; searchName: string; message: string }>;
  wouldSend: Array<{
    searchId: string;
    searchName: string;
    frequency: "daily" | "weekly";
    email: string;
    newEventCount: number;
    newEventNames: string[];
  }>;
};

export async function processSavedSearchAlerts({
  dryRun = false,
}: {
  dryRun?: boolean;
} = {}): Promise<SavedSearchAlertJobResult> {
  const supabase = getSupabaseAdminClient();
  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select(
      "id, user_id, name, search_params, map_overlay, known_event_ids, alert_frequency, last_alert_sent_at",
    )
    .in("alert_frequency", ["daily", "weekly"]);

  if (error) {
    throw new Error(error.message);
  }

  const result: SavedSearchAlertJobResult = {
    sent: 0,
    checked: 0,
    skippedNotDue: 0,
    skippedNoNewEvents: 0,
    skippedNoEmail: 0,
    errors: [],
    wouldSend: [],
  };

  for (const search of searches ?? []) {
    const frequency = search.alert_frequency as SavedSearchAlertFrequency;
    if (!isDueForDigest(frequency, search.last_alert_sent_at)) {
      result.skippedNotDue += 1;
      continue;
    }

    result.checked += 1;

    try {
      const params = search.search_params as SavedSearchParams;
      const mapOverlay = (search.map_overlay as SavedMapOverlay | null) ?? null;
      const knownIds = new Set((search.known_event_ids ?? []) as string[]);
      const response = await runSavedSearch(params, mapOverlay);
      const currentEventIds = response.results
        .filter((entry) => entry.kind === "event")
        .map((entry) => entry.item.id);
      const newEventIds = currentEventIds.filter((id) => !knownIds.has(id));

      if (newEventIds.length === 0) {
        result.skippedNoNewEvents += 1;
        continue;
      }

      const email = await getProfileEmail(search.user_id);
      if (!email) {
        result.skippedNoEmail += 1;
        continue;
      }

      const newEvents = response.results.filter(
        (entry) => entry.kind === "event" && newEventIds.includes(entry.item.id),
      );

      if (frequency !== "daily" && frequency !== "weekly") {
        continue;
      }

      const eventNames = newEvents.map((entry) =>
        entry.kind === "event" ? entry.item.title : "",
      );

      result.wouldSend.push({
        searchId: search.id,
        searchName: search.name,
        frequency,
        email,
        newEventCount: newEventIds.length,
        newEventNames: eventNames,
      });

      if (dryRun) {
        continue;
      }

      await sendSavedSearchAlertEmail({
        to: email,
        searchName: search.name,
        eventNames,
        searchUrl: `${APP_URL}/events?${savedSearchToQueryString(params)}`,
        alertFrequency: frequency,
      });

      await updateSavedSearchKnownEvents(search.id, currentEventIds);
      await updateSavedSearchLastAlertSent(search.id);
      result.sent += 1;
    } catch (searchError) {
      const message =
        searchError instanceof Error ? searchError.message : "Saved search alert failed.";
      console.error(`Saved search alert failed for ${search.id}:`, searchError);
      result.errors.push({
        searchId: search.id,
        searchName: search.name,
        message,
      });
    }
  }

  return result;
}

export type ArchivedEventNotificationJobResult = {
  sent: number;
  checked: number;
  skippedNoEmail: number;
  errors: Array<{ savedEventId: string; message: string }>;
};

export async function processArchivedEventNotifications(): Promise<ArchivedEventNotificationJobResult> {
  const supabase = getSupabaseAdminClient();
  const { data: savedRows, error } = await supabase
    .from("saved_events")
    .select("id, user_id, event_id, archive_notified_at, events(event_name, event_date, address_city, address_state, status)")
    .is("archive_notified_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const result: ArchivedEventNotificationJobResult = {
    sent: 0,
    checked: 0,
    skippedNoEmail: 0,
    errors: [],
  };
  const inactiveStatuses = new Set(["rejected", "pending", "archived"]);

  for (const row of savedRows ?? []) {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    if (!event || !inactiveStatuses.has(event.status)) {
      continue;
    }

    result.checked += 1;

    try {
      const email = await getProfileEmail(row.user_id);
      if (!email) {
        result.skippedNoEmail += 1;
        continue;
      }

      await sendEventPassedEmail({
        to: email,
        eventName: event.event_name,
        eventDate: event.event_date,
        location: `${event.address_city}, ${event.address_state}`,
      });

      await supabase.from("saved_events").delete().eq("id", row.id);

      result.sent += 1;
    } catch (rowError) {
      const message =
        rowError instanceof Error ? rowError.message : "Archived event notification failed.";
      console.error(`Archived event notification failed for ${row.id}:`, rowError);
      result.errors.push({
        savedEventId: row.id,
        message,
      });
    }
  }

  return result;
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
