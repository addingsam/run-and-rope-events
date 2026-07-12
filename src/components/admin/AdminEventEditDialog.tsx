"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getEventForEditAction,
  updateAndApproveEventAction,
  updateEventAction,
} from "@/app/admin/actions";
import { CheckboxGroup, SelectInput, TextArea, TextInput } from "@/components/submit/FormField";
import {
  DISCIPLINE_OPTIONS,
  FORMAT_OPTIONS,
  RODEO_LEVEL_OPTIONS,
} from "@/lib/events/submission-options";
import { US_STATES } from "@/lib/us-states";
import type { EventRecord } from "@/types/event-record";
import type {
  EventSubmission,
  RodeoLevel,
  SubmissionDiscipline,
  SubmissionFormat,
} from "@/types/event-submission";

const adminInputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500/20";

interface AdminEventEditDialogProps {
  event: EventRecord;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminEventEditDialog({
  event,
  onClose,
  onSaved,
}: AdminEventEditDialogProps) {
  const [formData, setFormData] = useState<EventSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    void getEventForEditAction(event.id)
      .then((submission) => {
        if (!cancelled) {
          setFormData(submission);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load event.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [event.id]);

  function updateField<K extends keyof EventSubmission>(field: K, value: EventSubmission[K]) {
    setFormData((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleSave(approveAfterSave: boolean) {
    if (!formData) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        if (approveAfterSave) {
          await updateAndApproveEventAction(event.id, formData);
        } else {
          await updateEventAction(event.id, formData);
        }
        onSaved();
        onClose();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save event.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/50 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        className="my-8 w-full max-w-4xl rounded-2xl border border-stone-300 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Edit event</h2>
            <p className="mt-1 text-sm text-stone-600">
              Update submission details before approving.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone-500 hover:text-stone-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!formData ? (
          <p className="mt-8 text-sm text-stone-600">Loading event details…</p>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Event name"
                name="eventName"
                value={formData.eventName}
                onChange={(changeEvent) => updateField("eventName", changeEvent.target.value)}
                required
                className={adminInputClass}
              />
              <SelectInput
                label="Format"
                name="format"
                value={formData.format}
                onChange={(changeEvent) => {
                  const format = changeEvent.target.value as SubmissionFormat;
                  updateField("format", format);
                  if (format !== "rodeo") {
                    updateField("rodeoLevels", []);
                    updateField("additionalOfferings", []);
                  }
                }}
                options={FORMAT_OPTIONS}
                className={adminInputClass}
              />
              {formData.format === "rodeo" && (
                <CheckboxGroup
                  label="Rodeo level(s)"
                  options={RODEO_LEVEL_OPTIONS}
                  values={formData.rodeoLevels}
                  onChange={(values) =>
                    updateField("rodeoLevels", values as RodeoLevel[])
                  }
                  id="rodeoLevels"
                />
              )}
              <TextInput
                label="Start date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(changeEvent) => updateField("startDate", changeEvent.target.value)}
                required
                className={adminInputClass}
              />
              <TextInput
                label="End date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={(changeEvent) => updateField("endDate", changeEvent.target.value)}
                className={adminInputClass}
              />
            </div>

            <CheckboxGroup
              label="Disciplines"
              options={DISCIPLINE_OPTIONS}
              values={formData.disciplines}
              onChange={(disciplines) =>
                updateField("disciplines", disciplines as SubmissionDiscipline[])
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Venue"
                name="venueName"
                value={formData.venueName}
                onChange={(changeEvent) => updateField("venueName", changeEvent.target.value)}
                className={adminInputClass}
              />
              <TextInput
                label="Street address"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={(changeEvent) => updateField("streetAddress", changeEvent.target.value)}
                className={adminInputClass}
              />
              <TextInput
                label="City"
                name="city"
                value={formData.city}
                onChange={(changeEvent) => updateField("city", changeEvent.target.value)}
                className={adminInputClass}
              />
              <SelectInput
                label="State"
                name="state"
                value={formData.state}
                onChange={(changeEvent) => updateField("state", changeEvent.target.value)}
                options={US_STATES}
                className={adminInputClass}
              />
              <TextInput
                label="Zip code"
                name="zipCode"
                value={formData.zipCode}
                onChange={(changeEvent) => updateField("zipCode", changeEvent.target.value)}
                className={adminInputClass}
              />
              <TextInput
                label="Submitter email"
                name="submitterEmail"
                type="email"
                value={formData.submitterEmail}
                onChange={(changeEvent) => updateField("submitterEmail", changeEvent.target.value)}
                className={adminInputClass}
              />
            </div>

            <TextArea
              label="Description"
              name="description"
              value={formData.description}
              onChange={(changeEvent) => updateField("description", changeEvent.target.value)}
              rows={4}
              className={adminInputClass}
            />

            {formData.flyerUrl && (
              <div>
                <p className="mb-2 text-sm font-semibold text-stone-900">Flyer</p>
                <a
                  href={formData.flyerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sm text-stone-700 hover:text-stone-900"
                >
                  <img
                    src={formData.flyerUrl}
                    alt="Event flyer preview"
                    className="h-24 w-16 rounded border border-stone-200 object-cover"
                  />
                  View full flyer
                </a>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave(false)}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave(true)}
                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save & approve"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
