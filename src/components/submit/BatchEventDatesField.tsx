"use client";

import { formatEventDate } from "@/lib/events/format-date";
import { uniqueSortedEventDates } from "@/lib/events/expand-batch-submissions";
import { sanitizeHtmlDateInputValue } from "@/lib/flyer/normalize-flyer-date";
import {
  themeHintClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";

interface BatchEventDatesFieldProps {
  dates: string[];
  errors: Record<string, string | undefined>;
  onChange: (dates: string[]) => void;
  onMergeToSingle?: () => void;
}

export function BatchEventDatesField({
  dates,
  errors,
  onChange,
  onMergeToSingle,
}: BatchEventDatesFieldProps) {
  const filledDateCount = uniqueSortedEventDates(
    dates.map((date) => date.trim()).filter(Boolean),
  ).length;

  function updateDate(index: number, value: string) {
    const next = [...dates];
    next[index] = sanitizeHtmlDateInputValue(value);
    onChange(next);
  }

  function removeDate(index: number) {
    onChange(dates.filter((_, currentIndex) => currentIndex !== index));
  }

  function addDate() {
    onChange([...dates, ""]);
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/10 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className={themeLabelClassName}>Multiple event dates</p>
          {filledDateCount >= 2 ? (
            <span className="inline-flex items-center rounded-full bg-[var(--color-accent-primary)]/20 px-2.5 py-0.5 text-xs font-bold text-[var(--color-text-primary)]">
              {filledDateCount} listings
            </span>
          ) : null}
        </div>
        <p className={`mt-1 ${themeHintClassName}`}>
          Your flyer lists more than one event day. Each date below becomes its own directory
          listing with the same flyer, venue, and shared event details.
        </p>
      </div>

      <ul className="space-y-3">
        {dates.map((date, index) => (
          <li key={`batch-date-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor={`eventDates-${index}`} className="mb-2 block text-sm font-semibold text-[var(--color-text-primary)]">
                Event date {index + 1}
              </label>
              <input
                id={`eventDates-${index}`}
                type="date"
                value={sanitizeHtmlDateInputValue(date)}
                onChange={(event) => updateDate(index, event.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
              />
              {errors[`eventDates.${index}`] ? (
                <p className="mt-2 text-sm text-red-400">{errors[`eventDates.${index}`]}</p>
              ) : date ? (
                <p className={`mt-2 text-sm ${themeMutedTextClassName}`}>{formatEventDate(date)}</p>
              ) : null}
            </div>
            {dates.length > 2 ? (
              <button
                type="button"
                onClick={() => removeDate(index)}
                className={`sm:mb-0.5 ${themeSecondaryButtonClassName}`}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {errors.eventDates ? <p className="text-sm text-red-400">{errors.eventDates}</p> : null}

      {onMergeToSingle ? (
        <button type="button" onClick={onMergeToSingle} className={themeSecondaryButtonClassName}>
          This is one event — use a single date
        </button>
      ) : null}

      <button type="button" onClick={addDate} className={themeSecondaryButtonClassName}>
        Add another date
      </button>
    </div>
  );
}
