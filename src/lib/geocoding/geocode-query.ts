import type { GeocodedLocation } from "@/lib/geocoding/geocode-city-state";
import { geocodeCityState } from "@/lib/geocoding/geocode-city-state";

async function geocodeZip(zip: string): Promise<GeocodedLocation | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return null;
  }

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(zip)}.json?access_token=${token}&country=US&types=postcode&limit=1`,
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

function parseCityState(query: string): { city: string; state: string } | null {
  const match = query.match(/^(.+?),\s*([A-Za-z]{2})$/);
  if (!match) {
    return null;
  }

  return {
    city: match[1].trim(),
    state: match[2].trim().toUpperCase(),
  };
}

export async function geocodeLocationQuery(query: string): Promise<GeocodedLocation> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Location is required.");
  }

  if (/^\d{5}$/.test(trimmed)) {
    const zipResult = await geocodeZip(trimmed);
    if (zipResult) {
      return zipResult;
    }
  }

  const cityState = parseCityState(trimmed);
  if (cityState) {
    return geocodeCityState(cityState.city, cityState.state);
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (token) {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${token}&country=US&types=place,locality,postcode&limit=1`,
      { next: { revalidate: 0 } },
    );

    if (response.ok) {
      const data = (await response.json()) as {
        features?: { center?: [number, number] }[];
      };
      const center = data.features?.[0]?.center;
      if (center) {
        const [longitude, latitude] = center;
        return { latitude, longitude };
      }
    }
  }

  throw new Error(`Could not geocode "${trimmed}".`);
}
