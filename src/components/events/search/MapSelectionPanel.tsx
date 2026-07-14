"use client";

import Link from "next/link";
import { formatEventDateRange } from "@/lib/events/format-date";
import { formatRodeoLevelList, parseStoredRodeoLevels } from "@/lib/events/rodeo-levels";
import {
  getDisciplineLabelFromSlug,
  getFormatLabel,
} from "@/lib/events/submission-options";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
  themeSecondaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { SearchResultEntry } from "@/types/event-search";
import type { SubmissionFormat } from "@/types/event-submission";
import type { MapSelection } from "@/lib/mapbox/search-map-utils";
import { getStateLabel } from "@/lib/mapbox/state-centroids";

interface MapSelectionPanelProps {
  selection: MapSelection;
  results: SearchResultEntry[];
  isSubscriber: boolean;
  onClose: () => void;
}

function findSelectedEntry(selection: MapSelection, results: SearchResultEntry[]) {
  if (!selection || selection.type === "state_cluster") {
    return null;
  }

  return (
    results.find((entry) => {
      if (selection.type === "event" && entry.kind === "event") {
        return entry.item.id === selection.id;
      }

      if (selection.type === "pro_rodeo" && entry.kind === "pro_rodeo") {
        return entry.item.id === selection.id;
      }

      return false;
    }) ?? null
  );
}

export function MapSelectionPanel({
  selection,
  results,
  isSubscriber,
  onClose,
}: MapSelectionPanelProps) {
  if (!selection) {
    return null;
  }

  if (selection.type === "state_cluster") {
    return (
      <div
        className={`absolute bottom-3 left-3 right-3 z-10 p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm ${themePanelClassName}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ✕
        </button>
        <h3 className="pr-8 text-lg font-semibold text-[var(--color-text-primary)]">
          {getStateLabel(selection.state)}
        </h3>
        <p className={`mt-2 ${themeMutedTextClassName}`}>
          Event listings in this state are available to subscribers.
        </p>
        <Link href="/subscribe" className={`mt-4 inline-flex ${themePrimaryButtonClassName}`}>
          Subscribe to unlock
        </Link>
      </div>
    );
  }

  if (selection.type === "event" && !isSubscriber) {
    return (
      <div
        className={`absolute bottom-3 left-3 right-3 z-10 p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm ${themePanelClassName}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ✕
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-background)] text-xl">
            🔒
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Subscribe to see event details
            </h3>
            <p className={`mt-2 ${themeMutedTextClassName}`}>
              Event names, dates, fees, and full listings are available to subscribers. Pro WPRA/PRCA
              rodeos remain free to browse.
            </p>
          </div>
        </div>
        <Link href="/subscribe" className={`mt-4 inline-flex ${themePrimaryButtonClassName}`}>
          View plans
        </Link>
      </div>
    );
  }

  const entry = findSelectedEntry(selection, results);
  if (!entry) {
    return null;
  }

  if (entry.kind === "pro_rodeo") {
    const proRodeo = entry.item;

    return (
      <div
        className={`absolute bottom-3 left-3 right-3 z-10 p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm ${themePanelClassName}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ✕
        </button>
        <div className="flex items-start gap-2 pr-8">
          <span className="text-xl text-[var(--color-accent-cta)]">★</span>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {proRodeo.rodeoName}
            </h3>
            <p className={`mt-1 ${themeMutedTextClassName}`}>{proRodeo.sanctioningBody}</p>
          </div>
        </div>
        <p className={`mt-3 ${themeMutedTextClassName}`}>
          {proRodeo.city}, {proRodeo.state}
        </p>
        <p className={`mt-1 ${themeMutedTextClassName}`}>
          {formatEventDateRange(proRodeo.startDate, proRodeo.endDate)}
        </p>
        <a
          href={proRodeo.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 inline-flex ${themePrimaryButtonClassName}`}
        >
          View on {proRodeo.sanctioningBody}
        </a>
      </div>
    );
  }

  const event = entry.item;

  return (
    <div
      className={`absolute bottom-3 left-3 right-3 z-10 p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm ${themePanelClassName}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        ✕
      </button>
      <h3 className="pr-8 text-lg font-semibold text-[var(--color-text-primary)]">{event.title}</h3>
      <dl className={`mt-3 space-y-1 ${themeMutedTextClassName}`}>
        {event.format && (
          <div>
            <dt className="sr-only">Format</dt>
            <dd>{getFormatLabel(event.format as SubmissionFormat)}</dd>
          </div>
        )}
        {event.format === "rodeo" && event.rodeoLevel && (
          <div>
            <dt className="sr-only">Level</dt>
            <dd>{formatRodeoLevelList(parseStoredRodeoLevels(event.rodeoLevel))}</dd>
          </div>
        )}
        <div>
          <dt className="sr-only">Disciplines</dt>
          <dd>
            {event.disciplines
              .map((discipline) => getDisciplineLabelFromSlug(discipline))
              .join(", ")}
          </dd>
        </div>
      </dl>
      <Link href={`/events/${event.id}`} className={`mt-4 inline-flex ${themeSecondaryButtonClassName}`}>
        View details
      </Link>
    </div>
  );
}
