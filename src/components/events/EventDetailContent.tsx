"use client";

import Link from "next/link";
import { AlsoAtThisRodeo } from "@/components/events/AlsoAtThisRodeo";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventDetailGrid } from "@/components/events/EventDetailGrid";
import { EventDetailHero } from "@/components/events/EventDetailHero";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailContentProps {
  event: EventDetailView;
}

export function EventDetailContent({ event }: EventDetailContentProps) {
  return (
    <div className="space-y-8 pb-12">
      <EventDetailHero event={event} />

      <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <Link href="/events" className="text-sm font-semibold text-amber-800 hover:text-amber-950">
          ← Back to events
        </Link>
        <EventDetailGrid event={event} />
        <EventDetailActions event={event} />
        {event.additionalOfferings.length > 0 && (
          <AlsoAtThisRodeo offerings={event.additionalOfferings} />
        )}
      </div>
    </div>
  );
}
