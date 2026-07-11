import {
  isEventCurrentlyFeatured,
  mapEventRecordToRodeoEvent,
} from "@/lib/events/map-record-to-rodeo-event";
import { extendFeaturedUntilDate } from "@/lib/stripe/featured-billing";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event-record";
import type { RodeoEvent } from "@/types/event";
import type { FeaturedBillingType } from "@/lib/stripe/featured-billing";

export { isPublicFeaturedEvent } from "@/lib/events/is-public-featured-event";

const PUBLISHED_STATUSES = ["approved", "published"] as const;
const HOMEPAGE_FEATURE_STATUSES = ["pending", "approved", "published"] as const;
const BLOCKED_FEATURE_STATUSES = new Set(["rejected", "archived"]);

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function listPaidFeaturedEvents(limit = 6): Promise<RodeoEvent[]> {
  const supabase = getSupabaseAdminClient();
  const today = getTodayDateString();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", [...HOMEPAGE_FEATURE_STATUSES])
    .gte("event_date", today)
    .not("featured_until", "is", null)
    .gt("featured_until", now)
    .not("featured_paid_at", "is", null)
    .order("featured_paid_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as EventRecord[]).map((record) => mapEventRecordToRodeoEvent(record));
}

export async function getEventForFeaturingCheckout(
  eventId: string,
): Promise<EventRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || BLOCKED_FEATURE_STATUSES.has(data.status)) {
    return null;
  }

  return data as EventRecord;
}

export async function getPublishedEventForFeaturing(
  eventId: string,
): Promise<EventRecord | null> {
  const event = await getEventForFeaturingCheckout(eventId);
  if (!event || !PUBLISHED_STATUSES.includes(event.status as (typeof PUBLISHED_STATUSES)[number])) {
    return null;
  }
  return event;
}

export async function getEventByFeaturedSubscriptionId(
  subscriptionId: string,
): Promise<EventRecord | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("featured_stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as EventRecord | null) ?? null;
}

export async function activateEventFeaturedPlacement({
  eventId,
  featuredUntil,
  featuredPaidAt,
  stripeCheckoutSessionId,
  billingType,
  stripeSubscriptionId,
}: {
  eventId: string;
  featuredUntil: string;
  featuredPaidAt: string;
  stripeCheckoutSessionId: string;
  billingType: FeaturedBillingType;
  stripeSubscriptionId?: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const existing = await getEventForFeaturingCheckout(eventId);

  if (!existing) {
    throw new Error("Event is not eligible for featuring.");
  }

  if (existing.featured_stripe_checkout_session_id === stripeCheckoutSessionId) {
    return existing;
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      featured_until: featuredUntil,
      featured_paid_at: featuredPaidAt,
      featured_stripe_checkout_session_id: stripeCheckoutSessionId,
      featured_billing_type: billingType,
      featured_stripe_subscription_id: stripeSubscriptionId ?? null,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventRecord;
}

export async function renewEventFeaturedPlacement({
  eventId,
  paidAt,
}: {
  eventId: string;
  paidAt: string;
}) {
  const supabase = getSupabaseAdminClient();
  const existing = await getEventForFeaturingCheckout(eventId);

  if (!existing) {
    throw new Error("Event is not eligible for featuring.");
  }

  const featuredUntil = extendFeaturedUntilDate(existing.featured_until, new Date(paidAt));

  const { data, error } = await supabase
    .from("events")
    .update({
      featured_until: featuredUntil,
      featured_paid_at: paidAt,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventRecord;
}

export function canPurchaseFeaturedPlacement(record: EventRecord) {
  return !isEventCurrentlyFeatured(record);
}

export function getSubmissionContactEmail(submission: {
  submitterEmail: string;
  contactEmail: string;
}) {
  return submission.submitterEmail.trim() || submission.contactEmail.trim();
}
