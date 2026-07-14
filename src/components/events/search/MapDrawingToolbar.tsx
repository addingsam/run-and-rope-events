"use client";

import {
  themeActiveToggleClassName,
  themeInactiveToggleClassName,
  themeMutedTextClassName,
  themePanelClassName,
} from "@/lib/theme/form-classes";

export type DrawingTool = "none" | "pin-radius" | "freehand" | "rectangle";

interface MapDrawingToolbarProps {
  activeTool: DrawingTool;
  pinRadiusMiles: number;
  onToolChange: (tool: DrawingTool) => void;
  onPinRadiusChange: (miles: number) => void;
  onClear: () => void;
}

const TOOLS: { id: DrawingTool; label: string }[] = [
  { id: "pin-radius", label: "Pin + radius" },
  { id: "freehand", label: "Freehand" },
  { id: "rectangle", label: "Box" },
];

export function MapDrawingToolbar({
  activeTool,
  pinRadiusMiles,
  onToolChange,
  onPinRadiusChange,
  onClear,
}: MapDrawingToolbarProps) {
  function handleToolClick(tool: DrawingTool) {
    onToolChange(activeTool === tool ? "none" : tool);
  }

  return (
    <div
      className={`absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] p-3 shadow-md backdrop-blur-sm ${themePanelClassName}`}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-primary)]">
        Drawing tools
      </p>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => handleToolClick(tool.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTool === tool.id ? themeActiveToggleClassName : themeInactiveToggleClassName
            }`}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${themeInactiveToggleClassName}`}
        >
          Clear
        </button>
      </div>

      {activeTool === "pin-radius" && (
        <div className="mt-3">
          <label className="text-xs font-medium text-[var(--color-text-primary)]">
            Radius: {pinRadiusMiles} mi
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={pinRadiusMiles}
            onChange={(event) => onPinRadiusChange(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-accent-cta)]"
          />
          <p className={`mt-1 text-[11px] ${themeMutedTextClassName}`}>
            Click the map to drop a pin.
          </p>
        </div>
      )}
    </div>
  );
}
