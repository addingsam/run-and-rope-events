"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeSavedEvent } from "@/lib/saved/client";
import { formatEventDate } from "@/lib/events/format-date";
import type { SavedEventWithDetails } from "@/types/saved-event";

interface SavedEventsPanelProps {
  initialEvents: SavedEventWithDetails[];
}

function statusLabel(status: string) {
  if (status === "approved" || status === "published") {
    return null;
  }

  return "Archived";
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
      <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-amber-900/70">
        No saved events yet. Bookmark events from search results or event detail pages.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {events.map((savedEvent) => {
        const archived = statusLabel(savedEvent.status);

        return (
          <article
            key={savedEvent.id}
            className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-amber-950">{savedEvent.event_name}</h3>
                  {archived && (
                    <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-800">
                      {archived}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-amber-900/70">
                  {savedEvent.address_city}, {savedEvent.address_state} ·{" "}
                  {formatEventDate(savedEvent.event_date)}
                </p>
                <p className="mt-1 text-xs text-amber-800/70">
                  Saved {new Date(savedEvent.saved_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {!archived && (
                  <Link
                    href={`/events/${savedEvent.event_id}`}
                    className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                  >
                    View event
                  </Link>
                )}
                <button
                  type="button"
                  disabled={pendingId === savedEvent.event_id}
                  onClick={() => void handleRemove(savedEvent.event_id)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
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
