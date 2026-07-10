"use client";

import Link from "next/link";
import { formatEventDateRange } from "@/lib/events/format-date";
import {
  getDisciplineLabelFromSlug,
  getFormatLabel,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import type { SearchResultEntry } from "@/types/event-search";
import type { RodeoLevel, SubmissionFormat } from "@/types/event-submission";
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
      <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl border border-amber-200 bg-white p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sm text-amber-700 hover:text-amber-950"
        >
          ✕
        </button>
        <h3 className="pr-8 text-lg font-semibold text-amber-950">
          {getStateLabel(selection.state)}
        </h3>
        <p className="mt-2 text-sm text-amber-900/75">
          Event listings in this state are available to subscribers.
        </p>
        <Link
          href="/subscribe"
          className="mt-4 inline-flex rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Subscribe to unlock
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
      <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl border border-stone-200 bg-stone-50 p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-sm text-stone-600 hover:text-stone-900"
        >
          ✕
        </button>
        <div className="flex items-start gap-2 pr-8">
          <span className="text-xl text-yellow-600">★</span>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">{proRodeo.rodeoName}</h3>
            <p className="mt-1 text-sm text-stone-700">{proRodeo.sanctioningBody}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-stone-700">
          {proRodeo.city}, {proRodeo.state}
        </p>
        <p className="mt-1 text-sm text-stone-700">
          {formatEventDateRange(proRodeo.startDate, proRodeo.endDate)}
        </p>
        <a
          href={proRodeo.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-full bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
        >
          View on {proRodeo.sanctioningBody}
        </a>
      </div>
    );
  }

  if (!isSubscriber) {
    return null;
  }

  const event = entry.item;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-10 rounded-2xl border border-amber-200 bg-white p-4 shadow-lg sm:left-auto sm:right-3 sm:max-w-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 text-sm text-amber-700 hover:text-amber-950"
      >
        ✕
      </button>
      <h3 className="pr-8 text-lg font-semibold text-amber-950">{event.title}</h3>
      <dl className="mt-3 space-y-1 text-sm text-amber-900/80">
        {event.format && (
          <div>
            <dt className="sr-only">Format</dt>
            <dd>{getFormatLabel(event.format as SubmissionFormat)}</dd>
          </div>
        )}
        {event.format === "rodeo" && event.rodeoLevel && (
          <div>
            <dt className="sr-only">Level</dt>
            <dd>{getRodeoLevelLabel(event.rodeoLevel as RodeoLevel)}</dd>
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
      <Link
        href={`/events/${event.id}`}
        className="mt-4 inline-flex rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-50"
      >
        View details
      </Link>
    </div>
  );
}
