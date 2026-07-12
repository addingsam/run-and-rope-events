"use client";

import {
  themeActiveToggleClassName,
  themeInactiveToggleClassName,
  themeToggleGroupClassName,
} from "@/lib/theme/form-classes";
import type { SearchMode } from "@/types/event-search";

interface SearchModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function SearchModeToggle({ mode, onChange }: SearchModeToggleProps) {
  return (
    <div className={themeToggleGroupClassName}>
      <button
        type="button"
        onClick={() => onChange("map")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "map" ? themeActiveToggleClassName : themeInactiveToggleClassName
        }`}
      >
        Map area
      </button>
      <button
        type="button"
        onClick={() => onChange("radius")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "radius" ? themeActiveToggleClassName : themeInactiveToggleClassName
        }`}
      >
        Radius search
      </button>
      <button
        type="button"
        onClick={() => onChange("route")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "route" ? themeActiveToggleClassName : themeInactiveToggleClassName
        }`}
      >
        Search along my route
      </button>
    </div>
  );
}
