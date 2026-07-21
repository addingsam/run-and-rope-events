export type EventDiscipline =
  | "bareback_riding"
  | "saddle_bronc"
  | "bull_riding"
  | "ranch_bronc_riding"
  | "barrel_racing"
  | "team_roping"
  | "calf_roping"
  | "breakaway_roping"
  | "steer_roping"
  | "steer_wrestling"
  | "cowboy_mounted_shooting"
  | "ranch_horse"
  | "obstacle_trail"
  | "pole_bending";

export type EventFormat = "jackpot" | "rodeo";

export type EventStatus = "upcoming" | "registration-open" | "sold-out" | "completed";

export interface RodeoEvent {
  id: string;
  title: string;
  format: EventFormat;
  rodeoLevel?: string | null;
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
  featured?: boolean;
}

export interface EventFilters {
  discipline?: EventDiscipline;
  state?: string;
  search?: string;
}
