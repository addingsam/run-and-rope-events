import type { RodeoLevel, SubmissionDiscipline, SubmissionFormat } from "@/types/event-submission";

export const FORMAT_OPTIONS = [
  { value: "jackpot", label: "Jackpot" },
  { value: "rodeo", label: "Rodeo" },
] as const satisfies readonly { value: SubmissionFormat; label: string }[];

export const RODEO_LEVEL_OPTIONS = [
  { value: "youth", label: "Youth Rodeo" },
  { value: "open", label: "Open Rodeo" },
  { value: "amateur", label: "Amateur Rodeo" },
] as const satisfies readonly { value: RodeoLevel; label: string }[];

export const DISCIPLINE_OPTIONS = [
  { value: "bareback_riding", label: "Bareback Riding (BB)", displayLabel: "Bareback Riding" },
  { value: "saddle_bronc", label: "Saddle Bronc (SB)", displayLabel: "Saddle Bronc" },
  { value: "bull_riding", label: "Bull Riding (BR)", displayLabel: "Bull Riding" },
  {
    value: "ranch_bronc_riding",
    label: "Ranch Bronc Riding (RB)",
    displayLabel: "Ranch Bronc Riding",
  },
  {
    value: "barrel_racing",
    label: "Barrel Racing (CBR/CGBR)",
    displayLabel: "Barrel Racing",
  },
  { value: "team_roping", label: "Team Roping", displayLabel: "Team Roping" },
  {
    value: "calf_roping",
    label: "Calf Roping / Tie Down Roping (CR/TD)",
    displayLabel: "Calf Roping / Tie Down Roping",
  },
  {
    value: "breakaway_roping",
    label: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
    displayLabel: "Breakaway Roping",
  },
  { value: "steer_roping", label: "Steer Roping (SR/SRADM)", displayLabel: "Steer Roping" },
  {
    value: "steer_wrestling",
    label: "Steer Wrestling / Bull Dogging (SW/BD)",
    displayLabel: "Steer Wrestling / Bull Dogging",
  },
  {
    value: "cowboy_mounted_shooting",
    label: "Cowboy Mounted Shooting",
    displayLabel: "Cowboy Mounted Shooting",
  },
  { value: "ranch_horse", label: "Ranch Horse", displayLabel: "Ranch Horse" },
  { value: "obstacle_trail", label: "Obstacle & Trail", displayLabel: "Obstacle & Trail" },
  {
    value: "pole_bending",
    label: "Pole Bending (Poles)",
    displayLabel: "Pole Bending",
  },
] as const satisfies readonly {
  value: SubmissionDiscipline;
  label: string;
  displayLabel: string;
}[];

export const RODEO_ROUGH_STOCK_DISCIPLINES = [
  "bareback_riding",
  "saddle_bronc",
  "bull_riding",
  "ranch_bronc_riding",
] as const satisfies readonly SubmissionDiscipline[];

export const JACKPOT_ONLY_DISCIPLINES = [
  "cowboy_mounted_shooting",
  "ranch_horse",
  "obstacle_trail",
  "pole_bending",
] as const satisfies readonly SubmissionDiscipline[];

export function isJackpotOnlyDiscipline(discipline: SubmissionDiscipline) {
  return (JACKPOT_ONLY_DISCIPLINES as readonly SubmissionDiscipline[]).includes(discipline);
}

export function isRodeoRoughStockDiscipline(discipline: SubmissionDiscipline) {
  return (RODEO_ROUGH_STOCK_DISCIPLINES as readonly SubmissionDiscipline[]).includes(discipline);
}

export function getDisciplineOptionsForFormat(format: SubmissionFormat) {
  const options =
    format === "jackpot"
      ? DISCIPLINE_OPTIONS.filter((option) => !isRodeoRoughStockDiscipline(option.value))
      : DISCIPLINE_OPTIONS.filter((option) => !isJackpotOnlyDiscipline(option.value));

  return options.map(({ value, displayLabel }) => ({
    value,
    label: displayLabel,
  }));
}

export function filterDisciplinesForFormat(
  disciplines: SubmissionDiscipline[],
  format: SubmissionFormat,
): SubmissionDiscipline[] {
  if (format === "jackpot") {
    return disciplines.filter((discipline) => !isRodeoRoughStockDiscipline(discipline));
  }

  return disciplines.filter((discipline) => !isJackpotOnlyDiscipline(discipline));
}

