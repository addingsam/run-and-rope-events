import type { SubmissionDiscipline } from "@/types/event-submission";

export interface FlyerLightboxEvent {
  id: string;
  title: string;
  format: string | null;
  rodeoLevel: string | null;
  disciplines: SubmissionDiscipline[] | string[];
  startDate: string;
  endDate?: string | null;
  venue: string;
  streetAddress?: string | null;
  city: string;
  state: string;
  zipCode?: string | null;
  prizePayoutInfo?: string | null;
  classDivisionInfo?: string | null;
  entryFee?: string | null;
  entryDeadline?: string | null;
  producerName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  flyerUrl?: string | null;
}
