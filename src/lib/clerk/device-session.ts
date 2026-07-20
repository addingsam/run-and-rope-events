import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function ensureClerkProfile({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const admin = getSupabaseAdminClient();
  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      subscription_tier: "free",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}
