import { NextResponse } from "next/server";
import { buildCalendarItems } from "@/lib/calendar/build-calendar-items";
import { listCalendarEntries } from "@/lib/calendar-entries/repository";
import { listSavedEvents } from "@/lib/saved-events/repository";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";

export async function GET() {
  try {
    const user = await requireSubscriberUser();
    const [savedEvents, manualEntries] = await Promise.all([
      listSavedEvents(user.id),
      listCalendarEntries(user.id),
    ]);

    const items = buildCalendarItems(savedEvents, manualEntries);
    return NextResponse.json({ items, savedEvents, manualEntries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
