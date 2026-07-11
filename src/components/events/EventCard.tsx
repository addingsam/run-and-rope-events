import Link from "next/link";
import { getDisciplineLabelFromSlug } from "@/lib/events/submission-options";
import type { RodeoEvent } from "@/types/event";

interface EventCardProps {
  event: RodeoEvent;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function EventCard({ event }: EventCardProps) {
  const disciplineLabel =
    event.disciplines.length === 1
      ? getDisciplineLabelFromSlug(event.disciplines[0])
      : `${event.disciplines.length} disciplines`;

  return (
    <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {disciplineLabel}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-amber-950">{event.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {event.featured && (
            <span className="rounded-full bg-amber-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Featured
            </span>
          )}
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            {event.status.replace("-", " ")}
          </span>
        </div>
      </div>
      <dl className="space-y-1 text-sm text-amber-900/75">
        <div>
          <dt className="sr-only">Date</dt>
          <dd>{formatDate(event.startDate)}</dd>
        </div>
        <div>
          <dt className="sr-only">Location</dt>
          <dd>
            {event.venue} · {event.city}, {event.state}
          </dd>
        </div>
        {event.entryFee && (
          <div>
            <dt className="sr-only">Entry fee</dt>
            <dd className="whitespace-pre-line">Entry fee: {event.entryFee}</dd>
          </div>
        )}
      </dl>
      {event.description && (
        <p className="mt-3 text-sm leading-6 text-amber-900/70">{event.description}</p>
      )}
      <Link
        href={`/events/${event.id}`}
        className="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-950"
      >
        View details →
      </Link>
    </article>
  );
}
