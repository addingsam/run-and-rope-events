export interface SavedEventRecord {
  id: string;
  user_id: string;
  event_id: string;
  saved_at: string;
  archive_notified_at: string | null;
}

export interface SavedEventWithDetails extends SavedEventRecord {
  event_name: string;
  event_date: string;
  address_city: string;
  address_state: string;
  event_format: string | null;
  status: string;
}
