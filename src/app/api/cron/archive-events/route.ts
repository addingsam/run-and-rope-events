import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/verify-cron";
import { archiveExpiredApprovedEvents } from "@/lib/events/archive-expired-events";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await archiveExpiredApprovedEvents();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Archive job failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
