"use client";

import { useCallback, useState } from "react";
import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";

export function useFlyerLightbox() {
  const [event, setEvent] = useState<FlyerLightboxEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setEvent(null);
    setError(null);
  }, []);

  const open = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = (await response.json()) as FlyerLightboxEvent & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load event details.");
      }

      setEvent(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load event details.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const openWithEvent = useCallback((flyerEvent: FlyerLightboxEvent) => {
    setError(null);
    setEvent(flyerEvent);
  }, []);

  return {
    event,
    loading,
    error,
    open,
    openWithEvent,
    close,
    isOpen: event !== null,
  };
}
