import type { EventSubmission } from "@/types/event-submission";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getSubmissionConfirmationRecipients(
  submission: Pick<EventSubmission, "submitterEmail">,
): string[] {
  const email = submission.submitterEmail.trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    return [];
  }

  return [email];
}
