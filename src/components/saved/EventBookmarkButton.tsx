"use client";

import Link from "next/link";
import { useState } from "react";
import { useSavedEvents } from "@/components/saved/SavedEventsProvider";

interface EventBookmarkButtonProps {
  eventId: string;
  eventTitle?: string;
  className?: string;
  size?: "sm" | "md";
  /** Stronger pill styling for buttons placed over event flyer thumbnails. */
  overlay?: boolean;
}

function BookmarkIcon({ filled, size = "md" }: { filled: boolean; size?: "sm" | "md" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} ${filled ? "fill-[var(--color-accent-cta)] text-[var(--color-accent-cta)]" : "fill-none text-[var(--color-accent-primary)]"}`}
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V20l-6-3.5L6 20V4.5z" />
    </svg>
  );
}

function buttonClassName(size: "sm" | "md", className: string, overlay: boolean) {
  const overlayStyles = overlay
    ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-lg ring-1 ring-black/25"
    : "border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-accent-primary)] shadow-sm backdrop-blur";

  return `inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors hover:bg-[var(--color-background)] ${overlayStyles} ${
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
  } ${className}`;
}

export function EventBookmarkButton({
  eventId,
  eventTitle,
  className = "",
  size = "md",
  overlay = false,
}: EventBookmarkButtonProps) {
  const { enabled, isSaved, toggleSaved, loading } = useSavedEvents();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!enabled) {
    return (
      <Link
        href={`/sign-in?redirect_url=${encodeURIComponent("/events")}`}
        className={buttonClassName(size, className, overlay)}
        aria-label="Sign in to save events"
        title="Sign in to save events"
      >
        <BookmarkIcon filled={false} size={size} />
        <span className="whitespace-nowrap">Save</span>
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
        className={`${buttonClassName(size, className, overlay)} disabled:opacity-60`}
        aria-label={label}
        title={label}
      >
        <BookmarkIcon filled={saved} size={size} />
        <span className="whitespace-nowrap">{saved ? "Saved" : "Save"}</span>
      </button>
      {error && (
        <p className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-red-400/40 bg-red-950/30 px-2 py-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
