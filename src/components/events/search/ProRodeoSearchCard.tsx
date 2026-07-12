import { SearchBadge } from "@/components/events/search/SearchBadges";
import { formatEventDateRange } from "@/lib/events/format-date";
import { themeMutedTextClassName, themePanelClassName } from "@/lib/theme/form-classes";
import type { ProRodeoSearchResultItem } from "@/types/event-search";

interface ProRodeoSearchCardProps {
  proRodeo: ProRodeoSearchResultItem;
}

export function ProRodeoSearchCard({ proRodeo }: ProRodeoSearchCardProps) {
  return (
    <a
      href={proRodeo.externalLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-5 shadow-sm transition-shadow hover:border-[var(--color-accent-primary)]/40 hover:shadow-md ${themePanelClassName}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {proRodeo.rodeoName}
        </h3>
        <SearchBadge variant="stone">{proRodeo.sanctioningBody}</SearchBadge>
      </div>
      <dl className={`space-y-1 ${themeMutedTextClassName}`}>
        <div>
          <dt className="sr-only">Location</dt>
          <dd>
            {proRodeo.city}, {proRodeo.state}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Dates</dt>
          <dd>{formatEventDateRange(proRodeo.startDate, proRodeo.endDate)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm font-semibold text-[var(--color-text-primary)]">
        View on {proRodeo.sanctioningBody} →
      </p>
    </a>
  );
}
