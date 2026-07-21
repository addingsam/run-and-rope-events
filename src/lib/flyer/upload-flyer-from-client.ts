import {
  FLYER_UPLOAD_CHUNK_BYTES,
  SERVER_FLYER_UPLOAD_MAX_BYTES,
} from "@/lib/flyer/constants";
import { HttpResponseParseError, parseJsonResponse } from "@/lib/http/parse-json-response";

function canUploadViaServer(file: File) {
  return file.size <= SERVER_FLYER_UPLOAD_MAX_BYTES;
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

async function uploadFlyerViaMultipart(file: File, originalFileName: string) {
  const initResponse = await fetch("/api/events/upload-flyer/multipart/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      originalFileName,
      contentType: file.type,
      size: file.size,
    }),
  });

  const initData = await parseJsonResponse<{
    key?: string;
    uploadId?: string;
    url?: string;
    error?: string;
  }>(initResponse, "upload");

  if (!initResponse.ok || !initData.key || !initData.uploadId || !initData.url) {
    throw new Error(initData.error ?? "Could not start flyer upload.");
  }

  const parts: Array<{ partNumber: number; etag: string }> = [];
  const totalParts = Math.ceil(file.size / FLYER_UPLOAD_CHUNK_BYTES);

  for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
    const start = (partNumber - 1) * FLYER_UPLOAD_CHUNK_BYTES;
    const end = Math.min(start + FLYER_UPLOAD_CHUNK_BYTES, file.size);
    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append("chunk", chunk, `${file.name}.part${partNumber}`);
    formData.append("key", initData.key);
    formData.append("uploadId", initData.uploadId);
    formData.append("partNumber", String(partNumber));

    const partResponse = await fetch("/api/events/upload-flyer/multipart/part", {
      method: "POST",
      body: formData,
    });

    const partData = await parseJsonResponse<{
      partNumber?: number;
      etag?: string;
      error?: string;
    }>(partResponse, "upload");

    if (!partResponse.ok || !partData.partNumber || !partData.etag) {
      throw new Error(partData.error ?? "Flyer upload failed while sending a file chunk.");
    }

    parts.push({
      partNumber: partData.partNumber,
      etag: partData.etag,
    });
  }

  const completeResponse = await fetch("/api/events/upload-flyer/multipart/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: initData.key,
      uploadId: initData.uploadId,
      parts,
    }),
  });

  const completeData = await parseJsonResponse<{ url?: string; error?: string }>(
    completeResponse,
    "upload",
  );

  if (!completeResponse.ok || !completeData.url) {
    throw new Error(completeData.error ?? "Flyer upload failed while finishing.");
  }

  return completeData.url;
}

/** Upload smaller flyers in one request; larger ones use chunked multipart through the app server. */
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

  return uploadFlyerViaMultipart(file, originalFileName);
}
