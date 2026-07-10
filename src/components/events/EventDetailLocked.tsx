import Link from "next/link";
import type { EventDetailView } from "@/types/event-detail";

interface EventDetailLockedProps {
  event: EventDetailView;
}

export function EventDetailLocked({ event }: EventDetailLockedProps) {
  return (
    <div className="space-y-8">
      <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
        <div className="min-h-[280px] bg-gradient-to-br from-amber-800 via-amber-700 to-amber-950 blur-sm sm:min-h-[340px]" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-3xl">
              🔒
            </div>
            <h1 className="text-2xl font-bold text-white">Subscribe to unlock event details</h1>
            <p className="mt-3 text-sm leading-6 text-amber-100/90">
              Full listings for {event.title} are available to subscribers. Pro WPRA/PRCA rodeos
              remain free to browse from search results.
            </p>
            <Link
              href="/subscribe"
              className="mt-5 inline-flex rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-400"
            >
              View subscription plans
            </Link>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-amber-900/70">
          Location: {event.city}, {event.state}
        </p>
        <Link
          href="/events"
          className="mt-4 inline-flex text-sm font-semibold text-amber-800 hover:text-amber-950"
        >
          ← Back to event search
        </Link>
      </div>
    </div>
  );
}
