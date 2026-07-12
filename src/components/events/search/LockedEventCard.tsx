import Link from "next/link";
import { RodeoLevelsBadges } from "@/components/events/EventTypeBadge";
import { DisciplineSummary } from "@/components/events/search/SearchBadges";
import { formatEventDate } from "@/lib/events/format-date";
import { getFormatLabel } from "@/lib/events/submission-options";
import type { EventSearchResultItem } from "@/types/event-search";
import type { SubmissionFormat } from "@/types/event-submission";

interface LockedEventCardProps {
  event: EventSearchResultItem;
}

export function LockedEventCard({ event }: LockedEventCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
      <div className="relative h-52 w-full overflow-hidden bg-[#fffaf3]">
        <div className="h-full w-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 blur-sm" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-white">
            🔒
          </div>
          <p className="text-sm font-semibold text-white">Subscribe to unlock</p>
          <Link
            href="/subscribe"
            className="mt-3 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-400"
          >
            View plans
          </Link>
        </div>
      </div>

      <div className="border-b border-amber-100 px-5 py-4">
        <h3 className="text-lg font-semibold leading-snug text-amber-950">{event.title}</h3>
        <p className="mt-1 text-sm text-amber-900/80">{formatEventDate(event.eventDate)}</p>
      </div>

      <div className="p-5">
        <dl className="space-y-1.5 text-sm text-amber-900/60">
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="font-medium text-amber-900/75">
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
                <dd>
                  <RodeoLevelsBadges levelValue={event.rodeoLevel} />
                </dd>
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
    </article>
  );
}
