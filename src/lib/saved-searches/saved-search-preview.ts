import { formatEventDate, formatEventDateRange } from "@/lib/events/format-date";
import type { SearchResultEntry } from "@/types/event-search";

export const SAVED_SEARCH_PREVIEW_LIMIT = 8;

export interface SavedSearchPreviewItem {
  title: string;
  dateLabel: string;
  locationLabel: string;
}

function mapResultToPreview(entry: SearchResultEntry): SavedSearchPreviewItem | null {
  if (entry.kind === "event") {
    return {
      title: entry.item.title,
      dateLabel: formatEventDate(entry.item.eventDate),
      locationLabel: [entry.item.city, entry.item.state].filter(Boolean).join(", "),
    };
  }

  return {
    title: entry.item.rodeoName,
    dateLabel: formatEventDateRange(entry.item.startDate, entry.item.endDate),
    locationLabel: [entry.item.city, entry.item.state].filter(Boolean).join(", "),
  };
}

export function buildSavedSearchPreviewItems(
  results: SearchResultEntry[],
  limit = SAVED_SEARCH_PREVIEW_LIMIT,
): SavedSearchPreviewItem[] {
  return results
    .map((entry) => mapResultToPreview(entry))
    .filter((item): item is SavedSearchPreviewItem => item !== null)
    .slice(0, limit);
}

export function formatSavedSearchPreviewLine(item: SavedSearchPreviewItem) {
  const location = item.locationLabel ? ` · ${item.locationLabel}` : "";
  return `${item.title} · ${item.dateLabel}${location}`;
}

export function formatSavedSearchPreviewLines(
  results: SearchResultEntry[],
  limit = SAVED_SEARCH_PREVIEW_LIMIT,
) {
  return buildSavedSearchPreviewItems(results, limit).map(formatSavedSearchPreviewLine);
}

export function countSavedSearchMatches(results: SearchResultEntry[]) {
  return results.length;
}
