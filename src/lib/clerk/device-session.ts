import { clerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface RegisteredDevice {
  clientId: string;
  registeredAt: string;
  lastSeenAt: string;
}

const MAX_REGISTERED_DEVICES = 2;
const MAX_ACTIVE_SESSIONS = 1;

interface DeviceSessionMetadata {
  registeredDevices?: RegisteredDevice[];
}

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

export async function enforceDeviceAndSessionLimits({
  userId,
  sessionId,
  clientId,
}: {
  userId: string;
  sessionId: string;
  clientId: string;
}) {
  const client = await clerkClient();

  const { data: activeSessions } = await client.sessions.getSessionList({
    userId,
    status: "active",
    limit: 100,
  });

  const otherActiveSessions = activeSessions.filter((session) => session.id !== sessionId);
  if (otherActiveSessions.length >= MAX_ACTIVE_SESSIONS) {
    for (const session of otherActiveSessions) {
      await client.sessions.revokeSession(session.id);
    }
  }

  const user = await client.users.getUser(userId);
  const metadata = user.privateMetadata as DeviceSessionMetadata;
  const devices = [...(metadata.registeredDevices ?? [])];
  const now = new Date().toISOString();
  const existingDeviceIndex = devices.findIndex((device) => device.clientId === clientId);

  if (existingDeviceIndex === -1) {
    if (devices.length >= MAX_REGISTERED_DEVICES) {
      await client.sessions.revokeSession(sessionId);
      return { allowed: false, reason: "device_limit" as const };
    }

    devices.push({
      clientId,
      registeredAt: now,
      lastSeenAt: now,
    });
  } else {
    devices[existingDeviceIndex] = {
      ...devices[existingDeviceIndex],
      lastSeenAt: now,
    };
  }

  await client.users.updateUserMetadata(userId, {
    privateMetadata: {
      registeredDevices: devices,
    },
  });

  return { allowed: true as const };
}
