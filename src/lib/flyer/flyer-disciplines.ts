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
  bb: "Bareback Riding (BB)",
  bareback: "Bareback Riding (BB)",
  "bareback riding": "Bareback Riding (BB)",
  sb: "Saddle Bronc (SB)",
  "saddle bronc": "Saddle Bronc (SB)",
  br: "Bull Riding (BR)",
  "bull riding": "Bull Riding (BR)",
  rb: "Ranch Bronc Riding (RB)",
  "ranch bronc": "Ranch Bronc Riding (RB)",
  "ranch bronc riding": "Ranch Bronc Riding (RB)",
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
  "calf roping": "Calf Roping / Tie Down Roping (CR/TD)",
  cr: "Calf Roping / Tie Down Roping (CR/TD)",
  td: "Calf Roping / Tie Down Roping (CR/TD)",
  "tie down": "Calf Roping / Tie Down Roping (CR/TD)",
  "tie-down": "Calf Roping / Tie Down Roping (CR/TD)",
  "tie down roping": "Calf Roping / Tie Down Roping (CR/TD)",
  "tie-down roping": "Calf Roping / Tie Down Roping (CR/TD)",
  tiedown: "Calf Roping / Tie Down Roping (CR/TD)",
  "tiedown roping": "Calf Roping / Tie Down Roping (CR/TD)",
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

function dedupeDisciplineLabels(
  labels: Array<FlyerExtractionDisciplineLabel | null | undefined>,
): FlyerExtractionDisciplineLabel[] {
  const seen = new Set<FlyerExtractionDisciplineLabel>();
  const result: FlyerExtractionDisciplineLabel[] = [];

  for (const label of labels) {
    if (!label || seen.has(label)) {
      continue;
    }

    seen.add(label);
    result.push(label);
  }

  return result;
}

export function normalizeFlyerDiscipline(value: unknown): FlyerExtractionDisciplineLabel | null {
  if (typeof value !== "string") {
    return null;
  }

  return canonicalDisciplineLabel(value);
}

export function normalizeFlyerDisciplines(value: unknown): FlyerExtractionDisciplineLabel[] {
  if (Array.isArray(value)) {
    return dedupeDisciplineLabels(
      value.map((item) => (typeof item === "string" ? canonicalDisciplineLabel(item) : null)),
    );
  }

  const single = normalizeFlyerDiscipline(value);
  return single ? [single] : [];
}

const DISCIPLINE_INFERENCE_PATTERNS: Array<{
  pattern: RegExp;
  label: FlyerExtractionDisciplineLabel;
}> = [
  { pattern: /\bbareback(?:\s+riding)?\b/i, label: "Bareback Riding (BB)" },
  { pattern: /\bsaddle bronc\b/i, label: "Saddle Bronc (SB)" },
  { pattern: /\bbull riding\b/i, label: "Bull Riding (BR)" },
  { pattern: /\branch bronc(?:\s+riding)?\b/i, label: "Ranch Bronc Riding (RB)" },
  {
    pattern: /\b(?:cmsa|cowboy mounted shooting(?:\s+association)?|mounted shooting)\b/i,
    label: "Cowboy Mounted Shooting",
  },
  { pattern: /\branch horse\b/i, label: "Ranch Horse" },
  { pattern: /\bobstacle(?:\s*(?:&|and)\s*trail| course)\b/i, label: "Obstacle & Trail" },
  { pattern: /\bbarrel racing\b/i, label: "Barrel Racing" },
  { pattern: /\bteam roping\b/i, label: "Team Roping" },
  {
    pattern: /\b(?:calf roping|tie[\s-]?down(?:\s+roping)?|tiedown(?:\s+roping)?)\b/i,
    label: "Calf Roping / Tie Down Roping (CR/TD)",
  },
  { pattern: /\b(?:cr|td)\b/i, label: "Calf Roping / Tie Down Roping (CR/TD)" },
  { pattern: /\bbreakaway(?:\s+roping)?\b/i, label: "Breakaway Roping" },
  { pattern: /\bsteer roping\b/i, label: "Steer Roping" },
  {
    pattern: /\b(?:steer wrestling|bull ?dogging)\b/i,
    label: "Steer Wrestling / Bull Dogging",
  },
];

export function inferFlyerDisciplinesFromText(
  ...texts: Array<string | null | undefined>
): FlyerExtractionDisciplineLabel[] {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return [];
  }

  return dedupeDisciplineLabels(
    DISCIPLINE_INFERENCE_PATTERNS.filter(({ pattern }) => pattern.test(combined)).map(
      ({ label }) => label,
    ),
  );
}

/** @deprecated Use inferFlyerDisciplinesFromText */
export function inferFlyerDisciplineFromText(
  ...texts: Array<string | null | undefined>
): FlyerExtractionDisciplineLabel | null {
  return inferFlyerDisciplinesFromText(...texts)[0] ?? null;
}

export function disciplineLabelToValue(
  label: FlyerExtractionDisciplineLabel | null,
): SubmissionDiscipline | null {
  if (!label) {
    return null;
  }

  return DISCIPLINE_LABEL_TO_VALUE[label] ?? null;
}

export function disciplineLabelsToValues(
  labels: FlyerExtractionDisciplineLabel[],
): SubmissionDiscipline[] {
  return dedupeDisciplineLabels(labels)
    .map((label) => disciplineLabelToValue(label))
    .filter((value): value is SubmissionDiscipline => value !== null);
}
