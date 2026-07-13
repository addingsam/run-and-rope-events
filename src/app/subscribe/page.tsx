import { Suspense } from "react";
import { PricingPlanCard } from "@/components/subscribe/PricingPlanCard";
import { SubscribeAlerts } from "@/components/subscribe/SubscribeAlerts";
import { APP_NAME } from "@/lib/constants";
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

      <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-[var(--color-accent-primary)]/25 bg-white px-6 py-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-[var(--color-accent-primary)]">
          Subscribe to {APP_NAME}
        </h1>
        <p className="mt-3 text-[var(--color-accent-primary)]/80">
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
