import { MAP_PIN_LEGEND } from "@/lib/constants/eventColors";

function getLegendLabelStyles(color: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${color} 30%, white)`,
    color: "#1f2937",
    borderColor: color,
  } as const;
}

export function MapPinLegend() {
  return (
    <div
      className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm"
      aria-label="Map pin legend"
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#374151]">
        Pin colors
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {MAP_PIN_LEGEND.map(({ label, color }) => (
          <li key={label}>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm"
              style={getLegendLabelStyles(color)}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
