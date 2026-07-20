import { NextResponse } from "next/server";
import { expandSubmissionToMultiEventBatch } from "@/lib/events/expand-batch-submissions";
import { listEventsForDuplicateCheck } from "@/lib/events/admin-repository";
import {
  findScheduleLocationDuplicateWarningsForCandidates,
  findSubmissionDuplicateWarnings,
} from "@/lib/events/duplicate-detection";
import { parseSubmissionRequest } from "@/lib/events/parse-submission";
import { normalizeEventSubmissionVenue } from "@/lib/events/resolve-venue-name";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { submission, batchEvents } = await parseSubmissionRequest(request);
    const normalizedSubmission = normalizeEventSubmissionVenue(submission);
    const candidates = await listEventsForDuplicateCheck();

    if (batchEvents.length >= 2) {
      const submissions = expandSubmissionToMultiEventBatch(normalizedSubmission, batchEvents);
      const nameWarnings = findSubmissionDuplicateWarnings(submissions, candidates);
      const locationWarnings = findScheduleLocationDuplicateWarningsForCandidates(
        submissions,
        candidates,
      );

      return NextResponse.json({
        nameWarnings,
        locationWarnings,
      });
    }

    const nameWarnings = findSubmissionDuplicateWarnings([normalizedSubmission], candidates);

    return NextResponse.json({
      nameWarnings,
      locationWarnings: findScheduleLocationDuplicateWarningsForCandidates(
        [normalizedSubmission],
        candidates,
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Duplicate check failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
