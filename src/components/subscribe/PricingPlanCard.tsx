"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { clerkAppearance } from "@/lib/clerk/appearance";
import type { PricingPlan } from "@/lib/stripe/plans";
import { themePrimaryButtonClassName } from "@/lib/theme/form-classes";

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
        appearance: clerkAppearance,
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
      className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
        plan.highlighted
          ? "border-[var(--color-accent-cta)] shadow-lg"
          : "border-[var(--color-accent-primary)]/25"
      }`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[var(--color-accent-cta)]">{plan.name}</h2>
        <p className="mt-2 text-sm text-[var(--color-accent-primary)]/80">{plan.description}</p>
      </div>

      <div className="mb-2">
        <p className="text-4xl font-bold text-[var(--color-accent-primary)]">{plan.priceLabel}</p>
        <p className="text-sm text-[var(--color-accent-primary)]/70">{plan.intervalLabel}</p>
        {plan.monthlyEquivalentLabel && (
          <p className="mt-2 text-sm text-[var(--color-accent-primary)]/80">
            Works out to {plan.monthlyEquivalentLabel}
          </p>
        )}
      </div>

      <ul className="mb-6 space-y-2 text-sm text-[var(--color-accent-primary)]/85">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span aria-hidden="true" className="text-[var(--color-accent-primary)]">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => void handleSubscribe()}
        disabled={loading}
        className={`mt-auto px-4 py-3 disabled:opacity-60 ${themePrimaryButtonClassName}`}
      >
        {loading ? "Redirecting…" : "Subscribe now"}
      </button>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </article>
  );
}
