import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/verify-cron";
import {
  processArchivedEventNotifications,
  processSavedSearchAlerts,
} from "@/lib/saved-searches/notifications";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  try {
    const [searchAlerts, archivedAlerts] = await Promise.all([
      processSavedSearchAlerts({ dryRun }),
      dryRun ? Promise.resolve({ sent: 0, checked: 0, skippedNoEmail: 0, errors: [] }) : processArchivedEventNotifications(),
    ]);

    return NextResponse.json({
      dryRun,
      searchAlerts,
      archivedAlerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification job failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
