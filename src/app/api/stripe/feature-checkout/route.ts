import { NextResponse } from "next/server";
import {
  canPurchaseFeaturedPlacement,
  getEventForFeaturingCheckout,
} from "@/lib/events/featured-events";
import { createFeaturedCheckoutSession } from "@/lib/stripe/create-featured-checkout";
import { isFeaturedBillingType } from "@/lib/stripe/featured";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: string;
      email?: string;
      billingType?: string;
      fromSubmit?: boolean;
    };

    if (!body.eventId) {
      return NextResponse.json({ error: "Event ID is required." }, { status: 400 });
    }

    if (!body.billingType || !isFeaturedBillingType(body.billingType)) {
      return NextResponse.json({ error: "Choose a featured billing option." }, { status: 400 });
    }

    const email = body.email?.trim() ?? "";
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email is required for featured placement checkout." },
        { status: 400 },
      );
    }

    const event = await getEventForFeaturingCheckout(body.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!canPurchaseFeaturedPlacement(event)) {
      return NextResponse.json(
        { error: "This event already has active featured placement." },
        { status: 409 },
      );
    }

    const successPath = body.fromSubmit
      ? `/submit?featured_success=1&event_id=${event.id}`
      : `/events/${event.id}/feature/success`;
    const cancelPath = body.fromSubmit
      ? `/submit?featured_canceled=1&event_id=${event.id}`
      : `/events/${event.id}/feature?canceled=1`;

    const url = await createFeaturedCheckoutSession({
      eventId: event.id,
      eventName: event.event_name,
      email,
      billingType: body.billingType,
      successPath,
      cancelPath,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
