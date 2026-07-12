"use client";

import { useState } from "react";
import { FEATURED_PLACEMENT } from "@/lib/stripe/featured";
import {
  themeCheckboxInputClassName,
  themeCheckboxRowClassName,
  themeInputClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { FeaturedBillingType } from "@/lib/stripe/featured";

interface FeatureEventCheckoutButtonProps {
  eventId: string;
  eventTitle: string;
  email?: string;
}

export function FeatureEventCheckoutButton({
  eventId,
  eventTitle,
  email: initialEmail = "",
}: FeatureEventCheckoutButtonProps) {
  const [billingType, setBillingType] = useState<FeaturedBillingType>("one_time");
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/feature-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, billingType, email }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Checkout failed.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className={themeMutedTextClassName}>
        No account required. Pay securely with Stripe to feature {eventTitle} on the homepage.
      </p>

      <div className="space-y-3">
        <label className={`flex cursor-pointer gap-3 px-4 py-3 ${themeCheckboxRowClassName}`}>
          <input
            type="radio"
            name="billingType"
            checked={billingType === "one_time"}
            onChange={() => setBillingType("one_time")}
            className={themeCheckboxInputClassName}
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            {FEATURED_PLACEMENT.oneTimeLabel}
          </span>
        </label>
        <label className={`flex cursor-pointer gap-3 px-4 py-3 ${themeCheckboxRowClassName}`}>
          <input
            type="radio"
            name="billingType"
            checked={billingType === "recurring"}
            onChange={() => setBillingType("recurring")}
            className={themeCheckboxInputClassName}
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            {FEATURED_PLACEMENT.recurringLabel}
          </span>
        </label>
      </div>

      <label className={themeLabelClassName}>
        Email for receipt
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className={`mt-2 ${themeInputClassName} text-sm`}
        />
      </label>

      <button
        type="button"
        onClick={() => void handleCheckout()}
        disabled={loading}
        className={`inline-flex px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60 ${themePrimaryButtonClassName}`}
      >
        {loading ? "Redirecting to checkout..." : "Continue to payment"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
