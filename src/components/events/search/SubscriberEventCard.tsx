"use client";

import Link from "next/link";
import { EventFlyerTrigger } from "@/components/events/EventFlyerTrigger";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";
import { DisciplineSummary } from "@/components/events/search/SearchBadges";
import { formatEventDate } from "@/lib/events/format-date";
import { getFormatLabel, getRodeoLevelLabel } from "@/lib/events/submission-options";
import type { EventSearchResultItem } from "@/types/event-search";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";

interface SubscriberEventCardProps {
  event: EventSearchResultItem;
}

export function SubscriberEventCard({ event }: SubscriberEventCardProps) {
  const hasFlyer = Boolean(event.flyerUrl);
  const isPdf = event.flyerUrl?.toLowerCase().endsWith(".pdf");

  return (
    <article className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 z-10">
        <EventBookmarkButton eventId={event.id} eventTitle={event.title} size="sm" />
      </div>

      <EventFlyerTrigger
        eventId={event.id}
        ariaLabel={`View flyer and details for ${event.title}`}
        className="relative block h-52 w-full cursor-zoom-in bg-[#fffaf3] text-left"
      >
        {hasFlyer && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.flyerUrl!}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800" />
        )}
      </EventFlyerTrigger>

      <div className="border-b border-amber-100 px-5 py-4">
        <h3 className="text-lg font-semibold leading-snug text-amber-950">{event.title}</h3>
        <p className="mt-1 text-sm text-amber-900/80">{formatEventDate(event.eventDate)}</p>
      </div>

      <Link
        href={`/events/${event.id}`}
        className="block p-5 transition-colors hover:bg-amber-50/60"
      >
        <dl className="space-y-1.5 text-sm text-amber-900/80">
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="font-medium text-amber-950">
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
      </Link>
    </article>
  );
}
