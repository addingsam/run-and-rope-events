"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteSavedSearch, updateSavedSearchAlertFrequency } from "@/lib/saved/client";
import { SAVED_SEARCH_ALERT_OPTIONS } from "@/lib/saved-searches/alert-frequency-options";
import {
  formatSavedSearchCriteriaLines,
  getAlertFrequencyLabel,
} from "@/lib/saved-searches/format-saved-search-criteria";
import { isUpcomingSavedSearch, storePendingSavedSearch } from "@/lib/saved-searches/run-saved-search";
import type { SavedSearchPreviewItem } from "@/lib/saved-searches/saved-search-preview";
import {
  themeCheckboxInputClassName,
  themeCheckboxRowClassName,
  themeMutedTextClassName,
  themePanelClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { SavedSearchAlertFrequency, SavedSearchRecord } from "@/types/saved-search";

export interface SavedSearchDashboardItem {
  search: SavedSearchRecord;
  preview: SavedSearchPreviewItem[];
  matchCount: number;
}

interface SavedSearchesPanelProps {
  initialItems: SavedSearchDashboardItem[];
}

function getSavedSearchTypeLabel(search: SavedSearchRecord) {
  if (isUpcomingSavedSearch(search.search_params)) {
    return "Upcoming filters";
  }

  if (search.search_params.mode === "map") {
    return "Map area";
  }

  return search.search_params.mode === "route" ? "Route search" : "Radius search";
}

function normalizeAlertFrequency(search: SavedSearchRecord): SavedSearchAlertFrequency {
  if (search.alert_frequency) {
    return search.alert_frequency;
  }

  return search.alerts_enabled ? "daily" : "off";
}

export function SavedSearchesPanel({ initialItems }: SavedSearchesPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleFrequencyChange(
    search: SavedSearchRecord,
    nextValue: SavedSearchAlertFrequency,
  ) {
    setError(null);
    setPendingId(search.id);
    try {
      await updateSavedSearchAlertFrequency(search.id, nextValue);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.search.id === search.id
            ? {
                ...item,
                search: {
                  ...item.search,
                  alert_frequency: nextValue,
                  alerts_enabled: nextValue !== "off",
                },
              }
            : item,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Failed to update alert settings.",
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
      setItems((current) => current.filter((item) => item.search.id !== searchId));
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete search.");
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className={`px-6 py-8 text-sm ${themeMutedTextClassName} ${themePanelClassName}`}>
        No saved searches yet. Set your filters on the events page and choose Save &amp; get alerts.
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

      {items.map(({ search, preview, matchCount }) => {
        const typeLabel = getSavedSearchTypeLabel(search);
        const alertFrequency = normalizeAlertFrequency(search);
        const criteria = formatSavedSearchCriteriaLines(search.search_params, search.map_overlay);
        const remainingPreviewCount = Math.max(matchCount - preview.length, 0);

        return (
          <article key={search.id} className={`space-y-5 p-5 sm:p-6 ${themePanelClassName}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {search.name}
                </h3>
                <p className={`mt-1 text-sm ${themeMutedTextClassName}`}>
                  {typeLabel} · saved {new Date(search.updated_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                  {matchCount} matching event{matchCount === 1 ? "" : "s"} right now
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    storePendingSavedSearch(search.search_params, search.map_overlay);
                    router.push("/events");
                  }}
                  className={themeSecondaryButtonClassName}
                >
                  Run search
                </button>
                <button
                  type="button"
                  disabled={pendingId === search.id}
                  onClick={() => void handleDelete(search.id)}
                  className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/30 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Filters</p>
              <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${themeMutedTextClassName}`}>
                {criteria.map((line) => (
                  <li key={`${search.id}-${line}`}>{line}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Current matches
              </p>
              {preview.length > 0 ? (
                <ul className={`mt-2 space-y-2 text-sm ${themeMutedTextClassName}`}>
                  {preview.map((item) => (
                    <li key={`${search.id}-${item.title}-${item.dateLabel}`}>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {item.title}
                      </span>
                      <span>
                        {" "}
                        · {item.dateLabel}
                        {item.locationLabel ? ` · ${item.locationLabel}` : ""}
                      </span>
                    </li>
                  ))}
                  {remainingPreviewCount > 0 ? (
                    <li>…and {remainingPreviewCount} more</li>
                  ) : null}
                </ul>
              ) : (
                <p className={`mt-2 text-sm ${themeMutedTextClassName}`}>
                  No approved events match these filters right now.
                </p>
              )}
            </div>

            <fieldset disabled={pendingId === search.id}>
              <legend className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                Update emails: {getAlertFrequencyLabel(alertFrequency)}
              </legend>
              <div className="space-y-2">
                {SAVED_SEARCH_ALERT_OPTIONS.map((option) => (
                  <label
                    key={`${search.id}-${option.value}`}
                    className={`${themeCheckboxRowClassName} px-3 py-3 text-sm`}
                  >
                    <input
                      type="radio"
                      name={`alertFrequency-${search.id}`}
                      value={option.value}
                      checked={alertFrequency === option.value}
                      onChange={() => void handleFrequencyChange(search, option.value)}
                      className={themeCheckboxInputClassName}
                    />
                    <span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-muted)]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </article>
        );
      })}
    </div>
  );
}
