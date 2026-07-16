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
  { value: "bareback_riding", label: "Bareback Riding (BB)" },
  { value: "saddle_bronc", label: "Saddle Bronc (SB)" },
  { value: "bull_riding", label: "Bull Riding (BR)" },
  { value: "ranch_bronc_riding", label: "Ranch Bronc Riding (RB)" },
  { value: "barrel_racing", label: "Barrel Racing (CBR/CGBR)" },
  { value: "team_roping", label: "Team Roping" },
  { value: "calf_roping", label: "Calf Roping / Tie Down Roping (CR/TD)" },
  { value: "breakaway_roping", label: "Breakaway Roping (BA/CBA/BAW/CGBKR)" },
  { value: "steer_roping", label: "Steer Roping (SR/SRADM)" },
  { value: "steer_wrestling", label: "Steer Wrestling / Bull Dogging (SW/BD)" },
  { value: "cowboy_mounted_shooting", label: "Cowboy Mounted Shooting" },
  { value: "ranch_horse", label: "Ranch Horse" },
  { value: "obstacle_trail", label: "Obstacle & Trail" },
] as const satisfies readonly { value: SubmissionDiscipline; label: string }[];

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
] as const satisfies readonly SubmissionDiscipline[];

export function isJackpotOnlyDiscipline(discipline: SubmissionDiscipline) {
  return (JACKPOT_ONLY_DISCIPLINES as readonly SubmissionDiscipline[]).includes(discipline);
}

export function isRodeoRoughStockDiscipline(discipline: SubmissionDiscipline) {
  return (RODEO_ROUGH_STOCK_DISCIPLINES as readonly SubmissionDiscipline[]).includes(discipline);
}

export function getDisciplineOptionsForFormat(format: SubmissionFormat) {
  if (format === "jackpot") {
    return DISCIPLINE_OPTIONS.filter((option) => !isRodeoRoughStockDiscipline(option.value));
  }

  return DISCIPLINE_OPTIONS.filter((option) => !isJackpotOnlyDiscipline(option.value));
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

export function getDisciplineLabel(discipline: SubmissionDiscipline) {
  return disciplineLabelMap[discipline];
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
  "barrel-racing": "Barrel Racing (CBR/CGBR)",
  "team-roping": "Team Roping",
  "calf-roping": "Calf Roping / Tie Down Roping (CR/TD)",
  breakaway: "Breakaway Roping (BA/CBA/BAW/CGBKR)",
  "breakaway-roping": "Breakaway Roping (BA/CBA/BAW/CGBKR)",
};

export function getDisciplineLabelFromSlug(discipline: string) {
  return (
    legacyDisciplineLabelMap[discipline] ??
    disciplineLabelMap[discipline as SubmissionDiscipline] ??
    discipline.replaceAll("_", " ")
  );
}

export function formatDisciplineLabels(disciplines: SubmissionDiscipline[]) {
  return disciplines.map(getDisciplineLabel).join(", ");
}
