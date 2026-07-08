import type { SubscriptionPlan } from "@/types/subscription";

export const APP_NAME = "Run & Rope Events";

export const APP_DESCRIPTION =
  "The subscription-based event directory for barrel racing and roping events across the country.";

export const DISCIPLINE_LABELS = {
  "barrel-racing": "Barrel Racing",
  "team-roping": "Team Roping",
  "calf-roping": "Calf Roping",
  breakaway: "Breakaway Roping",
} as const;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "Browse upcoming events in your region.",
    features: ["Event search by state", "Basic event details", "Monthly event digest"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    description: "For competitors who travel the circuit.",
    features: [
      "Nationwide event search",
      "Saved events & alerts",
      "Entry fee comparisons",
      "Early registration notices",
    ],
  },
  {
    id: "organizer",
    name: "Organizer",
    priceMonthly: 29,
    description: "List and promote your rodeo events.",
    features: [
      "Unlimited event listings",
      "Featured placement",
      "Registration link tracking",
      "Organizer dashboard",
    ],
  },
];
