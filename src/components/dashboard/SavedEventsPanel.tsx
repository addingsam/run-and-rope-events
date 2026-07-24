"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeSavedEvent } from "@/lib/saved/client";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { getFormatLabel } from "@/lib/events/submission-options";
import {
  themeBadgeClassName,
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { SavedEventWithDetails } from "@/types/saved-event";
import type { SubmissionFormat } from "@/types/event-submission";

interface SavedEventsPanelProps {
  initialEvents: SavedEventWithDetails[];
}

function statusLabel(status: string) {
  if (status === "approved" || status === "published") {
    return null;
  }

  return "Archived";
}

function formatLabel(format: string | null) {
  if (!format) {
    return null;
  }

  return getFormatLabel(format as SubmissionFormat) ?? null;
}

export function SavedEventsPanel({ initialEvents }: SavedEventsPanelProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRemove(eventId: string) {
    setError(null);
    setPendingId(eventId);
    try {
      await removeSavedEvent(eventId);
      setEvents((current) => current.filter((item) => item.event_id !== eventId));
      router.refresh();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Failed to remove event.");
    } finally {
      setPendingId(null);
    }
  }

  if (events.length === 0) {
    return (
      <div className={`px-6 py-8 text-sm ${themeMutedTextClassName} ${themePanelClassName}`}>
        No saved events yet. Bookmark events from search results or event detail pages.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {events.map((savedEvent) => {
        const archived = statusLabel(savedEvent.status);
        const format = formatLabel(savedEvent.event_format);
        const dateLabel = savedEvent.event_end_date
          ? formatEventDateRange(savedEvent.event_date, savedEvent.event_end_date)
          : formatEventDate(savedEvent.event_date);
        const locationLabel = [savedEvent.address_city, savedEvent.address_state]
          .filter(Boolean)
          .join(", ");

        return (
          <article
            key={savedEvent.id}
            className={`overflow-hidden shadow-sm ${themePanelClassName}`}
          >
            <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
                  {savedEvent.event_name}
                </h3>
                {format && <span className={themeBadgeClassName}>{format}</span>}
                {archived && (
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {archived}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <dl className="min-w-0 space-y-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Date
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-[var(--color-text-primary)]">
                    {dateLabel}
                  </dd>
                </div>
                {locationLabel && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Location
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">
                      {locationLabel}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Saved
                  </dt>
                  <dd className={`mt-0.5 text-sm ${themeMutedTextClassName}`}>
                    {new Date(savedEvent.saved_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>

              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                {!archived && (
                  <Link
                    href={`/events/${savedEvent.event_id}`}
                    className={`text-center ${themePrimaryButtonClassName}`}
                  >
                    View event
                  </Link>
                )}
                <button
                  type="button"
                  disabled={pendingId === savedEvent.event_id}
                  onClick={() => void handleRemove(savedEvent.event_id)}
                  className={`text-center ${themeSecondaryButtonClassName} border-red-400/40 text-red-300 hover:bg-red-950/30 disabled:opacity-60`}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
