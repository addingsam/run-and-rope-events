import Link from "next/link";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailLockedProps {
  event: EventDetailView;
}

export function EventDetailLocked({ event }: EventDetailLockedProps) {
  return (
    <div className="space-y-8">
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
        <div className="relative min-h-[280px] bg-[var(--color-background)] sm:min-h-[340px]">
          <div className="absolute inset-0 bg-[var(--color-accent-primary)]/35" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          <div className="absolute inset-0 bg-[var(--color-background)]/85" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)]/50 text-3xl">
              🔒
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Subscribe to unlock event details
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              Full event listings are available to subscribers. Pro WPRA/PRCA rodeos remain free to
              browse from search results.
            </p>
            <Link href="/subscribe" className={`mt-5 inline-flex ${themePrimaryButtonClassName}`}>
              View subscription plans
            </Link>
          </div>
        </div>
      </section>

      <div className={`p-6 text-center shadow-sm ${themePanelClassName}`}>
        <p className={themeMutedTextClassName}>
          Location: {event.city}, {event.state}
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex text-sm font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
        >
          ← Back to event search
        </Link>
      </div>
    </div>
  );
}
