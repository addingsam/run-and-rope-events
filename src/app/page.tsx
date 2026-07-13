import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { APP_HOME_EYEBROW, APP_HOME_HEADLINE, APP_NAME } from "@/lib/constants";
import { listPaidFeaturedEvents } from "@/lib/events/featured-events";

export default async function Home() {
  const featuredEvents = await listPaidFeaturedEvents().catch(() => []);

  return (
    <div>
      <section className="border-b border-amber-200/60 bg-gradient-to-b from-amber-100/80 to-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            {APP_HOME_EYEBROW}
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-amber-950 sm:text-4xl">
            {APP_HOME_HEADLINE}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-950 sm:text-3xl">Featured events</h2>
          <p className="mt-2 max-w-2xl text-amber-900/70">
            Paid homepage placement from event producers. Open to everyone — no subscription
            required to view these listings.
          </p>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-6 py-10 text-center">
            <p className="text-base font-medium text-amber-950">No featured events right now</p>
            <p className="mt-2 text-sm text-amber-900/70">
              Listing an event is free. Producers can optionally add paid homepage placement when
              submitting.
            </p>
            <Link
              href="/submit"
              className="mt-6 inline-flex rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Submit an event — free
            </Link>
          </div>
        )}
      </section>

      <section className="border-t border-amber-200/60 bg-[var(--background)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="max-w-2xl text-lg leading-8 text-amber-900/75">
            {APP_NAME} is a subscription-based directory for competitors and organizers. Search the
            full nationwide calendar, save events, and get alerts with a subscription.
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
              className="rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              View subscription plans
            </Link>
            <Link
              href="/submit"
              className="rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              List your event — free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
