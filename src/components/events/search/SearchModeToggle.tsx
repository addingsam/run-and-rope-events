"use client";

import type { SearchMode } from "@/types/event-search";

interface SearchModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function SearchModeToggle({ mode, onChange }: SearchModeToggleProps) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-amber-200 bg-[#fffaf3] p-1">
      <button
        type="button"
        onClick={() => onChange("map")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "map"
            ? "bg-amber-700 text-white"
            : "text-amber-900 hover:bg-amber-100"
        }`}
      >
        Map area
      </button>
      <button
        type="button"
        onClick={() => onChange("radius")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "radius"
            ? "bg-amber-700 text-white"
            : "text-amber-900 hover:bg-amber-100"
        }`}
      >
        Radius search
      </button>
      <button
        type="button"
        onClick={() => onChange("route")}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          mode === "route"
            ? "bg-amber-700 text-white"
            : "text-amber-900 hover:bg-amber-100"
        }`}
      >
        Search along my route
      </button>
    </div>
  );
}
