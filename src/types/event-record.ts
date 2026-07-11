export type EventRecordStatus = "pending" | "approved" | "rejected" | "published" | "archived";

export interface EventRecord {
  id: string;
  created_at: string;
  status: EventRecordStatus;
  event_name: string;
  event_type: string;
  event_format: string | null;
  rodeo_level: string | null;
  disciplines: string[];
  additional_offerings: string[] | null;
  event_date: string;
  event_end_date: string | null;
  venue_name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  latitude: number | null;
  longitude: number | null;
  location?: unknown;
  entry_fee: string | null;
  prize_info: string | null;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  website_link: string | null;
  description: string | null;
  flyer_url: string | null;
  submitter_email: string | null;
  source: string;
  featured_until: string | null;
  featured_paid_at: string | null;
  featured_stripe_checkout_session_id: string | null;
  featured_billing_type: string | null;
  featured_stripe_subscription_id: string | null;
}

export type EventRecordInsert = Omit<
  EventRecord,
  | "id"
  | "created_at"
  | "featured_until"
  | "featured_paid_at"
  | "featured_stripe_checkout_session_id"
  | "featured_billing_type"
  | "featured_stripe_subscription_id"
> & {
  id?: string;
  created_at?: string;
  featured_until?: string | null;
  featured_paid_at?: string | null;
  featured_stripe_checkout_session_id?: string | null;
  featured_billing_type?: string | null;
  featured_stripe_subscription_id?: string | null;
};
