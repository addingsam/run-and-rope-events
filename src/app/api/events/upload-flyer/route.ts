import { NextResponse } from "next/server";
import { uploadFlyerToR2 } from "@/lib/r2/upload-flyer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid upload request.";
      return NextResponse.json(
        {
          error: message.includes("FormData")
            ? "Flyer upload failed. Try choosing the file again or rename it using letters and numbers only."
            : message,
        },
        { status: 400 },
      );
    }

    const file = formData.get("flyer");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A flyer file is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFlyerToR2({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      body: buffer,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flyer upload failed.";
    const status = message.startsWith("Missing required environment variable") ? 500 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