export function resolveFormatFromDisciplines(
  disciplines: SubmissionDiscipline[],
  fallback: SubmissionFormat,
): SubmissionFormat {
  if (disciplines.some(isJackpotOnlyDiscipline)) {
    return "jackpot";
  }

  return fallback;
}

const formatLabelMap = Object.fromEntries(
  FORMAT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SubmissionFormat, string>;

const rodeoLevelLabelMap = Object.fromEntries(
  RODEO_LEVEL_OPTIONS.map((option) => [option.value, option.label]),
) as Record<RodeoLevel, string>;

const disciplineLabelMap = Object.fromEntries(
  DISCIPLINE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<SubmissionDiscipline, string>;

export function getFormatLabel(format: SubmissionFormat) {
  return formatLabelMap[format];
}

export function getRodeoLevelLabel(level: RodeoLevel) {
  return rodeoLevelLabelMap[level];
}

const disciplineDisplayLabelMap = Object.fromEntries(
  DISCIPLINE_OPTIONS.map((option) => [option.value, option.displayLabel]),
) as Record<SubmissionDiscipline, string>;

export function getDisciplineLabel(discipline: SubmissionDiscipline) {
  return disciplineLabelMap[discipline];
}

export function getDisciplineDisplayLabel(discipline: SubmissionDiscipline) {
  return disciplineDisplayLabelMap[discipline];
}

const legacyDisciplineLabelMap: Record<string, string> = {
  bareback_riding: "Bareback Riding (BB)",
  saddle_bronc: "Saddle Bronc (SB)",
  bull_riding: "Bull Riding (BR)",
  ranch_bronc_riding: "Ranch Bronc Riding (RB)",
  barrel_racing: "Barrel Racing (CBR/CGBR)",
  team_roping: "Team Roping",
  calf_roping: "Calf Roping / Tie Down Roping (CR/TD)",
  breakaway_roping: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  steer_roping: "Steer Roping (SR/SRADM)",
  steer_wrestling: "Steer Wrestling / Bull Dogging (SW/BD)",
  cowboy_mounted_shooting: "Cowboy Mounted Shooting",
  ranch_horse: "Ranch Horse",
  obstacle_trail: "Obstacle & Trail",
  pole_bending: "Pole Bending (Poles)",
  "barrel-racing": "Barrel Racing (CBR/CGBR)",
  "team-roping": "Team Roping",
  "calf-roping": "Calf Roping / Tie Down Roping (CR/TD)",
  breakaway: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  "breakaway-roping": "Breakaway Roping (BA/CBA/BAW/CGBKR)",
};

const legacyDisciplineDisplayLabelMap: Record<string, string> = {
  bareback_riding: "Bareback Riding",
  saddle_bronc: "Saddle Bronc",
  bull_riding: "Bull Riding",
  ranch_bronc_riding: "Ranch Bronc Riding",
  barrel_racing: "Barrel Racing",
  team_roping: "Team Roping",
  calf_roping: "Calf Roping / Tie Down Roping",
  breakaway_roping: "Breakaway Roping",
  steer_roping: "Steer Roping",
  steer_wrestling: "Steer Wrestling / Bull Dogging",
  cowboy_mounted_shooting: "Cowboy Mounted Shooting",
  ranch_horse: "Ranch Horse",
  obstacle_trail: "Obstacle & Trail",
  pole_bending: "Pole Bending",
  "barrel-racing": "Barrel Racing",
  "team-roping": "Team Roping",
  "calf-roping": "Calf Roping / Tie Down Roping",
  breakaway: "Breakaway Roping",
  "breakaway-roping": "Breakaway Roping",
};

export function getDisciplineLabelFromSlug(discipline: string) {
  return (
    legacyDisciplineLabelMap[discipline] ??
    disciplineLabelMap[discipline as SubmissionDiscipline] ??
    discipline.replaceAll("_", " ")
  );
}

export function getDisciplineDisplayLabelFromSlug(discipline: string) {
  return (
    legacyDisciplineDisplayLabelMap[discipline] ??
    disciplineDisplayLabelMap[discipline as SubmissionDiscipline] ??
    discipline.replaceAll("_", " ")
  );
}

export function formatDisciplineLabels(disciplines: SubmissionDiscipline[]) {
  return disciplines.map(getDisciplineLabel).join(", ");
}

export function formatDisciplineDisplayLabels(disciplines: SubmissionDiscipline[]) {
  return disciplines.map(getDisciplineDisplayLabel).join(", ");
}
