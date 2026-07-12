import type { SubmissionDiscipline } from "@/types/event-submission";
import { DisciplineColorBadge } from "@/components/events/EventTypeBadge";

interface SearchBadgeProps {
  children: React.ReactNode;
  variant?: "amber" | "stone" | "flyer";
}

export function SearchBadge({ children, variant = "amber" }: SearchBadgeProps) {
  const classes =
    variant === "flyer"
      ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
      : variant === "stone"
        ? "bg-[var(--color-background)] text-[var(--color-text-muted)]"
        : "bg-[var(--color-accent-primary)]/20 text-[var(--color-text-primary)]";

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
