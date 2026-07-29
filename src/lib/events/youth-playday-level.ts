import type { FlyerExtractionRodeoLevelLabel } from "@/types/flyer-extraction";
import type { RodeoLevel } from "@/types/event-submission";

const YOUTH_PLAYDAY_PATTERNS = [/\bplay[\s-]?days?\b/i];

export function inferYouthPlaydayFromText(
  ...texts: Array<string | null | undefined>
): boolean {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return false;
  }

  return YOUTH_PLAYDAY_PATTERNS.some((pattern) => pattern.test(combined));
}

export function resolveYouthPlaydayLevelLabel(
  extractedLevel: FlyerExtractionRodeoLevelLabel | null,
  ...texts: Array<string | null | undefined>
): FlyerExtractionRodeoLevelLabel | null {
  if (!inferYouthPlaydayFromText(...texts)) {
    return extractedLevel;
  }

  return "Youth";
}

export function resolveYouthPlaydayLevels(
  rodeoLevels: readonly RodeoLevel[],
  ...texts: Array<string | null | undefined>
): RodeoLevel[] {
  if (!inferYouthPlaydayFromText(...texts)) {
    return [...rodeoLevels];
  }

  const withoutOtherLevels = rodeoLevels.filter(
    (level) => level !== "open" && level !== "amateur" && level !== "ranch",
  );
  return [...new Set<RodeoLevel>([...withoutOtherLevels, "youth"])];
}
