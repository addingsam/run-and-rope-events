import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { sampleEvents } from "@/lib/events/sample-events";

export default function Home() {
  return (
    <div>
      <section className="border-b border-amber-200/60 bg-gradient-to-b from-amber-100/80 to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Barrel racing & roping
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl">
            Find your next run. Rope your next jackpot.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-amber-900/75">
            Run & Rope Events is a subscription-based directory for competitors and
            organizers. Discover upcoming barrel races, team ropings, and breakaways
            nationwide—or list your own event and reach riders who are ready to enter.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/events"
              className="rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Browse events
            </Link>
            <Link
              href="/subscribe"
              className="rounded-full border border-amber-300 bg-white px-6 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-50"
            >
              View subscription plans
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-amber-950">Featured events</h2>
            <p className="mt-2 text-amber-900/70">
              Sample listings to show how the directory will look at launch.
            </p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-amber-800 hover:text-amber-950">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sampleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}
