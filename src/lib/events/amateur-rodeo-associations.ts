import type { FlyerExtractionRodeoLevelLabel } from "@/types/flyer-extraction";
import type { RodeoLevel } from "@/types/event-submission";

export const AMATEUR_RODEO_ASSOCIATIONS = [
  { name: "American Cowboy Rodeo Association", abbrev: "ACRA" },
  { name: "International Professional Rodeo Association", abbrev: "IPRA" },
  { name: "Kansas Pro Rodeo Association", abbrev: "KPRA" },
  { name: "United Rodeo Association", abbrev: "URA" },
  { name: "Cowboys Regional Rodeo Association", abbrev: "CRRA" },
  { name: "United Professional Rodeo Association", abbrev: "UPRA" },
  { name: "Real Cowboys Association", abbrev: "RCA" },
  { name: "Missouri Rodeo Cowboys Association", abbrev: "MRCA" },
] as const;

const AMATEUR_RODEO_ASSOCIATION_PATTERNS: RegExp[] = [
  /\bamerican cowboy rodeo association\b/i,
  /\binternational professional rodeo association\b/i,
  /\bkansas pro rodeo association\b/i,
  /\bunited rodeo association\b/i,
  /\bcowboys regional rodeo association\b/i,
  /\bunited professional rodeo association\b/i,
  /\breal cowboys association\b/i,
  /\bmissouri rodeo cowboys association\b/i,
  /\bacra\b/i,
  /\bipra\b/i,
  /\bkpra\b/i,
  /\bura\b/i,
  /\bcrra\b/i,
  /\bupra\b/i,
  /\brca\b/i,
  /\bmrca\b/i,
];

export function inferAmateurRodeoFromText(
  ...texts: Array<string | null | undefined>
): boolean {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return false;
  }

  return AMATEUR_RODEO_ASSOCIATION_PATTERNS.some((pattern) => pattern.test(combined));
}

export function resolveFlyerRodeoLevelLabel(
  extractedLevel: FlyerExtractionRodeoLevelLabel | null,
  ...texts: Array<string | null | undefined>
): FlyerExtractionRodeoLevelLabel | null {
  if (!inferAmateurRodeoFromText(...texts)) {
    return extractedLevel;
  }

  if (extractedLevel === "Youth" || extractedLevel === "Pro") {
    return extractedLevel;
  }

  return "Amateur";
}

export function resolveSubmissionRodeoLevels(
  rodeoLevels: readonly RodeoLevel[],
  ...texts: Array<string | null | undefined>
): RodeoLevel[] {
  if (!inferAmateurRodeoFromText(...texts)) {
    return [...rodeoLevels];
  }

  const withoutOpen = rodeoLevels.filter((level) => level !== "open");
  const resolved = new Set<RodeoLevel>([...withoutOpen, "amateur"]);
  return [...resolved];
}

export function amateurRodeoAssociationPromptLines() {
  return AMATEUR_RODEO_ASSOCIATIONS.map(
    (association) => `${association.name} (${association.abbrev})`,
  ).join("; ");
}
