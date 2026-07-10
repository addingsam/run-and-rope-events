"use client";

import Link from "next/link";

export type DrawingTool = "none" | "pin-radius" | "freehand" | "rectangle";

interface MapDrawingToolbarProps {
  activeTool: DrawingTool;
  isSubscriber: boolean;
  pinRadiusMiles: number;
  hasDrawings: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onPinRadiusChange: (miles: number) => void;
  onClear: () => void;
  onLockedClick: () => void;
}

const TOOLS: { id: DrawingTool; label: string }[] = [
  { id: "pin-radius", label: "Pin + radius" },
  { id: "freehand", label: "Freehand" },
  { id: "rectangle", label: "Box" },
];

export function MapDrawingToolbar({
  activeTool,
  isSubscriber,
  pinRadiusMiles,
  hasDrawings,
  onToolChange,
  onPinRadiusChange,
  onClear,
  onLockedClick,
}: MapDrawingToolbarProps) {
  function handleToolClick(tool: DrawingTool) {
    if (!isSubscriber) {
      onLockedClick();
      return;
    }

    onToolChange(activeTool === tool ? "none" : tool);
  }

  return (
    <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl border border-amber-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Drawing tools
      </p>
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => handleToolClick(tool.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTool === tool.id
                ? "bg-amber-700 text-white"
                : "border border-amber-200 bg-[#fffaf3] text-amber-950 hover:bg-amber-50"
            } ${!isSubscriber ? "opacity-70" : ""}`}
          >
            {!isSubscriber ? "🔒 " : ""}
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            if (!isSubscriber) {
              onLockedClick();
              return;
            }
            onClear();
          }}
          disabled={!hasDrawings}
          className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 enabled:hover:bg-amber-50 disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      {activeTool === "pin-radius" && isSubscriber && (
        <div className="mt-3">
          <label className="text-xs font-medium text-amber-900">
            Radius: {pinRadiusMiles} mi
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={pinRadiusMiles}
            onChange={(event) => onPinRadiusChange(Number(event.target.value))}
            className="mt-1 w-full accent-amber-700"
          />
          <p className="mt-1 text-[11px] text-amber-800/70">Click the map to drop a pin.</p>
        </div>
      )}

      {!isSubscriber && (
        <p className="mt-2 text-[11px] text-amber-800/70">
          Drawing tools require a subscription.{" "}
          <Link href="/subscribe" className="font-semibold text-amber-800 hover:text-amber-950">
            Subscribe
          </Link>
        </p>
      )}
    </div>
  );
}
