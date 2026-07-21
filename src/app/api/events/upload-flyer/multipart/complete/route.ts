import { NextResponse } from "next/server";
import {
  abortMultipartFlyerUpload,
  completeMultipartFlyerUpload,
} from "@/lib/r2/multipart-flyer-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      key?: string;
      uploadId?: string;
      parts?: Array<{ partNumber?: number; etag?: string }>;
    };

    const key = body.key?.trim();
    const uploadId = body.uploadId?.trim();
    const parts = Array.isArray(body.parts) ? body.parts : [];

    if (!key || !uploadId) {
      return NextResponse.json({ error: "Upload key and uploadId are required." }, { status: 400 });
    }

    const completedParts = parts
      .map((part) => ({
        PartNumber: part.partNumber,
        ETag: part.etag,
      }))
      .filter(
        (part): part is { PartNumber: number; ETag: string } =>
          Number.isInteger(part.PartNumber) &&
          part.PartNumber! > 0 &&
          typeof part.ETag === "string" &&
          part.ETag.length > 0,
      );

    try {
      const result = await completeMultipartFlyerUpload({
        key,
        uploadId,
        parts: completedParts,
      });

      return NextResponse.json(result);
    } catch (error) {
      await abortMultipartFlyerUpload(key, uploadId).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flyer upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
