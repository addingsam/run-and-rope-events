import { NextResponse } from "next/server";
import { ensureClerkProfile } from "@/lib/clerk/device-session";
import {
  requireSubscriberUser,
  sendSavedSearchSavedConfirmation,
} from "@/lib/saved-searches/notifications";
import {
  createSavedSearch,
  listSavedSearches,
} from "@/lib/saved-searches/repository";
import { isSavedSearchAlertFrequency } from "@/lib/saved-searches/format-saved-search-criteria";
import { runSavedSearch } from "@/lib/saved-searches/run-saved-search";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";

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
      alertFrequency?: SavedSearchAlertFrequency;
      /** @deprecated Use alertFrequency */
      alertsEnabled?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!body.searchParams) {
      return NextResponse.json({ error: "Search parameters are required." }, { status: 400 });
    }

    const alertFrequency: SavedSearchAlertFrequency =
      body.alertFrequency && isSavedSearchAlertFrequency(body.alertFrequency)
        ? body.alertFrequency
        : body.alertsEnabled
          ? "daily"
          : "off";

    await ensureClerkProfile({ userId: user.id, email: user.email });

    const currentResults = await runSavedSearch(body.searchParams, body.mapOverlay ?? null);
    const knownEventIds = currentResults.results
      .filter((entry) => entry.kind === "event")
      .map((entry) => entry.item.id);

    const saved = await createSavedSearch({
      userId: user.id,
      name: body.name.trim(),
      searchParams: body.searchParams,
      mapOverlay: body.mapOverlay ?? null,
      alertFrequency,
      knownEventIds,
    });

    if (user.email) {
      await sendSavedSearchSavedConfirmation({
        to: user.email,
        searchName: saved.name,
        searchParams: body.searchParams,
        mapOverlay: body.mapOverlay ?? null,
        alertFrequency,
        previewResults: currentResults.results,
      }).catch((emailError) => {
        console.error("Failed to send saved search confirmation email:", emailError);
      });
    }

    return NextResponse.json({ search: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save search.";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("Subscription")
        ? 403
        : message.includes("invalid input syntax for type uuid")
          ? 503
          : 500;
    const publicMessage = message.includes("invalid input syntax for type uuid")
      ? "Saved searches are temporarily unavailable while a database update is applied. Please try again shortly."
      : message;
    return NextResponse.json({ error: publicMessage }, { status });
  }
}
