import { Suspense } from "react";
import { PricingPlanCard } from "@/components/subscribe/PricingPlanCard";
import { SubscribeAlerts } from "@/components/subscribe/SubscribeAlerts";
import { PRICING_PLANS } from "@/lib/stripe/plans";

export const metadata = {
  title: "Subscribe",
};

export default function SubscribePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Suspense fallback={null}>
        <SubscribeAlerts />
      </Suspense>

      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-amber-950">Subscribe to Run & Rope Events</h1>
        <p className="mt-3 text-amber-900/75">
          Unlock nationwide event search, saved lists, email alerts, and full event details.
          Checkout is handled securely by Stripe.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => (
          <PricingPlanCard key={plan.planType} plan={plan} />
        ))}
      </div>
    </div>
  );
}
