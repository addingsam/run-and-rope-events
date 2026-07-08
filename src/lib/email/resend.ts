import { Resend } from "resend";

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

export function getResendFromAddress() {
  return requireEnv("RESEND_FROM_EMAIL");
}
