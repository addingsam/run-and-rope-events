import type { FlyerExtractionResult } from "@/types/flyer-extraction";

const STOCK_CONTRACTOR_VALUE_PATTERN =
  /\bstock[\s-]?contractor\b\s*(?:[:#-]\s*|\s+)([A-Za-z0-9][A-Za-z0-9\s&'.-]{1,80})/i;

export function inferProducerFromText(
  ...texts: Array<string | null | undefined>
): string | null {
  const combined = texts.filter(Boolean).join("\n").trim();
  if (!combined) {
    return null;
  }

  const labeledMatch = combined.match(STOCK_CONTRACTOR_VALUE_PATTERN);
  if (labeledMatch?.[1]) {
    return labeledMatch[1].replace(/\s+/g, " ").trim();
  }

  return null;
}

export function resolveFlyerProducerName(
  extracted: Pick<
    FlyerExtractionResult,
    | "contactName"
    | "eventName"
    | "classDivisionInfo"
    | "prizePayoutInfo"
    | "entryFee"
    | "additionalNotes"
    | "format"
  >,
): string | null {
  const contactName = extracted.contactName?.trim();
  if (contactName) {
    return contactName;
  }

  if (extracted.format !== "Rodeo") {
    return null;
  }

  return inferProducerFromText(
    extracted.eventName,
    extracted.classDivisionInfo,
    extracted.prizePayoutInfo,
    extracted.entryFee,
    extracted.additionalNotes,
  );
}
