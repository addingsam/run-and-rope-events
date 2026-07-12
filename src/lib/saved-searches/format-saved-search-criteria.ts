import { UPCOMING_FORMAT_FILTER_OPTIONS } from "@/lib/events/filter-upcoming-events";
import { getDisciplineLabel } from "@/lib/events/submission-options";
import {
  SEARCH_BUFFER_OPTIONS,
  SEARCH_FORMAT_OPTIONS,
  SEARCH_RADIUS_OPTIONS,
  SEARCH_RODEO_LEVEL_OPTIONS,
} from "@/lib/events/search-options";
import { isUpcomingSavedSearch } from "@/lib/saved-searches/run-saved-search";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";
import type { SubmissionDiscipline } from "@/types/event-submission";

function labelFor<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T | "" | undefined,
) {
  if (!value) {
    return null;
  }

  return options.find((option) => option.value === value)?.label ?? String(value);
}

export function formatSavedSearchCriteriaLines(
  params: SavedSearchParams,
  mapOverlay?: SavedMapOverlay | null,
): string[] {
  const lines: string[] = [];

  if (isUpcomingSavedSearch(params)) {
    lines.push("Search type: Upcoming events");
    const formatLabel = labelFor(UPCOMING_FORMAT_FILTER_OPTIONS, params.upcomingFormatFilter ?? "both");
    if (formatLabel && params.upcomingFormatFilter !== "both") {
      lines.push(`Format: ${formatLabel}`);
    }
    if (params.upcomingDisciplines && params.upcomingDisciplines.length > 0) {
      lines.push(
        `Jackpot structure: ${params.upcomingDisciplines.map((d) => getDisciplineLabel(d)).join(", ")}`,
      );
    }
    if (params.upcomingRodeoLevels && params.upcomingRodeoLevels.length > 0) {
      lines.push(`Rodeo levels: ${params.upcomingRodeoLevels.join(", ")}`);
    }
  } else if (params.mode === "route") {
    lines.push("Search type: Route search");
    if (params.originLabel) {
      lines.push(`From: ${params.originLabel}`);
    }
    if (params.destinationLabel) {
      lines.push(`To: ${params.destinationLabel}`);
    }
    const bufferLabel = labelFor(SEARCH_BUFFER_OPTIONS, String(params.bufferMiles) as "5");
    lines.push(`Route buffer: ${bufferLabel ?? `${params.bufferMiles} miles`}`);
  } else if (params.mode === "map") {
    lines.push("Search type: Map area");
  } else {
    lines.push("Search type: Radius search");
    if (params.locationLabel) {
      lines.push(`Location: ${params.locationLabel}`);
    }
    const radiusLabel = labelFor(SEARCH_RADIUS_OPTIONS, String(params.radiusMiles) as "25");
    lines.push(`Radius: ${radiusLabel ?? `${params.radiusMiles} miles`}`);
  }

  if (!isUpcomingSavedSearch(params)) {
    const formatLabel = labelFor(SEARCH_FORMAT_OPTIONS, params.format);
    if (formatLabel && params.format !== "either") {
      lines.push(`Format: ${formatLabel}`);
    }
    const levelLabels = (params.rodeoLevels ?? []).map(
      (level) => labelFor(SEARCH_RODEO_LEVEL_OPTIONS, level) ?? level,
    );
    if (levelLabels.length > 0) {
      lines.push(`Rodeo levels: ${levelLabels.join(", ")}`);
    }
    if (params.disciplines.length > 0) {
      lines.push(
        `Jackpot structure: ${params.disciplines.map((d) => getDisciplineLabel(d as SubmissionDiscipline)).join(", ")}`,
      );
    }
    if (params.startDate) {
      lines.push(`Start date: ${params.startDate}`);
    }
    if (params.endDate) {
      lines.push(`End date: ${params.endDate}`);
    }
  }

  if (mapOverlay?.pinRadius) {
    lines.push(`Map filter: pin radius (${mapOverlay.pinRadius.radiusMiles} mi)`);
  }
  if (mapOverlay && mapOverlay.shapes.length > 0) {
    lines.push(
      `Map filter: ${mapOverlay.shapes.length} drawn area${mapOverlay.shapes.length === 1 ? "" : "s"}`,
    );
  }

  if (lines.length === 1) {
    lines.push("All events matching your saved filter settings.");
  }

  return lines;
}

export function getAlertFrequencyLabel(frequency: SavedSearchAlertFrequency) {
  switch (frequency) {
    case "daily":
      return "Daily digest";
    case "weekly":
      return "Weekly digest";
    default:
      return "No update emails";
  }
}

export function isSavedSearchAlertFrequency(value: string): value is SavedSearchAlertFrequency {
  return value === "off" || value === "daily" || value === "weekly";
}
