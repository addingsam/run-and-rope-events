export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "canceled"
  | "past_due"
  | "trialing";

export type PlanType = "monthly" | "annual";

export interface SubscriberRecord {
  id: string;
  clerk_user_id: string;
  subscription_status: SubscriptionStatus;
  plan_type: PlanType | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
