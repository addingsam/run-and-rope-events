import { NextResponse } from "next/server";
import { sampleEvents } from "@/lib/events/sample-events";

export async function GET() {
  return NextResponse.json({ events: sampleEvents });
}
