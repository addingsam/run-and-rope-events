import { DisciplineBadges } from "@/components/events/DisciplineBadges";
import { formatFlyerAddress } from "@/lib/events/flyer-lightbox";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { getFormatLabel, getRodeoLevelLabel } from "@/lib/events/submission-options";
import type { EventDetailView } from "@/types/event-detail";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";

interface EventDetailGridProps {
  event: EventDetailView;
}

function GridField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800/70">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6 text-amber-950">{children}</dd>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-amber-900/40">—</span>;
}

export function EventDetailGrid({ event }: EventDetailGridProps) {
  const address = formatFlyerAddress(event);
  const dateValue = event.endDate
    ? formatEventDateRange(event.startDate, event.endDate)
    : formatEventDate(event.startDate);

  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-amber-950">Event details</h2>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        <GridField label="Date">{dateValue}</GridField>

        <GridField label="Format">
          {event.format ? getFormatLabel(event.format as SubmissionFormat) : <EmptyValue />}
        </GridField>

        <GridField label="Rodeo level">
          {event.format === "rodeo" && event.rodeoLevel ? (
            getRodeoLevelLabel(event.rodeoLevel as RodeoLevel)
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Discipline(s)">
          {event.disciplines.length > 0 ? (
            <DisciplineBadges disciplines={event.disciplines} />
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Venue">{event.venue || <EmptyValue />}</GridField>

        <GridField label="Address">
          {address ? <span className="whitespace-pre-line">{address}</span> : <EmptyValue />}
        </GridField>

        <GridField label="Producer name">
          {event.producerName || <EmptyValue />}
        </GridField>

        <GridField label="Producer website">
          {event.websiteUrl ? (
            <a
              href={event.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-medium text-amber-800 hover:text-amber-950"
            >
              {event.websiteUrl}
            </a>
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Entry fee">
          {event.entryFee ? (
            <span className="whitespace-pre-line">{event.entryFee}</span>
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Entry deadline">
          {event.entryDeadline ? formatEventDate(event.entryDeadline) : <EmptyValue />}
        </GridField>

        <GridField label="Prize info" className="sm:col-span-2">
          {event.prizePayoutInfo ? (
            <span className="whitespace-pre-line">{event.prizePayoutInfo}</span>
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Class & division info" className="sm:col-span-2">
          {event.classDivisionInfo ? (
            <span className="whitespace-pre-line">{event.classDivisionInfo}</span>
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Contact details" className="sm:col-span-2">
          {event.contactEmail || event.contactPhone ? (
            <div className="space-y-1">
              {event.contactEmail && (
                <p>
                  <a
                    href={`mailto:${event.contactEmail}`}
                    className="font-medium text-amber-800 hover:text-amber-950"
                  >
                    {event.contactEmail}
                  </a>
                </p>
              )}
              {event.contactPhone && <p>{event.contactPhone}</p>}
            </div>
          ) : (
            <EmptyValue />
          )}
        </GridField>

        <GridField label="Description" className="sm:col-span-2">
          {event.description ? (
            <span className="whitespace-pre-line">{event.description}</span>
          ) : (
            <EmptyValue />
          )}
        </GridField>
      </dl>
    </section>
  );
}
