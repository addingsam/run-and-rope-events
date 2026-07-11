import { NextResponse } from "next/server";
import {
  extractFlyerFromFile,
  extractFlyerFromUrl,
} from "@/lib/flyer/extract-flyer-with-claude";

export const runtime = "nodejs";

function isAllowedFlyerUrl(flyerUrl: string) {
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!publicBase) {
    return false;
  }

  try {
    const target = new URL(flyerUrl);
    const allowed = new URL(publicBase);
    return target.origin === allowed.origin;
  } catch {
    return false;
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("flyer");

      if (!(file instanceof File)) {
        return jsonError("A flyer file is required.", 400);
      }

      const extracted = await extractFlyerFromFile(file);
      return NextResponse.json({ extracted });
    }

    const body = (await request.json()) as { flyerUrl?: string };
    const flyerUrl = body.flyerUrl?.trim();

    if (!flyerUrl) {
      return jsonError("flyerUrl is required.", 400);
    }

    if (!isAllowedFlyerUrl(flyerUrl)) {
      return jsonError("flyerUrl must point to an uploaded flyer in storage.", 400);
    }

    const extracted = await extractFlyerFromUrl(flyerUrl);
    return NextResponse.json({ extracted });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Flyer extraction failed.";

    if (
      message.includes("not valid JSON") ||
      message.includes("JSON that was not an object")
    ) {
      return jsonError(message, 422);
    }

    if (message.startsWith("Missing ANTHROPIC_API_KEY")) {
      return jsonError(message, 500);
    }

    return jsonError(message, 400);
  }
}
