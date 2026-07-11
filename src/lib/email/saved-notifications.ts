import { getResendClient, getResendFromAddress } from "@/lib/email/resend";
import { getAppUrl } from "@/lib/env/app-url";
import {
  formatSavedSearchCriteriaLines,
  getAlertFrequencyLabel,
} from "@/lib/saved-searches/format-saved-search-criteria";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendSavedSearchConfirmationEmail({
  to,
  searchName,
  searchParams,
  mapOverlay,
  alertFrequency,
  searchUrl,
}: {
  to: string;
  searchName: string;
  searchParams: SavedSearchParams;
  mapOverlay?: SavedMapOverlay | null;
  alertFrequency: SavedSearchAlertFrequency;
  searchUrl: string;
}) {
  const resend = getResendClient();
  const from = getResendFromAddress();
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const criteria = formatSavedSearchCriteriaLines(searchParams, mapOverlay);
  const criteriaHtml = criteria.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const criteriaText = criteria.map((line) => `- ${line}`).join("\n");
  const digestLine =
    alertFrequency === "off"
      ? "You did not opt in to update emails for this saved filter."
      : `Update emails: ${getAlertFrequencyLabel(alertFrequency)} when new approved events match these criteria.`;

  await resend.emails.send({
    from,
    to,
    subject: `Saved filter confirmed: ${searchName}`,
    html: `
      <h2>Your saved filter is ready</h2>
      <p>We saved <strong>${escapeHtml(searchName)}</strong> to your account with these criteria:</p>
      <ul>${criteriaHtml}</ul>
      <p>${escapeHtml(digestLine)}</p>
      <p><a href="${searchUrl}">Run this search</a> · <a href="${dashboardUrl}">Manage saved filters</a></p>
    `,
    text: [
      `Your saved filter "${searchName}" is ready.`,
      "",
      "Criteria:",
      criteriaText,
      "",
      digestLine,
      `Run search: ${searchUrl}`,
    ].join("\n"),
  });
}

export async function sendSavedSearchAlertEmail({
  to,
  searchName,
  eventNames,
  searchUrl,
  alertFrequency,
}: {
  to: string;
  searchName: string;
  eventNames: string[];
  searchUrl: string;
  alertFrequency: "daily" | "weekly";
}) {
  const resend = getResendClient();
  const from = getResendFromAddress();
  const listHtml = eventNames.map((name) => `<li>${escapeHtml(name)}</li>`).join("");
  const digestLabel = alertFrequency === "weekly" ? "Weekly" : "Daily";

  await resend.emails.send({
    from,
    to,
    subject: `${digestLabel} update: new events for "${searchName}"`,
    html: `
      <h2>${digestLabel} saved filter update</h2>
      <p>Your saved search <strong>${escapeHtml(searchName)}</strong> has ${eventNames.length} new approved event${eventNames.length === 1 ? "" : "s"}:</p>
      <ul>${listHtml}</ul>
      <p><a href="${searchUrl}">View your search</a></p>
    `,
    text: `${digestLabel} update for "${searchName}": ${eventNames.join(", ")}. View: ${searchUrl}`,
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
