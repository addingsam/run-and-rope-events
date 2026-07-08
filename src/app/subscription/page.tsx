import { PlanCard } from "@/components/subscription/PlanCard";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export const metadata = {
  title: "Subscription Plans",
};

export default function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-amber-950">Choose your plan</h1>
        <p className="mt-3 text-amber-900/75">
          Start free, upgrade when you need nationwide search and alerts, or list
          events as an organizer.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} highlighted={plan.id === "pro"} />
        ))}
      </div>
    </div>
  );
}
