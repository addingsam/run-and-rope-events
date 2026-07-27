import { getSupabaseAdminClient } from "@/lib/supabase/server";

const PUBLISHED_STATUSES = ["approved", "published"] as const;

export interface SitemapEventEntry {
  id: string;
  created_at: string;
  event_date: string;
}

export async function listPublishedEventsForSitemap(): Promise<SitemapEventEntry[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, created_at, event_date")
    .in("status", [...PUBLISHED_STATUSES])
    .order("event_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SitemapEventEntry[];
}
