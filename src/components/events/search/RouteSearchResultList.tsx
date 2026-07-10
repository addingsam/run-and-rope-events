import Link from "next/link";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { getFormatLabel, getRodeoLevelLabel } from "@/lib/events/submission-options";
import type { EventSearchResultItem, ProRodeoSearchResultItem } from "@/types/event-search";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";
import { DisciplineSummary } from "@/components/events/search/SearchBadges";
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
      <article className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              {formatMilesAlongRoute(event.distanceMiles)}
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-amber-950/70 blur-[2px]">
              {event.title}
            </h3>
            <p className="mt-2 text-sm text-amber-900/70">
              {event.city}, {event.state} · {formatEventDate(event.eventDate)}
            </p>
          </div>
          <div className="shrink-0 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">
              🔒
            </div>
            <Link
              href="/subscribe"
              className="mt-2 block text-xs font-semibold text-amber-800 hover:text-amber-950"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative rounded-2xl border border-amber-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <EventBookmarkButton eventId={event.id} eventTitle={event.title} size="sm" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {formatMilesAlongRoute(event.distanceMiles)}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-amber-950">{event.title}</h3>
          <dl className="mt-2 space-y-1 text-sm text-amber-900/80">
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
              {event.format === "rodeo" && event.rodeoLevel && (
                <div>
                  <dt className="sr-only">Rodeo level</dt>
                  <dd>{getRodeoLevelLabel(event.rodeoLevel as RodeoLevel)}</dd>
                </div>
              )}
            </div>
            <div>
              <dt className="sr-only">Disciplines</dt>
              <dd>
                <DisciplineSummary disciplines={event.disciplines} />
              </dd>
            </div>
          </dl>
        </div>
        <Link
          href={`/events/${event.id}`}
          className="shrink-0 rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
        >
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
      className="block rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-sm transition-shadow hover:border-stone-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
            {formatMilesAlongRoute(proRodeo.distanceMiles)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-stone-900">{proRodeo.rodeoName}</h3>
            <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-800">
              {proRodeo.sanctioningBody}
            </span>
          </div>
          <p className="mt-2 text-sm text-stone-700">
            {proRodeo.city}, {proRodeo.state} ·{" "}
            {formatEventDateRange(proRodeo.startDate, proRodeo.endDate)}
          </p>
        </div>
        <span className="text-sm font-semibold text-stone-800">
          View on {proRodeo.sanctioningBody} →
        </span>
      </div>
    </a>
  );
}
