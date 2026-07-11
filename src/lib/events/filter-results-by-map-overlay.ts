import type { EventSearchResultItem, SearchResultEntry } from "@/types/event-search";
import type { SavedMapOverlay } from "@/types/saved-search";

export function hasActiveMapOverlay(overlay: SavedMapOverlay): boolean {
  return Boolean(overlay.pinRadius) || overlay.shapes.length > 0;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusMiles = 3958.8;
  const lat1Radians = (lat1 * Math.PI) / 180;
  const lat2Radians = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointInPolygon(lng: number, lat: number, ring: number[][]) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const xi = ring[index][0];
    const yi = ring[index][1];
    const xj = ring[previous][0];
    const yj = ring[previous][1];

    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function matchesMapOverlay(lat: number, lng: number, overlay: SavedMapOverlay) {
  if (!hasActiveMapOverlay(overlay)) {
    return true;
  }

  const matches: boolean[] = [];

  if (overlay.pinRadius) {
    const distance = haversineMiles(
      lat,
      lng,
      overlay.pinRadius.lat,
      overlay.pinRadius.lng,
    );
    matches.push(distance <= overlay.pinRadius.radiusMiles);
  }

  if (overlay.shapes.length > 0) {
    matches.push(
      overlay.shapes.some((shape) => {
        const ring = shape.coordinates[0];
        return ring ? pointInPolygon(lng, lat, ring) : false;
      }),
    );
  }

  return matches.some(Boolean);
}

export function filterResultsByMapOverlay(
  results: SearchResultEntry[],
  overlay: SavedMapOverlay,
) {
  if (!hasActiveMapOverlay(overlay)) {
    return results;
  }

  return results.filter((entry) => {
    const { latitude, longitude } = entry.item;
    if (latitude == null || longitude == null) {
      return false;
    }

    return matchesMapOverlay(latitude, longitude, overlay);
  });
}

export function filterEventItemsByMapOverlay(
  events: EventSearchResultItem[],
  overlay: SavedMapOverlay,
) {
  if (!hasActiveMapOverlay(overlay)) {
    return events;
  }

  return events.filter((event) => {
    const { latitude, longitude } = event;
    if (latitude == null || longitude == null) {
      return false;
    }

    return matchesMapOverlay(latitude, longitude, overlay);
  });
}
