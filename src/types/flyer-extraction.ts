import type { FlyerExtractionDisciplineLabel } from "@/lib/flyer/flyer-disciplines";

export {
  FLYER_EXTRACTION_DISCIPLINE_LABELS,
  type FlyerExtractionDisciplineLabel,
} from "@/lib/flyer/flyer-disciplines";

export const FLYER_EXTRACTION_FORMAT_LABELS = ["Jackpot", "Rodeo"] as const;

export type FlyerExtractionFormatLabel = (typeof FLYER_EXTRACTION_FORMAT_LABELS)[number];

export const FLYER_EXTRACTION_RODEO_LEVEL_LABELS = [
  "Youth",
  "Amateur",
  "Open",
  "Pro",
] as const;

export type FlyerExtractionRodeoLevelLabel =
  (typeof FLYER_EXTRACTION_RODEO_LEVEL_LABELS)[number];

/** One stop on a series flyer — distinct date(s), location, and entry deadline from shared event details. */
export interface FlyerExtractionEventEntry {
  date: string | null;
  endDate: string | null;
  entryDeadline: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface FlyerExtractionResult {
  eventName: string | null;
  date: string | null;
  /** Separate event days when one flyer lists multiple distinct dates (not a multi-day range). */
  eventDates: string[];
  /** Multiple distinct events (series schedule) — each with its own date(s) and location. */
  events: FlyerExtractionEventEntry[];
  endDate: string | null;
  entryDeadline: string | null;
  time: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  discipline: FlyerExtractionDisciplineLabel | null;
  disciplines: FlyerExtractionDisciplineLabel[];
  format: FlyerExtractionFormatLabel | null;
  rodeoLevel: FlyerExtractionRodeoLevelLabel | null;
  entryFee: string | null;
  prizePayoutInfo: string | null;
  classDivisionInfo: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  additionalNotes: string | null;
}
