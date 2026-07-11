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
  { value: "barrel_racing", label: "Barrel Racing" },
  { value: "team_roping", label: "Team Roping" },
  { value: "calf_roping", label: "Calf Roping" },
  { value: "breakaway_roping", label: "Breakaway Roping" },
  { value: "steer_roping", label: "Steer Roping" },
  { value: "steer_wrestling", label: "Steer Wrestling / Bull Dogging" },
  { value: "cowboy_mounted_shooting", label: "Cowboy Mounted Shooting" },
  { value: "ranch_horse", label: "Ranch Horse" },
  { value: "obstacle_trail", label: "Obstacle & Trail" },
] as const satisfies readonly { value: SubmissionDiscipline; label: string }[];

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
  barrel_racing: "Barrel Racing",
  team_roping: "Team Roping",
  calf_roping: "Calf Roping",
  breakaway_roping: "Breakaway Roping",
  steer_roping: "Steer Roping",
  steer_wrestling: "Steer Wrestling / Bull Dogging",
  cowboy_mounted_shooting: "Cowboy Mounted Shooting",
  ranch_horse: "Ranch Horse",
  obstacle_trail: "Obstacle & Trail",
  "barrel-racing": "Barrel Racing",
  "team-roping": "Team Roping",
  "calf-roping": "Calf Roping",
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

export function formatDisciplineLabels(disciplines: SubmissionDiscipline[]) {
  return disciplines.map(getDisciplineLabel).join(", ");
}
