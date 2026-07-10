import { NextResponse } from "next/server";
import {
  getSavedEventIds,
  listSavedEvents,
  removeSavedEventForUser,
  saveEventForUser,
} from "@/lib/saved-events/repository";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";

export async function GET() {
  try {
    const user = await requireSubscriberUser();
    const [events, eventIds] = await Promise.all([
      listSavedEvents(user.id),
      getSavedEventIds(user.id),
    ]);
    return NextResponse.json({ events, eventIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved events.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSubscriberUser();
    const body = (await request.json()) as { eventId?: string };
    if (!body.eventId) {
      return NextResponse.json({ error: "eventId is required." }, { status: 400 });
    }

    await saveEventForUser(user.id, body.eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save event.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireSubscriberUser();
    const body = (await request.json()) as { eventId?: string };
    if (!body.eventId) {
      return NextResponse.json({ error: "eventId is required." }, { status: 400 });
    }

    await removeSavedEventForUser(user.id, body.eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove saved event.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
