export type SubmissionFormat = "jackpot" | "rodeo";

export type RodeoLevel = "youth" | "open" | "amateur";

export type SubmissionDiscipline =
  | "barrel_racing"
  | "team_roping"
  | "calf_roping"
  | "breakaway_roping"
  | "steer_roping"
  | "steer_wrestling"
  | "cowboy_mounted_shooting"
  | "ranch_horse"
  | "obstacle_trail";

export interface EventSubmission {
  eventName: string;
  format: SubmissionFormat;
  rodeoLevels: RodeoLevel[];
  disciplines: SubmissionDiscipline[];
  additionalOfferings: string[];
  startDate: string;
  endDate: string;
  entryDeadline: string;
  classDivisionInfo: string;
  venueName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  producerName: string;
  producerWebsite: string;
  contactEmail: string;
  contactPhone: string;
  entryFee: string;
  prizePayoutInfo: string;
  description: string;
  submitterEmail: string;
  flyerUrl: string;
}

export const EMPTY_EVENT_SUBMISSION: EventSubmission = {
  eventName: "",
  format: "jackpot",
  rodeoLevels: [],
  disciplines: [],
  additionalOfferings: [],
  startDate: "",
  endDate: "",
  entryDeadline: "",
  classDivisionInfo: "",
  venueName: "",
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  producerName: "",
  producerWebsite: "",
  contactEmail: "",
  contactPhone: "",
  entryFee: "",
  prizePayoutInfo: "",
  description: "",
  submitterEmail: "",
  flyerUrl: "",
};
