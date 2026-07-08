export type SubscriptionTier = "free" | "pro" | "organizer";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
}
