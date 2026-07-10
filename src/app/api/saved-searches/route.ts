import { NextResponse } from "next/server";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/lib/saved-searches/repository";
import { runSavedSearch } from "@/lib/saved-searches/run-saved-search";
import type { SavedMapOverlay, SavedSearchParams } from "@/types/saved-search";

export async function GET() {
  try {
    const user = await requireSubscriberUser();
    const searches = await listSavedSearches(user.id);
    return NextResponse.json({ searches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved searches.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSubscriberUser();
    const body = (await request.json()) as {
      name?: string;
      searchParams?: SavedSearchParams;
      mapOverlay?: SavedMapOverlay | null;
      alertsEnabled?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!body.searchParams) {
      return NextResponse.json({ error: "Search parameters are required." }, { status: 400 });
    }

    const currentResults = await runSavedSearch(body.searchParams);
    const knownEventIds = currentResults.results
      .filter((entry) => entry.kind === "event")
      .map((entry) => entry.item.id);

    const saved = await createSavedSearch({
      userId: user.id,
      name: body.name.trim(),
      searchParams: body.searchParams,
      mapOverlay: body.mapOverlay ?? null,
      alertsEnabled: body.alertsEnabled ?? false,
      knownEventIds,
    });

    return NextResponse.json({ search: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save search.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
