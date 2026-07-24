export interface CalendarEntryRecord {
  id: string;
  user_id: string;
  title: string;
  entry_date: string;
  entry_time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEntryInput {
  title: string;
  entry_date: string;
  entry_time?: string | null;
  note?: string | null;
}

export type CalendarItemKind = "saved_event" | "manual_entry";

export interface SavedEventCalendarItem {
  kind: "saved_event";
  id: string;
  event_id: string;
  title: string;
  date: string;
  end_date: string | null;
  location: string;
  status: string;
  saved_at: string;
}

export interface ManualEntryCalendarItem {
  kind: "manual_entry";
  id: string;
  title: string;
  date: string;
  time: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CalendarItem = SavedEventCalendarItem | ManualEntryCalendarItem;
