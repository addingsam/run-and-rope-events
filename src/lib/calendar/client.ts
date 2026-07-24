import type { CalendarEntryInput, CalendarEntryRecord } from "@/types/calendar-entry";
import type { CalendarItem } from "@/types/calendar-entry";

export async function fetchCalendarItems(): Promise<CalendarItem[]> {
  const response = await fetch("/api/calendar");
  if (response.status === 401 || response.status === 403) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Failed to load calendar.");
  }

  const data = (await response.json()) as { items?: CalendarItem[] };
  return data.items ?? [];
}

export async function createCalendarEntry(input: CalendarEntryInput) {
  const response = await fetch("/api/calendar-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as { error?: string; entry?: CalendarEntryRecord };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create calendar entry.");
  }

  return data.entry!;
}

export async function updateCalendarEntry(entryId: string, input: CalendarEntryInput) {
  const response = await fetch(`/api/calendar-entries/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as { error?: string; entry?: CalendarEntryRecord };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update calendar entry.");
  }

  return data.entry!;
}

export async function deleteCalendarEntry(entryId: string) {
  const response = await fetch(`/api/calendar-entries/${entryId}`, {
    method: "DELETE",
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete calendar entry.");
  }
}
