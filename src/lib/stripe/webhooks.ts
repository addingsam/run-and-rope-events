import type Stripe from "stripe";
import {
  activateEventFeaturedPlacement,
  getEventByFeaturedSubscriptionId,
  renewEventFeaturedPlacement,
} from "@/lib/events/featured-events";
import {
  getFeaturedUntilDate,
  isFeaturedBillingType,
} from "@/lib/stripe/featured";
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

function isFeaturedCheckoutMetadata(metadata: Stripe.Metadata | null | undefined) {
  return metadata?.checkout_type === "event_feature";
}

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
  if (isFeaturedCheckoutMetadata(session.metadata)) {
    if (session.mode === "payment") {
      await handleFeaturedEventOneTimeCheckout(session);
      return;
    }

    if (session.mode === "subscription") {
      await handleFeaturedEventSubscriptionCheckout(session);
      return;
    }
  }

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

  if (isFeaturedCheckoutMetadata(subscription.metadata)) {
    await handleFeaturedEventSubscriptionCheckout(session, subscription);
    return;
  }

  await syncSubscriptionRecord(subscription, session);
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (isFeaturedCheckoutMetadata(subscription.metadata)) {
    return;
  }

  await syncSubscriptionRecord(subscription);
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (isFeaturedCheckoutMetadata(subscription.metadata)) {
    return;
  }

  const existing = await getSubscriberByStripeSubscriptionId(subscription.id);
  if (!existing) {
    return;
  }

  await updateSubscriberByStripeSubscriptionId(subscription.id, {
    subscriptionStatus: "canceled",
    subscriptionExpiresAt: getSubscriptionPeriodEnd(subscription),
  });
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }

  const stripe = (await import("@/lib/stripe/client")).getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (!isFeaturedCheckoutMetadata(subscription.metadata)) {
    return;
  }

  const eventId = subscription.metadata?.event_id;
  if (!eventId) {
    throw new Error("Featured subscription is missing event_id metadata.");
  }

  if (invoice.billing_reason === "subscription_create") {
    const existing = await getEventByFeaturedSubscriptionId(subscriptionId);
    if (!existing) {
      await handleFeaturedEventSubscriptionActivation({
        eventId,
        subscription,
        checkoutSessionId: `invoice_${invoice.id}`,
        paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000).toISOString(),
      });
    }
    return;
  }

  await renewEventFeaturedPlacement({
    eventId,
    paidAt: new Date((invoice.status_transitions.paid_at ?? invoice.created) * 1000).toISOString(),
  });
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripe = (await import("@/lib/stripe/client")).getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (isFeaturedCheckoutMetadata(subscription.metadata)) {
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

async function handleFeaturedEventOneTimeCheckout(session: Stripe.Checkout.Session) {
  const eventId = session.metadata?.event_id;
  const billingType = session.metadata?.billing_type;

  if (!eventId) {
    throw new Error("Featured checkout is missing event_id metadata.");
  }

  if (!billingType || !isFeaturedBillingType(billingType)) {
    throw new Error("Featured checkout is missing billing_type metadata.");
  }

  if (session.payment_status !== "paid") {
    return;
  }

  const paidAt = new Date(session.created * 1000).toISOString();

  await activateEventFeaturedPlacement({
    eventId,
    featuredUntil: getFeaturedUntilDate(new Date(session.created * 1000)),
    featuredPaidAt: paidAt,
    stripeCheckoutSessionId: session.id,
    billingType,
  });
}

async function handleFeaturedEventSubscriptionCheckout(
  session: Stripe.Checkout.Session,
  subscriptionFromWebhook?: Stripe.Subscription,
) {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!subscriptionId) {
    throw new Error("Featured subscription checkout is missing subscription ID.");
  }

  const stripe = (await import("@/lib/stripe/client")).getStripeClient();
  const subscription =
    subscriptionFromWebhook ?? (await stripe.subscriptions.retrieve(subscriptionId));

  await handleFeaturedEventSubscriptionActivation({
    eventId: subscription.metadata?.event_id ?? session.metadata?.event_id ?? "",
    subscription,
    checkoutSessionId: session.id,
    paidAt: new Date(session.created * 1000).toISOString(),
  });
}

async function handleFeaturedEventSubscriptionActivation({
  eventId,
  subscription,
  checkoutSessionId,
  paidAt,
}: {
  eventId: string;
  subscription: Stripe.Subscription;
  checkoutSessionId: string;
  paidAt: string;
}) {
  if (!eventId) {
    throw new Error("Featured subscription is missing event_id metadata.");
  }

  await activateEventFeaturedPlacement({
    eventId,
    featuredUntil: getFeaturedUntilDate(new Date(paidAt)),
    featuredPaidAt: paidAt,
    stripeCheckoutSessionId: checkoutSessionId,
    billingType: "recurring",
    stripeSubscriptionId: subscription.id,
  });
}
