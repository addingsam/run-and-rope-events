import Link from "next/link";
import { EventCategorySummary } from "@/components/events/search/SearchBadges";
import { formatEventDate } from "@/lib/events/format-date";
import { getFormatLabel } from "@/lib/events/submission-options";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { EventSearchResultItem } from "@/types/event-search";
import type { SubmissionFormat } from "@/types/event-submission";

interface LockedEventCardProps {
  event: EventSearchResultItem;
}

export function LockedEventCard({ event }: LockedEventCardProps) {
  return (
    <article className={`overflow-hidden shadow-sm ${themePanelClassName}`}>
      <div className="relative h-52 w-full overflow-hidden bg-[var(--color-background)]">
        <div className="h-full w-full bg-gradient-to-br from-[var(--color-accent-primary)] via-[var(--color-accent-primary)]/80 to-[var(--color-background)] blur-sm" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)]/30 text-2xl text-[var(--color-text-primary)]">
            🔒
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Subscribe to unlock
          </p>
          <Link href="/subscribe" className={`mt-3 ${themePrimaryButtonClassName}`}>
            View plans
          </Link>
        </div>
      </div>

      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <h3 className="text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
          {event.title}
        </h3>
        <p className={`mt-1 ${themeMutedTextClassName}`}>{formatEventDate(event.eventDate)}</p>
      </div>

      <div className="p-5">
        <dl className={`space-y-1.5 ${themeMutedTextClassName}`}>
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="font-medium text-[var(--color-text-primary)]">
              {event.city}, {event.state}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {event.format && (
              <div>
                <dt className="sr-only">Format</dt>
                <dd>{getFormatLabel(event.format as SubmissionFormat)}</dd>
              </div>
            )}
          </div>
          <div>
            <dt className="sr-only">Categories</dt>
            <dd>
              <EventCategorySummary
                format={event.format}
                rodeoLevel={event.rodeoLevel}
                disciplines={event.disciplines}
              />
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
