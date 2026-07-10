export type EventDiscipline =
  | "barrel_racing"
  | "team_roping"
  | "calf_roping"
  | "breakaway_roping"
  | "steer_roping"
  | "steer_wrestling";

export type EventFormat = "jackpot" | "rodeo";

export type EventStatus = "upcoming" | "registration-open" | "sold-out" | "completed";

export interface RodeoEvent {
  id: string;
  title: string;
  format: EventFormat;
  disciplines: EventDiscipline[];
  additionalOfferings?: string[];
  status: EventStatus;
  startDate: string;
  endDate?: string;
  venue: string;
  city: string;
  state: string;
  entryFee?: string;
  description?: string;
  organizerName?: string;
  websiteUrl?: string;
}

export interface EventFilters {
  discipline?: EventDiscipline;
  state?: string;
  search?: string;
}
