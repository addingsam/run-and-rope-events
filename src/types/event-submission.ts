export type SubmissionEventType = "barrel-racing" | "team-roping" | "both";

export interface EventSubmission {
  eventName: string;
  eventType: SubmissionEventType;
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
  eventType: "barrel-racing",
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
