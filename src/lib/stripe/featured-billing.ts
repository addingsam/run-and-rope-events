export type FeaturedBillingType = "one_time" | "recurring";

export const FEATURED_DURATION_DAYS = 30;

export function getFeaturedUntilDate(from = new Date()) {
  const until = new Date(from);
  until.setUTCDate(until.getUTCDate() + FEATURED_DURATION_DAYS);
  return until.toISOString();
}

export function extendFeaturedUntilDate(currentUntil: string | null, from = new Date()) {
  const base =
    currentUntil && new Date(currentUntil).getTime() > from.getTime()
      ? new Date(currentUntil)
      : from;
  return getFeaturedUntilDate(base);
}

export function isFeaturedBillingType(value: string): value is FeaturedBillingType {
  return value === "one_time" || value === "recurring";
}
