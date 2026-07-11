import { getAppUrl, getStripeClient } from "@/lib/stripe/client";
import {
  type FeaturedBillingType,
  getFeaturedPriceId,
} from "@/lib/stripe/featured";

interface CreateFeaturedCheckoutSessionInput {
  eventId: string;
  eventName: string;
  email: string;
  billingType: FeaturedBillingType;
  successPath: string;
  cancelPath: string;
}

export async function createFeaturedCheckoutSession({
  eventId,
  eventName,
  email,
  billingType,
  successPath,
  cancelPath,
}: CreateFeaturedCheckoutSessionInput) {
  const stripe = getStripeClient();
  const appUrl = getAppUrl();
  const priceId = getFeaturedPriceId(billingType);
  const metadata = {
    checkout_type: "event_feature",
    event_id: eventId,
    billing_type: billingType,
    event_name: eventName,
  };

  const session = await stripe.checkout.sessions.create({
    mode: billingType === "recurring" ? "subscription" : "payment",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    ...(billingType === "recurring"
      ? {
          subscription_data: {
            metadata,
          },
        }
      : {}),
    success_url: `${appUrl}${successPath}${successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${cancelPath}`,
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session.");
  }

  return session.url;
}
