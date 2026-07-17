import { getResendClient, getResendFromAddress } from "@/lib/email/resend";
import { APP_NAME } from "@/lib/constants";
import { getAppUrl } from "@/lib/env/app-url";
import {
  formatSavedSearchCriteriaLines,
  getAlertFrequencyDescription,
  getAlertFrequencyLabel,
} from "@/lib/saved-searches/format-saved-search-criteria";
import {
  buildSavedSearchPreviewItems,
  formatSavedSearchPreviewLine,
} from "@/lib/saved-searches/saved-search-preview";
import type { SavedMapOverlay, SavedSearchAlertFrequency, SavedSearchParams } from "@/types/saved-search";
import type { SearchResultEntry } from "@/types/event-search";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailFooterHtml() {
  return `<p style="margin-top: 24px; font-size: 13px; color: #92400e;">— ${APP_NAME}</p>`;
}

function emailFooterText() {
  return `— ${APP_NAME}`;
}

export async function sendSavedSearchConfirmationEmail({
  to,
  searchName,
  searchParams,
  mapOverlay,
  alertFrequency,
  searchUrl,
  previewResults = [],
}: {
  to: string;
  searchName: string;
  searchParams: SavedSearchParams;
  mapOverlay?: SavedMapOverlay | null;
  alertFrequency: SavedSearchAlertFrequency;
  searchUrl: string;
  previewResults?: SearchResultEntry[];
}) {
  const resend = getResendClient();
  const from = getResendFromAddress();
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const criteria = formatSavedSearchCriteriaLines(searchParams, mapOverlay);
  const criteriaHtml = criteria.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const criteriaText = criteria.map((line) => `- ${line}`).join("\n");
  const previewItems = buildSavedSearchPreviewItems(previewResults);
  const matchCount = previewResults.length;
  const remainingCount = Math.max(matchCount - previewItems.length, 0);

  const previewHtml =
    previewItems.length > 0
      ? `<ul>${previewItems
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.dateLabel)}${item.locationLabel ? ` · ${escapeHtml(item.locationLabel)}` : ""}</li>`,
          )
          .join("")}</ul>${remainingCount > 0 ? `<p>…and ${remainingCount} more matching event${remainingCount === 1 ? "" : "s"}.</p>` : ""}`
      : `<p>No approved events match these filters right now. We'll email you when new listings appear.</p>`;

  const previewText =
    previewItems.length > 0
      ? [
          ...previewItems.map((item) => `- ${formatSavedSearchPreviewLine(item)}`),
          ...(remainingCount > 0
            ? [`…and ${remainingCount} more matching event${remainingCount === 1 ? "" : "s"}.`]
            : []),
        ].join("\n")
      : "No approved events match these filters right now.";

  const digestLine = getAlertFrequencyDescription(alertFrequency);
  const digestHeading =
    alertFrequency === "off"
      ? "Update emails: Off"
      : `Update emails: ${getAlertFrequencyLabel(alertFrequency)}`;

  await resend.emails.send({
    from,
    to,
    subject: `Saved search confirmed: ${searchName}`,
    html: `
      <h2>Your saved search is confirmed</h2>
      <p>We saved <strong>${escapeHtml(searchName)}</strong> to your ${escapeHtml(APP_NAME)} profile.</p>
      <h3>Your filters</h3>
      <ul>${criteriaHtml}</ul>
      <h3>${escapeHtml(digestHeading)}</h3>
      <p>${escapeHtml(digestLine)} Update emails only cover newly approved events after today — not the preview below.</p>
      <h3>Matching events right now (${matchCount})</h3>
      ${previewHtml}
      <p><a href="${searchUrl}">Run this search</a> · <a href="${dashboardUrl}">Manage saved searches</a></p>
      ${emailFooterHtml()}
    `,
    text: [
      `Your saved search "${searchName}" is confirmed.`,
      "",
      "Your filters:",
      criteriaText,
      "",
      digestHeading,
      digestLine,
      "Update emails only cover newly approved events after today — not the preview below.",
      "",
      `Matching events right now (${matchCount}):`,
      previewText,
      "",
      `Run search: ${searchUrl}`,
      `Manage saved searches: ${dashboardUrl}`,
      emailFooterText(),
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
      <p>Your saved search <strong>${escapeHtml(searchName)}</strong> on ${escapeHtml(APP_NAME)} has ${eventNames.length} new approved event${eventNames.length === 1 ? "" : "s"}:</p>
      <ul>${listHtml}</ul>
      <p><a href="${searchUrl}">View your search</a></p>
      ${emailFooterHtml()}
    `,
    text: `${digestLabel} update for "${searchName}" on ${APP_NAME}: ${eventNames.join(", ")}. View: ${searchUrl}\n${emailFooterText()}`,
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
      <p><strong>${eventName}</strong> on ${eventDate} in ${location} has ended and was removed from your saved events list on ${escapeHtml(APP_NAME)}.</p>
      <p>It is no longer shown in search results, but the listing remains in our records.</p>
      ${emailFooterHtml()}
    `,
    text: `${eventName} (${eventDate}, ${location}) has passed and was removed from your saved events on ${APP_NAME}.\n${emailFooterText()}`,
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
