import { getRodeoLevelLabel } from "@/lib/events/submission-options";
import type { RodeoLevel } from "@/types/event-submission";
import type { SearchRodeoLevel } from "@/types/event-search";

const KNOWN_SUBMISSION_LEVELS = new Set<RodeoLevel>(["youth", "open", "amateur"]);
const KNOWN_SEARCH_LEVELS = new Set<SearchRodeoLevel>(["youth", "open", "amateur", "pro"]);

export function parseStoredRodeoLevels(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function serializeRodeoLevels(levels: readonly string[]): string | null {
  const normalized = [
    ...new Set(levels.map((level) => level.trim().toLowerCase()).filter(Boolean)),
  ];

  return normalized.length > 0 ? normalized.join(",") : null;
}

export function parseSearchRodeoLevels(value: string | null | undefined): SearchRodeoLevel[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((level): level is SearchRodeoLevel =>
      KNOWN_SEARCH_LEVELS.has(level as SearchRodeoLevel),
    );
}

export function eventMatchesRodeoLevels(
  eventLevel: string | null | undefined,
  selectedLevels: readonly string[],
): boolean {
  if (selectedLevels.length === 0) {
    return true;
  }

  const eventLevels = parseStoredRodeoLevels(eventLevel);
  if (eventLevels.length === 0) {
    return false;
  }

  return eventLevels.some((level) => selectedLevels.includes(level));
}

export function shouldIncludeProRodeos(
  format: "jackpot" | "rodeo" | "either",
  rodeoLevels: readonly SearchRodeoLevel[],
) {
  if (format === "jackpot") {
    return false;
  }

  if (rodeoLevels.length === 0) {
    return true;
  }

  return rodeoLevels.includes("pro");
}

export function shouldIncludeRegularRodeoEvents(rodeoLevels: readonly SearchRodeoLevel[]) {
  if (rodeoLevels.length === 0) {
    return true;
  }

  return rodeoLevels.some((level) => level !== "pro");
}

export function regularRodeoLevelsForMatching(rodeoLevels: readonly SearchRodeoLevel[]) {
  return rodeoLevels.filter((level) => level !== "pro");
}

export function formatRodeoLevelList(levels: readonly string[]): string {
  return levels
    .map((level) => {
      if (level === "pro") {
        return "Pro Rodeo";
      }

      if (KNOWN_SUBMISSION_LEVELS.has(level as RodeoLevel)) {
        return getRodeoLevelLabel(level as RodeoLevel);
      }

      return level.replaceAll("_", " ");
    })
    .join(", ");
}
