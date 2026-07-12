import type { EventSubmission } from "@/types/event-submission";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getSubmissionConfirmationRecipients(
  submission: Pick<EventSubmission, "submitterEmail" | "contactEmail">,
): string[] {
  const seen = new Set<string>();
  const recipients: string[] = [];

  for (const value of [submission.submitterEmail, submission.contactEmail]) {
    const email = value.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email) || seen.has(email)) {
      continue;
    }

    seen.add(email);
    recipients.push(email);
  }

  return recipients;
}
