"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createProRodeoAction,
  getProRodeoForEditAction,
  updateProRodeoAction,
} from "@/app/admin/pro-rodeo-actions";
import { SelectInput, TextInput } from "@/components/submit/FormField";
import { US_STATES } from "@/lib/us-states";
import {
  EMPTY_PRO_RODEO_FORM,
  type ProRodeoInput,
  type SanctioningBody,
} from "@/types/pro-rodeo-form";

const SANCTIONING_BODY_OPTIONS = [
  { value: "WPRA", label: "WPRA" },
  { value: "PRCA", label: "PRCA" },
] as const;

const adminInputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500/20";

interface AdminProRodeoFormDialogProps {
  proRodeoId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminProRodeoFormDialog({
  proRodeoId,
  onClose,
  onSaved,
}: AdminProRodeoFormDialogProps) {
  const isEditing = Boolean(proRodeoId);
  const [formData, setFormData] = useState<ProRodeoInput>(EMPTY_PRO_RODEO_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!proRodeoId) {
      return;
    }

    let cancelled = false;

    void getProRodeoForEditAction(proRodeoId)
      .then((input) => {
        if (!cancelled) {
          setFormData(input);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load pro rodeo.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [proRodeoId]);

  function updateField<K extends keyof ProRodeoInput>(field: K, value: ProRodeoInput[K]) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        if (isEditing && proRodeoId) {
          await updateProRodeoAction(proRodeoId, formData);
        } else {
          await createProRodeoAction(formData);
        }
        onSaved();
        onClose();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save pro rodeo.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/50 p-4 sm:p-8">
      <div
        role="dialog"
        aria-modal="true"
        className="my-8 w-full max-w-lg rounded-2xl border border-stone-300 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              {isEditing ? "Edit pro rodeo" : "Add pro rodeo"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              City and state are geocoded automatically on save.
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <TextInput
            label="Rodeo name"
            name="rodeoName"
            required
            value={formData.rodeoName}
            onChange={(changeEvent) => updateField("rodeoName", changeEvent.target.value)}
            className={adminInputClass}
          />
          <SelectInput
            label="Sanctioning body"
            name="sanctioningBody"
            required
            value={formData.sanctioningBody}
            onChange={(changeEvent) =>
              updateField("sanctioningBody", changeEvent.target.value as SanctioningBody)
            }
            options={SANCTIONING_BODY_OPTIONS}
            className={adminInputClass}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="City"
              name="city"
              required
              value={formData.city}
              onChange={(changeEvent) => updateField("city", changeEvent.target.value)}
              className={adminInputClass}
            />
            <SelectInput
              label="State"
              name="state"
              required
              value={formData.state}
              onChange={(changeEvent) => updateField("state", changeEvent.target.value)}
              options={US_STATES}
              className={adminInputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Start date"
              name="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={(changeEvent) => updateField("startDate", changeEvent.target.value)}
              className={adminInputClass}
            />
            <TextInput
              label="End date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={(changeEvent) => updateField("endDate", changeEvent.target.value)}
              hint="Optional for multi-day rodeos."
              className={adminInputClass}
            />
          </div>
          <TextInput
            label="External link"
            name="externalLink"
            type="url"
            required
            value={formData.externalLink}
            onChange={(changeEvent) => updateField("externalLink", changeEvent.target.value)}
            placeholder="https://www.prorodeo.com/..."
            className={adminInputClass}
          />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {isPending ? "Saving…" : isEditing ? "Save changes" : "Add pro rodeo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
