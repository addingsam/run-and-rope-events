import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";

export async function fetchSavedEventIds(): Promise<string[]> {
  const response = await fetch("/api/saved-events");
  if (response.status === 401 || response.status === 403) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Failed to load saved events.");
  }

  const data = (await response.json()) as { eventIds?: string[] };
  return data.eventIds ?? [];
}

export async function saveEvent(eventId: string) {
  const response = await fetch("/api/saved-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to save event.");
  }
}

export async function removeSavedEvent(eventId: string) {
  const response = await fetch("/api/saved-events", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to remove saved event.");
  }
}

export async function createSavedSearch({
  name,
  searchParams,
  mapOverlay,
  alertsEnabled = false,
}: {
  name: string;
  searchParams: SavedSearchParams;
  mapOverlay: SavedMapOverlay | null;
  alertsEnabled?: boolean;
}) {
  const response = await fetch("/api/saved-searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, searchParams, mapOverlay, alertsEnabled }),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to save search.");
  }

  return data;
}

export async function updateSavedSearchAlerts(searchId: string, alertsEnabled: boolean) {
  const response = await fetch(`/api/saved-searches/${searchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertsEnabled }),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update alerts.");
  }

  return data;
}

export async function deleteSavedSearch(searchId: string) {
  const response = await fetch(`/api/saved-searches/${searchId}`, {
    method: "DELETE",
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete saved search.");
  }
}
