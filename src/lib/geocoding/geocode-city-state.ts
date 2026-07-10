export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

function requireEnv(name: string): string | null {
  return process.env[name] ?? null;
}

async function geocodeWithMapbox(city: string, state: string): Promise<GeocodedLocation | null> {
  const token = requireEnv("MAPBOX_ACCESS_TOKEN");
  if (!token) {
    return null;
  }

  const query = encodeURIComponent(`${city}, ${state}, United States`);
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&types=place,locality&limit=1`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    features?: { center?: [number, number] }[];
  };

  const center = data.features?.[0]?.center;
  if (!center) {
    return null;
  }

  const [longitude, latitude] = center;
  return { latitude, longitude };
}

async function geocodeWithNominatim(city: string, state: string): Promise<GeocodedLocation | null> {
  const query = encodeURIComponent(`${city}, ${state}, USA`);
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    {
      headers: { "User-Agent": "run-and-rope-events/1.0" },
      next: { revalidate: 0 },
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { lat?: string; lon?: string }[];
  const match = data[0];
  if (!match?.lat || !match?.lon) {
    return null;
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
  };
}

export async function geocodeCityState(city: string, state: string): Promise<GeocodedLocation> {
  const trimmedCity = city.trim();
  const trimmedState = state.trim();

  if (!trimmedCity || !trimmedState) {
    throw new Error("City and state are required for geocoding.");
  }

  const mapboxResult = await geocodeWithMapbox(trimmedCity, trimmedState);
  if (mapboxResult) {
    return mapboxResult;
  }

  const nominatimResult = await geocodeWithNominatim(trimmedCity, trimmedState);
  if (nominatimResult) {
    return nominatimResult;
  }

  throw new Error(`Could not geocode ${trimmedCity}, ${trimmedState}.`);
}
