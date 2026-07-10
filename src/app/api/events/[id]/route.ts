import { NextResponse } from "next/server";
import { requireActiveEventAccess } from "@/lib/auth/event-access";
import { mapEventRecordToFlyerLightbox } from "@/lib/events/flyer-lightbox";
import { getPublishedEventById } from "@/lib/events/get-event-by-id";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await requireActiveEventAccess();

    const record = await getPublishedEventById(id);

    if (!record) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json(mapEventRecordToFlyerLightbox(record));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load event.";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("subscription")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
