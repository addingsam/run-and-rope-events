import { HttpResponseParseError, parseJsonResponse } from "@/lib/http/parse-json-response";

function isLocalDevHost() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
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

  const putResponse = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });

  if (!putResponse.ok) {
    throw new Error(
      "Direct flyer upload failed. Enable R2 CORS for this site in Cloudflare, or compress the flyer and try again.",
    );
  }

  return presign.url;
}

/** Uploads a flyer directly to R2 in production to avoid Vercel's body-size limit. */
export async function uploadFlyerFromClient(file: File, originalFileName: string) {
  if (!isLocalDevHost()) {
    return uploadFlyerViaPresignedUrl(file, originalFileName);
  }

  try {
    return await uploadFlyerViaServer(file, originalFileName);
  } catch (error) {
    if (error instanceof HttpResponseParseError && error.status === 413) {
      return uploadFlyerViaPresignedUrl(file, originalFileName);
    }
    throw error;
  }
}
