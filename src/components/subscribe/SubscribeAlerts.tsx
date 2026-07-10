"use client";

import { useSearchParams } from "next/navigation";

export function SubscribeAlerts() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";
  const fromEvents = searchParams.get("from") === "events";
  const authState = searchParams.get("auth");

  if (!canceled && !fromEvents) {
    return null;
  }

  if (canceled) {
    return (
      <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Checkout was canceled. Pick a plan below when you are ready.
      </div>
    );
  }

  const title =
    authState === "required" ? "Sign in to subscribe" : "Choose a plan to access events";
  const description =
    authState === "required"
      ? "Create an account or sign in, then complete checkout to unlock the event directory."
      : "You are signed in. Complete checkout below to activate your subscription.";

  return (
    <div className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
      <h2 className="text-lg font-semibold text-amber-950">{title}</h2>
      <p className="mt-2 text-sm text-amber-900/80">{description}</p>
    </div>
  );
}
