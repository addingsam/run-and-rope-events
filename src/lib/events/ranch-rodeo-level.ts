import type { FlyerExtractionRodeoLevelLabel } from "@/types/flyer-extraction";
import type { RodeoLevel } from "@/types/event-submission";

const RANCH_RODEO_PATTERNS = [/\branch rodeos?\b/i, /\branch-rodeo\b/i];

export function inferRanchRodeoFromText(
  ...texts: Array<string | null | undefined>
): boolean {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return false;
  }

  return RANCH_RODEO_PATTERNS.some((pattern) => pattern.test(combined));
}

export function resolveRanchRodeoLevelLabel(
  extractedLevel: FlyerExtractionRodeoLevelLabel | null,
  ...texts: Array<string | null | undefined>
): FlyerExtractionRodeoLevelLabel | null {
  if (!inferRanchRodeoFromText(...texts)) {
    return extractedLevel;
  }

  if (extractedLevel === "Youth" || extractedLevel === "Pro") {
    return extractedLevel;
  }

  return "Ranch";
}

export function resolveRanchRodeoLevels(
  rodeoLevels: readonly RodeoLevel[],
  ...texts: Array<string | null | undefined>
): RodeoLevel[] {
  if (!inferRanchRodeoFromText(...texts)) {
    return [...rodeoLevels];
  }

  const withoutOpenOrAmateur = rodeoLevels.filter(
    (level) => level !== "open" && level !== "amateur",
  );
  return [...new Set<RodeoLevel>([...withoutOpenOrAmateur, "ranch"])];
}
