import { Resend } from "resend";
import { APP_NAME, TEAM_CONTACT_EMAIL, TEAM_CONTACT_FROM } from "@/lib/constants";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeFromAddress(configured: string) {
  const trimmed = configured.trim();
  const bracketMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  const email = (bracketMatch?.[2] ?? trimmed).trim().toLowerCase();

  if (email === "samanthaaddington1@gmail.com" || email === "onboarding@resend.dev") {
    return TEAM_CONTACT_FROM;
  }

  if (bracketMatch) {
    return `${APP_NAME} <${bracketMatch[2].trim()}>`;
  }

  return `${APP_NAME} <${trimmed}>`;
}

export function getResendClient() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

/** Use the verified mailbox from env but always show the current app name to recipients. */
export function getResendFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) {
    return TEAM_CONTACT_FROM;
  }
  return normalizeFromAddress(configured);
}

export function getResendFromEmailAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) {
    return TEAM_CONTACT_EMAIL;
  }

  const bracketMatch = configured.match(/^(.+?)\s*<([^>]+)>$/);
  const email = (bracketMatch?.[2] ?? configured).trim().toLowerCase();

  if (email === "samanthaaddington1@gmail.com") {
    return TEAM_CONTACT_EMAIL;
  }

  return email;
}

export function isResendTestSender() {
  return getResendFromEmailAddress() === "onboarding@resend.dev";
}

export function getResendDeliveryFailureMessage(reason: string) {
  if (
    reason.includes("only send testing emails to your own email address") ||
    isResendTestSender()
  ) {
    return "Email delivery is limited to the Resend account owner until a sending domain is verified.";
  }

  return reason;
}
