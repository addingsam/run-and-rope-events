"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchSavedEventIds,
  removeSavedEvent,
  saveEvent,
} from "@/lib/saved/client";

interface SavedEventsContextValue {
  enabled: boolean;
  savedIds: Set<string>;
  loading: boolean;
  isSaved: (eventId: string) => boolean;
  toggleSaved: (eventId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SavedEventsContext = createContext<SavedEventsContextValue | null>(null);

interface SavedEventsProviderProps {
  enabled: boolean;
  children: React.ReactNode;
}

export function SavedEventsProvider({ enabled, children }: SavedEventsProviderProps) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ids = await fetchSavedEventIds();
      setSavedIds(new Set(ids));
    } catch {
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleSaved = useCallback(
    async (eventId: string) => {
      if (!enabled) {
        return;
      }

      const currentlySaved = savedIds.has(eventId);
      if (currentlySaved) {
        await removeSavedEvent(eventId);
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(eventId);
          return next;
        });
        return;
      }

      await saveEvent(eventId);
      setSavedIds((current) => new Set(current).add(eventId));
    },
    [enabled, savedIds],
  );

  const value = useMemo<SavedEventsContextValue>(
    () => ({
      enabled,
      savedIds,
      loading,
      isSaved: (eventId) => savedIds.has(eventId),
      toggleSaved,
      refresh,
    }),
    [enabled, savedIds, loading, toggleSaved, refresh],
  );

  return (
    <SavedEventsContext.Provider value={value}>{children}</SavedEventsContext.Provider>
  );
}

export function useSavedEvents() {
  const context = useContext(SavedEventsContext);
  if (!context) {
    throw new Error("useSavedEvents must be used within SavedEventsProvider.");
  }
  return context;
}
