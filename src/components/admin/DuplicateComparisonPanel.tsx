import { formatEventDate } from "@/lib/events/format-date";
import {
  formatDisciplineDisplayLabels,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import type { EventRecord, EventRecordStatus } from "@/types/event-record";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";

function formatLocation(event: EventRecord) {
  const cityLine = [event.address_city, event.address_state].filter(Boolean).join(", ");
  if (event.venue_name) {
    return `${event.venue_name} · ${cityLine}`;
  }
  return cityLine;
}

function getStatusLabel(status: EventRecordStatus) {
  switch (status) {
    case "approved":
      return "Approved";
    case "published":
      return "Published";
    case "pending":
      return "Pending";
    case "archived":
      return "Archived";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function EventSummaryCard({
  title,
  event,
  badge,
}: {
  title: string;
  event: EventRecord;
  badge?: string;
}) {
  const format = (event.event_format as SubmissionFormat) ?? "jackpot";

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-stone-900">{title}</h4>
        {badge && (
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
            {badge}
          </span>
        )}
      </div>
      <dl className="space-y-2 text-sm text-stone-700">
        <div>
          <dt className="font-medium text-stone-500">Name</dt>
          <dd>{event.event_name}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Format</dt>
          <dd>{getFormatLabel(format)}</dd>
        </div>
        {format === "rodeo" && event.rodeo_level && (
          <div>
            <dt className="font-medium text-stone-500">Level</dt>
            <dd>{getRodeoLevelLabel(event.rodeo_level as RodeoLevel)}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-stone-500">Disciplines</dt>
          <dd>
            {event.disciplines?.length
              ? formatDisciplineDisplayLabels(
                  event.disciplines as Parameters<typeof formatDisciplineDisplayLabels>[0],
                )
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Date</dt>
          <dd>{formatEventDate(event.event_date)}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Location</dt>
          <dd>{formatLocation(event)}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-500">Submitter</dt>
          <dd>{event.submitter_email ?? "—"}</dd>
        </div>
        {event.flyer_url && (
          <div>
            <dt className="font-medium text-stone-500">Flyer</dt>
            <dd>
              <a
                href={event.flyer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-medium text-stone-800 underline decoration-stone-300 underline-offset-2"
              >
                <img
                  src={event.flyer_url}
                  alt={`Flyer for ${event.event_name}`}
                  className="h-14 w-10 rounded border border-stone-200 object-cover"
                />
                View flyer
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

interface DuplicateComparisonPanelProps {
  submission: EventRecord;
  duplicates: EventRecord[];
}

export function DuplicateComparisonPanel({
  submission,
  duplicates,
}: DuplicateComparisonPanelProps) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-950">
        Possible duplicate detected — compare before approving
      </p>
      <p className="mt-1 text-sm text-amber-900/80">
        Another event with the same name, format, and date already exists in the database.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <EventSummaryCard title="New submission" event={submission} badge="Pending" />
        {duplicates.map((duplicate) => (
          <EventSummaryCard
            key={duplicate.id}
            title="Existing event"
            event={duplicate}
            badge={getStatusLabel(duplicate.status)}
          />
        ))}
      </div>
    </div>
  );
}
