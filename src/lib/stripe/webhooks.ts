import type Stripe from "stripe";
import {
  getSubscriberByStripeCustomerId,
  getSubscriberByStripeSubscriptionId,
  syncSubscriberFromStripe,
  updateSubscriberByStripeSubscriptionId,
} from "@/lib/subscribers/repository";
import {
  getClerkUserIdFromMetadata,
  getInvoiceSubscriptionId,
  getPlanTypeFromMetadata,
  getSubscriptionPeriodEnd,
  mapStripeSubscriptionStatus,
} from "@/lib/stripe/subscription-status";

async function resolveClerkUserId({
  subscription,
  session,
}: {
  subscription: Stripe.Subscription;
  session?: Stripe.Checkout.Session | null;
}) {
  const fromSubscription = getClerkUserIdFromMetadata(subscription.metadata);
  if (fromSubscription) {
    return fromSubscription;
  }

  const fromSession = session ? getClerkUserIdFromMetadata(session.metadata) : null;
  if (fromSession) {
    return fromSession;
  }

  if (session?.client_reference_id) {
    return session.client_reference_id;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId) {
    const existing = await getSubscriberByStripeCustomerId(customerId);
    if (existing) {
      return existing.clerk_user_id;
    }
  }

  return null;
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") {
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error("Checkout session is missing subscription ID.");
  }

  const stripe = (await import("@/lib/stripe/client")).getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionRecord(subscription, session);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await syncSubscriptionRecord(subscription);
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await getSubscriberByStripeSubscriptionId(subscription.id);
  if (!existing) {
    return;
  }

  await updateSubscriberByStripeSubscriptionId(subscription.id, {
    subscriptionStatus: "canceled",
    subscriptionExpiresAt: getSubscriptionPeriodEnd(subscription),
  });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const existing = await getSubscriberByStripeSubscriptionId(subscriptionId);
  if (!existing) {
    return;
  }

  await updateSubscriberByStripeSubscriptionId(subscriptionId, {
    subscriptionStatus: "past_due",
    subscriptionExpiresAt: existing.subscription_expires_at,
  });
}

async function syncSubscriptionRecord(
  subscription: Stripe.Subscription,
  session?: Stripe.Checkout.Session | null,
) {
  const clerkUserId = await resolveClerkUserId({ subscription, session });
  if (!clerkUserId) {
    throw new Error("Unable to resolve Clerk user for Stripe subscription.");
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const planType =
    getPlanTypeFromMetadata(subscription.metadata) ??
    (session ? getPlanTypeFromMetadata(session.metadata) : null);

  await syncSubscriberFromStripe({
    clerkUserId,
    planType,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
    subscriptionExpiresAt: getSubscriptionPeriodEnd(subscription),
  });
}
