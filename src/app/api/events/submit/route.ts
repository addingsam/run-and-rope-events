import { NextResponse } from "next/server";
import { saveEventSubmission } from "@/lib/events/save-submission";
import { sendSubmissionConfirmation } from "@/lib/email/send-submission-confirmation";
import type { EventSubmission, SubmissionEventType } from "@/types/event-submission";

export const runtime = "nodejs";

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSubmission(formData: FormData): EventSubmission {
  return {
    eventName: getString(formData.get("eventName")),
    eventType: getString(formData.get("eventType")) as SubmissionEventType,
    startDate: getString(formData.get("startDate")),
    endDate: getString(formData.get("endDate")),
    entryDeadline: getString(formData.get("entryDeadline")),
    classDivisionInfo: getString(formData.get("classDivisionInfo")),
    venueName: getString(formData.get("venueName")),
    streetAddress: getString(formData.get("streetAddress")),
    city: getString(formData.get("city")),
    state: getString(formData.get("state")),
    zipCode: getString(formData.get("zipCode")),
    producerName: getString(formData.get("producerName")),
    producerWebsite: getString(formData.get("producerWebsite")),
    contactEmail: getString(formData.get("contactEmail")),
    contactPhone: getString(formData.get("contactPhone")),
    entryFee: getString(formData.get("entryFee")),
    prizePayoutInfo: getString(formData.get("prizePayoutInfo")),
    description: getString(formData.get("description")),
    submitterEmail: getString(formData.get("submitterEmail")),
    flyerUrl: getString(formData.get("flyerUrl")),
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const submission = parseSubmission(formData);

    const savedEvent = await saveEventSubmission(submission);

    let confirmationEmailSent = false;

    if (submission.submitterEmail && submission.eventName && submission.startDate) {
      try {
        await sendSubmissionConfirmation({
          to: submission.submitterEmail,
          eventName: submission.eventName,
          startDate: submission.startDate,
        });
        confirmationEmailSent = true;
      } catch (error) {
        console.error("Failed to send submission confirmation email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      eventId: savedEvent.id,
      confirmationEmailSent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
