import { BLOCKED_PRODUCER_CONTACT_EMAIL } from "@/lib/events/blocked-producers";

interface BlockedProducerNoticeProps {
  className?: string;
}

export function BlockedProducerNotice({ className = "" }: BlockedProducerNoticeProps) {
  return (
    <p
      className={`rounded-xl border-2 border-[var(--color-accent-cta)] bg-[var(--color-accent-cta)]/10 px-4 py-3 text-sm leading-6 text-[var(--color-text-primary)] ${className}`}
    >
      Thank you for your submission. This particular event cannot be accepted. Please reach out to
      us at{" "}
      <a
        href={`mailto:${BLOCKED_PRODUCER_CONTACT_EMAIL}`}
        className="rounded bg-[var(--color-accent-cta)] px-1.5 py-0.5 font-semibold text-[var(--color-background)] underline decoration-[var(--color-background)]/40 underline-offset-2"
      >
        {BLOCKED_PRODUCER_CONTACT_EMAIL}
      </a>{" "}
      if you have further questions.
    </p>
  );
}
