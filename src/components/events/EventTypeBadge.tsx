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
        <RodeoLevelColorBadge key={level} level={level} />
      ))}
    </span>
  );
}

interface RodeoLevelColorBadgeProps {
  level: string;
  className?: string;
}

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
