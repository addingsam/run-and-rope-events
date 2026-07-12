import { Suspense } from "react";
import { EventSearchPage } from "@/components/events/search/EventSearchPage";
import { getIsSubscriber } from "@/lib/auth/get-user";
import {
  listFutureMapEvents,
  listUpcomingEvents,
} from "@/lib/events/list-future-map-events";

export const metadata = {
  title: "Events",
};

export default async function EventsPage() {
  const [isSubscriber, upcomingEvents, mapResults] = await Promise.all([
    getIsSubscriber(),
    listUpcomingEvents(),
    listFutureMapEvents(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Event directory</h1>
        <p className="mt-3 text-[var(--color-text-muted)]">
          Set search criteria, draw on the interactive map, or search by radius or route to find
          jackpots and rodeos nationwide.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-muted)]">
            Loading search…
          </div>
        }
      >
        <EventSearchPage
          isSubscriber={isSubscriber}
          mapboxToken={process.env.MAPBOX_ACCESS_TOKEN ?? ""}
          initialUpcomingEvents={upcomingEvents}
          initialMapResults={mapResults}
        />
      </Suspense>
    </div>
  );
}
