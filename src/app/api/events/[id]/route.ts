import { NextResponse } from "next/server";
import {
  getAuthenticatedClerkUserId,
  requireActiveEventAccess,
  userHasActiveEventAccess,
} from "@/lib/auth/event-access";
import { isPublicFeaturedEvent } from "@/lib/events/is-public-featured-event";
import { mapEventRecordToFlyerLightbox } from "@/lib/events/flyer-lightbox";
import { getPubliclyViewableEventById } from "@/lib/events/get-event-by-id";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const isFeatured = await isPublicFeaturedEvent(id).catch(() => false);
    const userId = await getAuthenticatedClerkUserId();
    const hasSubscription = await userHasActiveEventAccess(userId);

    if (!isFeatured && !hasSubscription) {
      await requireActiveEventAccess();
    }

    const record = await getPubliclyViewableEventById(id);

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
