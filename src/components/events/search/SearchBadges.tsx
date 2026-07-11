import type { SubmissionDiscipline } from "@/types/event-submission";
import { DisciplineColorBadge } from "@/components/events/EventTypeBadge";

interface SearchBadgeProps {
  children: React.ReactNode;
  variant?: "amber" | "stone" | "flyer";
}

export function SearchBadge({ children, variant = "amber" }: SearchBadgeProps) {
  const classes =
    variant === "flyer"
      ? "bg-white/90 text-amber-950"
      : variant === "stone"
        ? "bg-stone-100 text-stone-800"
        : "bg-amber-100 text-amber-900";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

export function DisciplineSummary({ disciplines }: { disciplines: SubmissionDiscipline[] | string[] }) {
  if (disciplines.length === 0) {
    return <span>—</span>;
  }

  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {disciplines.map((discipline) => (
        <DisciplineColorBadge key={discipline} discipline={discipline} />
      ))}
    </span>
  );
}
