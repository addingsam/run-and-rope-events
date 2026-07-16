"use client";

import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { uniqueSortedEventDates } from "@/lib/events/expand-batch-submissions";
import type { BatchEventEntry } from "@/types/event-submission";

interface BatchSubmissionSummaryProps {
  batchEventDates: string[];
  batchEvents: BatchEventEntry[];
  variant?: "banner" | "submit";
}

export function getBatchSubmissionCount(
  batchEventDates: string[],
  batchEvents: BatchEventEntry[],
) {
  if (batchEvents.length >= 2) {
    return batchEvents.length;
  }

  if (batchEventDates.length >= 2) {
    return uniqueSortedEventDates(
      batchEventDates.map((date) => date.trim()).filter(Boolean),
    ).length;
  }

  return 1;
}

function describeBatchListing(count: number) {
  return `${count} separate event listing${count === 1 ? "" : "s"}`;
}

export function BatchSubmissionSummary({
  batchEventDates,
  batchEvents,
  variant = "banner",
}: BatchSubmissionSummaryProps) {
  const isMultiEvent = batchEvents.length >= 2;
  const isSameVenue = !isMultiEvent && batchEventDates.length >= 2;

  if (!isMultiEvent && !isSameVenue) {
    return null;
  }

  const count = getBatchSubmissionCount(batchEventDates, batchEvents);
  const filledDates = isSameVenue
    ? uniqueSortedEventDates(batchEventDates.map((date) => date.trim()).filter(Boolean))
    : [];

  const containerClassName =
    variant === "submit"
      ? "rounded-2xl border-2 border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/15 px-5 py-4"
      : "rounded-2xl border-2 border-amber-400 bg-amber-50 px-5 py-4 text-amber-950";

  const titleClassName =
    variant === "submit"
      ? "text-base font-bold text-[var(--color-text-primary)]"
      : "text-base font-bold text-amber-950";

  const bodyClassName =
    variant === "submit"
      ? "mt-2 text-sm leading-6 text-[var(--color-text-primary)]"
      : "mt-2 text-sm leading-6 text-amber-900/90";

  const listClassName =
    variant === "submit"
      ? "mt-3 space-y-2 text-sm text-[var(--color-text-primary)]"
      : "mt-3 space-y-2 text-sm text-amber-950";

  return (
    <div className={containerClassName} role="status" aria-live="polite">
      <p className={titleClassName}>
        {isMultiEvent
          ? `This flyer covers ${count} distinct events`
          : `This flyer covers ${count} separate dates`}
      </p>
      <p className={bodyClassName}>
        {isMultiEvent
          ? `Submitting will create ${describeBatchListing(count)} — one per event stop below. Shared details (name, format, disciplines, contact, and flyer) apply to each listing.`
          : `Submitting will create ${describeBatchListing(count)} at the same venue — one listing per date below. Each date uses the same flyer and event details.`}
      </p>

      {variant === "submit" ? (
        <ul className={listClassName}>
          {isMultiEvent
            ? batchEvents.map((event, index) => (
                <li key={`batch-submit-event-${index}`} className="flex gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>
                    {event.startDate
                      ? formatEventDateRange(event.startDate, event.endDate)
                      : "Date not set"}
                    {event.city || event.state
                      ? ` · ${[event.venueName, event.city, event.state].filter(Boolean).join(", ")}`
                      : event.venueName
                        ? ` · ${event.venueName}`
                        : ""}
                  </span>
                </li>
              ))
            : filledDates.map((date, index) => (
                <li key={`batch-submit-date-${date}-${index}`} className="flex gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{formatEventDate(date)}</span>
                </li>
              ))}
        </ul>
      ) : isSameVenue && filledDates.length > 0 ? (
        <ul className={listClassName}>
          {filledDates.map((date, index) => (
            <li key={`batch-banner-date-${date}-${index}`}>
              <span className="font-semibold">Date {index + 1}:</span> {formatEventDate(date)}
            </li>
          ))}
        </ul>
      ) : null}

      {variant === "banner" ? (
        <p className="mt-3 text-sm font-semibold text-amber-950">
          Review every {isMultiEvent ? "event stop" : "date"} in the Dates section before you submit.
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
          Confirm this is correct — you are about to submit {describeBatchListing(count)}.
        </p>
      )}
    </div>
  );
}
