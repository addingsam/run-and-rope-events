import { Resend } from "resend";
import { APP_NAME } from "@/lib/constants";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getResendClient() {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

/** Use the verified mailbox from env but always show the current app name to recipients. */
export function getResendFromAddress() {
  const configured = requireEnv("RESEND_FROM_EMAIL").trim();
  const bracketMatch = configured.match(/^(.+?)\s*<([^>]+)>$/);

  if (bracketMatch) {
    return `${APP_NAME} <${bracketMatch[2].trim()}>`;
  }

  return `${APP_NAME} <${configured}>`;
}

export function getResendFromEmailAddress() {
  const configured = requireEnv("RESEND_FROM_EMAIL").trim();
  const bracketMatch = configured.match(/^(.+?)\s*<([^>]+)>$/);
  return (bracketMatch?.[2] ?? configured).trim().toLowerCase();
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
