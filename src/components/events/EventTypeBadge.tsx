import {
  getDisciplineColor,
  getEventPinColor,
  getRodeoLevelColor,
  usesLightBadgeText,
} from "@/lib/constants/eventColors";
import {
  getDisciplineLabelFromSlug,
  getRodeoLevelLabel,
} from "@/lib/events/submission-options";
import {
  formatRodeoLevelList,
  parseStoredRodeoLevels,
} from "@/lib/events/rodeo-levels";
import { themeBadgeClassName } from "@/lib/theme/form-classes";
import type { RodeoLevel } from "@/types/event-submission";

interface EventTypeBadgeProps {
  format: string | null;
  rodeoLevel?: string | null;
  disciplines?: string[];
  className?: string;
}

function getBadgeLabel({
  format,
  rodeoLevel,
  disciplines = [],
}: EventTypeBadgeProps): string {
  if (format === "rodeo" && rodeoLevel) {
    const levels = parseStoredRodeoLevels(rodeoLevel);
    if (levels.length > 0) {
      return formatRodeoLevelList(levels);
    }
  }

  const primaryDiscipline = disciplines[0];
  if (primaryDiscipline) {
    return getDisciplineLabelFromSlug(primaryDiscipline);
  }

  return "Event";
}

export function EventTypeBadge({
  format,
  rodeoLevel,
  disciplines = [],
  className = "",
}: EventTypeBadgeProps) {
  const color = getEventPinColor({ format, rodeoLevel, disciplines });
  const label = getBadgeLabel({ format, rodeoLevel, disciplines });
  const lightText = usesLightBadgeText(color);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{
        backgroundColor: color,
        color: lightText ? "#ffffff" : "#1f2937",
      }}
    >
      {label}
    </span>
  );
}

interface DisciplineColorBadgeProps {
  discipline: string;
  className?: string;
}

/** Map pin / legacy multicolor badge — keep for map-related color logic only. */
export function DisciplineColorBadge({ discipline, className = "" }: DisciplineColorBadgeProps) {
  const color = getDisciplineColor(discipline);
  const lightText = usesLightBadgeText(color);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{
        backgroundColor: color,
        color: lightText ? "#ffffff" : "#1f2937",
      }}
    >
      {getDisciplineLabelFromSlug(discipline)}
    </span>
  );
}

export function ThemeDisciplineBadge({ discipline, className = "" }: DisciplineColorBadgeProps) {
  return (
    <span className={`${themeBadgeClassName} ${className}`}>
      {getDisciplineLabelFromSlug(discipline)}
    </span>
  );
}

export function RodeoLevelsBadges({
  levelValue,
  className = "",
}: {
  levelValue: string | null | undefined;
  className?: string;
}) {
  const levels = parseStoredRodeoLevels(levelValue);

  if (levels.length === 0) {
    return null;
  }

  return (
    <span className={`inline-flex flex-wrap gap-2 ${className}`}>
      {levels.map((level) => (
        <ThemeRodeoLevelBadge key={level} level={level} />
      ))}
    </span>
  );
}

interface RodeoLevelColorBadgeProps {
  level: string;
  className?: string;
}

function getRodeoLevelBadgeLabel(level: string) {
  if (level === "pro") {
    return "Pro Rodeo";
  }

  if (level === "youth" || level === "open" || level === "amateur") {
    return getRodeoLevelLabel(level as RodeoLevel);
  }

  return level.replaceAll("_", " ");
}

export function ThemeRodeoLevelBadge({ level, className = "" }: RodeoLevelColorBadgeProps) {
  return (
    <span className={`${themeBadgeClassName} ${className}`}>{getRodeoLevelBadgeLabel(level)}</span>
  );
}

/** Map pin multicolor rodeo level badge — not used on event card thumbnails. */
export function RodeoLevelColorBadge({ level, className = "" }: RodeoLevelColorBadgeProps) {
  const color = getRodeoLevelColor(level);
  const lightText = usesLightBadgeText(color);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{
        backgroundColor: color,
        color: lightText ? "#ffffff" : "#1f2937",
      }}
    >
      {level === "pro"
        ? "Pro Rodeo"
        : level === "youth" || level === "open" || level === "amateur"
          ? getRodeoLevelLabel(level as RodeoLevel)
          : level.replaceAll("_", " ")}
    </span>
  );
}
