import { NextResponse } from "next/server";
import {
  baselineSavedSearchKnownEvents,
  requireSubscriberUser,
} from "@/lib/saved-searches/notifications";
import {
  deleteSavedSearch,
  getSavedSearchById,
  updateSavedSearchAlerts,
} from "@/lib/saved-searches/repository";
import type { SavedSearchParams } from "@/types/saved-search";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireSubscriberUser();
    const { id } = await context.params;
    const body = (await request.json()) as { alertsEnabled?: boolean };

    if (typeof body.alertsEnabled !== "boolean") {
      return NextResponse.json({ error: "alertsEnabled is required." }, { status: 400 });
    }

    let knownEventIds: string[] | undefined;
    if (body.alertsEnabled) {
      const existing = await getSavedSearchById(user.id, id);
      knownEventIds = await baselineSavedSearchKnownEvents(
        id,
        existing.search_params as SavedSearchParams,
      );
    }

    const search = await updateSavedSearchAlerts(
      user.id,
      id,
      body.alertsEnabled,
      knownEventIds,
    );
    return NextResponse.json({ search });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update saved search.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireSubscriberUser();
    const { id } = await context.params;
    await deleteSavedSearch(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete saved search.";
    const status = message.includes("Authentication") ? 401 : message.includes("Subscription") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
