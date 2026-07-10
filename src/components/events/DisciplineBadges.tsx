import { getDisciplineLabelFromSlug } from "@/lib/events/submission-options";

interface DisciplineBadgesProps {
  disciplines: string[];
}

export function DisciplineBadges({ disciplines }: DisciplineBadgesProps) {
  if (disciplines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {disciplines.map((discipline) => (
        <span
          key={discipline}
          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900"
        >
          {getDisciplineLabelFromSlug(discipline)}
        </span>
      ))}
    </div>
  );
}
