import { APP_NAME } from "@/lib/constants";
import { getResendClient, getResendFromAddress } from "@/lib/email/resend";

interface SubmissionConfirmationInput {
  to: string;
  eventName: string;
  startDate: string;
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function buildConfirmationHtml(eventName: string, formattedDate: string) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; background: #fffaf3; color: #451a03; padding: 32px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #f3e8d8; border-radius: 16px; overflow: hidden;">
        <div style="background: #fef3c7; border-bottom: 1px solid #f3e8d8; padding: 24px 28px;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #b45309;">
            ${APP_NAME}
          </p>
          <h1 style="margin: 0; font-size: 24px; line-height: 1.3; color: #451a03;">
            Your event has been received
          </h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #78350f;">
            Thanks for submitting your event. Our team is reviewing the details now and will publish it to the directory once approved.
          </p>
          <div style="margin: 24px 0; padding: 18px 20px; background: #fffaf3; border: 1px solid #f3e8d8; border-radius: 12px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b45309;">
              Submission details
            </p>
            <p style="margin: 0 0 6px; font-size: 16px; color: #451a03;">
              <strong>Event:</strong> ${eventName}
            </p>
            <p style="margin: 0; font-size: 16px; color: #451a03;">
              <strong>Date:</strong> ${formattedDate}
            </p>
          </div>
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #92400e;">
            We&apos;ll be in touch if we need anything else. Thanks for helping riders find their next run.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendSubmissionConfirmation({
  to,
  eventName,
  startDate,
}: SubmissionConfirmationInput) {
  const formattedDate = formatEventDate(startDate);
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: [to],
    subject: `Your event submission has been received — ${eventName}`,
    html: buildConfirmationHtml(eventName, formattedDate),
    text: [
      `Your event has been received`,
      ``,
      `Thanks for submitting your event to ${APP_NAME}. Our team is reviewing the details and will publish it once approved.`,
      ``,
      `Event: ${eventName}`,
      `Date: ${formattedDate}`,
      ``,
      `We'll be in touch if we need anything else.`,
    ].join("\n"),
  });

  if (error) {
    throw new Error(error.message);
  }
}
