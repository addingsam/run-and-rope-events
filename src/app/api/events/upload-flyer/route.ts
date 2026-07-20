import { NextResponse } from "next/server";
import { getFlyerUploadUserMessage } from "@/lib/flyer/upload-errors";
import { uploadFlyerToR2 } from "@/lib/r2/upload-flyer";

export const runtime = "nodejs";

function getOriginalFileName(formData: FormData, fallback: string) {
  const value = formData.get("originalFileName");
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: Request) {
  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (error) {
      const { status, message } = getFlyerUploadUserMessage(error, "formData parse");
      return NextResponse.json({ error: message }, { status });
    }

    const file = formData.get("flyer");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A flyer file is required." }, { status: 400 });
    }

    const originalFileName = getOriginalFileName(formData, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFlyerToR2({
      fileName: file.name,
      originalFileName,
      contentType: file.type,
      size: file.size,
      body: buffer,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { status, message } = getFlyerUploadUserMessage(error, "upload handler");
    return NextResponse.json({ error: message }, { status });
  }
}
