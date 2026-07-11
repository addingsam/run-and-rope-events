"use client";

import { useState } from "react";
import { createSavedSearch } from "@/lib/saved/client";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";

interface SaveSearchDialogProps {
  open: boolean;
  searchParams: SavedSearchParams;
  mapOverlay: SavedMapOverlay | null;
  onClose: () => void;
  onSaved?: () => void;
}

const ALERT_OPTIONS: { value: SavedSearchAlertFrequency; label: string; description: string }[] = [
  {
    value: "off",
    label: "No update emails",
    description: "Save only — you'll still get a confirmation email with your criteria.",
  },
  {
    value: "daily",
    label: "Daily digest",
    description: "Email once a day when new approved events match this filter.",
  },
  {
    value: "weekly",
    label: "Weekly digest",
    description: "Email once a week when new approved events match this filter.",
  },
];

export function SaveSearchDialog({
  open,
  searchParams,
  mapOverlay,
  onClose,
  onSaved,
}: SaveSearchDialogProps) {
  const [name, setName] = useState("");
  const [alertFrequency, setAlertFrequency] = useState<SavedSearchAlertFrequency>("off");
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
        alertFrequency,
      });
      setSuccess(true);
      onSaved?.();
      window.setTimeout(() => {
        setName("");
        setAlertFrequency("off");
        setSuccess(false);
        onClose();
      }, 1400);
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
              We&apos;ll email you a confirmation with your saved criteria. Optionally choose daily
              or weekly updates when new approved events match.
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

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-amber-950">Update emails</legend>
            <div className="space-y-2">
              {ALERT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-[#fffaf3] px-3 py-3 text-sm text-amber-900/80"
                >
                  <input
                    type="radio"
                    name="alertFrequency"
                    value={option.value}
                    checked={alertFrequency === option.value}
                    onChange={() => setAlertFrequency(option.value)}
                    className="mt-1 h-4 w-4 border-amber-300 text-amber-700 focus:ring-amber-500"
                  />
                  <span>
                    <span className="font-semibold text-amber-950">{option.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-amber-800/75">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Search saved. Check your inbox for a confirmation email.
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
