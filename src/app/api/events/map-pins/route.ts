import { NextResponse } from "next/server";
import { requireActiveEventAccess } from "@/lib/auth/event-access";
import { listFutureMapEvents } from "@/lib/events/list-future-map-events";

export async function GET() {
  try {
    await requireActiveEventAccess();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied.";
    const status = message.includes("Authentication") ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const results = await listFutureMapEvents();

    return NextResponse.json({
      results,
      counts: {
        events: results.length,
        proRodeos: 0,
        total: results.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load map events.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
