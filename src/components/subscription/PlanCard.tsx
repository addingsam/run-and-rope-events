import type { SubscriptionPlan } from "@/types/subscription";

interface PlanCardProps {
  plan: SubscriptionPlan;
  highlighted?: boolean;
}

export function PlanCard({ plan, highlighted = false }: PlanCardProps) {
  return (
    <article
      className={`flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? "border-amber-700 bg-amber-950 text-white shadow-lg"
          : "border-amber-200 bg-white text-amber-950"
      }`}
    >
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        <p className={`mt-2 text-sm ${highlighted ? "text-amber-100" : "text-amber-900/70"}`}>
          {plan.description}
        </p>
      </div>
      <p className="mb-6 text-3xl font-bold">
        {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
        {plan.priceMonthly > 0 && (
          <span className={`text-sm font-normal ${highlighted ? "text-amber-200" : "text-amber-900/60"}`}>
            /month
          </span>
        )}
      </p>
      <ul className="mb-6 space-y-2 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden="true">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`mt-auto rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-white text-amber-950 hover:bg-amber-50"
            : "bg-amber-700 text-white hover:bg-amber-800"
        }`}
      >
        {plan.priceMonthly === 0 ? "Get started" : "Choose plan"}
      </button>
    </article>
  );
}
