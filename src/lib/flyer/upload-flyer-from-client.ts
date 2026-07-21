import { SERVER_FLYER_UPLOAD_MAX_BYTES } from "@/lib/flyer/constants";
import { HttpResponseParseError, parseJsonResponse } from "@/lib/http/parse-json-response";

function canUploadViaServer(file: File) {
  return file.size <= SERVER_FLYER_UPLOAD_MAX_BYTES;
}

function isDirectUploadNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("load failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  );
}

function directUploadHelpMessage(file: File) {
  if (canUploadViaServer(file)) {
    return "Flyer upload failed. Check your connection and try again.";
  }

  return "This flyer is too large for server upload. Compress it under 3.5 MB, or enable R2 CORS so files up to 10 MB can upload directly to storage.";
}

async function uploadFlyerViaServer(file: File, originalFileName: string) {
  const body = new FormData();
  body.append("flyer", file);
  body.append("originalFileName", originalFileName);

  const response = await fetch("/api/events/upload-flyer", {
    method: "POST",
    body,
  });

  const data = await parseJsonResponse<{ url?: string; error?: string }>(response, "upload");

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Flyer upload failed.");
  }

  return data.url;
}

async function uploadFlyerViaPresignedUrl(file: File, originalFileName: string) {
  const presignResponse = await fetch("/api/events/upload-flyer/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      originalFileName,
      contentType: file.type,
      size: file.size,
    }),
  });

  const presign = await parseJsonResponse<{
    uploadUrl?: string;
    url?: string;
    error?: string;
  }>(presignResponse, "upload");

  if (!presignResponse.ok || !presign.uploadUrl || !presign.url) {
    throw new Error(presign.error ?? "Could not prepare flyer upload.");
  }

  let putResponse: Response;
  try {
    putResponse = await fetch(presign.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
  } catch (error) {
    if (isDirectUploadNetworkError(error)) {
      throw new Error(directUploadHelpMessage(file));
    }
    throw error;
  }

  if (!putResponse.ok) {
    throw new Error(directUploadHelpMessage(file));
  }

  return presign.url;
}

/** Upload smaller flyers through the app server; larger ones go direct to R2. */
export async function uploadFlyerFromClient(file: File, originalFileName: string) {
  if (canUploadViaServer(file)) {
    try {
      return await uploadFlyerViaServer(file, originalFileName);
    } catch (error) {
      if (!(error instanceof HttpResponseParseError && error.status === 413)) {
        throw error;
      }
    }
  }

  return uploadFlyerViaPresignedUrl(file, originalFileName);
}
