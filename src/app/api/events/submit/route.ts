import { NextResponse } from "next/server";
import { expandSubmissionToBatch } from "@/lib/events/expand-batch-submissions";
import { parseBatchEventDates, parseSubmissionFormData } from "@/lib/events/parse-submission";
import { saveEventSubmission, saveEventSubmissions } from "@/lib/events/save-submission";
import {
  sendBatchSubmissionConfirmationEmails,
  sendSubmissionConfirmationEmails,
} from "@/lib/email/send-submission-confirmation";
import { validateBatchEventDates } from "@/lib/events/validate-batch-dates";
import { validateEventSubmission } from "@/lib/events/validate-submission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const submission = parseSubmissionFormData(formData);
    const batchEventDates = parseBatchEventDates(formData);
    const isBatchSubmission = batchEventDates.length >= 2;

    if (isBatchSubmission && formData.get("featurePlacement") !== "none") {
      return NextResponse.json(
        {
          error:
            "Homepage featuring applies to one event at a time. Submit multiple dates first, then feature each listing after approval.",
        },
        { status: 400 },
      );
    }

    const validationErrors = validateEventSubmission(submission, submission.source);
    const batchErrors = isBatchSubmission ? validateBatchEventDates(batchEventDates) : {};
    const errors = { ...validationErrors, ...batchErrors };

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      return NextResponse.json({ error: firstError, errors }, { status: 400 });
    }

    if (isBatchSubmission) {
      const submissions = expandSubmissionToBatch(submission, batchEventDates);
      const savedEvents = await saveEventSubmissions(submissions);
      const confirmationEmails = await sendBatchSubmissionConfirmationEmails(
        submission,
        batchEventDates,
      );

      return NextResponse.json({
        success: true,
        eventIds: savedEvents.map((event) => event.id),
        eventCount: savedEvents.length,
        confirmationEmailSent: confirmationEmails.sent.length > 0,
        confirmationEmails,
      });
    }

    const savedEvent = await saveEventSubmission(submission);
    const confirmationEmails = await sendSubmissionConfirmationEmails(submission);

    return NextResponse.json({
      success: true,
      eventId: savedEvent.id,
      eventCount: 1,
      confirmationEmailSent: confirmationEmails.sent.length > 0,
      confirmationEmails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
