"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import type { PricingPlan } from "@/lib/stripe/plans";

interface PricingPlanCardProps {
  plan: PricingPlan;
}

export function PricingPlanCard({ plan }: PricingPlanCardProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);

    if (!isSignedIn) {
      openSignIn({
        forceRedirectUrl: "/subscribe",
        fallbackRedirectUrl: "/subscribe",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: plan.planType }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <article
      className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
        plan.highlighted
          ? "border-amber-700 bg-amber-950 text-white shadow-lg"
          : "border-amber-200 bg-white text-amber-950"
      }`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{plan.name}</h2>
        <p className={`mt-2 text-sm ${plan.highlighted ? "text-amber-100" : "text-amber-900/70"}`}>
          {plan.description}
        </p>
      </div>

      <div className="mb-2">
        <p className="text-4xl font-bold">{plan.priceLabel}</p>
        <p className={`text-sm ${plan.highlighted ? "text-amber-200" : "text-amber-900/60"}`}>
          {plan.intervalLabel}
        </p>
        {plan.monthlyEquivalentLabel && (
          <p className={`mt-2 text-sm ${plan.highlighted ? "text-amber-100" : "text-amber-800"}`}>
            Works out to {plan.monthlyEquivalentLabel}
          </p>
        )}
      </div>

      <ul className={`mb-6 space-y-2 text-sm ${plan.highlighted ? "text-amber-50" : "text-amber-900/80"}`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden="true">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void handleSubscribe()}
        disabled={loading}
        className={`mt-auto rounded-full px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          plan.highlighted
            ? "bg-white text-amber-950 hover:bg-amber-50"
            : "bg-amber-700 text-white hover:bg-amber-800"
        }`}
      >
        {loading ? "Redirecting…" : "Subscribe now"}
      </button>

      {error && (
        <p className={`mt-3 text-sm ${plan.highlighted ? "text-amber-100" : "text-red-700"}`}>
          {error}
        </p>
      )}
    </article>
  );
}
