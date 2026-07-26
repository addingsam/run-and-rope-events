"use client";

import Link from "next/link";
import { formatEventDate } from "@/lib/events/format-date";
import {
  getSubmissionDuplicateStatusLabel,
  type ScheduleDuplicateWarning,
  type SubmissionDuplicateMatch,
  type SubmissionDuplicateWarning,
} from "@/lib/events/duplicate-detection";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";

interface DuplicateSubmissionPromptProps {
  open: boolean;
  nameWarnings: SubmissionDuplicateWarning[];
  locationWarnings: ScheduleDuplicateWarning[];
  pending?: boolean;
  onSubmitAnyway: () => void;
  onNevermind: () => void;
}

interface DuplicatePreviewItem extends SubmissionDuplicateMatch {
  reasons: string[];
}

function collectDuplicatePreviewItems(
  nameWarnings: SubmissionDuplicateWarning[],
  locationWarnings: ScheduleDuplicateWarning[],
): DuplicatePreviewItem[] {
  const byId = new Map<string, DuplicatePreviewItem>();

  for (const warning of nameWarnings) {
    for (const match of warning.matches) {
      const existing = byId.get(match.id);
      const reasons = existing?.reasons ?? [];
      if (!reasons.includes("Same event name, format, and date")) {
        reasons.push("Same event name, format, and date");
      }
      byId.set(match.id, { ...match, reasons });
    }
  }

  for (const warning of locationWarnings) {
    for (const match of warning.matches) {
      const existing = byId.get(match.id);
      const reasons = existing?.reasons ?? [];
      if (!reasons.includes("Same venue, city, state, and date")) {
        reasons.push("Same venue, city, state, and date");
      }
      byId.set(match.id, { ...match, reasons });
    }
  }

  return Array.from(byId.values());
}

export function DuplicateSubmissionPrompt({
  open,
  nameWarnings,
  locationWarnings,
  pending = false,
  onSubmitAnyway,
  onNevermind,
}: DuplicateSubmissionPromptProps) {
  if (!open) {
    return null;
  }

  const previewItems = collectDuplicatePreviewItems(nameWarnings, locationWarnings);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className={`${themePanelClassName} w-full max-w-xl p-6 shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-submission-title"
      >
        <h2
          id="duplicate-submission-title"
          className="text-xl font-semibold text-[var(--color-text-primary)]"
        >
          Possible duplicate
        </h2>
        <p className={`mt-2 text-sm leading-6 ${themeMutedTextClassName}`}>
          This submission looks similar to an event already in our directory. Review the existing
          listing below, then choose whether to continue.
        </p>

        <ul className="mt-5 space-y-3">
          {previewItems.map((match) => (
            <li
              key={match.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">
                    {match.eventName}
                  </p>
                  <p className={`mt-1 text-sm ${themeMutedTextClassName}`}>
                    {formatEventDate(match.startDate)} · {match.location}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-primary)]">
                    {getSubmissionDuplicateStatusLabel(match.status)}
                  </p>
                  <ul className={`mt-2 space-y-1 text-xs ${themeMutedTextClassName}`}>
                    {match.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                {(match.status === "approved" || match.status === "published") && (
                  <Link
                    href={`/events/${match.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`shrink-0 text-center text-sm ${themeSecondaryButtonClassName}`}
                  >
                    View listing
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onNevermind}
            disabled={pending}
            className={`${themeSecondaryButtonClassName} disabled:opacity-60`}
          >
            Nevermind
          </button>
          <button
            type="button"
            onClick={onSubmitAnyway}
            disabled={pending}
            className={`${themePrimaryButtonClassName} disabled:opacity-60`}
          >
            {pending ? "Submitting..." : "Submit anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
