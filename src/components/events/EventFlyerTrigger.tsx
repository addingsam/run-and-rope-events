"use client";

import { FlyerLightbox } from "@/components/events/FlyerLightbox";
import { useFlyerLightbox } from "@/hooks/useFlyerLightbox";
import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";

interface EventFlyerTriggerProps {
  event?: FlyerLightboxEvent;
  eventId?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function EventFlyerTrigger({
  event,
  eventId,
  children,
  ariaLabel,
  className,
}: EventFlyerTriggerProps) {
  const { event: openEvent, loading, error, open, openWithEvent, close, isOpen } =
    useFlyerLightbox();

  async function handleOpen() {
    if (event) {
      openWithEvent(event);
      return;
    }

    if (eventId) {
      await open(eventId);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleOpen()}
        aria-label={ariaLabel}
        className={className}
        disabled={loading}
      >
        {children}
      </button>

      {(error) && (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      )}

      {isOpen && openEvent && <FlyerLightbox event={openEvent} onClose={close} />}
    </>
  );
}
