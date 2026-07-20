import { NextResponse } from "next/server";
import {
  expandSubmissionToBatch,
  expandSubmissionToMultiEventBatch,
} from "@/lib/events/expand-batch-submissions";
import { parseSubmissionRequest } from "@/lib/events/parse-submission";
import {
  normalizeBatchEventsVenue,
  normalizeEventSubmissionVenue,
} from "@/lib/events/resolve-venue-name";
import { saveEventSubmission, saveEventSubmissions } from "@/lib/events/save-submission";
import {
  sendBatchSubmissionConfirmationEmails,
  sendSubmissionConfirmationEmails,
} from "@/lib/email/send-submission-confirmation";
import { sendDuplicateSubmissionAlertEmails } from "@/lib/email/send-duplicate-submission-alert";
import { listEventsForDuplicateCheck } from "@/lib/events/admin-repository";
import { findSubmissionDuplicateWarnings } from "@/lib/events/duplicate-detection";
import { validateBatchEventDates } from "@/lib/events/validate-batch-dates";
import { validateBatchEvents } from "@/lib/events/validate-batch-events";
import { validateEventSubmission } from "@/lib/events/validate-submission";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { submission: parsedSubmission, batchEvents, batchEventDates } =
      await parseSubmissionRequest(request);
    const submission = normalizeEventSubmissionVenue(parsedSubmission);
    const normalizedBatchEvents = normalizeBatchEventsVenue(batchEvents, {
      eventName: submission.eventName,
    });
    const isMultiEventBatch = normalizedBatchEvents.length >= 2;
    const isSameVenueBatch = !isMultiEventBatch && batchEventDates.length >= 2;
    const isBatchSubmission = isMultiEventBatch || isSameVenueBatch;

    const validationErrors = validateEventSubmission(submission, submission.source);
    const batchErrors = isMultiEventBatch
      ? validateBatchEvents(normalizedBatchEvents)
      : isSameVenueBatch
        ? validateBatchEventDates(batchEventDates)
        : {};
    const errors = { ...validationErrors, ...batchErrors };

    if (isMultiEventBatch) {
      delete errors.venueName;
      delete errors.city;
      delete errors.state;
      delete errors.startDate;
      delete errors.endDate;
      delete errors.entryDeadline;
    }

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      return NextResponse.json({ error: firstError, errors }, { status: 400 });
    }

    const duplicateCandidates = await listEventsForDuplicateCheck();

    if (isBatchSubmission) {
      const submissions = isMultiEventBatch
        ? expandSubmissionToMultiEventBatch(submission, normalizedBatchEvents)
        : expandSubmissionToBatch(submission, batchEventDates);
      const duplicateWarnings = findSubmissionDuplicateWarnings(submissions, duplicateCandidates);
      const savedEvents = await saveEventSubmissions(submissions);
      const confirmationDates = isMultiEventBatch
        ? normalizedBatchEvents.map((event) => event.startDate)
        : batchEventDates;
      const confirmationEmails = await sendBatchSubmissionConfirmationEmails(
        submission,
        confirmationDates,
      );
      const duplicateAlertEmails = await sendDuplicateSubmissionAlertEmails(
        submission,
        duplicateWarnings,
      );

      return NextResponse.json({
        success: true,
        eventIds: savedEvents.map((event) => event.id),
        eventCount: savedEvents.length,
        confirmationEmailSent: confirmationEmails.sent.length > 0,
        confirmationEmails,
        duplicateDetected: duplicateWarnings.length > 0,
        duplicateWarnings,
        duplicateAlertEmails,
      });
    }

    const duplicateWarnings = findSubmissionDuplicateWarnings([submission], duplicateCandidates);
    const savedEvent = await saveEventSubmission(submission);
    const confirmationEmails = await sendSubmissionConfirmationEmails(submission);
    const duplicateAlertEmails = await sendDuplicateSubmissionAlertEmails(
      submission,
      duplicateWarnings,
    );

    return NextResponse.json({
      success: true,
      eventId: savedEvent.id,
      eventCount: 1,
      confirmationEmailSent: confirmationEmails.sent.length > 0,
      confirmationEmails,
      duplicateDetected: duplicateWarnings.length > 0,
      duplicateWarnings,
      duplicateAlertEmails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
