"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteSavedSearch,
  updateSavedSearchAlertFrequency,
} from "@/lib/saved/client";
import { getAlertFrequencyLabel } from "@/lib/saved-searches/format-saved-search-criteria";
import {
  isUpcomingSavedSearch,
  storePendingSavedSearch,
} from "@/lib/saved-searches/run-saved-search";
import type { SavedSearchAlertFrequency, SavedSearchRecord } from "@/types/saved-search";

interface SavedSearchesPanelProps {
  initialSearches: SavedSearchRecord[];
}

const FREQUENCY_CYCLE: SavedSearchAlertFrequency[] = ["off", "daily", "weekly"];

function getSavedSearchTypeLabel(search: SavedSearchRecord) {
  if (isUpcomingSavedSearch(search.search_params)) {
    return "Upcoming filters";
  }

  return search.search_params.mode === "route" ? "Route search" : "Radius search";
}

function normalizeAlertFrequency(search: SavedSearchRecord): SavedSearchAlertFrequency {
  if (search.alert_frequency) {
    return search.alert_frequency;
  }

  return search.alerts_enabled ? "daily" : "off";
}

function nextAlertFrequency(current: SavedSearchAlertFrequency): SavedSearchAlertFrequency {
  const index = FREQUENCY_CYCLE.indexOf(current);
  return FREQUENCY_CYCLE[(index + 1) % FREQUENCY_CYCLE.length];
}

export function SavedSearchesPanel({ initialSearches }: SavedSearchesPanelProps) {
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCycleAlerts(search: SavedSearchRecord) {
    setError(null);
    setPendingId(search.id);
    try {
      const current = normalizeAlertFrequency(search);
      const nextValue = nextAlertFrequency(current);
      await updateSavedSearchAlertFrequency(search.id, nextValue);
      setSearches((currentSearches) =>
        currentSearches.map((item) =>
          item.id === search.id
            ? {
                ...item,
                alert_frequency: nextValue,
                alerts_enabled: nextValue !== "off",
              }
            : item,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Failed to update alert settings.",
      );
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
        No saved searches yet. Set your filters on the events page and use Save &amp; get alerts.
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
        const typeLabel = getSavedSearchTypeLabel(search);
        const alertFrequency = normalizeAlertFrequency(search);

        return (
          <article
            key={search.id}
            className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-amber-950">{search.name}</h3>
                <p className="mt-1 text-sm text-amber-900/70">
                  {typeLabel} · saved {new Date(search.updated_at).toLocaleDateString()}
                </p>
                <p className="mt-1 text-xs font-medium text-amber-800">
                  Updates: {getAlertFrequencyLabel(alertFrequency)}
                </p>
                {search.map_overlay &&
                  (search.map_overlay.pinRadius || search.map_overlay.shapes.length > 0) && (
                    <p className="mt-1 text-xs text-amber-800/70">Includes map drawings</p>
                  )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    storePendingSavedSearch(search.search_params, search.map_overlay);
                    router.push("/events");
                  }}
                  className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                >
                  Apply filters
                </button>
                <button
                  type="button"
                  disabled={pendingId === search.id}
                  onClick={() => void handleCycleAlerts(search)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                    alertFrequency !== "off"
                      ? "bg-amber-950 text-white hover:bg-amber-900"
                      : "border border-amber-300 text-amber-950 hover:bg-amber-50"
                  }`}
                  title="Cycle: off → daily → weekly"
                >
                  {getAlertFrequencyLabel(alertFrequency)}
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
