import { ACCEPTED_FLYER_EXTENSIONS } from "@/lib/flyer/constants";

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

export function getFlyerExtension(fileName: string, contentType: string) {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");

  if (lastDot > 0) {
    const extension = trimmed.slice(lastDot).toLowerCase();
    if (ACCEPTED_FLYER_EXTENSIONS.includes(extension as (typeof ACCEPTED_FLYER_EXTENSIONS)[number])) {
      return extension;
    }
  }

  return CONTENT_TYPE_EXTENSION[contentType] ?? ".bin";
}

export function buildFlyerStorageKey(fileName: string, contentType: string) {
  return `flyers/${buildFlyerUploadFileName(fileName, contentType)}`;
}

export function buildFlyerUploadFileName(fileName: string, contentType: string) {
  return `${crypto.randomUUID()}${getFlyerExtension(fileName, contentType)}`;
}

export function createFlyerUploadPayload(file: File) {
  const originalFileName = file.name.trim() || "flyer";
  const uploadFile = new File([file], buildFlyerUploadFileName(originalFileName, file.type), {
    type: file.type,
    lastModified: file.lastModified,
  });

  return {
    file: uploadFile,
    originalFileName,
  };
}
