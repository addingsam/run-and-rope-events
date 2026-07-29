import { clerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const DEVICE_TRUST_MS = 30 * 24 * 60 * 60 * 1000;

export function getDeviceTrustExpiry(from = new Date()) {
  return new Date(from.getTime() + DEVICE_TRUST_MS);
}

export function isDeviceTrustActive(trustedUntil: string | Date, now = new Date()) {
  return new Date(trustedUntil).getTime() > now.getTime();
}

export async function recordTrustedDevice({
  userId,
  clientId,
  trustedAt = new Date(),
}: {
  userId: string;
  clientId: string;
  trustedAt?: Date;
}) {
  const supabase = getSupabaseAdminClient();
  const trustedUntil = getDeviceTrustExpiry(trustedAt).toISOString();
  const seenAt = trustedAt.toISOString();

  const { data: existing, error: lookupError } = await supabase
    .from("trusted_devices")
    .select("id, trusted_until")
    .eq("user_id", userId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing && isDeviceTrustActive(existing.trusted_until, trustedAt)) {
    const { error } = await supabase
      .from("trusted_devices")
      .update({
        last_seen_at: seenAt,
        updated_at: seenAt,
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      created: false,
      trustedUntil: existing.trusted_until,
    };
  }

  const { error } = await supabase.from("trusted_devices").upsert(
    {
      user_id: userId,
      client_id: clientId,
      first_trusted_at: seenAt,
      last_seen_at: seenAt,
      trusted_until: trustedUntil,
      updated_at: seenAt,
    },
    { onConflict: "user_id,client_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    created: !existing,
    trustedUntil,
  };
}

export async function expireTrustedDevices() {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const client = await clerkClient();

  const { data: expiredDevices, error } = await supabase
    .from("trusted_devices")
    .select("id, user_id, client_id")
    .lte("trusted_until", now);

  if (error) {
    throw new Error(error.message);
  }

  let revokedSessions = 0;
  let removedDevices = 0;

  for (const device of expiredDevices ?? []) {
    const { data: activeSessions } = await client.sessions.getSessionList({
      userId: device.user_id,
      status: "active",
      limit: 100,
    });

    for (const session of activeSessions) {
      if (session.clientId !== device.client_id) {
        continue;
      }

      await client.sessions.revokeSession(session.id);
      revokedSessions += 1;
    }

    const { error: deleteError } = await supabase
      .from("trusted_devices")
      .delete()
      .eq("id", device.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    removedDevices += 1;
  }

  return {
    expiredDevices: expiredDevices?.length ?? 0,
    revokedSessions,
    removedDevices,
  };
}
