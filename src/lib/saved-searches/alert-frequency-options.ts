import type { SavedSearchAlertFrequency } from "@/types/saved-search";

export const SAVED_SEARCH_ALERT_OPTIONS: {
  value: SavedSearchAlertFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: "off",
    label: "No update emails",
    description: "Save only. You'll still get a confirmation email with your criteria and current matches.",
  },
  {
    value: "daily",
    label: "Daily digest",
    description: "Email once a day when new approved events match this saved search.",
  },
  {
    value: "weekly",
    label: "Weekly digest",
    description: "Email once a week when new approved events match this saved search.",
  },
];
