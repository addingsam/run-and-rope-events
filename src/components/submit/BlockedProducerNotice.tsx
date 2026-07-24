import { BLOCKED_PRODUCER_CONTACT_EMAIL } from "@/lib/events/blocked-producers";

interface BlockedProducerNoticeProps {
  className?: string;
}

export function BlockedProducerNotice({ className = "" }: BlockedProducerNoticeProps) {
  return (
    <p className={className}>
      Thank you for your submission. This particular event cannot be accepted. Please reach out to
      us at{" "}
      <a
        href={`mailto:${BLOCKED_PRODUCER_CONTACT_EMAIL}`}
        className="rounded bg-yellow-300 px-1.5 py-0.5 font-semibold text-stone-900 underline decoration-stone-900/40 underline-offset-2"
      >
        {BLOCKED_PRODUCER_CONTACT_EMAIL}
      </a>{" "}
      if you have further questions.
    </p>
  );
}
