import type { SearchResultEntry } from "@/types/event-search";

export type MapSelection =
  | { type: "event"; id: string }
  | { type: "pro_rodeo"; id: string }
  | { type: "state_cluster"; state: string }
  | null;

export function getResultKey(entry: SearchResultEntry) {
  return entry.kind === "pro_rodeo" ? `pro:${entry.item.id}` : `event:${entry.item.id}`;
}

export function selectionFromKey(key: string | null): MapSelection {
  if (!key) {
    return null;
  }

  if (key.startsWith("pro:")) {
    return { type: "pro_rodeo", id: key.slice(4) };
  }

  if (key.startsWith("event:")) {
    return { type: "event", id: key.slice(6) };
  }

  if (key.startsWith("state:")) {
    return { type: "state_cluster", state: key.slice(6) };
  }

  return null;
}

export function getRodeoLevelBadge(level: string | null) {
  switch (level) {
    case "youth":
      return "Y";
    case "open":
      return "O";
    case "amateur":
      return "A";
    case "pro":
      return "Pro";
    default:
      return "";
  }
}

export function createCircleGeoJson(lng: number, lat: number, radiusMiles: number) {
  const points = 64;
  const coordinates: [number, number][] = [];
  const distanceX = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusMiles / 69;

  for (let i = 0; i < points; i += 1) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coordinates.push([lng + x, lat + y]);
  }

  coordinates.push(coordinates[0]);

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates],
    },
  };
}
