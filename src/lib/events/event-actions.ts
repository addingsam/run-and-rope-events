import type { EventDetailView } from "@/types/event-detail";
import { APP_NAME } from "@/lib/constants";

function formatIcsDate(date: string) {
  return date.replaceAll("-", "");
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

export function buildGoogleCalendarUrl(event: EventDetailView) {
  const start = formatIcsDate(event.startDate);
  const end = formatIcsDate(event.endDate ?? event.startDate);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: [event.venue, event.city, event.state].filter(Boolean).join(", "),
    details: event.description ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsFileContent(event: EventDetailView) {
  const start = formatIcsDate(event.startDate);
  const end = formatIcsDate(event.endDate ?? event.startDate);
  const location = [event.venue, event.city, event.state].filter(Boolean).join(", ");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//EN`,
    "BEGIN:VEVENT",
    `UID:${event.id}@jackpotandrodeo.events`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString().slice(0, 10))}T000000Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    event.description ? `DESCRIPTION:${escapeIcsText(event.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcsFile(event: EventDetailView) {
  const blob = new Blob([buildIcsFileContent(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replaceAll(/[^\w-]+/g, "-").toLowerCase() || "event"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

const SAVED_EVENTS_KEY = "rr_saved_events";

export function getSavedEventIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_EVENTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveEventId(eventId: string) {
  const saved = new Set(getSavedEventIds());
  saved.add(eventId);
  window.localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify([...saved]));
}

export function removeSavedEventId(eventId: string) {
  const saved = getSavedEventIds().filter((id) => id !== eventId);
  window.localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(saved));
}

export function isEventSaved(eventId: string) {
  return getSavedEventIds().includes(eventId);
}
