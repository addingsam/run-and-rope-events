import { APP_NAME } from "@/lib/constants";
import { getAdminEmail } from "@/lib/email/get-admin-email";
import { getResendClient, getResendDeliveryFailureMessage, getResendFromAddress } from "@/lib/email/resend";
import type { ContactMessagePayload } from "@/lib/contact/validate-contact";

export interface ContactMessageSenderContext {
  userId?: string | null;
  signedInEmail?: string | null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildContactHtml(
  { name, email, subject, message }: ContactMessagePayload,
  senderContext: ContactMessageSenderContext,
) {
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");
  const signedInLine =
    senderContext.userId && senderContext.signedInEmail
      ? `Signed in as ${escapeHtml(senderContext.signedInEmail)} (${escapeHtml(senderContext.userId)})`
      : "Sent while signed out";

  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; background: #fffaf3; color: #451a03; padding: 32px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #f3e8d8; border-radius: 16px; overflow: hidden;">
        <div style="background: #fef3c7; border-bottom: 1px solid #f3e8d8; padding: 24px 28px;">
          <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #b45309;">
            ${APP_NAME}
          </p>
          <h1 style="margin: 0; font-size: 24px; line-height: 1.3; color: #451a03;">
            New contact message
          </h1>
        </div>
        <div style="padding: 28px;">
          <p style="margin: 0 0 6px; font-size: 16px; color: #451a03;">
            <strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;
          </p>
          <p style="margin: 0 0 6px; font-size: 16px; color: #451a03;">
            <strong>Account:</strong> ${signedInLine}
          </p>
          <p style="margin: 0 0 24px; font-size: 16px; color: #451a03;">
            <strong>Subject:</strong> ${escapeHtml(subject)}
          </p>
          <div style="padding: 18px 20px; background: #fffaf3; border: 1px solid #f3e8d8; border-radius: 12px;">
            <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b45309;">
              Message
            </p>
            <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #78350f;">
              ${safeMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildContactText(
  { name, email, subject, message }: ContactMessagePayload,
  senderContext: ContactMessageSenderContext,
) {
  const signedInLine =
    senderContext.userId && senderContext.signedInEmail
      ? `Signed in as ${senderContext.signedInEmail} (${senderContext.userId})`
      : "Sent while signed out";

  return [
    `New contact message for ${APP_NAME}`,
    "",
    `From: ${name} <${email}>`,
    `Account: ${signedInLine}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    message,
  ].join("\n");
}

export async function sendContactMessage(
  payload: ContactMessagePayload,
  senderContext: ContactMessageSenderContext = {},
) {
  const resend = getResendClient();
  const from = getResendFromAddress();
  const to = getAdminEmail();

  const result = await resend.emails.send({
    from,
    to,
    replyTo: payload.email,
    subject: `[${APP_NAME}] ${payload.subject}`,
    html: buildContactHtml(payload, senderContext),
    text: buildContactText(payload, senderContext),
  });

  if (result.error) {
    throw new Error(getResendDeliveryFailureMessage(result.error.message));
  }

  return result;
}
