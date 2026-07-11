import type { SubscriptionPlan } from "@/types/subscription";

export const APP_NAME = "Jackpot & Rodeo Events";

export const APP_DESCRIPTION =
  "The subscription-based event directory for jackpot and rodeo events across the country.";

export const APP_TAGLINE = "Jackpots & rodeos, all in one place.";

export const APP_HOME_EYEBROW = "Jackpots & rodeos";

export const APP_HOME_HEADLINE = "Find your next jackpot. Discover your next rodeo.";

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
    description: "List and promote your jackpot and rodeo events.",
    features: [
      "Unlimited event listings",
      "Paid homepage featuring",
      "Registration link tracking",
      "Organizer dashboard",
    ],
  },
];
