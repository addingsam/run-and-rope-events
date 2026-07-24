import { NextResponse } from "next/server";
import { listCalendarEntries, createCalendarEntry } from "@/lib/calendar-entries/repository";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";
import type { CalendarEntryInput } from "@/types/calendar-entry";

function parseInput(body: Record<string, unknown>): CalendarEntryInput | null {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const entry_date = typeof body.entry_date === "string" ? body.entry_date.trim() : "";
  if (!title || !entry_date) {
    return null;
  }

  const entry_time =
    typeof body.entry_time === "string" && body.entry_time.trim()
      ? body.entry_time.trim()
      : null;
  const note =
    typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  return { title, entry_date, entry_time, note };
}

export async function GET() {
  try {
    const user = await requireSubscriberUser();
    const entries = await listCalendarEntries(user.id);
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar entries.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSubscriberUser();
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseInput(body);
    if (!input) {
      return NextResponse.json({ error: "title and entry_date are required." }, { status: 400 });
    }

    const entry = await createCalendarEntry(user.id, input);
    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create calendar entry.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
