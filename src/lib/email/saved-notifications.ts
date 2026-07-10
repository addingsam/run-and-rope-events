import { getResendClient, getResendFromAddress } from "@/lib/email/resend";

export async function sendSavedSearchAlertEmail({
  to,
  searchName,
  eventNames,
  searchUrl,
}: {
  to: string;
  searchName: string;
  eventNames: string[];
  searchUrl: string;
}) {
  const resend = getResendClient();
  const from = getResendFromAddress();
  const listHtml = eventNames.map((name) => `<li>${name}</li>`).join("");

  await resend.emails.send({
    from,
    to,
    subject: `New events for "${searchName}"`,
    html: `
      <h2>New matching events</h2>
      <p>Your saved search <strong>${searchName}</strong> has ${eventNames.length} new event${eventNames.length === 1 ? "" : "s"}:</p>
      <ul>${listHtml}</ul>
      <p><a href="${searchUrl}">View your search</a></p>
    `,
    text: `New events for "${searchName}": ${eventNames.join(", ")}. View: ${searchUrl}`,
  });
}

export async function sendEventPassedEmail({
  to,
  eventName,
  eventDate,
  location,
}: {
  to: string;
  eventName: string;
  eventDate: string;
  location: string;
}) {
  const resend = getResendClient();
  const from = getResendFromAddress();

  await resend.emails.send({
    from,
    to,
    subject: `Event passed: ${eventName}`,
    html: `
      <h2>An event you saved has passed</h2>
      <p><strong>${eventName}</strong> on ${eventDate} in ${location} has ended and was removed from your saved events list.</p>
      <p>It is no longer shown in search results, but the listing remains in our records.</p>
    `,
    text: `${eventName} (${eventDate}, ${location}) has passed and was removed from your saved events.`,
  });
}

export async function sendEventArchivedEmail({
  to,
  eventName,
  eventDate,
  location,
}: {
  to: string;
  eventName: string;
  eventDate: string;
  location: string;
}) {
  return sendEventPassedEmail({ to, eventName, eventDate, location });
}
