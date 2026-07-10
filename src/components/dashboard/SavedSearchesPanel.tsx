"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteSavedSearch,
  updateSavedSearchAlerts,
} from "@/lib/saved/client";
import { savedSearchToQueryString } from "@/lib/saved-searches/run-saved-search";
import type { SavedSearchRecord } from "@/types/saved-search";

interface SavedSearchesPanelProps {
  initialSearches: SavedSearchRecord[];
}

export function SavedSearchesPanel({ initialSearches }: SavedSearchesPanelProps) {
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggleAlerts(search: SavedSearchRecord) {
    setError(null);
    setPendingId(search.id);
    try {
      const nextValue = !search.alerts_enabled;
      await updateSavedSearchAlerts(search.id, nextValue);
      setSearches((current) =>
        current.map((item) =>
          item.id === search.id ? { ...item, alerts_enabled: nextValue } : item,
        ),
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Failed to update alerts.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(searchId: string) {
    setError(null);
    setPendingId(searchId);
    try {
      await deleteSavedSearch(searchId);
      setSearches((current) => current.filter((item) => item.id !== searchId));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete search.");
    } finally {
      setPendingId(null);
    }
  }

  if (searches.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-6 text-sm text-amber-900/70">
        No saved searches yet. Run a search on the events page and use Save This Search.
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

      {searches.map((search) => {
        const query = savedSearchToQueryString(search.search_params);
        const modeLabel = search.search_params.mode === "route" ? "Route" : "Radius";

        return (
          <article
            key={search.id}
            className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-amber-950">{search.name}</h3>
                <p className="mt-1 text-sm text-amber-900/70">
                  {modeLabel} search · saved {new Date(search.updated_at).toLocaleDateString()}
                </p>
                {search.map_overlay &&
                  (search.map_overlay.pinRadius || search.map_overlay.shapes.length > 0) && (
                    <p className="mt-1 text-xs text-amber-800/70">Includes map drawings</p>
                  )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/events?${query}`}
                  className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                >
                  Run search
                </Link>
                <button
                  type="button"
                  disabled={pendingId === search.id}
                  onClick={() => void handleToggleAlerts(search)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    search.alerts_enabled
                      ? "bg-amber-950 text-white hover:bg-amber-900"
                      : "border border-amber-300 text-amber-950 hover:bg-amber-50"
                  }`}
                >
                  {search.alerts_enabled ? "Alerts on" : "Alerts off"}
                </button>
                <button
                  type="button"
                  disabled={pendingId === search.id}
                  onClick={() => void handleDelete(search.id)}
                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
