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

  try {
    const [searchAlerts, archivedAlerts] = await Promise.all([
      processSavedSearchAlerts(),
      processArchivedEventNotifications(),
    ]);

    return NextResponse.json({
      searchAlertsSent: searchAlerts.sent,
      archivedAlertsSent: archivedAlerts.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification job failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
