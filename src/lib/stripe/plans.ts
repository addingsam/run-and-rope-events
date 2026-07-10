import type { PlanType } from "@/types/subscriber";

export interface PricingPlan {
  planType: PlanType;
  name: string;
  priceLabel: string;
  intervalLabel: string;
  monthlyEquivalentLabel?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  stripePriceIdEnv: "STRIPE_PRICE_MONTHLY_ID" | "STRIPE_PRICE_ANNUAL_ID";
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    planType: "monthly",
    name: "Monthly",
    priceLabel: "$9.99",
    intervalLabel: "per month",
    description: "Full access billed monthly. Cancel anytime.",
    features: [
      "Nationwide event search",
      "Saved events and searches",
      "Email alerts for new matches",
      "Map drawing tools",
    ],
    stripePriceIdEnv: "STRIPE_PRICE_MONTHLY_ID",
  },
  {
    planType: "annual",
    name: "Annual",
    priceLabel: "$79.99",
    intervalLabel: "per year",
    monthlyEquivalentLabel: "$6.67/mo",
    description: "Best value for competitors on the road all season.",
    features: [
      "Everything in Monthly",
      "Save over 30% vs monthly billing",
      "One payment for the full year",
      "Priority email alerts",
    ],
    highlighted: true,
    stripePriceIdEnv: "STRIPE_PRICE_ANNUAL_ID",
  },
];

export function getStripePriceId(planType: PlanType) {
  const plan = PRICING_PLANS.find((entry) => entry.planType === planType);
  if (!plan) {
    throw new Error("Unknown plan type.");
  }

  const priceId = process.env[plan.stripePriceIdEnv];
  if (!priceId) {
    throw new Error(`Missing ${plan.stripePriceIdEnv}.`);
  }

  return priceId;
}
