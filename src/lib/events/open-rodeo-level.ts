import type { FlyerExtractionRodeoLevelLabel } from "@/types/flyer-extraction";
import type { RodeoLevel } from "@/types/event-submission";

const OPEN_RODEO_PATTERNS = [/\bopen[\s-]+rodeos?\b/i, /\bopen-rodeo\b/i];

export function inferOpenRodeoFromText(
  ...texts: Array<string | null | undefined>
): boolean {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return false;
  }

  return OPEN_RODEO_PATTERNS.some((pattern) => pattern.test(combined));
}

export function resolveOpenRodeoLevelLabel(
  extractedLevel: FlyerExtractionRodeoLevelLabel | null,
  ...texts: Array<string | null | undefined>
): FlyerExtractionRodeoLevelLabel | null {
  if (!inferOpenRodeoFromText(...texts)) {
    return extractedLevel;
  }

  if (extractedLevel === "Youth" || extractedLevel === "Pro") {
    return extractedLevel;
  }

  return "Open";
}

export function resolveOpenRodeoLevels(
  rodeoLevels: readonly RodeoLevel[],
  ...texts: Array<string | null | undefined>
): RodeoLevel[] {
  if (!inferOpenRodeoFromText(...texts)) {
    return [...rodeoLevels];
  }

  const withoutConflicting = rodeoLevels.filter(
    (level) => level !== "amateur" && level !== "ranch" && level !== "youth",
  );
  return [...new Set<RodeoLevel>([...withoutConflicting, "open"])];
}
