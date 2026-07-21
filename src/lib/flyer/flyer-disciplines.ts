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
  "bull riding": "Bull Riding (BR)",
  br: "Bull Riding (BR)",
  rb: "Ranch Bronc Riding (RB)",
  "ranch bronc": "Ranch Bronc Riding (RB)",
  "ranch bronc riding": "Ranch Bronc Riding (RB)",
  cmsa: "Cowboy Mounted Shooting",
  "cowboy mounted shooting association": "Cowboy Mounted Shooting",
  "cowboy mounted shooting": "Cowboy Mounted Shooting",
  "mounted shooting": "Cowboy Mounted Shooting",
  "steer wrestling": "Steer Wrestling / Bull Dogging (SW/BD)",
  "bull dogging": "Steer Wrestling / Bull Dogging (SW/BD)",
  bulldogging: "Steer Wrestling / Bull Dogging (SW/BD)",
  sw: "Steer Wrestling / Bull Dogging (SW/BD)",
  bd: "Steer Wrestling / Bull Dogging (SW/BD)",
  "ranch horse": "Ranch Horse",
  "obstacle & trail": "Obstacle & Trail",
  "obstacle and trail": "Obstacle & Trail",
  "pole bending": "Pole Bending (Poles)",
  poles: "Pole Bending (Poles)",
  pb: "Pole Bending (Poles)",
  "barrel racing": "Barrel Racing (CBR/CGBR)",
  cbr: "Barrel Racing (CBR/CGBR)",
  cgbr: "Barrel Racing (CBR/CGBR)",
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
  "breakaway roping": "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  breakaway: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  ba: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  cba: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  baw: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  cgbkr: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  "steer roping": "Steer Roping (SR/SRADM)",
  sr: "Steer Roping (SR/SRADM)",
  sradm: "Steer Roping (SR/SRADM)",
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
  { pattern: /\bbr\b/i, label: "Bull Riding (BR)" },
  { pattern: /\branch bronc(?:\s+riding)?\b/i, label: "Ranch Bronc Riding (RB)" },
  {
    pattern: /\b(?:cmsa|cowboy mounted shooting(?:\s+association)?|mounted shooting)\b/i,
    label: "Cowboy Mounted Shooting",
  },
  { pattern: /\branch horse\b/i, label: "Ranch Horse" },
  { pattern: /\bobstacle(?:\s*(?:&|and)\s*trail| course)\b/i, label: "Obstacle & Trail" },
  { pattern: /\b(?:pole bending|poles)\b/i, label: "Pole Bending (Poles)" },
  { pattern: /\bbarrel racing\b/i, label: "Barrel Racing (CBR/CGBR)" },
  { pattern: /\b(?:cbr|cgbr)\b/i, label: "Barrel Racing (CBR/CGBR)" },
  { pattern: /\bteam roping\b/i, label: "Team Roping" },
  {
    pattern: /\b(?:calf roping|tie[\s-]?down(?:\s+roping)?|tiedown(?:\s+roping)?)\b/i,
    label: "Calf Roping / Tie Down Roping (CR/TD)",
  },
  { pattern: /\b(?:cr|td)\b/i, label: "Calf Roping / Tie Down Roping (CR/TD)" },
  { pattern: /\bbreakaway(?:\s+roping)?\b/i, label: "Breakaway Roping (BA/CBA/BAW/CGBKR)" },
  { pattern: /\b(?:cba|baw|cgbkr)\b/i, label: "Breakaway Roping (BA/CBA/BAW/CGBKR)" },
  { pattern: /\bba\b/i, label: "Breakaway Roping (BA/CBA/BAW/CGBKR)" },
  { pattern: /\bsteer roping\b/i, label: "Steer Roping (SR/SRADM)" },
  { pattern: /\bsradm\b/i, label: "Steer Roping (SR/SRADM)" },
  { pattern: /\bsr\b/i, label: "Steer Roping (SR/SRADM)" },
  {
    pattern: /\b(?:steer wrestling|bull ?dogging|sw|bd)\b/i,
    label: "Steer Wrestling / Bull Dogging (SW/BD)",
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
