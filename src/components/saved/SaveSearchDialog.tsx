"use client";

import { useState } from "react";
import { createSavedSearch } from "@/lib/saved/client";
import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";

interface SaveSearchDialogProps {
  open: boolean;
  searchParams: SavedSearchParams;
  mapOverlay: SavedMapOverlay | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveSearchDialog({
  open,
  searchParams,
  mapOverlay,
  onClose,
  onSaved,
}: SaveSearchDialogProps) {
  const [name, setName] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await createSavedSearch({
        name: name.trim(),
        searchParams,
        mapOverlay,
        alertsEnabled,
      });
      setSuccess(true);
      onSaved?.();
      window.setTimeout(() => {
        setName("");
        setAlertsEnabled(false);
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save search.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-search-title"
        className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="save-search-title" className="text-xl font-semibold text-amber-950">
              Save your filters
            </h2>
            <p className="mt-1 text-sm text-amber-900/70">
              Store your event parameters and optional map drawings. Turn on alerts to get emailed
              when new approved events match.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-amber-700 hover:text-amber-950"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(submitEvent) => void handleSubmit(submitEvent)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="saved-search-name" className="mb-2 block text-sm font-semibold text-amber-950">
              Saved filter name
            </label>
            <input
              id="saved-search-name"
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              placeholder="e.g. Texas jackpots this summer"
              required
              className="w-full rounded-xl border border-amber-200 bg-[#fffaf3] px-4 py-3 text-base text-amber-950 placeholder:text-amber-900/40 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-amber-900/80">
            <input
              type="checkbox"
              checked={alertsEnabled}
              onChange={(changeEvent) => setAlertsEnabled(changeEvent.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500"
            />
            <span>
              Email me when new approved events are added that match these parameters.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Search saved. Manage alerts from your dashboard.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save search"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
