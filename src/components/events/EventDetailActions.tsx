"use client";

import { useState } from "react";
import {
  buildGoogleCalendarUrl,
} from "@/lib/events/event-actions";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailActionsProps {
  event: EventDetailView;
}

export function EventDetailActions({ event }: EventDetailActionsProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on Run & Rope Events`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied to clipboard.");
    } catch {
      setShareMessage("Unable to share this event.");
    }

    window.setTimeout(() => setShareMessage(null), 2500);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <EventBookmarkButton eventId={event.id} eventTitle={event.title} />

        <a
          href={buildGoogleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
        >
          Add to calendar
        </a>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
        >
          Share
        </button>
      </div>

      {shareMessage && <p className="text-sm text-amber-800">{shareMessage}</p>}
    </div>
  );
}
