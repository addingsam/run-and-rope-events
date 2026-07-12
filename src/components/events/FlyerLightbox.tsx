"use client";

import { useEffect } from "react";
import { formatFlyerAddress } from "@/lib/events/flyer-lightbox";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { formatRodeoLevelList, parseStoredRodeoLevels } from "@/lib/events/rodeo-levels";
import {
  getDisciplineLabelFromSlug,
  getFormatLabel,
} from "@/lib/events/submission-options";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { FlyerLightboxEvent } from "@/types/flyer-lightbox";
import type { SubmissionFormat } from "@/types/event-submission";

interface FlyerLightboxProps {
  event: FlyerLightboxEvent;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</dt>
      <dd
        className={`mt-1 text-sm text-[var(--color-text-primary)] ${multiline ? "whitespace-pre-line" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function isImageFlyer(flyerUrl: string | null | undefined) {
  if (!flyerUrl) {
    return false;
  }

  const lower = flyerUrl.toLowerCase();
  return !lower.endsWith(".pdf");
}

export function FlyerLightbox({ event, onClose }: FlyerLightboxProps) {
  useEffect(() => {
    function handleKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const address = formatFlyerAddress(event);
  const showFlyerPreview = isImageFlyer(event.flyerUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Event details for ${event.title}`}
      onClick={onClose}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl ${themePanelClassName}`}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="overflow-y-auto">
          {showFlyerPreview && event.flyerUrl && (
            <div className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.flyerUrl}
                alt={`${event.title} flyer`}
                className="max-h-72 w-full object-contain sm:max-h-80"
              />
            </div>
          )}

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {event.format && (
                <span className="rounded-full bg-[var(--color-accent-primary)]/20 px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]">
                  {getFormatLabel(event.format as SubmissionFormat)}
                </span>
              )}
              {event.disciplines.map((discipline) => (
                <span
                  key={discipline}
                  className="rounded-full bg-[var(--color-accent-primary)]/20 px-3 py-1 text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  {getDisciplineLabelFromSlug(discipline)}
                </span>
              ))}
              {event.format === "rodeo" && event.rodeoLevel && (
                <span className="rounded-full bg-[var(--color-background)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
                  {formatRodeoLevelList(parseStoredRodeoLevels(event.rodeoLevel))}
                </span>
              )}
            </div>

            <h2 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">{event.title}</h2>

            <hr className="my-5 border-[var(--color-border)]" />

            <dl className="space-y-4">
              <DetailRow
                label="Date"
                value={
                  event.endDate
                    ? formatEventDateRange(event.startDate, event.endDate)
                    : formatEventDate(event.startDate)
                }
              />
              <DetailRow label="Venue" value={event.venue} />
              {address && <DetailRow label="Address" value={address} multiline />}
              {event.prizePayoutInfo && (
                <DetailRow label="Prize & payout info" value={event.prizePayoutInfo} multiline />
              )}
              {event.classDivisionInfo && (
                <DetailRow
                  label="Class & division info"
                  value={event.classDivisionInfo}
                  multiline
                />
              )}
              {event.entryFee && (
                <DetailRow label="Entry fee" value={event.entryFee} multiline />
              )}
              {event.entryDeadline && (
                <DetailRow label="Entry deadline" value={formatEventDate(event.entryDeadline)} />
              )}
              {event.producerName && (
                <DetailRow label="Producer" value={event.producerName} />
              )}
              {(event.contactEmail || event.contactPhone || event.websiteUrl) && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Contact
                  </dt>
                  <dd className="mt-1 space-y-1 text-sm text-[var(--color-text-primary)]">
                    {event.contactEmail && (
                      <p>
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                        >
                          {event.contactEmail}
                        </a>
                      </p>
                    )}
                    {event.contactPhone && <p>{event.contactPhone}</p>}
                    {event.websiteUrl && (
                      <p>
                        <a
                          href={event.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
                        >
                          {event.websiteUrl}
                        </a>
                      </p>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:justify-end">
          {event.flyerUrl && (
            <a
              href={event.flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-center ${themePrimaryButtonClassName} px-5 py-2.5`}
            >
              Download flyer
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 ${themeSecondaryButtonClassName}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
