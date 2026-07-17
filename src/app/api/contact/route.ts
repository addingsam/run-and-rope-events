import { NextResponse } from "next/server";
import { getAuthUserProfile } from "@/lib/auth/get-user";
import { validateContactMessage } from "@/lib/contact/validate-contact";
import { sendContactMessage } from "@/lib/email/send-contact-message";
import type { ContactMessageInput } from "@/lib/contact/validate-contact";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactMessageInput>;
    const validation = validateContactMessage({
      name: body.name ?? "",
      email: body.email ?? "",
      subject: body.subject ?? "",
      message: body.message ?? "",
      website: body.website,
    });

    if (!validation.ok) {
      if ("isSpam" in validation && validation.isSpam) {
        return NextResponse.json({ ok: true });
      }

      if ("error" in validation) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }

    const profile = await getAuthUserProfile();

    if (
      profile?.email &&
      validation.data.email.toLowerCase() !== profile.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Use the email address on your signed-in account." },
        { status: 400 },
      );
    }

    await sendContactMessage(validation.data, {
      userId: profile?.id ?? null,
      signedInEmail: profile?.email ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact message:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send your message. Please try again.";
    const status = message.includes("Missing required environment variable") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
