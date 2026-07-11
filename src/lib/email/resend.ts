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
