import { activateEventFeaturedPlacement } from "@/lib/events/featured-events";
import { getStripeClient } from "@/lib/stripe/client";
import { getFeaturedUntilDate, isFeaturedBillingType } from "@/lib/stripe/featured";
import type { FeaturedBillingType } from "@/lib/stripe/featured";

export async function syncFeaturedPlacementFromCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.checkout_type !== "event_feature") {
    return null;
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return null;
  }

  const eventId = session.metadata?.event_id;
  if (!eventId) {
    throw new Error("Checkout session is missing event_id metadata.");
  }

  const billingTypeRaw = session.metadata?.billing_type ?? "";
  const billingType: FeaturedBillingType = isFeaturedBillingType(billingTypeRaw)
    ? billingTypeRaw
    : session.mode === "subscription"
      ? "recurring"
      : "one_time";

  const paidAt = new Date(session.created * 1000).toISOString();
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  return activateEventFeaturedPlacement({
    eventId,
    featuredUntil: getFeaturedUntilDate(new Date(session.created * 1000)),
    featuredPaidAt: paidAt,
    stripeCheckoutSessionId: session.id,
    billingType,
    stripeSubscriptionId: billingType === "recurring" ? subscriptionId : null,
  });
}
