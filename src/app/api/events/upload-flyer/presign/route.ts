import { NextResponse } from "next/server";
import { createFlyerPresignedUpload } from "@/lib/r2/create-flyer-presigned-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      originalFileName?: string;
      contentType?: string;
      size?: number;
    };

    const fileName = body.fileName?.trim();
    const contentType = body.contentType?.trim();
    const size = body.size;

    if (!fileName || !contentType || typeof size !== "number") {
      return NextResponse.json(
        { error: "fileName, contentType, and size are required." },
        { status: 400 },
      );
    }

    const result = await createFlyerPresignedUpload({
      fileName,
      originalFileName: body.originalFileName?.trim(),
      contentType,
      size,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare flyer upload.";
    const status = message.includes("Flyer must be") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
