import { getSupabaseAdminClient } from "@/lib/supabase/server";

const HOMEPAGE_FEATURE_STATUSES = ["pending", "approved", "published"] as const;

export async function isPublicFeaturedEvent(eventId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .in("status", [...HOMEPAGE_FEATURE_STATUSES])
    .not("featured_paid_at", "is", null)
    .not("featured_until", "is", null)
    .gt("featured_until", now)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
