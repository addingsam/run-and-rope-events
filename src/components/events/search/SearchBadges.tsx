import type { SubmissionDiscipline } from "@/types/event-submission";
import { getDisciplineLabelFromSlug, getFormatLabel } from "@/lib/events/submission-options";
import type { SubmissionFormat } from "@/types/event-submission";

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

interface ThumbnailBadgesProps {
  title: string;
  format: string | null;
  disciplines: string[];
  hasFlyer: boolean;
}

export function ThumbnailBadges({
  title,
  format,
  disciplines,
  hasFlyer,
}: ThumbnailBadgesProps) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/35 to-black/10 p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {format && (
          <SearchBadge>
            {getFormatLabel(format as SubmissionFormat)}
          </SearchBadge>
        )}
        {disciplines.slice(0, 3).map((discipline) => (
          <SearchBadge key={discipline}>
            {getDisciplineLabelFromSlug(discipline)}
          </SearchBadge>
        ))}
        {disciplines.length > 3 && (
          <SearchBadge>+{disciplines.length - 3} more</SearchBadge>
        )}
        {hasFlyer && <SearchBadge variant="flyer">Flyer</SearchBadge>}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-white">{title}</h3>
    </div>
  );
}

export function DisciplineSummary({ disciplines }: { disciplines: SubmissionDiscipline[] | string[] }) {
  if (disciplines.length === 0) {
    return <span>—</span>;
  }

  return (
    <span>
      {disciplines.map((discipline) => getDisciplineLabelFromSlug(discipline)).join(", ")}
    </span>
  );
}
