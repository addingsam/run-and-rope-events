import { MAP_PIN_LEGEND } from "@/lib/constants/eventColors";

export function MapPinLegend() {
  return (
    <div
      className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm"
      aria-label="Map pin legend"
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Pin colors
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
        {MAP_PIN_LEGEND.map(({ label, color }) => (
          <li key={label} className="flex items-center gap-1.5 text-xs text-[var(--color-text-primary)]">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
