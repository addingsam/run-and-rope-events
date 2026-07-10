import type { LocationSuggestion } from "@/types/event-search";

interface MapboxFeature {
  id: string;
  place_name: string;
  center?: [number, number];
  context?: { id: string; text: string; short_code?: string }[];
  text?: string;
  place_type?: string[];
}

function getContextValue(feature: MapboxFeature, prefix: string) {
  return feature.context?.find((item) => item.id.startsWith(prefix))?.text ?? "";
}

function getStateCode(feature: MapboxFeature) {
  const region = feature.context?.find((item) => item.id.startsWith("region."));
  if (!region) {
    return "";
  }

  const shortCode = region.short_code?.replace(/^us-/, "").toUpperCase();
  return shortCode ?? region.text ?? "";
}

function getZipCode(feature: MapboxFeature) {
  return feature.context?.find((item) => item.id.startsWith("postcode."))?.text ?? "";
}

function toSuggestion(feature: MapboxFeature): LocationSuggestion | null {
  const center = feature.center;
  if (!center) {
    return null;
  }

  const [lng, lat] = center;
  const city =
    feature.text ??
    (getContextValue(feature, "place.") ||
      getContextValue(feature, "locality.") ||
      getContextValue(feature, "district."));

  return {
    id: feature.id,
    label: feature.place_name,
    lat,
    lng,
    city,
    state: getStateCode(feature),
    zip: getZipCode(feature),
  };
}

export async function getLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return [];
  }

  const encoded = encodeURIComponent(trimmed);
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=US&types=place,locality,postcode&autocomplete=true&limit=6`,
    { next: { revalidate: 0 } },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { features?: MapboxFeature[] };
  return (data.features ?? [])
    .map(toSuggestion)
    .filter((item): item is LocationSuggestion => item !== null);
}
