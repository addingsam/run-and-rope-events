"use client";

import { useState } from "react";
import { sendContactMessage } from "@/lib/contact/client";
import {
  themeInputClassName,
  themeLabelClassName,
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";

interface ContactFormProps {
  defaultName?: string;
  defaultEmail?: string;
  lockEmail?: boolean;
}

export function ContactForm({
  defaultName = "",
  defaultEmail = "",
  lockEmail = false,
}: ContactFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        website,
      });
      setSuccess(true);
      setSubject("");
      setMessage("");
      setWebsite("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(submitEvent) => void handleSubmit(submitEvent)}
      className={`space-y-5 p-6 sm:p-8 ${themePanelClassName}`}
    >
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(changeEvent) => setWebsite(changeEvent.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={themeLabelClassName}>
            Your name
          </label>
          <input
            id="contact-name"
            value={name}
            onChange={(changeEvent) => setName(changeEvent.target.value)}
            required
            autoComplete="name"
            className={`mt-2 ${themeInputClassName}`}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className={themeLabelClassName}>
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(changeEvent) => setEmail(changeEvent.target.value)}
            required
            readOnly={lockEmail}
            autoComplete="email"
            className={`mt-2 ${themeInputClassName}${lockEmail ? " cursor-not-allowed opacity-80" : ""}`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={themeLabelClassName}>
          Subject
        </label>
        <input
          id="contact-subject"
          value={subject}
          onChange={(changeEvent) => setSubject(changeEvent.target.value)}
          required
          maxLength={160}
          className={`mt-2 ${themeInputClassName}`}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={themeLabelClassName}>
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(changeEvent) => setMessage(changeEvent.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={8}
          className={`mt-2 min-h-[180px] resize-y ${themeInputClassName}`}
        />
        <p className={`mt-2 ${themeMutedTextClassName}`}>
          Tell us what you need help with, including event details when relevant.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/40 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          Message sent. We&apos;ll reply to the email address you provided.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${themePrimaryButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
