import { NextResponse } from "next/server";
import { getLocationSuggestions } from "@/lib/geocoding/location-suggestions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const suggestions = await getLocationSuggestions(query);
    return NextResponse.json({ suggestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestion lookup failed.";
    return NextResponse.json({ error: message, suggestions: [] }, { status: 500 });
  }
}
