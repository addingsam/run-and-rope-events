import { NextResponse } from "next/server";
import {
  getStripeClient,
  getStripeWebhookSecret,
} from "@/lib/stripe/client";
import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "@/lib/stripe/webhooks";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
