"use client";

import { useState } from "react";
import { FlyerLightbox } from "@/components/events/FlyerLightbox";
import { EventBookmarkButton } from "@/components/saved/EventBookmarkButton";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import type { EventDetailView } from "@/types/event-detail";

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
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-b border-amber-200 bg-[#fffaf3]">
        <div className="absolute right-4 top-4 z-20 sm:right-8">
          <EventBookmarkButton eventId={event.id} eventTitle={event.title} />
        </div>

        <div
          className="relative mx-auto max-w-4xl cursor-pointer px-4 pt-6 sm:px-6 sm:pt-8"
          onClick={() => setLightboxOpen(true)}
        >
          {showImage && event.flyerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.flyerUrl}
              alt={`${event.title} flyer`}
              className="mx-auto max-h-[70vh] w-full object-contain"
            />
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-800 via-amber-700 to-amber-950 sm:min-h-[380px]">
              <p className="text-sm font-medium text-amber-100/90">No flyer preview available</p>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-amber-950 sm:text-4xl">
            {event.title}
          </h1>

          <dl className="mt-4 space-y-1 text-sm text-amber-900/80 sm:text-base">
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

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              View flyer
            </button>
            {hasFlyer && (
              <a
                href={event.flyerUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
              >
                Download
              </a>
            )}
          </div>
        </div>
      </section>

      {lightboxOpen && <FlyerLightbox event={event} onClose={() => setLightboxOpen(false)} />}
    </>
  );
}
