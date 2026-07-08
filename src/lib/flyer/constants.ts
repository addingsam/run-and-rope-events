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

export function sanitizeFlyerFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const extension = lastDot > 0 ? trimmed.slice(lastDot) : "";

  const safeBase = base.replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "flyer";
  const safeExtension = extension.replace(/[^a-z0-9.]/g, "");

  return `${safeBase}${safeExtension}`;
}
