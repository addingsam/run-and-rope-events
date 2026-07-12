"use client";

import { useState } from "react";
import {
  buildGoogleCalendarUrl,
} from "@/lib/events/event-actions";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";
import { APP_NAME } from "@/lib/constants";
import { themeMutedTextClassName, themeSecondaryButtonClassName } from "@/lib/theme/form-classes";
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
      text: `Check out ${event.title} on ${APP_NAME}`,
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
          className={themeSecondaryButtonClassName}
        >
          Add to calendar
        </a>

        <button
          type="button"
          onClick={() => void handleShare()}
          className={themeSecondaryButtonClassName}
        >
          Share
        </button>
      </div>

      {shareMessage && <p className={`text-sm text-[var(--color-accent-primary)]`}>{shareMessage}</p>}
    </div>
  );
}
