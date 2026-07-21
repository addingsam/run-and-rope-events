import { HttpResponseParseError, parseJsonResponse } from "@/lib/http/parse-json-response";
import { SERVER_FLYER_UPLOAD_MAX_BYTES } from "@/lib/flyer/constants";

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

  const putResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!putResponse.ok) {
    throw new Error(
      "Direct flyer upload failed. If this keeps happening, compress the flyer or ask the site admin to enable R2 CORS for direct uploads.",
    );
  }

  return presign.url;
}

/** Uploads a flyer, using direct-to-R2 upload when the file exceeds Vercel's body limit. */
export async function uploadFlyerFromClient(file: File, originalFileName: string) {
  if (file.size <= SERVER_FLYER_UPLOAD_MAX_BYTES) {
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
