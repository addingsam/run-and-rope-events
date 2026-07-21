import { NextResponse } from "next/server";
import { FLYER_UPLOAD_CHUNK_BYTES } from "@/lib/flyer/constants";
import { uploadMultipartFlyerPart } from "@/lib/r2/multipart-flyer-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk");
    const keyValue = formData.get("key");
    const uploadIdValue = formData.get("uploadId");
    const key = typeof keyValue === "string" ? keyValue : "";
    const uploadId = typeof uploadIdValue === "string" ? uploadIdValue : "";
    const partNumberValue = formData.get("partNumber");

    if (!(chunk instanceof File)) {
      return NextResponse.json({ error: "A flyer chunk is required." }, { status: 400 });
    }

    if (!key || !uploadId) {
      return NextResponse.json({ error: "Upload key and uploadId are required." }, { status: 400 });
    }

    const partNumber = Number(partNumberValue);
    if (!Number.isInteger(partNumber) || partNumber < 1) {
      return NextResponse.json({ error: "A valid partNumber is required." }, { status: 400 });
    }

    if (chunk.size === 0) {
      return NextResponse.json({ error: "Flyer chunk cannot be empty." }, { status: 400 });
    }

    if (chunk.size > FLYER_UPLOAD_CHUNK_BYTES) {
      return NextResponse.json({ error: "Flyer chunk is too large." }, { status: 400 });
    }

    const result = await uploadMultipartFlyerPart({
      key,
      uploadId,
      partNumber,
      body: Buffer.from(await chunk.arrayBuffer()),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flyer upload part failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
