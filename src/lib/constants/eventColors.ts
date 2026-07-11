import type { SubmissionDiscipline } from "@/types/event-submission";

/** Neutral fallback when discipline or rodeo level is missing or unrecognized. */
export const FALLBACK_EVENT_COLOR = "#9CA3AF";

/**
 * Supabase `events.disciplines` stores snake_case slugs (text[]), e.g. barrel_racing.
 * Colors apply to jackpot events and discipline badges.
 */
export const DISCIPLINE_COLORS: Record<SubmissionDiscipline, string> = {
  barrel_racing: "#EF4444",
  breakaway_roping: "#A855F7",
  calf_roping: "#3B82F6",
  team_roping: "#22C55E",
  steer_wrestling: "#F97316",
  steer_roping: "#EC4899",
};

/**
 * Supabase `events.rodeo_level` stores text slugs: youth, open, amateur, pro.
 */
export const RODEO_LEVEL_COLORS: Record<string, string> = {
  youth: "#EAB308",
  amateur: "#14B8A6",
  open: "#6366F1",
  pro: "#B91C1C",
};

const legacyDisciplineAliases: Record<string, SubmissionDiscipline> = {
  barrel_racing: "barrel_racing",
  "barrel-racing": "barrel_racing",
  breakaway_roping: "breakaway_roping",
  "breakaway-roping": "breakaway_roping",
  breakaway: "breakaway_roping",
  calf_roping: "calf_roping",
  "calf-roping": "calf_roping",
  team_roping: "team_roping",
  "team-roping": "team_roping",
  steer_wrestling: "steer_wrestling",
  "steer-wrestling": "steer_wrestling",
  steer_roping: "steer_roping",
  "steer-roping": "steer_roping",
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDisciplineSlug(value: string): SubmissionDiscipline | null {
  const normalized = normalizeSlug(value);
  const alias = legacyDisciplineAliases[normalized];
  if (alias) {
    return alias;
  }

  if (normalized in DISCIPLINE_COLORS) {
    return normalized as SubmissionDiscipline;
  }

  return null;
}

export function getDisciplineColor(discipline: string | null | undefined): string {
  if (!discipline) {
    return FALLBACK_EVENT_COLOR;
  }

  const slug = normalizeDisciplineSlug(discipline);
  return slug ? DISCIPLINE_COLORS[slug] : FALLBACK_EVENT_COLOR;
}

export function getRodeoLevelColor(level: string | null | undefined): string {
  if (!level) {
    return FALLBACK_EVENT_COLOR;
  }

  return RODEO_LEVEL_COLORS[normalizeSlug(level)] ?? FALLBACK_EVENT_COLOR;
}

export function getEventPinColor({
  format,
  rodeoLevel,
  disciplines,
}: {
  format: string | null | undefined;
  rodeoLevel: string | null | undefined;
  disciplines: string[] | null | undefined;
}): string {
  if (format === "rodeo" && rodeoLevel) {
    return getRodeoLevelColor(rodeoLevel);
  }

  return getDisciplineColor(disciplines?.[0]);
}

/** Returns true when a light/white label reads better on the swatch. */
export function usesLightBadgeText(color: string): boolean {
  const hex = color.replace("#", "");
  if (hex.length !== 6) {
    return true;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance < 0.62;
}
