import {
  APPROVED_STATUSES,
  countEventsByStatus,
} from "@/lib/events/admin-repository";
import { isSubscriptionCurrentlyActive } from "@/lib/subscribers/repository";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function getAdminDashboardStats() {
  const [approvedEvents, pendingSubmissions, subscribers] = await Promise.all([
    countEventsByStatus(APPROVED_STATUSES),
    countEventsByStatus("pending"),
    getActiveSubscriberCount(),
  ]);

  return {
    approvedEvents,
    pendingSubmissions,
    activeSubscribers: subscribers,
  };
}

async function getActiveSubscriberCount() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select("subscription_status, subscription_expires_at");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((subscriber) =>
    isSubscriptionCurrentlyActive(subscriber),
  ).length;
}
