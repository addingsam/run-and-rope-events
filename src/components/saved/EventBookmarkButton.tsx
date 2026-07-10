"use client";

import Link from "next/link";
import { useState } from "react";
import { useSavedEvents } from "@/components/saved/SavedEventsProvider";

interface EventBookmarkButtonProps {
  eventId: string;
  eventTitle?: string;
  className?: string;
  size?: "sm" | "md";
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-5 w-5 ${filled ? "fill-amber-700 text-amber-700" : "fill-none text-amber-800"}`}
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V20l-6-3.5L6 20V4.5z" />
    </svg>
  );
}

export function EventBookmarkButton({
  eventId,
  eventTitle,
  className = "",
  size = "md",
}: EventBookmarkButtonProps) {
  const { enabled, isSaved, toggleSaved, loading } = useSavedEvents();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!enabled) {
    return (
      <Link
        href={`/sign-in?redirect_url=${encodeURIComponent("/events")}`}
        className={`inline-flex items-center justify-center rounded-full border border-amber-200 bg-white/90 text-amber-800 shadow-sm backdrop-blur transition-colors hover:bg-amber-50 ${
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        } ${className}`}
        aria-label="Sign in to save events"
        title="Sign in to save events"
      >
        <BookmarkIcon filled={false} />
      </Link>
    );
  }

  const saved = isSaved(eventId);
  const label = saved
    ? `Remove ${eventTitle ?? "event"} from saved events`
    : `Save ${eventTitle ?? "event"}`;

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    setError(null);
    setPending(true);
    try {
      await toggleSaved(eventId);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to save event.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(clickEvent) => void handleClick(clickEvent)}
        disabled={loading || pending}
        className={`inline-flex items-center justify-center rounded-full border border-amber-200 bg-white/90 text-amber-800 shadow-sm backdrop-blur transition-colors hover:bg-amber-50 disabled:opacity-60 ${
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        } ${className}`}
        aria-label={label}
        title={label}
      >
        <BookmarkIcon filled={saved} />
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
