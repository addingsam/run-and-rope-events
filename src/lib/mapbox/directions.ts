import type { RoutePoint } from "@/lib/supabase/along-route";

export interface DrivingRoute {
  coordinates: [number, number][];
  distanceMiles: number;
  durationMinutes: number;
}

interface MapboxDirectionsResponse {
  routes?: {
    geometry?: {
      coordinates?: [number, number][];
    };
    distance?: number;
    duration?: number;
  }[];
  message?: string;
}

export async function getDrivingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
): Promise<DrivingRoute> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MAPBOX_ACCESS_TOKEN is required for route search.");
  }

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${token}`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) {
    throw new Error("Mapbox Directions request failed.");
  }

  const data = (await response.json()) as MapboxDirectionsResponse;
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    throw new Error(data.message ?? "No driving route found between those points.");
  }

  return {
    coordinates: route.geometry.coordinates,
    distanceMiles: (route.distance ?? 0) / 1609.344,
    durationMinutes: (route.duration ?? 0) / 60,
  };
}
