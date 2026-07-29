import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";
import { ensureClerkProfile } from "@/lib/clerk/device-session";
import { recordTrustedDevice } from "@/lib/clerk/trusted-devices";

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
      const { user_id, client_id } = event.data;
      if (user_id && client_id) {
        try {
          await recordTrustedDevice({
            userId: user_id,
            clientId: client_id,
          });
        } catch (deviceError) {
          console.error("Failed to record trusted device:", deviceError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
