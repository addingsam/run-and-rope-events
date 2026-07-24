import { NextResponse } from "next/server";
import {
  deleteCalendarEntry,
  updateCalendarEntry,
} from "@/lib/calendar-entries/repository";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";
import type { CalendarEntryInput } from "@/types/calendar-entry";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSubscriberUser();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseInput(body);
    if (!input) {
      return NextResponse.json({ error: "title and entry_date are required." }, { status: 400 });
    }

    const entry = await updateCalendarEntry(user.id, id, input);
    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update calendar entry.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSubscriberUser();
    const { id } = await context.params;
    await deleteCalendarEntry(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete calendar entry.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
