import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron/verify-cron";
import { expireTrustedDevices } from "@/lib/clerk/trusted-devices";

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await expireTrustedDevices();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Device trust expiration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
