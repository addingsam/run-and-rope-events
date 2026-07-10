interface AlsoAtThisRodeoProps {
  offerings: string[];
}

export function AlsoAtThisRodeo({ offerings }: AlsoAtThisRodeoProps) {
  if (offerings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/90 p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-600">
        Also At This Rodeo
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Extra events and activities happening at the same rodeo.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {offerings.map((offering) => (
          <li key={offering}>
            <span className="inline-flex rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm leading-5 text-stone-700 shadow-sm">
              {offering}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
