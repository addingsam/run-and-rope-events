import { APP_NAME } from "@/lib/constants";
import {
  formatSubmissionDuplicateSummary,
  getSubmissionDuplicateStatusLabel,
  type SubmissionDuplicateWarning,
} from "@/lib/events/duplicate-detection";
import { formatEventDate } from "@/lib/events/format-date";
import { getResendClient, getResendDeliveryFailureMessage, getResendFromAddress } from "@/lib/email/resend";
import { getSubmissionConfirmationRecipients } from "@/lib/email/submission-confirmation-recipients";
import type { SubmissionConfirmationSendResult } from "@/lib/email/send-submission-confirmation";
import type { EventSubmission } from "@/types/event-submission";

function buildDuplicateAlertHtml(warnings: SubmissionDuplicateWarning[]) {
  const warningBlocks = warnings
    .map((warning) => {
      const matchItems = warning.matches
        .map(
          (match) => `
            <li style="margin: 0 0 10px; font-size: 15px; line-height: 1.6; color: #451a03;">
              <strong>${match.eventName}</strong><br />
              ${formatEventDate(match.startDate)} · ${match.location}<br />
              Status: ${getSubmissionDuplicateStatusLabel(match.status)}
            </li>
          `,
        )
        .join("");

      return `
        <div style="margin: 0 0 18px; padding: 16px 18px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px;">
          <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #9a3412;">
            Your submission: ${warning.eventName} · ${formatEventDate(warning.startDate)}
          </p>
          <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: #7c2d12;">
            Matches an existing listing with the same name, format, and date:
          </p>
          <ul style="margin: 0; padding-left: 18px;">${matchItems}</ul>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; background: #fffaf3; color: #451a03; padding: 32px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #f3e8d8; border-radius: 16px; overflow: hidden;">
        <div style="background: #ffedd5; border-bottom: 1px solid #fdba74; padding: 24px 28px;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #c2410c;">
            ${APP_NAME}
          </p>
          <h1 style="margin: 0; font-size: 24px; line-height: 1.3; color: #451a03;">
            Possible duplicate event detected
          </h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #78350f;">
            We received your submission, but it looks similar to one or more events already in our directory. Our team will review it and reach out if anything else is needed.
          </p>
          ${warningBlocks}
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #92400e;">
            If this is a different event or an updated flyer, no action is required — we&apos;ll compare the details during review.
          </p>
        </div>
      </div>
    </div>
  `;
}

function buildDuplicateAlertText(warnings: SubmissionDuplicateWarning[]) {
  return [
    "Possible duplicate event detected",
    "",
    "We received your submission, but it looks similar to one or more events already in our directory. Our team will review it and reach out if anything else is needed.",
    "",
    ...warnings.map((warning) => `- ${formatSubmissionDuplicateSummary(warning)}`),
    "",
    "If this is a different event or an updated flyer, no action is required — we'll compare the details during review.",
  ].join("\n");
}

function logResendDeliveryIssue(email: string, reason: string) {
  const message = getResendDeliveryFailureMessage(reason);
  console.error(`Failed to send duplicate submission alert to ${email}: ${message}`);
}

export async function sendDuplicateSubmissionAlertEmails(
  submission: Pick<EventSubmission, "submitterEmail" | "contactEmail">,
  warnings: SubmissionDuplicateWarning[],
): Promise<SubmissionConfirmationSendResult> {
  const recipients = getSubmissionConfirmationRecipients(submission);
  const sent: string[] = [];
  const failed: Array<{ email: string; reason: string }> = [];

  if (warnings.length === 0 || recipients.length === 0) {
    return { sent, failed };
  }

  const resend = getResendClient();
  const subject =
    warnings.length === 1
      ? `Possible duplicate detected — ${warnings[0].eventName}`
      : `Possible duplicates detected — ${warnings.length} of your submissions`;

  for (const email of recipients) {
    try {
      const { error } = await resend.emails.send({
        from: getResendFromAddress(),
        to: [email],
        subject,
        html: buildDuplicateAlertHtml(warnings),
        text: buildDuplicateAlertText(warnings),
      });

      if (error) {
        throw new Error(error.message);
      }

      sent.push(email);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown email delivery error.";
      failed.push({ email, reason: getResendDeliveryFailureMessage(reason) });
      logResendDeliveryIssue(email, reason);
    }
  }

  return { sent, failed };
}
