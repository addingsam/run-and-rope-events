import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export function isAdminRole(role: unknown): role is "admin" {
  return role === "admin";
}

export async function requireAdminUser() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (!isAdminRole(role)) {
    redirect("/");
  }

  return {
    id: userId,
    email:
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress ??
      "",
  };
}
