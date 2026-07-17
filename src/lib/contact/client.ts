import type { ContactMessageInput } from "@/lib/contact/validate-contact";

export async function sendContactMessage(input: ContactMessageInput) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to send message.");
  }
}
