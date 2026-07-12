import { DisciplineBadges } from "@/components/events/DisciplineBadges";
import { RodeoLevelsBadges } from "@/components/events/EventTypeBadge";
import { formatFlyerAddress } from "@/lib/events/flyer-lightbox";
import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import { getFormatLabel } from "@/lib/events/submission-options";
import { themeMutedTextClassName, themePanelClassName } from "@/lib/theme/form-classes";
import type { EventDetailView } from "@/types/event-detail";
import type { SubmissionFormat } from "@/types/event-submission";

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
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-6 text-[var(--color-text-primary)]">{children}</dd>
    </div>
  );
}

function EmptyValue() {
  return <span className="text-[var(--color-text-muted)]/50">—</span>;
}

export function EventDetailGrid({ event }: EventDetailGridProps) {
  const address = formatFlyerAddress(event);
  const dateValue = event.endDate
    ? formatEventDateRange(event.startDate, event.endDate)
    : formatEventDate(event.startDate);

  return (
    <section className={`p-5 shadow-sm sm:p-6 ${themePanelClassName}`}>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Event details</h2>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        <GridField label="Date">{dateValue}</GridField>

        <GridField label="Format">
          {event.format ? getFormatLabel(event.format as SubmissionFormat) : <EmptyValue />}
        </GridField>

        <GridField label="Rodeo level">
          {event.format === "rodeo" && event.rodeoLevel ? (
            <RodeoLevelsBadges levelValue={event.rodeoLevel} />
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
              className="break-all font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
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
                    className="font-medium text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
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
