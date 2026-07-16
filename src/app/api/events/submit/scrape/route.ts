import { NextResponse } from "next/server";
import { normalizeEventSubmissionVenue } from "@/lib/events/resolve-venue-name";
import { parseSubmissionFormData } from "@/lib/events/parse-submission";
import { saveEventSubmission } from "@/lib/events/save-submission";
import { validateEventSubmission } from "@/lib/events/validate-submission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const submission = normalizeEventSubmissionVenue(
      parseSubmissionFormData(formData, { source: "scrape" }),
    );

    const validationErrors = validateEventSubmission(submission, "scrape");
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      return NextResponse.json({ error: firstError, errors: validationErrors }, { status: 400 });
    }

    const savedEvent = await saveEventSubmission(submission);

    return NextResponse.json({
      success: true,
      eventId: savedEvent.id,
      requiresAdminReview: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scraped event submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
