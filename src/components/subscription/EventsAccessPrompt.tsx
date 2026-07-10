"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function EventsAccessPrompt() {
  const searchParams = useSearchParams();
  const fromEvents = searchParams.get("from") === "events";
  const authState = searchParams.get("auth");

  if (!fromEvents) {
    return null;
  }

  const isSignInRequired = authState === "required";
  const title = isSignInRequired ? "Sign in to access events" : "Subscribe to access events";
  const description = isSignInRequired
    ? "The event directory and detail pages are for subscribers. Create an account or sign in, then choose a plan to continue."
    : "You are signed in, but your account does not have an active subscription yet. Choose a plan below to unlock event search and details.";

  return (
    <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 px-5 py-5 shadow-sm">
      <h2 className="text-lg font-semibold text-amber-950">{title}</h2>
      <p className="mt-2 text-sm text-amber-900/80">{description}</p>
      {isSignInRequired && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/sign-in"
            className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-white"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
