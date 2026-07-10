import { NextResponse } from "next/server";
import { requireActiveEventAccess } from "@/lib/auth/event-access";
import { geocodeLocationQuery } from "@/lib/geocoding/geocode-query";
import { searchAlongRoute } from "@/lib/events/search-along-route";
import { searchEvents } from "@/lib/events/search-events";
import {
  DEFAULT_SEARCH_BUFFER,
  DEFAULT_SEARCH_RADIUS,
} from "@/lib/events/search-options";
import type {
  SearchBufferMiles,
  SearchFormat,
  SearchMode,
  SearchRadiusMiles,
  SearchRodeoLevel,
} from "@/types/event-search";
import type { SubmissionDiscipline } from "@/types/event-submission";
import { DISCIPLINE_OPTIONS } from "@/lib/events/submission-options";

const VALID_FORMATS = new Set<SearchFormat>(["jackpot", "rodeo", "either"]);
const VALID_RODEO_LEVELS = new Set<SearchRodeoLevel>(["youth", "open", "amateur", "pro"]);
const VALID_RADII = new Set<SearchRadiusMiles>([25, 50, 100, 200]);
const VALID_BUFFERS = new Set<SearchBufferMiles>([5, 10, 25]);
const VALID_MODES = new Set<SearchMode>(["radius", "route"]);
const VALID_DISCIPLINES = new Set(
  DISCIPLINE_OPTIONS.map((option) => option.value),
);

function parseDisciplines(value: string | null): SubmissionDiscipline[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is SubmissionDiscipline =>
      VALID_DISCIPLINES.has(item as SubmissionDiscipline),
    );
}

function parseCoordinate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function resolveCoordinates({
  label,
  lat,
  lng,
  fieldName,
}: {
  label: string;
  lat: number | null;
  lng: number | null;
  fieldName: string;
}) {
  if (lat !== null && lng !== null) {
    return { lat, lng };
  }

  if (!label.trim()) {
    throw new Error(`${fieldName} is required. Choose a location from autocomplete.`);
  }

  const geocoded = await geocodeLocationQuery(label);
  return {
    lat: geocoded.latitude,
    lng: geocoded.longitude,
  };
}

export async function GET(request: Request) {
  try {
    await requireActiveEventAccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied.";
    const status = message.includes("Authentication") ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  const { searchParams } = new URL(request.url);

  const mode = (searchParams.get("mode") ?? "radius") as SearchMode;
  const format = (searchParams.get("format") ?? "either") as SearchFormat;
  const rodeoLevel = (searchParams.get("rodeoLevel") ?? "") as SearchRodeoLevel | "";
  const disciplines = parseDisciplines(searchParams.get("disciplines"));
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  if (!VALID_MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid search mode." }, { status: 400 });
  }

  if (!VALID_FORMATS.has(format)) {
    return NextResponse.json({ error: "Invalid format." }, { status: 400 });
  }

  if (rodeoLevel && !VALID_RODEO_LEVELS.has(rodeoLevel)) {
    return NextResponse.json({ error: "Invalid rodeo level." }, { status: 400 });
  }

  try {
    if (mode === "route") {
      const bufferParam = Number(searchParams.get("buffer") ?? DEFAULT_SEARCH_BUFFER);
      const originLabel = searchParams.get("origin") ?? "";
      const destinationLabel = searchParams.get("destination") ?? "";
      const originLat = parseCoordinate(searchParams.get("originLat"));
      const originLng = parseCoordinate(searchParams.get("originLng"));
      const destinationLat = parseCoordinate(searchParams.get("destinationLat"));
      const destinationLng = parseCoordinate(searchParams.get("destinationLng"));

      if (!VALID_BUFFERS.has(bufferParam as SearchBufferMiles)) {
        return NextResponse.json({ error: "Invalid buffer distance." }, { status: 400 });
      }

      const origin = await resolveCoordinates({
        label: originLabel,
        lat: originLat,
        lng: originLng,
        fieldName: "Starting point",
      });
      const destination = await resolveCoordinates({
        label: destinationLabel,
        lat: destinationLat,
        lng: destinationLng,
        fieldName: "Destination",
      });

      const response = await searchAlongRoute({
        origin,
        destination,
        bufferMiles: bufferParam as SearchBufferMiles,
        format,
        rodeoLevel,
        disciplines,
        startDate,
        endDate,
      });

      return NextResponse.json(response);
    }

    const location = searchParams.get("location") ?? "";
    const radiusParam = Number(searchParams.get("radius") ?? DEFAULT_SEARCH_RADIUS);
    const latParam = parseCoordinate(searchParams.get("lat"));
    const lngParam = parseCoordinate(searchParams.get("lng"));

    if (!VALID_RADII.has(radiusParam as SearchRadiusMiles)) {
      return NextResponse.json({ error: "Invalid radius." }, { status: 400 });
    }

    const center = await resolveCoordinates({
      label: location,
      lat: latParam,
      lng: lngParam,
      fieldName: "Location",
    });

    const response = await searchEvents({
      format,
      rodeoLevel,
      disciplines,
      lat: center.lat,
      lng: center.lng,
      radiusMiles: radiusParam as SearchRadiusMiles,
      startDate,
      endDate,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    const status = message.includes("required") || message.includes("Could not geocode") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
