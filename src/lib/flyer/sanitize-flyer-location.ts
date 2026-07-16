import type { FlyerExtractionResult } from "@/types/flyer-extraction";
import { isCityOnlyVenueLabel, resolveVenueName } from "@/lib/events/resolve-venue-name";

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseZipFromAddress(address: string | null) {
  if (!address) {
    return null;
  }

  const match = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  return match?.[1] ?? null;
}

function isCityOrCityStateLabel(
  value: string | null,
  city: string | null,
  state: string | null,
): boolean {
  return isCityOnlyVenueLabel(value, city, state);
}

const STREET_ADDRESS_PATTERN =
  /\b(\d{1,6}\s+[A-Za-z0-9][\w\s.-]{0,40}\b(road|rd|street|st|avenue|ave|boulevard|blvd|drive|dr|lane|ln|way|circle|cir|highway|hwy|route|rt|pike|trail|parkway|pkwy)\b|^(road|rd|street|st|avenue|ave|boulevard|blvd|drive|dr|lane|ln|way|circle|cir|highway|hwy|route|rt|pike|trail|parkway|pkwy)\s+\d+)/i;

export function looksLikePrintedStreetAddress(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^p\.?\s*o\.?\s*box\s+\d+/i.test(trimmed)) {
    return true;
  }

  if (/^\d{1,6}\s+[A-Za-z0-9]/.test(trimmed)) {
    return true;
  }

  return STREET_ADDRESS_PATTERN.test(trimmed);
}

export function sanitizeFlyerExtractionLocation(
  extracted: FlyerExtractionResult,
): FlyerExtractionResult {
  let venueName = extracted.venueName;
  let address = extracted.address;
  let zipCode = extracted.zipCode;

  if (isCityOrCityStateLabel(venueName, extracted.city, extracted.state)) {
    venueName = null;
  }

  if (address) {
    if (
      isCityOrCityStateLabel(address, extracted.city, extracted.state) ||
      !looksLikePrintedStreetAddress(address)
    ) {
      address = null;
    }
  }

  if (venueName && address && normalizeForCompare(venueName) === normalizeForCompare(address)) {
    venueName = null;
  }

  if (address === null && extracted.address) {
    const zipFromRemovedAddress = parseZipFromAddress(extracted.address);
    if (zipFromRemovedAddress && (!extracted.zipCode || zipCode === zipFromRemovedAddress)) {
      zipCode = null;
    }
  }

  const resolvedVenueName = resolveVenueName({
    venueName,
    city: extracted.city,
    state: extracted.state,
    textSources: [
      extracted.venueName,
      extracted.eventName,
      extracted.additionalNotes,
      extracted.classDivisionInfo,
      extracted.address,
    ],
  });

  return {
    ...extracted,
    venueName: resolvedVenueName || null,
    address,
    zipCode,
  };
}
