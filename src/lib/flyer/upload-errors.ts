import { MAX_FLYER_SIZE_BYTES } from "@/lib/flyer/constants";

export function getFlyerUploadUserMessage(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Flyer must be a JPEG, PNG, or PDF")) {
    return { status: 400, message };
  }

  if (message.includes("Flyer must be 10MB or smaller")) {
    return { status: 400, message };
  }

  if (message.includes("A flyer file is required")) {
    return { status: 400, message };
  }

  if (message.startsWith("Missing required environment variable")) {
    console.error(`[upload-flyer] ${context}:`, message);
    return {
      status: 500,
      message: "Flyer upload is temporarily unavailable. Please try again later.",
    };
  }

  if (message.includes("FormData") || message.includes("multipart")) {
    console.error(`[upload-flyer] ${context}:`, error);
    return {
      status: 400,
      message: "Could not read the uploaded file. Please choose the file again and retry.",
    };
  }

  if (
    message.includes("NetworkingError") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("socket hang up")
  ) {
    console.error(`[upload-flyer] ${context}:`, error);
    return {
      status: 503,
      message: "Network issue while uploading the flyer. Check your connection and try again.",
    };
  }

  console.error(`[upload-flyer] ${context}:`, error);
  return {
    status: 500,
    message: "Flyer upload failed while saving to storage. Please try again in a moment.",
  };
}

export function getFlyerUploadValidationMessage(file: File) {
  if (file.size > MAX_FLYER_SIZE_BYTES) {
    return "Flyer must be 10MB or smaller.";
  }

  return null;
}
