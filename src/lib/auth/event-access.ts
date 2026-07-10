import { auth } from "@clerk/nextjs/server";
import { hasActiveSubscription } from "@/lib/subscribers/repository";

export async function getAuthenticatedClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function userHasActiveEventAccess(clerkUserId: string | null): Promise<boolean> {
  if (!clerkUserId) {
    return false;
  }

  return hasActiveSubscription(clerkUserId);
}

export async function requireActiveEventAccess() {
  const userId = await getAuthenticatedClerkUserId();
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const isActive = await hasActiveSubscription(userId);
  if (!isActive) {
    throw new Error("Active subscription required.");
  }

  return userId;
}
