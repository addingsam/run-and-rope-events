import { auth, currentUser } from "@clerk/nextjs/server";
import { hasActiveSubscription } from "@/lib/subscribers/repository";

export interface AuthUserProfile {
  id: string;
  email: string;
  hasActiveSubscription: boolean;
}

export async function getAuthUserProfile(): Promise<AuthUserProfile | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "";

  const active = await hasActiveSubscription(userId);

  return {
    id: userId,
    email,
    hasActiveSubscription: active,
  };
}

export async function getIsSubscriber(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }

  return hasActiveSubscription(userId);
}

export async function getIsAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return userId !== null;
}
