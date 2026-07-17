const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function validateContactMessage(input: ContactMessageInput):
  | { ok: true; data: ContactMessagePayload }
  | { ok: false; error: string }
  | { ok: false; isSpam: true } {
  if (input.website?.trim()) {
    return { ok: false, isSpam: true };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name) {
    return { ok: false, error: "Enter your name." };
  }

  if (name.length > 120) {
    return { ok: false, error: "Name must be 120 characters or fewer." };
  }

  if (!email) {
    return { ok: false, error: "Enter your email address." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!subject) {
    return { ok: false, error: "Enter a subject." };
  }

  if (subject.length > 200) {
    return { ok: false, error: "Subject must be 200 characters or fewer." };
  }

  if (!message) {
    return { ok: false, error: "Enter a message." };
  }

  if (message.length < 10) {
    return { ok: false, error: "Message must be at least 10 characters." };
  }

  if (message.length > 5000) {
    return { ok: false, error: "Message must be 5000 characters or fewer." };
  }

  return { ok: true, data: { name, email, subject, message } };
}
