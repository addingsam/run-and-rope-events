import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SavedMapOverlay, SavedSearchParams, SavedSearchRecord } from "@/types/saved-search";

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
  alertsEnabled = false,
  knownEventIds = [],
}: {
  userId: string;
  name: string;
  searchParams: SavedSearchParams;
  mapOverlay: SavedMapOverlay | null;
  alertsEnabled?: boolean;
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
      alerts_enabled: alertsEnabled,
      known_event_ids: knownEventIds,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedSearchRecord;
}

export async function updateSavedSearchAlerts(
  userId: string,
  searchId: string,
  alertsEnabled: boolean,
  knownEventIds?: string[],
) {
  const supabase = getSupabaseAdminClient();
  const updatePayload: {
    alerts_enabled: boolean;
    updated_at: string;
    known_event_ids?: string[];
  } = {
    alerts_enabled: alertsEnabled,
    updated_at: new Date().toISOString(),
  };

  if (knownEventIds) {
    updatePayload.known_event_ids = knownEventIds;
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
