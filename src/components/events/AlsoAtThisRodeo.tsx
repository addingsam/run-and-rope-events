import { themeMutedTextClassName, themePanelClassName } from "@/lib/theme/form-classes";

interface AlsoAtThisRodeoProps {
  offerings: string[];
}

export function AlsoAtThisRodeo({ offerings }: AlsoAtThisRodeoProps) {
  if (offerings.length === 0) {
    return null;
  }

  return (
    <section
      className={`border-dashed p-5 sm:p-6 ${themePanelClassName}`}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        Also At This Rodeo
      </h2>
      <p className={`mt-2 ${themeMutedTextClassName}`}>
        Extra events and activities happening at the same rodeo.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {offerings.map((offering) => (
          <li key={offering}>
            <span className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm leading-5 text-[var(--color-text-primary)] shadow-sm">
              {offering}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
