export type EventDiscipline = "barrel-racing" | "team-roping" | "calf-roping" | "breakaway";

export type EventStatus = "upcoming" | "registration-open" | "sold-out" | "completed";

export interface RodeoEvent {
  id: string;
  title: string;
  discipline: EventDiscipline;
  status: EventStatus;
  startDate: string;
  endDate?: string;
  venue: string;
  city: string;
  state: string;
  entryFee?: number;
  description?: string;
  organizerName?: string;
  websiteUrl?: string;
}

export interface EventFilters {
  discipline?: EventDiscipline;
  state?: string;
  search?: string;
}
