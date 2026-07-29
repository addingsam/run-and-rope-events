import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import { inferAmateurRodeoFromText } from "@/lib/events/amateur-rodeo-associations";
import { inferOpenRodeoFromText } from "@/lib/events/open-rodeo-level";
import { inferRanchRodeoFromText } from "@/lib/events/ranch-rodeo-level";
import { inferYouthPlaydayFromText } from "@/lib/events/youth-playday-level";

const GENERIC_RODEO_PATTERN = /\brodeo\b/i;

export function inferRodeoFlyerFromText(
  ...texts: Array<string | null | undefined>
): boolean {
  const combined = texts.filter(Boolean).join("\n");
  if (!combined.trim()) {
    return false;
  }

  return (
    inferOpenRodeoFromText(...texts) ||
    inferRanchRodeoFromText(...texts) ||
    inferYouthPlaydayFromText(...texts) ||
    inferAmateurRodeoFromText(...texts) ||
    GENERIC_RODEO_PATTERN.test(combined)
  );
}

export function inferRodeoFlyerFromExtraction(
  extracted: Pick<FlyerExtractionResult, "format" | "rodeoLevel" | "disciplines">,
  flyerSearchText: string,
): boolean {
  if (extracted.format === "Rodeo") {
    return true;
  }

  if (extracted.rodeoLevel) {
    return true;
  }

  return inferRodeoFlyerFromText(flyerSearchText, ...(extracted.disciplines ?? []));
}
