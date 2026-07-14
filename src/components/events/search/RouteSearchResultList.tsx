import Link from "next/link";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { getFormatLabel } from "@/lib/events/submission-options";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { EventSearchResultItem, ProRodeoSearchResultItem } from "@/types/event-search";
import type { SubmissionFormat } from "@/types/event-submission";
import { EventCategorySummary } from "@/components/events/search/SearchBadges";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";

function formatMilesAlongRoute(distanceMiles: number) {
  return `${distanceMiles.toFixed(1)} mi along route`;
}

interface RouteEventListItemProps {
  event: EventSearchResultItem;
  isSubscriber: boolean;
}

export function RouteEventListItem({ event, isSubscriber }: RouteEventListItemProps) {
  if (!isSubscriber) {
    return (
      <article className={`p-4 shadow-sm ${themePanelClassName}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-primary)]">
              {formatMilesAlongRoute(event.distanceMiles)}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
              {event.city}, {event.state}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-primary)]/20 text-lg">
              🔒
            </div>
            <Link
              href="/subscribe"
              className="mt-2 block text-xs font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative p-4 shadow-sm transition-shadow hover:shadow-md ${themePanelClassName}`}
    >
      <div className="absolute right-3 top-3 z-10">
        <EventBookmarkButton eventId={event.id} eventTitle={event.title} size="sm" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-primary)]">
            {formatMilesAlongRoute(event.distanceMiles)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{event.title}</h3>
          </div>
          <dl className={`mt-2 space-y-1 ${themeMutedTextClassName}`}>
            <div>
              <dt className="sr-only">Location</dt>
              <dd>
                {event.city}, {event.state}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Date</dt>
              <dd>{formatEventDate(event.eventDate)}</dd>
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
        <Link href={`/events/${event.id}`} className={`shrink-0 ${themeSecondaryButtonClassName}`}>
          View details
        </Link>
      </div>
    </article>
  );
}

interface RouteProRodeoListItemProps {
  proRodeo: ProRodeoSearchResultItem;
}

export function RouteProRodeoListItem({ proRodeo }: RouteProRodeoListItemProps) {
  return (
    <a
      href={proRodeo.externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 shadow-sm transition-shadow hover:border-[var(--color-accent-primary)]/40 hover:shadow-md ${themePanelClassName}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {formatMilesAlongRoute(proRodeo.distanceMiles)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {proRodeo.rodeoName}
            </h3>
            <span className="rounded-full bg-[var(--color-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {proRodeo.sanctioningBody}
            </span>
          </div>
          <p className={`mt-2 ${themeMutedTextClassName}`}>
            {proRodeo.city}, {proRodeo.state} ·{" "}
            {formatEventDateRange(proRodeo.startDate, proRodeo.endDate)}
          </p>
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          View on {proRodeo.sanctioningBody} →
        </span>
      </div>
    </a>
  );
}
