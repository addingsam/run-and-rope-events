import { NextResponse } from "next/server";
import { requireSubscriberUser } from "@/lib/saved-searches/notifications";
import {
  deleteSavedSearch,
  updateSavedSearchAlerts,
} from "@/lib/saved-searches/repository";

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

    const search = await updateSavedSearchAlerts(user.id, id, body.alertsEnabled);
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
