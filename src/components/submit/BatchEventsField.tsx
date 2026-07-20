"use client";

import { OptionalDateInput, SelectInput, TextArea, TextInput } from "@/components/submit/FormField";
import { formatEventDate } from "@/lib/events/format-date";
import {
  getSubmissionDuplicateStatusLabel,
  type ScheduleDuplicateWarning,
} from "@/lib/events/duplicate-detection";
import { US_STATES } from "@/lib/us-states";
import {
  themeHintClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { BatchEventEntry } from "@/types/event-submission";

interface BatchEventsFieldProps {
  events: BatchEventEntry[];
  errors: Record<string, string | undefined>;
  yearInferred: Array<{ startDate: boolean; endDate: boolean }>;
  duplicateWarnings?: ScheduleDuplicateWarning[];
  onChange: (events: BatchEventEntry[]) => void;
}

export function BatchEventsField({
  events,
  errors,
  yearInferred,
  duplicateWarnings = [],
  onChange,
}: BatchEventsFieldProps) {
  function updateEvent<K extends keyof BatchEventEntry>(
    index: number,
    field: K,
    value: BatchEventEntry[K],
  ) {
    const next = [...events];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function removeEvent(index: number) {
    onChange(events.filter((_, currentIndex) => currentIndex !== index));
  }

  function addEvent() {
    onChange([
      ...events,
      {
        startDate: "",
        endDate: "",
        entryDeadline: "",
        venueName: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        classDivisionInfo: "",
      },
    ]);
  }

  function warningsForIndex(index: number) {
    return duplicateWarnings.filter((warning) => warning.index === index);
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className={themeLabelClassName}>Multiple events on this flyer</p>
          <span className="inline-flex items-center rounded-full bg-[var(--color-accent-primary)]/20 px-2.5 py-0.5 text-xs font-bold text-[var(--color-text-primary)]">
            {events.length} listings
          </span>
        </div>
        <p className={`mt-1 ${themeHintClassName}`}>
          Your flyer is a schedule of distinct events. Each card below becomes its own listing.
          Review dates, locations, and classes for each stop, and remove any you do not want to
          submit.
        </p>
      </div>

      <ul className="space-y-5">
        {events.map((event, index) => {
          const inferred = yearInferred[index];
          const showYearWarning = inferred?.startDate || inferred?.endDate;
          const cardWarnings = warningsForIndex(index);

          return (
            <li
              key={`batch-event-${index}`}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Event {index + 1}
                </p>
                {events.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
                    className={themeSecondaryButtonClassName}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {showYearWarning ? (
                <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  Verify dates — the flyer may not have included a year for this event.
                </p>
              ) : null}

              {cardWarnings.length > 0 ? (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                  <p className="font-semibold">Possible duplicate at this location and date</p>
                  <ul className="mt-2 space-y-2">
                    {cardWarnings.flatMap((warning) =>
                      warning.matches.map((match) => (
                        <li key={`${warning.index}-${match.id}`}>
                          Existing: {match.eventName} · {formatEventDate(match.startDate)} ·{" "}
                          {match.location} ({getSubmissionDuplicateStatusLabel(match.status)})
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  name={`batchEvents.${index}.startDate`}
                  label="Start Date"
                  type="date"
                  value={event.startDate}
                  onChange={(changeEvent) =>
                    updateEvent(index, "startDate", changeEvent.target.value)
                  }
                  error={errors[`batchEvents.${index}.startDate`]}
                />
                <TextInput
                  name={`batchEvents.${index}.endDate`}
                  label="End Date"
                  type="date"
                  value={event.endDate}
                  onChange={(changeEvent) =>
                    updateEvent(index, "endDate", changeEvent.target.value)
                  }
                  error={errors[`batchEvents.${index}.endDate`]}
                  hint="Optional — for multi-day stops."
                />
              </div>

              <div className="mt-4">
                <OptionalDateInput
                  id={`batchEvents-${index}-entryDeadline`}
                  label="Entry Deadline"
                  value={event.entryDeadline}
                  onChange={(value) => updateEvent(index, "entryDeadline", value)}
                  error={errors[`batchEvents.${index}.entryDeadline`]}
                  hint="Optional — leave blank if there is no entry deadline."
                />
              </div>

              <div className="mt-4">
                <TextArea
                  name={`batchEvents.${index}.classDivisionInfo`}
                  label="Class or Division Info"
                  value={event.classDivisionInfo}
                  onChange={(changeEvent) =>
                    updateEvent(index, "classDivisionInfo", changeEvent.target.value)
                  }
                  hint="Optional — use when this stop has different classes or divisions."
                  className="min-h-24"
                />
              </div>

              {event.startDate ? (
                <p className={`mt-2 text-sm ${themeMutedTextClassName}`}>
                  {formatEventDate(event.startDate)}
                  {event.endDate && event.endDate !== event.startDate
                    ? ` – ${formatEventDate(event.endDate)}`
                    : ""}
                </p>
              ) : null}

              <div className="mt-4 space-y-4">
                <TextInput
                  name={`batchEvents.${index}.venueName`}
                  label="Venue Name"
                  required
                  value={event.venueName}
                  onChange={(changeEvent) =>
                    updateEvent(index, "venueName", changeEvent.target.value)
                  }
                  error={errors[`batchEvents.${index}.venueName`]}
                />
                <TextInput
                  name={`batchEvents.${index}.streetAddress`}
                  label="Street Address"
                  value={event.streetAddress}
                  onChange={(changeEvent) =>
                    updateEvent(index, "streetAddress", changeEvent.target.value)
                  }
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput
                    name={`batchEvents.${index}.city`}
                    label="City"
                    required
                    value={event.city}
                    onChange={(changeEvent) =>
                      updateEvent(index, "city", changeEvent.target.value)
                    }
                    error={errors[`batchEvents.${index}.city`]}
                  />
                  <SelectInput
                    name={`batchEvents.${index}.state`}
                    label="State"
                    required
                    value={event.state}
                    onChange={(changeEvent) =>
                      updateEvent(index, "state", changeEvent.target.value)
                    }
                    error={errors[`batchEvents.${index}.state`]}
                    placeholder="Select state"
                    options={US_STATES}
                  />
                  <TextInput
                    name={`batchEvents.${index}.zipCode`}
                    label="Zip Code"
                    inputMode="numeric"
                    value={event.zipCode}
                    onChange={(changeEvent) =>
                      updateEvent(index, "zipCode", changeEvent.target.value)
                    }
                    hint="Optional"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {errors.batchEvents ? <p className="text-sm text-red-400">{errors.batchEvents}</p> : null}

      <button type="button" onClick={addEvent} className={themeSecondaryButtonClassName}>
        Add another event
      </button>
    </div>
  );
}
