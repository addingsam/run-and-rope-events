"use client";

import { useState } from "react";
import { createSavedSearch } from "@/lib/saved/client";
import {
  themeCheckboxInputClassName,
  themeCheckboxRowClassName,
  themeInputClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-search-title"
        className={`w-full max-w-md p-6 shadow-xl ${themePanelClassName}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="save-search-title"
              className="text-xl font-semibold text-[var(--color-text-primary)]"
            >
              Save your filters
            </h2>
            <p className={`mt-1 ${themeMutedTextClassName}`}>
              We&apos;ll email you a confirmation with your saved criteria. Optionally choose daily
              or weekly updates when new approved events match.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={(submitEvent) => void handleSubmit(submitEvent)} className="mt-5 space-y-4">
          <div>
            <label htmlFor="saved-search-name" className={themeLabelClassName}>
              Saved filter name
            </label>
            <input
              id="saved-search-name"
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              placeholder="e.g. Texas jackpots this summer"
              required
              className={themeInputClassName}
            />
          </div>

          <fieldset>
            <legend className={`mb-2 ${themeLabelClassName}`}>Update emails</legend>
            <div className="space-y-2">
              {ALERT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`${themeCheckboxRowClassName} px-3 py-3 text-sm`}
                >
                  <input
                    type="radio"
                    name="alertFrequency"
                    value={option.value}
                    checked={alertFrequency === option.value}
                    onChange={() => setAlertFrequency(option.value)}
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

          {error && (
            <p className="rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              Search saved. Check your inbox for a confirmation email.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className={themeSecondaryButtonClassName}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className={`${themePrimaryButtonClassName} disabled:opacity-60`}
            >
              {pending ? "Saving…" : "Save search"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
