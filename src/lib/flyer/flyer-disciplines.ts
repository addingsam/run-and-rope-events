import { DISCIPLINE_OPTIONS } from "@/lib/events/submission-options";
import type { SubmissionDiscipline } from "@/types/event-submission";

export const FLYER_EXTRACTION_DISCIPLINE_LABELS = DISCIPLINE_OPTIONS.map(
  (option) => option.label,
);

export type FlyerExtractionDisciplineLabel =
  (typeof DISCIPLINE_OPTIONS)[number]["label"];

export const DISCIPLINE_LABEL_TO_VALUE = Object.fromEntries(
  DISCIPLINE_OPTIONS.map((option) => [option.label, option.value]),
) as Record<FlyerExtractionDisciplineLabel, SubmissionDiscipline>;

const DISCIPLINE_ALIAS_TO_LABEL: Record<string, FlyerExtractionDisciplineLabel> = {
  cmsa: "Cowboy Mounted Shooting",
  "cowboy mounted shooting association": "Cowboy Mounted Shooting",
  "cowboy mounted shooting": "Cowboy Mounted Shooting",
  "mounted shooting": "Cowboy Mounted Shooting",
  "steer wrestling": "Steer Wrestling / Bull Dogging",
  "bull dogging": "Steer Wrestling / Bull Dogging",
  bulldogging: "Steer Wrestling / Bull Dogging",
  "ranch horse": "Ranch Horse",
  "obstacle & trail": "Obstacle & Trail",
  "obstacle and trail": "Obstacle & Trail",
  "barrel racing": "Barrel Racing",
  "team roping": "Team Roping",
  "calf roping": "Calf Roping",
  "breakaway roping": "Breakaway Roping",
  breakaway: "Breakaway Roping",
  "steer roping": "Steer Roping",
};

function canonicalDisciplineLabel(
  value: string,
): FlyerExtractionDisciplineLabel | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (
    FLYER_EXTRACTION_DISCIPLINE_LABELS.includes(
      trimmed as FlyerExtractionDisciplineLabel,
    )
  ) {
    return trimmed as FlyerExtractionDisciplineLabel;
  }

  const aliasMatch = DISCIPLINE_ALIAS_TO_LABEL[trimmed.toLowerCase()];
  if (aliasMatch) {
    return aliasMatch;
  }

  return null;
}

export function normalizeFlyerDiscipline(value: unknown): FlyerExtractionDisciplineLabel | null {
  if (typeof value !== "string") {
    return null;
  }

  return canonicalDisciplineLabel(value);
}

const DISCIPLINE_INFERENCE_PATTERNS: Array<{
  pattern: RegExp;
  label: FlyerExtractionDisciplineLabel;
}> = [
  {
    pattern: /\b(?:cmsa|cowboy mounted shooting(?:\s+association)?|mounted shooting)\b/i,
    label: "Cowboy Mounted Shooting",
  },
  { pattern: /\branch horse\b/i, label: "Ranch Horse" },
  { pattern: /\bobstacle(?:\s*(?:&|and)\s*trail| course)\b/i, label: "Obstacle & Trail" },
  { pattern: /\bbarrel racing\b/i, label: "Barrel Racing" },
  { pattern: /\bteam roping\b/i, label: "Team Roping" },
  { pattern: /\bcalf roping\b/i, label: "Calf Roping" },
  { pattern: /\bbreakaway(?:\s+roping)?\b/i, label: "Breakaway Roping" },
  { pattern: /\bsteer roping\b/i, label: "Steer Roping" },
  {
    pattern: /\b(?:steer wrestling|bull ?dogging)\b/i,
    label: "Steer Wrestling / Bull Dogging",
  },
];

export function inferFlyerDisciplineFromText(...texts: Array<string | null | undefined>) {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return null;
  }

  for (const { pattern, label } of DISCIPLINE_INFERENCE_PATTERNS) {
    if (pattern.test(combined)) {
      return label;
    }
  }

  return null;
}

export function disciplineLabelToValue(
  label: FlyerExtractionDisciplineLabel | null,
): SubmissionDiscipline | null {
  if (!label) {
    return null;
  }

  return DISCIPLINE_LABEL_TO_VALUE[label] ?? null;
}
