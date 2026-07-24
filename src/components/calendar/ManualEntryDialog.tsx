"use client";

import { useEffect, useState } from "react";
import {
  themeHintClassName,
  themeInputClassName,
  themeLabelClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { CalendarEntryInput } from "@/types/calendar-entry";

interface ManualEntryDialogProps {
  open: boolean;
  initialValues?: CalendarEntryInput & { id?: string };
  onClose: () => void;
  onSave: (input: CalendarEntryInput) => Promise<void>;
}

const emptyValues: CalendarEntryInput = {
  title: "",
  entry_date: "",
  entry_time: "",
  note: "",
};

export function ManualEntryDialog({
  open,
  initialValues,
  onClose,
  onSave,
}: ManualEntryDialogProps) {
  const [values, setValues] = useState<CalendarEntryInput>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? emptyValues);
      setError(null);
    }
  }, [open, initialValues]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSave(values);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save entry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className={`${themePanelClassName} w-full max-w-lg p-6 shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-entry-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="manual-entry-title" className="text-xl font-semibold text-[var(--color-text-primary)]">
              {initialValues?.id ? "Edit calendar entry" : "Add calendar entry"}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Add a personal note, reminder, or off-site event to your calendar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-background)]"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label htmlFor="entry-title" className={themeLabelClassName}>
              Title
            </label>
            <input
              id="entry-title"
              required
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
              className={`${themeInputClassName} mt-2`}
              placeholder="Team practice, vet appointment, etc."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="entry-date" className={themeLabelClassName}>
                Date
              </label>
              <input
                id="entry-date"
                type="date"
                required
                value={values.entry_date}
                onChange={(event) =>
                  setValues((current) => ({ ...current, entry_date: event.target.value }))
                }
                className={`${themeInputClassName} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="entry-time" className={themeLabelClassName}>
                Time <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
              </label>
              <input
                id="entry-time"
                type="time"
                value={values.entry_time ?? ""}
                onChange={(event) =>
                  setValues((current) => ({ ...current, entry_time: event.target.value }))
                }
                className={`${themeInputClassName} mt-2`}
              />
              <p className={themeHintClassName}>Leave blank for all-day entries.</p>
            </div>
          </div>

          <div>
            <label htmlFor="entry-note" className={themeLabelClassName}>
              Note <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
            </label>
            <textarea
              id="entry-note"
              rows={3}
              value={values.note ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
              className={`${themeInputClassName} mt-2 resize-y`}
              placeholder="Add details, links, or reminders."
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className={themeSecondaryButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={themePrimaryButtonClassName}>
              {pending ? "Saving..." : initialValues?.id ? "Save changes" : "Add entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
