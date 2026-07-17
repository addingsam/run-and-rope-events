import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

const RESEND_TEST_FROM = `${APP_NAME} <onboarding@resend.dev>`;

/** Domains Resend cannot verify for sending (use a custom domain instead). */
const UNSENDABLE_FROM_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseConfiguredEmail(configured: string) {
  const trimmed = configured.trim();
  const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  const email = (bracketMatch?.[2] ?? trimmed).trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  return { email, domain, bracketMatch, trimmed };
}

export function isUnsendableFromAddress(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return UNSENDABLE_FROM_DOMAINS.has(domain);
}

export function getResendClient() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

/**
 * Outbound sender — must be a verified domain/address in Resend.
 * Gmail/Yahoo/etc. cannot be used as FROM; use ADMIN_EMAIL for the team inbox instead.
 */
export function getResendFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) {
    return RESEND_TEST_FROM;
  }

  const { email, bracketMatch, trimmed } = parseConfiguredEmail(configured);
  if (isUnsendableFromAddress(email)) {
    return RESEND_TEST_FROM;
  }

  if (bracketMatch) {
    return `${APP_NAME} <${bracketMatch[2].trim()}>`;
  }

  return `${APP_NAME} <${trimmed}>`;
}

export function getResendFromEmailAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) {
    return "onboarding@resend.dev";
  }

  const { email } = parseConfiguredEmail(configured);
  if (isUnsendableFromAddress(email)) {
    return "onboarding@resend.dev";
  }

  return email;
}

export function isResendTestSender() {
  return getResendFromEmailAddress() === "onboarding@resend.dev";
}

export function getResendDeliveryFailureMessage(reason: string) {
  const lower = reason.toLowerCase();

  if (
    lower.includes("gmail.com domain is not verified") ||
    lower.includes("domain is not verified") ||
    lower.includes("not verified")
  ) {
    return "Email could not be sent because the outbound sender is not verified in Resend. Verify your website domain at resend.com/domains and set RESEND_FROM_EMAIL to an address on that domain (for example noreply@yourdomain.com). Contact form messages can still be delivered to jackpotandrodeoevents@gmail.com once sending is configured.";
  }

  if (
    lower.includes("only send testing emails to your own email address") ||
    isResendTestSender()
  ) {
    return "Email delivery is limited until a sending domain is verified in Resend. Verify your domain at resend.com/domains, then set RESEND_FROM_EMAIL to an address on that domain.";
  }

  return reason;
}
