import { APP_NAME } from "@/lib/constants";
import {
  FEATURED_DURATION_DAYS,
  type FeaturedBillingType,
  extendFeaturedUntilDate,
  getFeaturedUntilDate,
  isFeaturedBillingType,
} from "@/lib/stripe/featured-billing";

export type { FeaturedBillingType } from "@/lib/stripe/featured-billing";
export { extendFeaturedUntilDate, getFeaturedUntilDate, isFeaturedBillingType };

export const FEATURED_PLACEMENT = {
  durationDays: FEATURED_DURATION_DAYS,
  priceLabel: "$15",
  description: `Feature your event on the ${APP_NAME} homepage so every visitor can see it — including people without a paid subscription.`,
  oneTimeLabel: "$15 one-time for 30 days",
  recurringLabel: "$15 every 30 days (renews automatically until canceled)",
} as const;

export function getStripeFeaturedOneTimePriceId() {
  const priceId = process.env.STRIPE_PRICE_FEATURED_ID;
  if (!priceId) {
    throw new Error("Missing STRIPE_PRICE_FEATURED_ID.");
  }
  return priceId;
}

export function getStripeFeaturedRecurringPriceId() {
  const priceId = process.env.STRIPE_PRICE_FEATURED_RECURRING_ID;
  if (!priceId) {
    throw new Error("Missing STRIPE_PRICE_FEATURED_RECURRING_ID.");
  }
  return priceId;
}

export function getFeaturedPriceId(billingType: FeaturedBillingType) {
  return billingType === "recurring"
    ? getStripeFeaturedRecurringPriceId()
    : getStripeFeaturedOneTimePriceId();
}
