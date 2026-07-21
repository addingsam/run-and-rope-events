export const ACCEPTED_FLYER_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const ACCEPTED_FLYER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"] as const;

export const MAX_FLYER_SIZE_BYTES = 10 * 1024 * 1024;

export const FLYER_ACCEPT_ATTRIBUTE =
  ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";

export function validateFlyerFile(file: File): string | null {
  if (!ACCEPTED_FLYER_TYPES.includes(file.type as (typeof ACCEPTED_FLYER_TYPES)[number])) {
    return "Flyer must be a JPEG, PNG, or PDF file.";
  }

  if (file.size > MAX_FLYER_SIZE_BYTES) {
    return "Flyer must be 10MB or smaller.";
  }

  return null;
}
