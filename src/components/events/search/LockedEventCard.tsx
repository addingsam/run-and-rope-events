import Link from "next/link";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { EventSearchResultItem } from "@/types/event-search";

interface LockedEventCardProps {
  event: EventSearchResultItem;
}

export function LockedEventCard({ event }: LockedEventCardProps) {
  return (
    <article className={`overflow-hidden shadow-sm ${themePanelClassName}`}>
      <div className="relative h-52 w-full overflow-hidden bg-[var(--color-background)]">
        <div className="absolute inset-0 bg-[var(--color-accent-primary)]/30" />
        <div className="absolute inset-0 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-[var(--color-background)]/80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)]/50 text-2xl text-[var(--color-text-primary)]">
            🔒
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Subscribe to unlock
          </p>
          <Link href="/subscribe" className={`mt-3 ${themePrimaryButtonClassName}`}>
            View plans
          </Link>
        </div>
      </div>

      <div className="p-5">
        <dl className={themeMutedTextClassName}>
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="text-lg font-semibold text-[var(--color-text-primary)]">
              {event.city}, {event.state}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
