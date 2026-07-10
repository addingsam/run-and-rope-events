import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import {
  enforceDeviceAndSessionLimits,
  ensureClerkProfile,
} from "@/lib/clerk/device-session";

function getPrimaryEmail(data: WebhookEvent["data"]) {
  if (!("email_addresses" in data) || !Array.isArray(data.email_addresses)) {
    return "";
  }

  const primaryId = "primary_email_address_id" in data ? data.primary_email_address_id : null;
  const primary = data.email_addresses.find((entry) => entry.id === primaryId);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

export async function POST(request: NextRequest) {
  let event: WebhookEvent;

  try {
    event = await verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const { id } = event.data;
      const email = getPrimaryEmail(event.data);
      await ensureClerkProfile({ userId: id, email });
    }

    if (event.type === "session.created") {
      const { id, user_id, client_id } = event.data;
      if (user_id && client_id) {
        await enforceDeviceAndSessionLimits({
          userId: user_id,
          sessionId: id,
          clientId: client_id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
