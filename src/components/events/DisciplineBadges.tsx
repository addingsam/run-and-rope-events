import { DisciplineColorBadge } from "@/components/events/EventTypeBadge";

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
        <DisciplineColorBadge key={discipline} discipline={discipline} />
      ))}
    </div>
  );
}
