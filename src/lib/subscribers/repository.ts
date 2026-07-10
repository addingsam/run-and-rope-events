import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { PlanType, SubscriberRecord, SubscriptionStatus } from "@/types/subscriber";

export function isSubscriptionCurrentlyActive(subscriber: {
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
}): boolean {
  if (subscriber.subscription_status !== "active" && subscriber.subscription_status !== "trialing") {
    return false;
  }

  if (!subscriber.subscription_expires_at) {
    return true;
  }

  return new Date(subscriber.subscription_expires_at).getTime() > Date.now();
}

export async function getSubscriberByClerkUserId(clerkUserId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SubscriberRecord | null) ?? null;
}

export async function getSubscriberByStripeSubscriptionId(stripeSubscriptionId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SubscriberRecord | null) ?? null;
}

export async function getSubscriberByStripeCustomerId(stripeCustomerId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SubscriberRecord | null) ?? null;
}

export async function hasActiveSubscription(clerkUserId: string): Promise<boolean> {
  const subscriber = await getSubscriberByClerkUserId(clerkUserId);
  if (!subscriber) {
    return false;
  }

  return isSubscriptionCurrentlyActive(subscriber);
}

export async function syncSubscriberFromStripe({
  clerkUserId,
  planType,
  stripeCustomerId,
  stripeSubscriptionId,
  subscriptionStatus,
  subscriptionExpiresAt,
}: {
  clerkUserId: string;
  planType: PlanType | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
}) {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("subscribers")
    .upsert(
      {
        clerk_user_id: clerkUserId,
        plan_type: planType,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        subscription_status: subscriptionStatus,
        subscription_expires_at: subscriptionExpiresAt,
        updated_at: now,
      },
      { onConflict: "clerk_user_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SubscriberRecord;
}

export async function updateSubscriberByStripeSubscriptionId(
  stripeSubscriptionId: string,
  patch: {
    subscriptionStatus: SubscriptionStatus;
    subscriptionExpiresAt?: string | null;
    planType?: PlanType | null;
    stripeCustomerId?: string | null;
  },
) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .update({
      subscription_status: patch.subscriptionStatus,
      subscription_expires_at: patch.subscriptionExpiresAt,
      plan_type: patch.planType,
      stripe_customer_id: patch.stripeCustomerId,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SubscriberRecord | null) ?? null;
}
