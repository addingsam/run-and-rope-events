export const FLYER_EXTRACTION_DISCIPLINE_LABELS = [
  "Barrel Racing",
  "Team Roping",
  "Calf Roping",
  "Breakaway Roping",
  "Steer Roping",
  "Steer Wrestling",
] as const;

export type FlyerExtractionDisciplineLabel =
  (typeof FLYER_EXTRACTION_DISCIPLINE_LABELS)[number];

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

export interface FlyerExtractionResult {
  eventName: string | null;
  date: string | null;
  endDate: string | null;
  entryDeadline: string | null;
  time: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  discipline: FlyerExtractionDisciplineLabel | null;
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
