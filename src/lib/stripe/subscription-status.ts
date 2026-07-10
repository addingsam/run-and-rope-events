import type { PlanType, SubscriptionStatus } from "@/types/subscriber";
import type Stripe from "stripe";

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

export function subscriptionGrantsAccess(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

export function getPlanTypeFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): PlanType | null {
  const value = metadata?.plan_type;
  if (value === "monthly" || value === "annual") {
    return value;
  }
  return null;
}

export function getClerkUserIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const value = metadata?.clerk_user_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const items = subscription.items?.data ?? [];
  if (items.length === 0) {
    throw new Error("Subscription has no items.");
  }

  const periodEnd = Math.max(...items.map((item) => item.current_period_end));
  return new Date(periodEnd * 1000).toISOString();
}
