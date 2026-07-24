import type { CalendarItem } from "@/types/calendar-entry";
import type { CalendarEntryRecord } from "@/types/calendar-entry";
import type { SavedEventWithDetails } from "@/types/saved-event";

function formatLocation(city: string, state: string) {
  if (city && state) {
    return `${city}, ${state}`;
  }
  return city || state || "";
}

export function buildCalendarItems(
  savedEvents: SavedEventWithDetails[],
  manualEntries: CalendarEntryRecord[],
): CalendarItem[] {
  const savedItems: CalendarItem[] = savedEvents.map((event) => ({
    kind: "saved_event",
    id: event.id,
    event_id: event.event_id,
    title: event.event_name,
    date: event.event_date,
    end_date: event.event_end_date ?? null,
    location: formatLocation(event.address_city, event.address_state),
    status: event.status,
    saved_at: event.saved_at,
  }));

  const manualItems: CalendarItem[] = manualEntries.map((entry) => ({
    kind: "manual_entry",
    id: entry.id,
    title: entry.title,
    date: entry.entry_date,
    time: entry.entry_time,
    note: entry.note,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  }));

  return [...savedItems, ...manualItems].sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) {
      return dateCompare;
    }

    const leftTime = left.kind === "manual_entry" ? left.time : null;
    const rightTime = right.kind === "manual_entry" ? right.time : null;
    if (leftTime && rightTime) {
      return leftTime.localeCompare(rightTime);
    }
    if (leftTime) {
      return -1;
    }
    if (rightTime) {
      return 1;
    }
    return left.title.localeCompare(right.title);
  });
}

export function itemOccursOnDate(item: CalendarItem, dateKey: string) {
  if (item.kind === "manual_entry") {
    return item.date === dateKey;
  }

  const endDate = item.end_date && item.end_date !== item.date ? item.end_date : item.date;
  return dateKey >= item.date && dateKey <= endDate;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
