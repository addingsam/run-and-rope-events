import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAppUrl, getStripeClient } from "@/lib/stripe/client";
import { getStripeCheckoutCustomText } from "@/lib/stripe/checkout-branding";
import { getStripePriceId } from "@/lib/stripe/plans";
import type { PlanType } from "@/types/subscriber";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json()) as { planType?: PlanType };
    if (body.planType !== "monthly" && body.planType !== "annual") {
      return NextResponse.json({ error: "Invalid plan type." }, { status: 400 });
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Account email is required." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const priceId = getStripePriceId(body.planType);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      client_reference_id: userId,
      allow_promotion_codes: true,
      custom_text: getStripeCheckoutCustomText(),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        clerk_user_id: userId,
        plan_type: body.planType,
      },
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          plan_type: body.planType,
        },
      },
      success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe?canceled=1`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
