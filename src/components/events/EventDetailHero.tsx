"use client";

import { useState } from "react";
import { FlyerLightbox } from "@/components/events/FlyerLightbox";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import {
  getDisciplineLabelFromSlug,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import type { EventDetailView } from "@/types/event-detail";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";

interface EventDetailHeroProps {
  event: EventDetailView;
}

function isImageFlyer(flyerUrl: string | null | undefined) {
  return Boolean(flyerUrl && !flyerUrl.toLowerCase().endsWith(".pdf"));
}

export function EventDetailHero({ event }: EventDetailHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasFlyer = Boolean(event.flyerUrl);
  const showImage = isImageFlyer(event.flyerUrl);

  const dateLabel = event.endDate
    ? formatEventDateRange(event.startDate, event.endDate)
    : formatEventDate(event.startDate);

  return (
    <>
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <div className="absolute right-4 top-4 z-20 sm:right-8">
          <EventBookmarkButton eventId={event.id} eventTitle={event.title} />
        </div>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block min-h-[320px] w-full text-left sm:min-h-[380px]"
          aria-label={`Tap to view flyer for ${event.title}`}
        >
          {showImage && event.flyerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.flyerUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-amber-700 to-amber-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

          <div className="relative flex h-full min-h-[320px] flex-col justify-end px-4 py-6 sm:min-h-[380px] sm:px-8 sm:py-8">
            <div className="mx-auto w-full max-w-4xl">
              <div className="flex flex-wrap gap-2">
                {event.format && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {getFormatLabel(event.format as SubmissionFormat)}
                  </span>
                )}
                {event.disciplines.map((discipline) => (
                  <span
                    key={discipline}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    {getDisciplineLabelFromSlug(discipline)}
                  </span>
                ))}
                {event.format === "rodeo" && event.rodeoLevel && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-sm">
                    {getRodeoLevelLabel(event.rodeoLevel as RodeoLevel)}
                  </span>
                )}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                {event.title}
              </h1>

              <dl className="mt-4 space-y-1 text-sm text-amber-50 sm:text-base">
                <div>
                  <dt className="sr-only">Date</dt>
                  <dd>{dateLabel}</dd>
                </div>
                <div>
                  <dt className="sr-only">Venue</dt>
                  <dd>
                    {event.venue} · {event.city}, {event.state}
                  </dd>
                </div>
                {event.prizePayoutInfo && (
                  <div>
                    <dt className="sr-only">Prize info</dt>
                    <dd className="line-clamp-2 whitespace-pre-line">{event.prizePayoutInfo}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-4 text-sm font-medium text-amber-100/90">
                Tap to view flyer
              </p>

              <div
                className="mt-4 flex flex-wrap gap-3"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
                onKeyDown={(keyboardEvent) => keyboardEvent.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
                >
                  View flyer
                </button>
                {hasFlyer && (
                  <a
                    href={event.flyerUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        </button>
      </section>

      {lightboxOpen && <FlyerLightbox event={event} onClose={() => setLightboxOpen(false)} />}
    </>
  );
}
