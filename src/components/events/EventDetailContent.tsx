"use client";

import Link from "next/link";
import { AlsoAtThisRodeo } from "@/components/events/AlsoAtThisRodeo";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventDetailGrid } from "@/components/events/EventDetailGrid";
import { EventDetailHero } from "@/components/events/EventDetailHero";
import { APP_NAME } from "@/lib/constants";
import {
  themeMutedTextClassName,
  themePanelClassName,
  themePrimaryButtonClassName,
} from "@/lib/theme/form-classes";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailContentProps {
  event: EventDetailView;
  showFeaturePlacementCta?: boolean;
}

export function EventDetailContent({ event, showFeaturePlacementCta = false }: EventDetailContentProps) {
  return (
    <div className="space-y-8 pb-12">
      <EventDetailHero event={event} />

      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <Link
          href="/events"
          className="text-sm font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-text-primary)]"
        >
          ← Back to events
        </Link>
        <EventDetailGrid event={event} />
        {showFeaturePlacementCta && (
          <section className={`p-5 ${themePanelClassName} bg-[var(--color-accent-primary)]/10`}>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Promote this event
            </h2>
            <p className={`mt-2 leading-6 ${themeMutedTextClassName}`}>
              Purchase paid homepage featuring to put this listing in front of competitors browsing{" "}
              {APP_NAME}.
            </p>
            <Link
              href={`/events/${event.id}/feature`}
              className={`mt-4 inline-flex ${themePrimaryButtonClassName} px-5 py-2.5`}
            >
              Feature on homepage
            </Link>
          </section>
        )}
        <EventDetailActions event={event} />
        {event.additionalOfferings.length > 0 && (
          <AlsoAtThisRodeo offerings={event.additionalOfferings} />
        )}
      </div>
    </div>
  );
}
