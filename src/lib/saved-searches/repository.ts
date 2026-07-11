import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams, SavedSearchRecord } from "@/types/saved-search";

function alertsEnabledFromFrequency(frequency: SavedSearchAlertFrequency) {
  return frequency !== "off";
}

export async function getSavedSearchById(userId: string, searchId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .eq("id", searchId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedSearchRecord;
}

export async function getProfileEmail(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.email ?? null;
}

export async function listSavedSearches(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavedSearchRecord[];
}

export async function createSavedSearch({
  userId,
  name,
  searchParams,
  mapOverlay,
  alertFrequency = "off",
  knownEventIds = [],
}: {
  userId: string;
  name: string;
  searchParams: SavedSearchParams;
  mapOverlay: SavedMapOverlay | null;
  alertFrequency?: SavedSearchAlertFrequency;
  knownEventIds?: string[];
}) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: userId,
      name,
      search_params: searchParams,
      map_overlay: mapOverlay,
      alert_frequency: alertFrequency,
      alerts_enabled: alertsEnabledFromFrequency(alertFrequency),
      known_event_ids: knownEventIds,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedSearchRecord;
}

export async function updateSavedSearchAlertFrequency(
  userId: string,
  searchId: string,
  alertFrequency: SavedSearchAlertFrequency,
  knownEventIds?: string[],
) {
  const supabase = getSupabaseAdminClient();
  const updatePayload: {
    alert_frequency: SavedSearchAlertFrequency;
    alerts_enabled: boolean;
    updated_at: string;
    known_event_ids?: string[];
    last_alert_sent_at?: string | null;
  } = {
    alert_frequency: alertFrequency,
    alerts_enabled: alertsEnabledFromFrequency(alertFrequency),
    updated_at: new Date().toISOString(),
  };

  if (knownEventIds) {
    updatePayload.known_event_ids = knownEventIds;
  }

  if (alertFrequency === "off") {
    updatePayload.last_alert_sent_at = null;
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("id", searchId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedSearchRecord;
}

/** @deprecated Use updateSavedSearchAlertFrequency */
export async function updateSavedSearchAlerts(
  userId: string,
  searchId: string,
  alertsEnabled: boolean,
  knownEventIds?: string[],
) {
  return updateSavedSearchAlertFrequency(
    userId,
    searchId,
    alertsEnabled ? "daily" : "off",
    knownEventIds,
  );
}

export async function updateSavedSearchLastAlertSent(searchId: string, sentAt = new Date()) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_searches")
    .update({
      last_alert_sent_at: sentAt.toISOString(),
      updated_at: sentAt.toISOString(),
    })
    .eq("id", searchId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSavedSearch(userId: string, searchId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("user_id", userId)
    .eq("id", searchId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSavedSearchKnownEvents(
  searchId: string,
  knownEventIds: string[],
) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("saved_searches")
    .update({
      known_event_ids: knownEventIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", searchId);

  if (error) {
    throw new Error(error.message);
  }
}
